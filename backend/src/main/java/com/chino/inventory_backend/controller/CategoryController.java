package com.chino.inventory_backend.controller;

import com.chino.inventory_backend.model.Category;
import com.chino.inventory_backend.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<String>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategoryNames());
    }

    @PostMapping
    public ResponseEntity<Category> createCategory(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String description = body.get("description");
        Category created = categoryService.createCategory(name, description);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping
    public ResponseEntity<Category> updateCategory(@RequestBody Map<String, String> body) {
        String oldName = body.get("oldName");
        String newName = body.get("newName");
        String description = body.get("description");
        Category updated = categoryService.updateCategory(oldName, newName, description);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{name}")
    public ResponseEntity<?> deleteCategory(
            @PathVariable String name,
            @RequestParam(defaultValue = "false") boolean deleteProducts) {
        categoryService.deleteCategory(name, deleteProducts);
        return ResponseEntity.ok(Map.of("success", true, "message", "Category deleted successfully"));
    }

    @PutMapping("/{name}/assign-products")
    public ResponseEntity<?> assignProductsToCategory(
            @PathVariable String name,
            @RequestBody List<Long> productIds) {
        categoryService.assignProductsToCategory(name, productIds);
        return ResponseEntity.ok(Map.of("success", true, "updatedCount", productIds != null ? productIds.size() : 0));
    }
}
