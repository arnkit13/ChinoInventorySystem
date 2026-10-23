package com.chino.inventory_backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url:${SPRING_DATASOURCE_URL:${DATABASE_URL:}}}")
    private String rawUrl;

    @Value("${spring.datasource.username:${SPRING_DATASOURCE_USERNAME:${PGUSER:postgres}}}")
    private String defaultUsername;

    @Value("${spring.datasource.password:${SPRING_DATASOURCE_PASSWORD:${PGPASSWORD:}}}")
    private String defaultPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String url = rawUrl != null ? rawUrl.trim() : "";
        String username = defaultUsername;
        String password = defaultPassword;

        // If URL is in standard postgresql://user:pass@host:port/db format
        if (url.startsWith("postgresql://") || url.startsWith("postgres://") || url.startsWith("jdbc:postgresql://")) {
            try {
                String cleanUrl = url.startsWith("jdbc:") ? url.substring(5) : url;
                URI uri = new URI(cleanUrl);
                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    password = parts[1];
                }
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();
                String query = uri.getQuery();
                url = "jdbc:postgresql://" + host + ":" + port + path + (query != null ? "?" + query : "");
            } catch (Exception ignored) {
                if (!url.startsWith("jdbc:")) {
                    url = "jdbc:" + url;
                }
            }
        }

        // Ensure jdbc: prefix is present
        if (!url.startsWith("jdbc:")) {
            url = "jdbc:" + url;
        }

        // Prevent PgBouncer prepared statement collision
        if (!url.contains("prepareThreshold")) {
            url += (url.contains("?") ? "&" : "?") + "prepareThreshold=0";
        }

        System.out.println(">>> [DatabaseConfig] Final JDBC URL: " + url.replaceAll(":[^/@]+@", ":****@"));
        System.out.println(">>> [DatabaseConfig] Database User: " + username);

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(30000);
        config.setMaxLifetime(60000);
        config.setConnectionTimeout(30000);

        return new HikariDataSource(config);
    }
}
