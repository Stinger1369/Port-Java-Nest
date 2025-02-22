package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.Language;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LanguageRepository extends MongoRepository<Language, String> {
    List<Language> findByUserId(String userId);
}
