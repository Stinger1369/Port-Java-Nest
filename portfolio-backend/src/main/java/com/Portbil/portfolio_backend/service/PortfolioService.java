package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.dto.PortfolioDTO;
import com.Portbil.portfolio_backend.entity.*;
import com.Portbil.portfolio_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final UserRepository userRepository;
    private final EducationRepository educationRepository;
    private final ExperienceRepository experienceRepository;
    private final SkillRepository skillRepository;
    private final ProjectRepository projectRepository;
    private final CertificationRepository certificationRepository;
    private final SocialLinkRepository socialLinkRepository;
    private final LanguageRepository languageRepository;
    private final RecommendationRepository recommendationRepository;
    private final InterestRepository interestRepository;

    // ✅ Mise à jour automatique du portfolio lors d'un ajout de section
    public Optional<Portfolio> updatePortfolioWithUserData(String userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) return Optional.empty();

        User user = userOptional.get();

        System.out.println("🔄 Mise à jour du portfolio pour l'utilisateur : " + userId);
        System.out.println("🟢 Éducation : " + user.getEducationIds());
        System.out.println("🟢 Expérience : " + user.getExperienceIds());
        System.out.println("🟢 Compétences : " + user.getSkillIds());
        System.out.println("🟢 Projets : " + user.getProjectIds());
        System.out.println("🟢 Certifications : " + user.getCertificationIds());
        System.out.println("🟢 Réseaux Sociaux : " + user.getSocialLinkIds());
        System.out.println("🟢 Langues : " + user.getLanguageIds());
        System.out.println("🟢 Recommandations : " + user.getRecommendationIds());
        System.out.println("🟢 Centres d'intérêt : " + user.getInterestIds());

        // Vérifier si un portfolio existe sinon le créer
        Portfolio portfolio = portfolioRepository.findByUserId(userId)
                .orElse(Portfolio.builder()
                        .userId(userId)
                        .isPublic(true)
                        .cards(List.of())
                        .build());

        // Générer les cartes du portfolio
        List<PortfolioCard> updatedCards = user.getAllPortfolioIds().stream()
                .map(id -> new PortfolioCard("section-" + id, 0, "medium"))
                .collect(Collectors.toList());

        portfolio.setCards(updatedCards);
        return Optional.of(portfolioRepository.save(portfolio));
    }

    // ✅ Récupérer le portfolio avec toutes ses sections complètes
    public Optional<PortfolioDTO> getPortfolioWithDetails(String userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) return Optional.empty();

        User user = userOptional.get();

        PortfolioDTO portfolioDTO = PortfolioDTO.builder()
                .id(user.getPortfolioId())
                .userId(userId)
                .isPublic(true)
                .educations(educationRepository.findByUserId(userId))
                .experiences(experienceRepository.findByUserId(userId))
                .skills(skillRepository.findByUserId(userId))
                .projects(projectRepository.findByUserId(userId))
                .certifications(certificationRepository.findByUserId(userId))
                .socialLinks(socialLinkRepository.findByUserId(userId))
                .languages(languageRepository.findByUserId(userId))
                .recommendations(recommendationRepository.findByUserId(userId))
                .interests(interestRepository.findByUserId(userId))
                .build();

        return Optional.of(portfolioDTO);
    }
}
