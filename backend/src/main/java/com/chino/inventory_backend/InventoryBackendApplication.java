package com.chino.inventory_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

@SpringBootApplication
public class InventoryBackendApplication {

    static {
        loadDotenv();
    }

    public static void main(String[] args) {
        String url = System.getProperty("SPRING_DATASOURCE_URL", System.getenv("SPRING_DATASOURCE_URL"));
        String user = System.getProperty("SPRING_DATASOURCE_USERNAME", System.getenv("SPRING_DATASOURCE_USERNAME"));
        String port = System.getenv("PORT");
        System.out.println("==================================================");
        System.out.println("Starting Chino Inventory Backend");
        System.out.println("PORT: " + port);
        System.out.println("DB URL: " + (url != null ? url : "(using default in properties)"));
        System.out.println("DB USER: " + (user != null ? user : "(using default in properties)"));
        System.out.println("==================================================");
        SpringApplication.run(InventoryBackendApplication.class, args);
    }

    private static void loadDotenv() {
        File[] candidateFiles = new File[] {
            new File(".env"),
            new File("../.env")
        };

        for (File file : candidateFiles) {
            if (file.exists() && file.isFile()) {
                try {
                    List<String> lines = Files.readAllLines(file.toPath());
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int eqIdx = line.indexOf('=');
                        if (eqIdx > 0) {
                            String key = line.substring(0, eqIdx).trim();
                            String val = line.substring(eqIdx + 1).trim();
                            if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                                val = val.substring(1, val.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, val);
                            }
                        }
                    }
                } catch (Exception e) {
                    // Continue with existing environment configuration
                }
                break;
            }
        }

        // Support standard DATABASE_URL format (e.g. from Railway Postgres or Supabase)
        String dbUrl = System.getenv("DATABASE_URL");
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getProperty("DATABASE_URL");
        }
        if (dbUrl != null && !dbUrl.isBlank() && System.getenv("SPRING_DATASOURCE_URL") == null && System.getProperty("SPRING_DATASOURCE_URL") == null) {
            try {
                java.net.URI uri = new java.net.URI(dbUrl.replace("jdbc:", ""));
                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    System.setProperty("SPRING_DATASOURCE_USERNAME", parts[0]);
                    System.setProperty("SPRING_DATASOURCE_PASSWORD", parts[1]);
                }
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();
                String query = uri.getQuery();
                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path + (query != null ? "?" + query : "");
                System.setProperty("SPRING_DATASOURCE_URL", jdbcUrl);
            } catch (Exception ignored) {
            }
        }
    }
}
