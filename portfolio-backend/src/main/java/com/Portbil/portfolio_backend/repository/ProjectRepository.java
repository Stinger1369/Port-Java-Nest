package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.Project;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends MongoRepository<Project, String> {
    List<Project> findByUserId(String userId);
    List<Project> findByUserIdAndIsPublicTrue(String userId); // Pour le portfolio public
}