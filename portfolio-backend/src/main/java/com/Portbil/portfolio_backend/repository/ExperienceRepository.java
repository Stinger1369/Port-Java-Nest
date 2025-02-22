package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.Experience;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ExperienceRepository extends MongoRepository<Experience, String> {
    List<Experience> findByUserId(String userId);
}
