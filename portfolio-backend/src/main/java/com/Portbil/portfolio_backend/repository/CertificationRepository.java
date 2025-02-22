package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.Certification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CertificationRepository extends MongoRepository<Certification, String> {
    List<Certification> findByUserId(String userId);
}
