package com.chino.inventory_backend.dto;

import java.time.LocalDateTime;

public class SupabaseConfigDto {

    private String supabaseUrl;
    private String supabaseKey;
    private String databaseUrl;
    private Boolean isConnected;
    private LocalDateTime lastTested;
    private String message;

    public SupabaseConfigDto() {
    }

    public SupabaseConfigDto(String supabaseUrl, String supabaseKey, String databaseUrl, Boolean isConnected, LocalDateTime lastTested, String message) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.databaseUrl = databaseUrl;
        this.isConnected = isConnected;
        this.lastTested = lastTested;
        this.message = message;
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

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
