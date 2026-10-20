package com.chino.inventory_backend.repository;

import com.chino.inventory_backend.model.SupabaseSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupabaseSettingsRepository extends JpaRepository<SupabaseSettings, Long> {
}
