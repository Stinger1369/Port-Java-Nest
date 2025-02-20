package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByResetToken(String resetToken); // ✅ Trouver un utilisateur par son token de réinitialisation
}
