package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        
        User user = authService.login(username, password);
        Map<String, Object> response = new HashMap<>();
        
        if (user != null) {
            response.put("success", true);
            response.put("user", Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "realName", user.getRealName(),
                    "email", user.getEmail(),
                    "isAdmin", authService.isAdmin(user)
            ));
        } else {
            response.put("success", false);
            response.put("message", "用户名或密码错误");
        }
        
        return response;
    }

    @PostMapping("/logout")
    public Map<String, Object> logout() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return response;
    }
}