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

        // Support standard DATABASE_URL or SPRING_DATASOURCE_URL format (e.g. from Railway Postgres)
        String dbUrl = System.getenv("DATABASE_URL");
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getenv("SPRING_DATASOURCE_URL");
        }
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getenv("DATABASE_PRIVATE_URL");
        }
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getenv("DATABASE_PUBLIC_URL");
        }
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getProperty("DATABASE_URL");
        }
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getProperty("SPRING_DATASOURCE_URL");
        }
        if (dbUrl != null && !dbUrl.isBlank()) {
            try {
                String cleanUrl = dbUrl.startsWith("jdbc:") ? dbUrl.substring(5) : dbUrl;
                java.net.URI uri = new java.net.URI(cleanUrl);
                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    System.setProperty("SPRING_DATASOURCE_USERNAME", parts[0]);
                    System.setProperty("SPRING_DATASOURCE_PASSWORD", parts[1]);
                    System.setProperty("spring.datasource.username", parts[0]);
                    System.setProperty("spring.datasource.password", parts[1]);
                }
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();
                String query = uri.getQuery();
                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path + (query != null ? "?" + query : "");
                System.setProperty("SPRING_DATASOURCE_URL", jdbcUrl);
                System.setProperty("spring.datasource.url", jdbcUrl);
                System.setProperty("spring.datasource.driverClassName", "org.postgresql.Driver");
            } catch (Exception ignored) {
            }
        } else {
            // Check individual Railway PG environment variables
            String pgHost = System.getenv("PGHOST");
            if (pgHost != null && !pgHost.isBlank()) {
                String pgPort = System.getenv().getOrDefault("PGPORT", "5432");
                String pgDb = System.getenv().getOrDefault("PGDATABASE", "railway");
                String pgUser = System.getenv().getOrDefault("PGUSER", "postgres");
                String pgPass = System.getenv().getOrDefault("PGPASSWORD", "");
                String jdbcUrl = "jdbc:postgresql://" + pgHost + ":" + pgPort + "/" + pgDb;
                System.setProperty("SPRING_DATASOURCE_URL", jdbcUrl);
                System.setProperty("spring.datasource.url", jdbcUrl);
                System.setProperty("SPRING_DATASOURCE_USERNAME", pgUser);
                System.setProperty("spring.datasource.username", pgUser);
                System.setProperty("SPRING_DATASOURCE_PASSWORD", pgPass);
                System.setProperty("spring.datasource.password", pgPass);
                System.setProperty("spring.datasource.driverClassName", "org.postgresql.Driver");
            }
        }
    }
}
