package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.Recommendation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationRepository extends MongoRepository<Recommendation, String> {
    List<Recommendation> findByUserId(String userId);
    List<Recommendation> findByRecommenderId(String recommenderId);
}
