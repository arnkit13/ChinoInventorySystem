package com.chino.inventory_backend.controller;

import com.chino.inventory_backend.dto.SaleRequest;
import com.chino.inventory_backend.model.Sale;
import com.chino.inventory_backend.service.SaleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @PostMapping
    public ResponseEntity<Sale> recordSale(@RequestBody SaleRequest request) {
        Sale sale = saleService.recordSale(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(sale);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Sale>> getRecentSales() {
        return ResponseEntity.ok(saleService.getRecentSales());
    }
}
