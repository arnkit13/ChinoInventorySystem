package com.chino.inventory_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "supabase_settings")
public class SupabaseSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "supabase_url")
    private String supabaseUrl;

    @Column(name = "supabase_key", length = 1000)
    private String supabaseKey;

    @Column(name = "database_url", length = 1000)
    private String databaseUrl;

    @Column(name = "is_connected")
    private Boolean isConnected = false;

    @Column(name = "last_tested")
    private LocalDateTime lastTested;

    public SupabaseSettings() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSupabaseUrl() {
        return supabaseUrl;
    }

    public void setSupabaseUrl(String supabaseUrl) {
        this.supabaseUrl = supabaseUrl;
    }

    public String getSupabaseKey() {
        return supabaseKey;
    }

    public void setSupabaseKey(String supabaseKey) {
        this.supabaseKey = supabaseKey;
    }

    public String getDatabaseUrl() {
        return databaseUrl;
    }

    public void setDatabaseUrl(String databaseUrl) {
        this.databaseUrl = databaseUrl;
    }

    public Boolean getIsConnected() {
        return isConnected;
    }

    public void setIsConnected(Boolean connected) {
        isConnected = connected;
    }

    public LocalDateTime getLastTested() {
        return lastTested;
    }

    public void setLastTested(LocalDateTime lastTested) {
        this.lastTested = lastTested;
    }
}
