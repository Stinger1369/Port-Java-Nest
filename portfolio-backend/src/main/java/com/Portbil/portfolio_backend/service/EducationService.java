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
    private final PortfolioService portfolioService;

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
        Optional<User> user = userRepository.findById(education.getUserId());
        if (user.isEmpty()) {
            return Optional.empty();
        }

        // Vider endDate si currentlyStudying est true
        if (education.isCurrentlyStudying()) {
            education.setEndDate(null);
        }

        Education savedEducation = educationRepository.save(education);

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
            existingEducation.setPublic(updatedEducation.isPublic()); // Ajout de la mise à jour de isPublic

            // Vider endDate si currentlyStudying est true
            if (existingEducation.isCurrentlyStudying()) {
                existingEducation.setEndDate(null);
            }

            return educationRepository.save(existingEducation);
        });
    }

    public void deleteEducation(String id) {
        educationRepository.findById(id).ifPresent(education -> {
            userRepository.findById(education.getUserId()).ifPresent(user -> {
                user.getEducationIds().remove(id);
                userRepository.save(user);
                portfolioService.updatePortfolioWithUserData(user.getId());
            });

            educationRepository.deleteById(id);
        });
    }
}