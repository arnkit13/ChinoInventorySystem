package com.chino.inventory_backend.service;

import com.chino.inventory_backend.dto.InventoryStats;
import com.chino.inventory_backend.model.Product;
import com.chino.inventory_backend.repository.ProductRepository;
import org.apache.poi.ss.usermodel.*;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final SaleService saleService;
    private final CategoryService categoryService;
    private final JdbcTemplate jdbcTemplate;

    public ProductService(ProductRepository productRepository, SaleService saleService, CategoryService categoryService, JdbcTemplate jdbcTemplate) {
        this.productRepository = productRepository;
        this.saleService = saleService;
        this.categoryService = categoryService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<Product> searchForTindera(String query) {
        if (query == null || query.trim().isEmpty()) {
            return productRepository.findAll().stream().limit(25).collect(Collectors.toList());
        }
        return productRepository.searchProducts(query.trim());
    }

    @Transactional(readOnly = true)
    public List<Product> getAll(String search, String category) {
        List<Product> list;
        if (search != null && !search.trim().isEmpty()) {
            list = productRepository.searchProducts(search.trim());
        } else {
            list = productRepository.findAll();
        }

        if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("ALL")) {
            list = list.stream()
                    .filter(p -> p.getCategory() != null && p.getCategory().equalsIgnoreCase(category.trim()))
                    .collect(Collectors.toList());
        }

        return list;
    }

    @Transactional(readOnly = true)
    public Product getById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
    }

    public Product create(Product product) {
        if (product.getCategory() == null || product.getCategory().trim().isEmpty()) {
            product.setCategory("General");
        }
        if (product.getUnit() == null || product.getUnit().trim().isEmpty()) {
            product.setUnit("pc");
        }
        if (product.getStock() == null) {
            product.setStock(0);
        }
        return productRepository.save(product);
    }

    public Product update(Long id, Product incoming) {
        Product existing = getById(id);
        existing.setName(incoming.getName());
        existing.setSupplier(incoming.getSupplier());
        existing.setOriginalPrice(incoming.getOriginalPrice());
        existing.setPrice(incoming.getPrice());
        existing.setPriceAbove10(incoming.getPriceAbove10());
        existing.setWholesalePrice(incoming.getWholesalePrice());
        existing.setCategory(incoming.getCategory() != null ? incoming.getCategory() : existing.getCategory());
        existing.setStock(incoming.getStock() != null ? incoming.getStock() : existing.getStock());
        existing.setUnit(incoming.getUnit() != null ? incoming.getUnit() : existing.getUnit());
        existing.setBarcode(incoming.getBarcode());
        existing.setDescription(incoming.getDescription());
        return productRepository.save(existing);
    }

    @Transactional
    public List<Product> bulkCreate(List<Product> products) {
        if (products == null || products.isEmpty()) {
            return Collections.emptyList();
        }

        // 1. Process distinct categories in a single pass to eliminate repetitive DB calls
        Set<String> uniqueCategories = products.stream()
                .map(Product::getCategory)
                .filter(c -> c != null && !c.trim().isEmpty())
                .map(String::trim)
                .collect(Collectors.toSet());
        if (uniqueCategories.isEmpty()) {
            uniqueCategories.add("General");
        }
        for (String cat : uniqueCategories) {
            try {
                categoryService.createCategory(cat, "Imported Category");
            } catch (Exception ignored) {
            }
        }

        // 2. Prepare, sanitize and timestamp each product
        LocalDateTime now = LocalDateTime.now();
        for (Product product : products) {
            if (product.getName() == null || product.getName().trim().isEmpty()) {
                throw new IllegalArgumentException("Product name cannot be empty");
            }
            if (product.getPrice() == null) {
                if (product.getOriginalPrice() != null) {
                    product.setPrice(product.getOriginalPrice());
                } else {
                    product.setPrice(BigDecimal.ZERO);
                }
            }
            if (product.getCategory() == null || product.getCategory().trim().isEmpty()) {
                product.setCategory("General");
            }
            if (product.getUnit() == null || product.getUnit().trim().isEmpty()) {
                product.setUnit("pc");
            }
            if (product.getStock() == null) {
                product.setStock(0);
            }
            if (product.getCreatedAt() == null) {
                product.setCreatedAt(now);
            }
            if (product.getUpdatedAt() == null) {
                product.setUpdatedAt(now);
            }
        }

        // 3. Batch insert using JdbcTemplate for single-roundtrip performance
        String sql = "INSERT INTO products (name, supplier, original_price, price, price_above_10, wholesale_price, category, stock, unit, barcode, description, created_at, updated_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                Product p = products.get(i);
                ps.setString(1, p.getName().trim());
                ps.setString(2, p.getSupplier() != null && !p.getSupplier().trim().isEmpty() ? p.getSupplier().trim() : null);
                if (p.getOriginalPrice() != null) {
                    ps.setBigDecimal(3, p.getOriginalPrice());
                } else {
                    ps.setNull(3, Types.NUMERIC);
                }
                ps.setBigDecimal(4, p.getPrice());
                if (p.getPriceAbove10() != null) {
                    ps.setBigDecimal(5, p.getPriceAbove10());
                } else {
                    ps.setNull(5, Types.NUMERIC);
                }
                if (p.getWholesalePrice() != null) {
                    ps.setBigDecimal(6, p.getWholesalePrice());
                } else {
                    ps.setNull(6, Types.NUMERIC);
                }
                ps.setString(7, p.getCategory());
                ps.setInt(8, p.getStock() != null ? p.getStock() : 0);
                ps.setString(9, p.getUnit());
                ps.setString(10, p.getBarcode());
                ps.setString(11, p.getDescription());
                ps.setTimestamp(12, Timestamp.valueOf(p.getCreatedAt()));
                ps.setTimestamp(13, Timestamp.valueOf(p.getUpdatedAt()));
            }

            @Override
            public int getBatchSize() {
                return products.size();
            }
        });

        return products;
    }

    @Transactional
    public List<Product> importFromExcel(InputStream inputStream) throws IOException {
        List<Product> list = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            // Find best sheet: check names for data, source, item, product, price, inventory or pick sheet with most rows
            Sheet sheet = null;
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                String sName = workbook.getSheetName(i).toLowerCase();
                if (sName.matches(".*(data|source|item|product|inventory|price|master|list).*")) {
                    sheet = workbook.getSheetAt(i);
                    break;
                }
            }
            if (sheet == null) {
                int maxRows = -1;
                for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                    Sheet s = workbook.getSheetAt(i);
                    if (s.getPhysicalNumberOfRows() > maxRows) {
                        maxRows = s.getPhysicalNumberOfRows();
                        sheet = s;
                    }
                }
            }
            if (sheet == null && workbook.getNumberOfSheets() > 0) {
                sheet = workbook.getSheetAt(0);
            }
            if (sheet == null) {
                return list;
            }

            // Find header row in first 30 rows
            Row headerRow = null;
            int headerRowIdx = -1;
            for (int r = sheet.getFirstRowNum(); r <= Math.min(sheet.getLastRowNum(), sheet.getFirstRowNum() + 30); r++) {
                Row testRow = sheet.getRow(r);
                if (testRow == null) continue;
                for (Cell cell : testRow) {
                    String str = getCellString(cell).toLowerCase().replaceAll("[^a-z0-9]", "");
                    if (str.matches(".*(itemname|productname|supplier|item|product).*")) {
                        headerRow = testRow;
                        headerRowIdx = r;
                        break;
                    }
                }
                if (headerRow != null) break;
            }

            if (headerRow == null) {
                headerRow = sheet.getRow(sheet.getFirstRowNum());
                headerRowIdx = sheet.getFirstRowNum();
            }
            if (headerRow == null) {
                return list;
            }

            Map<String, Integer> colMap = new HashMap<>();
            for (Cell cell : headerRow) {
                String val = getCellString(cell).toLowerCase().replaceAll("[^a-z0-9]", "");
                if (!val.isEmpty()) {
                    colMap.put(val, cell.getColumnIndex());
                }
            }

            Integer priceAbove10Col = findCol(colMap, "above10items", "above10", "10items", "10price", "priceabove10", "10plusprice", "bulk10");
            Integer wholesaleCol = findCol(colMap, "wholesaleprice", "wholesale", "wsprice", "bulkprice");
            Integer origPriceCol = findCol(colMap, "originalprice", "costprice", "cost", "origprice", "capital", "puhunan", "buyingprice");
            Integer priceCol = findCol(colMap, "sellingprice", "retailprice", "price", "srp", "benta", "sellprice");
            Integer supplierCol = findCol(colMap, "supplier", "vendor", "distributor", "source");
            Integer nameCol = findCol(colMap, "itemname", "productname", "item", "product", "name");
            Integer categoryCol = findCol(colMap, "category", "cat");
            Integer stockCol = findCol(colMap, "stock", "quantity", "qty", "count");
            Integer unitCol = findCol(colMap, "unit", "unittype", "uom");
            Integer barcodeCol = findCol(colMap, "barcode", "upc", "code");
            Integer descCol = findCol(colMap, "description", "desc", "notes");

            for (int r = headerRowIdx + 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                String name = getCellValue(row, nameCol);
                if (name == null || name.trim().isEmpty() || name.matches("(?i)^(total|grand total|subtotal|summary)$")) {
                    continue;
                }

                String supplier = getCellValue(row, supplierCol);
                BigDecimal origPrice = getCellDecimal(row, origPriceCol);
                BigDecimal price = getCellDecimal(row, priceCol);
                BigDecimal priceAbove10 = getCellDecimal(row, priceAbove10Col);
                BigDecimal wholesale = getCellDecimal(row, wholesaleCol);
                String category = getCellValue(row, categoryCol);
                Integer stock = getCellInteger(row, stockCol);
                String unit = getCellValue(row, unitCol);
                String barcode = getCellValue(row, barcodeCol);
                String desc = getCellValue(row, descCol);

                if (price == null) {
                    price = origPrice != null ? origPrice : BigDecimal.ZERO;
                }

                Product p = new Product(
                    name.trim(),
                    supplier != null && !supplier.trim().isEmpty() ? supplier.trim() : null,
                    origPrice,
                    price,
                    priceAbove10,
                    wholesale,
                    category != null && !category.trim().isEmpty() ? category.trim() : "General",
                    stock != null ? stock : 0,
                    unit != null && !unit.trim().isEmpty() ? unit.trim() : "pc",
                    barcode != null && !barcode.trim().isEmpty() ? barcode.trim() : null,
                    desc != null && !desc.trim().isEmpty() ? desc.trim() : null
                );
                list.add(p);
            }
        }

        return bulkCreate(list);
    }

    private String getCellValue(Row row, Integer colIndex) {
        if (row == null || colIndex == null) return null;
        Cell cell = row.getCell(colIndex);
        if (cell == null) return null;
        return getCellString(cell);
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        DataFormatter formatter = new DataFormatter();
        return formatter.formatCellValue(cell).trim();
    }

    private BigDecimal getCellDecimal(Row row, Integer colIndex) {
        String s = getCellValue(row, colIndex);
        if (s == null || s.trim().isEmpty()) return null;
        try {
            String clean = s.replaceAll("[^0-9.]", "");
            return new BigDecimal(clean);
        } catch (Exception e) {
            return null;
        }
    }

    private Integer getCellInteger(Row row, Integer colIndex) {
        String s = getCellValue(row, colIndex);
        if (s == null || s.trim().isEmpty()) return null;
        try {
            String clean = s.replaceAll("[^0-9]", "");
            return Integer.parseInt(clean);
        } catch (Exception e) {
            return null;
        }
    }

    private Integer findCol(Map<String, Integer> map, String... candidates) {
        for (String c : candidates) {
            if (map.containsKey(c)) return map.get(c);
        }
        for (Map.Entry<String, Integer> entry : map.entrySet()) {
            for (String c : candidates) {
                if (entry.getKey().contains(c)) return entry.getValue();
            }
        }
        return null;
    }

    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new IllegalArgumentException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<String> getCategories() {
        return categoryService.getAllCategoryNames();
    }

    @Transactional(readOnly = true)
    public InventoryStats getStats() {
        List<Product> all = productRepository.findAll();
        long totalProducts = all.size();
        long lowStockCount = all.stream().filter(p -> p.getStock() != null && p.getStock() <= 5).count();

        BigDecimal totalInventoryValue = BigDecimal.ZERO;
        BigDecimal totalCostValue = BigDecimal.ZERO;
        for (Product p : all) {
            int stockCount = p.getStock() != null ? p.getStock() : 0;
            if (p.getPrice() != null) {
                totalInventoryValue = totalInventoryValue.add(p.getPrice().multiply(BigDecimal.valueOf(stockCount)));
            }
            if (p.getOriginalPrice() != null) {
                totalCostValue = totalCostValue.add(p.getOriginalPrice().multiply(BigDecimal.valueOf(stockCount)));
            }
        }

        BigDecimal todaySales = saleService.getTodaySales();
        BigDecimal weekSales = saleService.getWeekSales();
        BigDecimal monthSales = saleService.getMonthSales();

        Map<String, Long> categoryCounts = all.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getCategory() != null ? p.getCategory() : "Uncategorized",
                        Collectors.counting()
                ));

        return new InventoryStats(
                totalProducts,
                lowStockCount,
                totalInventoryValue,
                totalCostValue,
                categoryCounts.keySet().size(),
                todaySales,
                weekSales,
                monthSales,
                categoryCounts
        );
    }
}
