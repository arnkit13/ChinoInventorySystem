package com.chino.inventory_backend.service;

import com.chino.inventory_backend.dto.SaleRequest;
import com.chino.inventory_backend.model.Product;
import com.chino.inventory_backend.model.Sale;
import com.chino.inventory_backend.model.SaleItem;
import com.chino.inventory_backend.repository.ProductRepository;
import com.chino.inventory_backend.repository.SaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
@Transactional
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;

    public SaleService(SaleRepository saleRepository, ProductRepository productRepository) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
    }

    public Sale recordSale(SaleRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cannot record sale with empty items.");
        }

        BigDecimal total = BigDecimal.ZERO;
        Sale sale = new Sale(BigDecimal.ZERO, request.getPaymentReceived(), request.getChangeGiven(), LocalDateTime.now());

        for (SaleRequest.SaleItemDto itemDto : request.getItems()) {
            BigDecimal price = itemDto.getPrice() != null ? itemDto.getPrice() : BigDecimal.ZERO;
            int qty = itemDto.getQuantity() != null ? itemDto.getQuantity() : 1;
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(qty));
            total = total.add(subtotal);

            SaleItem item = new SaleItem(
                    sale,
                    itemDto.getProductId(),
                    itemDto.getProductName(),
                    qty,
                    price,
                    subtotal
            );
            sale.addItem(item);

            // Update product stock if product id exists
            if (itemDto.getProductId() != null) {
                productRepository.findById(itemDto.getProductId()).ifPresent(prod -> {
                    int currentStock = prod.getStock() != null ? prod.getStock() : 0;
                    prod.setStock(Math.max(0, currentStock - qty));
                    productRepository.save(prod);
                });
            }
        }

        sale.setTotalAmount(total);
        return saleRepository.save(sale);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTodaySales() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        return saleRepository.sumTotalSalesBetween(startOfDay, endOfDay);
    }

    @Transactional(readOnly = true)
    public BigDecimal getWeekSales() {
        LocalDate now = LocalDate.now();
        LocalDate startOfWeek = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDateTime start = startOfWeek.atStartOfDay();
        LocalDateTime end = now.atTime(LocalTime.MAX);
        return saleRepository.sumTotalSalesBetween(start, end);
    }

    @Transactional(readOnly = true)
    public BigDecimal getMonthSales() {
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDateTime start = startOfMonth.atStartOfDay();
        LocalDateTime end = now.atTime(LocalTime.MAX);
        return saleRepository.sumTotalSalesBetween(start, end);
    }

    @Transactional(readOnly = true)
    public List<Sale> getRecentSales() {
        return saleRepository.findTop20ByOrderByCreatedAtDesc();
    }
}
