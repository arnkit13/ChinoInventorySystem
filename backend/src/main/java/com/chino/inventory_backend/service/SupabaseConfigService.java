package com.chino.inventory_backend.service;

import com.chino.inventory_backend.dto.SupabaseConfigDto;
import com.chino.inventory_backend.model.SupabaseSettings;
import com.chino.inventory_backend.repository.SupabaseSettingsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class SupabaseConfigService {

    private final SupabaseSettingsRepository repository;

    @Value("${supabase.url:}")
    private String envSupabaseUrl;

    @Value("${supabase.key:}")
    private String envSupabaseKey;

    public SupabaseConfigService(SupabaseSettingsRepository repository) {
        this.repository = repository;
    }

    public SupabaseConfigDto getConfig() {
        SupabaseSettings settings = repository.findAll().stream().findFirst().orElse(null);
        String url = settings != null && settings.getSupabaseUrl() != null ? settings.getSupabaseUrl() : envSupabaseUrl;
        String key = settings != null && settings.getSupabaseKey() != null ? settings.getSupabaseKey() : envSupabaseKey;
        String dbUrl = settings != null ? settings.getDatabaseUrl() : "";
        Boolean isConnected = settings != null ? settings.getIsConnected() : false;
        LocalDateTime lastTested = settings != null ? settings.getLastTested() : null;

        String maskedKey = (key != null && key.length() > 8) 
                ? key.substring(0, 4) + "..." + key.substring(key.length() - 4) 
                : (key != null ? key : "");

        return new SupabaseConfigDto(url, maskedKey, dbUrl, isConnected, lastTested, "Configuration retrieved.");
    }

    public SupabaseConfigDto saveAndTestConfig(SupabaseConfigDto dto) {
        SupabaseSettings settings = repository.findAll().stream().findFirst().orElse(new SupabaseSettings());
        
        if (dto.getSupabaseUrl() != null && !dto.getSupabaseUrl().trim().isEmpty()) {
            settings.setSupabaseUrl(dto.getSupabaseUrl().trim());
        }
        if (dto.getSupabaseKey() != null && !dto.getSupabaseKey().trim().isEmpty() && !dto.getSupabaseKey().contains("...")) {
            settings.setSupabaseKey(dto.getSupabaseKey().trim());
        }
        if (dto.getDatabaseUrl() != null) {
            settings.setDatabaseUrl(dto.getDatabaseUrl().trim());
        }

        settings.setLastTested(LocalDateTime.now());
        
        // Test HTTP health check ping to Supabase REST if URL is supplied
        boolean pingOk = false;
        String statusMessage;
        if (settings.getSupabaseUrl() != null && !settings.getSupabaseUrl().isEmpty()) {
            try {
                String testUrl = settings.getSupabaseUrl();
                if (!testUrl.startsWith("http://") && !testUrl.startsWith("https://")) {
                    testUrl = "https://" + testUrl;
                }
                if (!testUrl.endsWith("/")) {
                    testUrl += "/";
                }
                
                HttpClient client = HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(4))
                        .build();

                HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                        .uri(URI.create(testUrl + "rest/v1/"))
                        .timeout(Duration.ofSeconds(4))
                        .GET();

                if (settings.getSupabaseKey() != null && !settings.getSupabaseKey().isEmpty()) {
                    reqBuilder.header("apikey", settings.getSupabaseKey());
                    reqBuilder.header("Authorization", "Bearer " + settings.getSupabaseKey());
                }

                HttpResponse<String> resp = client.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());
                // If status code is 200, 401, or 403, server reached
                if (resp.statusCode() == 200 || resp.statusCode() == 401 || resp.statusCode() == 403) {
                    pingOk = resp.statusCode() == 200;
                    statusMessage = pingOk ? "Supabase connected successfully!" : "Supabase endpoint reachable (API key verification response: " + resp.statusCode() + ").";
                } else {
                    statusMessage = "Supabase responded with HTTP " + resp.statusCode();
                }
            } catch (Exception e) {
                pingOk = false;
                statusMessage = "Could not reach Supabase endpoint: " + e.getMessage();
            }
        } else {
            statusMessage = "Settings saved (Pending Supabase credentials).";
        }

        settings.setIsConnected(pingOk);
        repository.save(settings);

        return new SupabaseConfigDto(
                settings.getSupabaseUrl(),
                settings.getSupabaseKey() != null && settings.getSupabaseKey().length() > 8 
                        ? settings.getSupabaseKey().substring(0, 4) + "..." + settings.getSupabaseKey().substring(settings.getSupabaseKey().length() - 4)
                        : settings.getSupabaseKey(),
                settings.getDatabaseUrl(),
                settings.getIsConnected(),
                settings.getLastTested(),
                statusMessage
        );
    }
}
