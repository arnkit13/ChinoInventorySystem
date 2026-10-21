package com.chino.inventory_backend.repository;

import com.chino.inventory_backend.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE s.createdAt >= :startDate AND s.createdAt <= :endDate")
    BigDecimal sumTotalSalesBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.createdAt >= :startDate AND s.createdAt <= :endDate")
    long countSalesBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT DISTINCT s FROM Sale s LEFT JOIN FETCH s.items ORDER BY s.createdAt DESC")
    List<Sale> findTop20ByOrderByCreatedAtDesc();
}
