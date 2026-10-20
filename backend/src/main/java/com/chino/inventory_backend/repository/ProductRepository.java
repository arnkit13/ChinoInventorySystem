package com.chino.inventory_backend.repository;

import com.chino.inventory_backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByBarcode(String barcode);

    List<Product> findByCategoryIgnoreCase(String category);

    @Query("SELECT p FROM Product p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.category) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "(p.barcode IS NOT NULL AND LOWER(p.barcode) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY " +
           "CASE " +
           "  WHEN LOWER(p.name) LIKE LOWER(CONCAT(:keyword, '%')) THEN 1 " +
           "  WHEN LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) THEN 2 " +
           "  ELSE 3 " +
           "END, p.name ASC")
    List<Product> searchProducts(@Param("keyword") String keyword);

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.category IS NOT NULL ORDER BY p.category ASC")
    List<String> findDistinctCategories();

    long countByStockLessThan(int threshold);
}
