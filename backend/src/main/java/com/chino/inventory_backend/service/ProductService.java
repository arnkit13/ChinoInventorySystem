package com.chino.inventory_backend.service;

import com.chino.inventory_backend.dto.InventoryStats;
import com.chino.inventory_backend.model.Product;
import com.chino.inventory_backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final SaleService saleService;
    private final CategoryService categoryService;

    public ProductService(ProductRepository productRepository, SaleService saleService, CategoryService categoryService) {
        this.productRepository = productRepository;
        this.saleService = saleService;
        this.categoryService = categoryService;
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
        existing.setPrice(incoming.getPrice());
        existing.setCategory(incoming.getCategory() != null ? incoming.getCategory() : existing.getCategory());
        existing.setStock(incoming.getStock() != null ? incoming.getStock() : existing.getStock());
        existing.setUnit(incoming.getUnit() != null ? incoming.getUnit() : existing.getUnit());
        existing.setBarcode(incoming.getBarcode());
        existing.setDescription(incoming.getDescription());
        return productRepository.save(existing);
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
        for (Product p : all) {
            if (p.getPrice() != null) {
                int stockCount = p.getStock() != null ? p.getStock() : 0;
                totalInventoryValue = totalInventoryValue.add(p.getPrice().multiply(BigDecimal.valueOf(stockCount)));
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
                categoryCounts.keySet().size(),
                todaySales,
                weekSales,
                monthSales,
                categoryCounts
        );
    }
}
