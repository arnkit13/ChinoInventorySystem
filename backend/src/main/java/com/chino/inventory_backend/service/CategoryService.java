package com.chino.inventory_backend.service;

import com.chino.inventory_backend.model.Category;
import com.chino.inventory_backend.model.Product;
import com.chino.inventory_backend.repository.CategoryRepository;
import com.chino.inventory_backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<String> getAllCategoryNames() {
        Set<String> unique = new LinkedHashSet<>();
        
        // From Category entity table
        categoryRepository.findAll().forEach(c -> {
            if (c.getName() != null && !c.getName().trim().isEmpty()) {
                unique.add(c.getName().trim());
            }
        });

        // From Product distinct categories
        productRepository.findDistinctCategories().forEach(c -> {
            if (c != null && !c.trim().isEmpty()) {
                unique.add(c.trim());
            }
        });

        return new ArrayList<>(unique);
    }

    public Category createCategory(String name, String description) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Category name cannot be blank.");
        }
        String cleanName = name.trim();
        return categoryRepository.findByNameIgnoreCase(cleanName)
                .orElseGet(() -> categoryRepository.save(new Category(cleanName, description)));
    }

    public Category updateCategory(String oldName, String newName, String description) {
        if (oldName == null || oldName.trim().isEmpty()) {
            throw new IllegalArgumentException("Current category name is required.");
        }
        if (newName == null || newName.trim().isEmpty()) {
            throw new IllegalArgumentException("New category name cannot be blank.");
        }
        String cleanOld = oldName.trim();
        String cleanNew = newName.trim();

        Category category = categoryRepository.findByNameIgnoreCase(cleanOld)
                .orElseGet(() -> new Category(cleanOld, description));

        category.setName(cleanNew);
        if (description != null) {
            category.setDescription(description);
        }
        Category saved = categoryRepository.save(category);

        // Synchronize all products with this category
        productRepository.updateCategoryName(cleanOld, cleanNew);

        return saved;
    }

    public void deleteCategory(String name, boolean deleteProducts) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Category name cannot be blank.");
        }
        String cleanName = name.trim();

        // Remove from Category entity table
        categoryRepository.deleteByNameIgnoreCase(cleanName);

        // Remove or reassign from products so it never resurrects
        if (deleteProducts) {
            productRepository.deleteByCategoryIgnoreCase(cleanName);
        } else {
            productRepository.reassignCategoryToGeneral(cleanName);
        }
    }

    public void assignProductsToCategory(String categoryName, List<Long> productIds) {
        if (categoryName == null || categoryName.trim().isEmpty() || productIds == null || productIds.isEmpty()) {
            return;
        }
        String cleanCategory = categoryName.trim();
        List<Product> products = productRepository.findAllById(productIds);
        for (Product p : products) {
            p.setCategory(cleanCategory);
        }
        productRepository.saveAll(products);
    }
}
