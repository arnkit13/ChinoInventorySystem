package com.chino.inventory_backend.dto;

import java.math.BigDecimal;
import java.util.Map;

public class InventoryStats {

    private long totalProducts;
    private long lowStockCount;
    private BigDecimal totalInventoryValue;
    private long totalCategories;
    private BigDecimal todaySales;
    private BigDecimal weekSales;
    private BigDecimal monthSales;
    private Map<String, Long> categoryCounts;

    public InventoryStats() {
    }

    public InventoryStats(long totalProducts, long lowStockCount, BigDecimal totalInventoryValue, long totalCategories, BigDecimal todaySales, BigDecimal weekSales, BigDecimal monthSales, Map<String, Long> categoryCounts) {
        this.totalProducts = totalProducts;
        this.lowStockCount = lowStockCount;
        this.totalInventoryValue = totalInventoryValue;
        this.totalCategories = totalCategories;
        this.todaySales = todaySales;
        this.weekSales = weekSales;
        this.monthSales = monthSales;
        this.categoryCounts = categoryCounts;
    }

    public long getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
    }

    public long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public BigDecimal getTotalInventoryValue() {
        return totalInventoryValue;
    }

    public void setTotalInventoryValue(BigDecimal totalInventoryValue) {
        this.totalInventoryValue = totalInventoryValue;
    }

    public long getTotalCategories() {
        return totalCategories;
    }

    public void setTotalCategories(long totalCategories) {
        this.totalCategories = totalCategories;
    }

    public BigDecimal getTodaySales() {
        return todaySales;
    }

    public void setTodaySales(BigDecimal todaySales) {
        this.todaySales = todaySales;
    }

    public BigDecimal getWeekSales() {
        return weekSales;
    }

    public void setWeekSales(BigDecimal weekSales) {
        this.weekSales = weekSales;
    }

    public BigDecimal getMonthSales() {
        return monthSales;
    }

    public void setMonthSales(BigDecimal monthSales) {
        this.monthSales = monthSales;
    }

    public Map<String, Long> getCategoryCounts() {
        return categoryCounts;
    }

    public void setCategoryCounts(Map<String, Long> categoryCounts) {
        this.categoryCounts = categoryCounts;
    }
}
