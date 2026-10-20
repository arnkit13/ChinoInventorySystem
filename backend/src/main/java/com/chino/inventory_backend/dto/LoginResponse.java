package com.chino.inventory_backend.dto;

public class LoginResponse {

    private boolean success;
    private String message;
    private String token;
    private String username;
    private String role;
    private String fullName;

    public LoginResponse() {
    }

    public LoginResponse(boolean success, String message, String token, String username, String role, String fullName) {
        this.success = success;
        this.message = message;
        this.token = token;
        this.username = username;
        this.role = role;
        this.fullName = fullName;
    }

    public static LoginResponse failure(String message) {
        return new LoginResponse(false, message, null, null, null, null);
    }

    public static LoginResponse success(String token, String username, String role, String fullName) {
        return new LoginResponse(true, "Authentication successful", token, username, role, fullName);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
}
