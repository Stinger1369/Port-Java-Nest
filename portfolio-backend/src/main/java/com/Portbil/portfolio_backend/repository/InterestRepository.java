package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.Interest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterestRepository extends MongoRepository<Interest, String> {
    List<Interest> findByUserId(String userId);
}