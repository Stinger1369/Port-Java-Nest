package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.Skill;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillRepository extends MongoRepository<Skill, String> {
    List<Skill> findByUserId(String userId); // ✅ Trouver les skills par userId
}
