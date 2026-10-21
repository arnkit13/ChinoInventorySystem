package com.chino.inventory_backend.controller;

import com.chino.inventory_backend.dto.InventoryStats;
import com.chino.inventory_backend.model.Product;
import com.chino.inventory_backend.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * Fast search & autocomplete endpoint for Tindera/o.
     * Searches by keyword across product name, category, and barcode.
     */
    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(
            @RequestParam(value = "q", required = false, defaultValue = "") String query) {
        List<Product> results = productService.searchForTindera(query);
        return ResponseEntity.ok(results);
    }

    /**
     * Admin view: List all products with optional filters.
     */
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "category", required = false) String category) {
        List<Product> products = productService.getAll(search, category);
        return ResponseEntity.ok(products);
    }

    /**
     * Get single product details.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    /**
     * Admin: Create a new product.
     */
    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product) {
        Product created = productService.create(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Admin: Bulk create products (e.g. from parsed Excel or batch insert).
     */
    @PostMapping("/bulk")
    public ResponseEntity<List<Product>> bulkCreate(@Valid @RequestBody List<Product> products) {
        List<Product> created = productService.bulkCreate(products);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Admin: Directly upload and import an Excel file (.xlsx or .xls).
     */
    @PostMapping(value = "/import-excel", consumes = "multipart/form-data")
    public ResponseEntity<?> importExcelFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Uploaded file is empty.");
        }
        try {
            List<Product> created = productService.importFromExcel(file.getInputStream());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to process Excel file: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Admin: Update product details and price.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody Product product) {
        Product updated = productService.update(id, product);
        return ResponseEntity.ok(updated);
    }

    /**
     * Admin: Delete product.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all unique categories.
     */
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(productService.getCategories());
    }

    /**
     * Admin Inventory dashboard stats.
     */
    @GetMapping("/stats")
    public ResponseEntity<InventoryStats> getStats() {
        return ResponseEntity.ok(productService.getStats());
    }
}
