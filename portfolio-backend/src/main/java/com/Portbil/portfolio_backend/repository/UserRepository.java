package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByResetToken(String resetToken);
    Optional<User> findByFirstNameAndLastName(String firstName, String lastName); // Gardé pour compatibilité
    List<User> findAllByFirstNameAndLastName(String firstName, String lastName);  // Gardé pour compatibilité
    Optional<User> findBySlug(String slug);
    Optional<User> findByPhone(String phone);
}