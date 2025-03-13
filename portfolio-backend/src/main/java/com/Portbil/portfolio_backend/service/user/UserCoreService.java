package com.Portbil.portfolio_backend.service.user;

import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserCoreService {

    private final UserRepository userRepository;

    /**
     * Récupérer tous les utilisateurs
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Récupérer un utilisateur par ID
     */
    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    /**
     * Récupérer un utilisateur par email
     */
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Supprimer un utilisateur
     */
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
}