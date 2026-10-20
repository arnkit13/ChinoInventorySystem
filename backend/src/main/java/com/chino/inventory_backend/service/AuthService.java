package com.chino.inventory_backend.service;

import com.chino.inventory_backend.dto.LoginRequest;
import com.chino.inventory_backend.dto.LoginResponse;
import com.chino.inventory_backend.model.User;
import com.chino.inventory_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    // Simple in-memory token store for session verification
    private final Map<String, User> activeTokens = new ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public LoginResponse login(LoginRequest request) {
        if (request.getUsername() == null || request.getPassword() == null) {
            return LoginResponse.failure("Username and password are required.");
        }

        return userRepository.findByUsername(request.getUsername().trim())
                .filter(u -> u.getPassword().equals(request.getPassword().trim()))
                .map(user -> {
                    String token = "chino-auth-" + UUID.randomUUID().toString();
                    activeTokens.put(token, user);
                    return LoginResponse.success(token, user.getUsername(), user.getRole(), user.getFullName());
                })
                .orElseGet(() -> LoginResponse.failure("Invalid username or password."));
    }

    public boolean logout(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        if (token != null) {
            return activeTokens.remove(token) != null;
        }
        return false;
    }

    public User validateToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        if (token == null) return null;
        return activeTokens.get(token);
    }
}
