package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.Experience;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository; // Ajout de l'importation manquante

import java.util.List;

@Repository
public interface ExperienceRepository extends MongoRepository<Experience, String> {
    List<Experience> findByUserId(String userId);
    List<Experience> findByUserIdAndIsPublicTrue(String userId); // Pour le portfolio public
}