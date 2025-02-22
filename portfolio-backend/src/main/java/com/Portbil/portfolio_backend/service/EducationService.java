package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.entity.Education;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.EducationRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EducationService {

    private final EducationRepository educationRepository;
    private final UserRepository userRepository;
    private final PortfolioService portfolioService; // ✅ Ajout du PortfolioService

    public List<Education> getAllEducations() {
        return educationRepository.findAll();
    }

    public List<Education> getEducationsByUserId(String userId) {
        return educationRepository.findByUserId(userId);
    }

    public Optional<Education> getEducationById(String id) {
        return educationRepository.findById(id);
    }

    public Optional<Education> createEducation(Education education) {
        // ✅ Vérifier si l'utilisateur existe avant d'ajouter l'éducation
        Optional<User> user = userRepository.findById(education.getUserId());
        if (user.isEmpty()) {
            return Optional.empty();
        }

        Education savedEducation = educationRepository.save(education);

        // ✅ Ajouter l'ID de l'éducation à l'utilisateur et mettre à jour le portfolio
        user.get().getEducationIds().add(savedEducation.getId());
        userRepository.save(user.get());
        portfolioService.updatePortfolioWithUserData(user.get().getId());

        return Optional.of(savedEducation);
    }

    public Optional<Education> updateEducation(String id, Education updatedEducation) {
        return educationRepository.findById(id).map(existingEducation -> {
            existingEducation.setSchoolName(updatedEducation.getSchoolName());
            existingEducation.setDegree(updatedEducation.getDegree());
            existingEducation.setFieldOfStudy(updatedEducation.getFieldOfStudy());
            existingEducation.setStartDate(updatedEducation.getStartDate());
            existingEducation.setEndDate(updatedEducation.getEndDate());
            existingEducation.setDescription(updatedEducation.getDescription());
            existingEducation.setCurrentlyStudying(updatedEducation.isCurrentlyStudying());
            return educationRepository.save(existingEducation);
        });
    }

    public void deleteEducation(String id) {
        educationRepository.findById(id).ifPresent(education -> {
            // ✅ Supprimer l'ID de l'éducation dans l'utilisateur
            userRepository.findById(education.getUserId()).ifPresent(user -> {
                user.getEducationIds().remove(id);
                userRepository.save(user);
                portfolioService.updatePortfolioWithUserData(user.getId());
            });

            educationRepository.deleteById(id);
        });
    }
}
