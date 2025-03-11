package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.SocialLink;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SocialLinkRepository extends MongoRepository<SocialLink, String> {
    List<SocialLink> findByUserId(String userId);
    List<SocialLink> findByUserIdAndIsPublicTrue(String userId); // Pour le portfolio public
}