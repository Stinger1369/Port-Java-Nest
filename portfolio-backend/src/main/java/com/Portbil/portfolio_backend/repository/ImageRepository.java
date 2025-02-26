package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.Image;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ImageRepository extends MongoRepository<Image, String> {
    List<Image> findByUserId(String userId);
    void deleteByUserIdAndName(String userId, String name);
}