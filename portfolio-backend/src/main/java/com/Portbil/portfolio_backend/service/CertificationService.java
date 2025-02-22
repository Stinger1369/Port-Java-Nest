package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.entity.Certification;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.CertificationRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CertificationService {

    private final CertificationRepository certificationRepository;
    private final UserRepository userRepository;
    private final PortfolioService portfolioService; // ✅ Ajout du PortfolioService

    public List<Certification> getAllCertifications() {
        return certificationRepository.findAll();
    }

    public List<Certification> getCertificationsByUserId(String userId) {
        return certificationRepository.findByUserId(userId);
    }

    public Optional<Certification> getCertificationById(String id) {
        return certificationRepository.findById(id);
    }

    public Optional<Certification> createCertification(Certification certification) {
        // ✅ Vérifier si l'utilisateur existe avant d'ajouter la certification
        Optional<User> user = userRepository.findById(certification.getUserId());
        if (user.isEmpty()) {
            return Optional.empty();
        }

        Certification savedCertification = certificationRepository.save(certification);

        // ✅ Ajouter l'ID de la certification à l'utilisateur et mettre à jour le portfolio
        user.get().getCertificationIds().add(savedCertification.getId());
        userRepository.save(user.get());
        portfolioService.updatePortfolioWithUserData(user.get().getId());

        return Optional.of(savedCertification);
    }

    public Optional<Certification> updateCertification(String id, Certification updatedCertification) {
        return certificationRepository.findById(id).map(existingCertification -> {
            existingCertification.setName(updatedCertification.getName());
            existingCertification.setOrganization(updatedCertification.getOrganization());
            existingCertification.setDateObtained(updatedCertification.getDateObtained());
            existingCertification.setExpirationDate(updatedCertification.getExpirationDate());
            existingCertification.setDoesNotExpire(updatedCertification.isDoesNotExpire());
            existingCertification.setCredentialId(updatedCertification.getCredentialId());
            existingCertification.setCredentialUrl(updatedCertification.getCredentialUrl());

            return certificationRepository.save(existingCertification);
        });
    }

    public void deleteCertification(String id) {
        certificationRepository.findById(id).ifPresent(certification -> {
            // ✅ Supprimer l'ID de la certification dans l'utilisateur
            userRepository.findById(certification.getUserId()).ifPresent(user -> {
                user.getCertificationIds().remove(id);
                userRepository.save(user);
                portfolioService.updatePortfolioWithUserData(user.getId());
            });

            certificationRepository.deleteById(id);
        });
    }
}
