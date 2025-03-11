package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.entity.Skill;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.SkillRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final PortfolioService portfolioService;

    public List<Skill> getAllSkills() {
        return skillRepository.findAll();
    }

    public List<Skill> getSkillsByUserId(String userId) {
        return skillRepository.findByUserId(userId);
    }

    public Optional<Skill> getSkillById(String id) {
        return skillRepository.findById(id);
    }

    public Skill createSkill(Skill skill) {
        Optional<User> userOptional = userRepository.findById(skill.getUserId());
        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("Utilisateur non trouvé !");
        }

        Skill savedSkill = skillRepository.save(skill);

        User user = userOptional.get();
        user.getSkillIds().add(savedSkill.getId());
        userRepository.save(user);
        portfolioService.updatePortfolioWithUserData(user.getId());

        return savedSkill;
    }

    public Optional<Skill> updateSkill(String id, Skill updatedSkill) {
        return skillRepository.findById(id).map(existingSkill -> {
            existingSkill.setName(updatedSkill.getName());
            existingSkill.setLevel(updatedSkill.getLevel());
            existingSkill.setDescription(updatedSkill.getDescription());
            existingSkill.setPublic(updatedSkill.isPublic()); // Ajout de la mise à jour de isPublic

            Skill savedSkill = skillRepository.save(existingSkill);
            portfolioService.updatePortfolioWithUserData(existingSkill.getUserId());

            return savedSkill;
        });
    }

    public void deleteSkill(String id) {
        skillRepository.findById(id).ifPresent(skill -> {
            userRepository.findById(skill.getUserId()).ifPresent(user -> {
                user.getSkillIds().remove(id);
                userRepository.save(user);
                portfolioService.updatePortfolioWithUserData(user.getId());
            });

            skillRepository.deleteById(id);
        });
    }
}