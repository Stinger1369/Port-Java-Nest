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
    private final UserRepository userRepository; // ✅ Pour vérifier si l'utilisateur existe avant l'ajout

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
        // ✅ Vérifier si l'utilisateur associé existe avant d'ajouter l'éducation
        Optional<User> user = userRepository.findById(education.getUserId());
        if (user.isEmpty()) {
            return Optional.empty(); // ✅ Retourne vide si l'utilisateur n'existe pas
        }

        return Optional.of(educationRepository.save(education));
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
        educationRepository.deleteById(id);
    }
}
