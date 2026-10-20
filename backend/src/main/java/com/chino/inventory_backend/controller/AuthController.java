package com.chino.inventory_backend.controller;

import com.chino.inventory_backend.dto.LoginRequest;
import com.chino.inventory_backend.dto.LoginResponse;
import com.chino.inventory_backend.model.User;
import com.chino.inventory_backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<LoginResponse> logout(@RequestHeader(value = "Authorization", required = false) String token) {
        authService.logout(token);
        LoginResponse response = new LoginResponse(true, "Logged out successfully", null, null, null, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.validateToken(token);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(LoginResponse.failure("Unauthorized or session expired"));
        }
        return ResponseEntity.ok(LoginResponse.success(token, user.getUsername(), user.getRole(), user.getFullName()));
    }
}
