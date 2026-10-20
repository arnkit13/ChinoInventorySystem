package com.chino.inventory_backend.service;

import com.chino.inventory_backend.model.Category;
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
}
