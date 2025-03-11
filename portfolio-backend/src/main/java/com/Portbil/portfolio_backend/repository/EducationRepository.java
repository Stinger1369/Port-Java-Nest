package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.Education;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EducationRepository extends MongoRepository<Education, String> {
    List<Education> findByUserId(String userId);
    List<Education> findByUserIdAndIsPublicTrue(String userId); // Pour le portfolio public
}