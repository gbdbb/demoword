package com.example.backend.service;

import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;

    public User login(String username, String password) {
        User user = userRepository.findByUsername(username);
        if (user != null && user.getPassword().equals(password) && user.getStatus()) {
            return user;
        }
        return null;
    }

    public boolean hasRole(User user, String roleCode) {
        if (user == null) {
            return false;
        }
        Set<Role> roles = user.getRoles();
        for (Role role : roles) {
            if (role.getRoleCode().equals(roleCode)) {
                return true;
            }
        }
        return false;
    }

    public boolean isAdmin(User user) {
        return hasRole(user, Role.ADMIN);
    }
}