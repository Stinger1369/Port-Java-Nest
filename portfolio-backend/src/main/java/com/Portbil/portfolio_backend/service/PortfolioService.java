package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.dto.PortfolioInternalDTO;
import com.Portbil.portfolio_backend.dto.PortfolioPublicDTO;
import com.Portbil.portfolio_backend.entity.*;
import com.Portbil.portfolio_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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

    public Optional<PortfolioInternalDTO> getInternalPortfolio(String userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            System.out.println("❌ Utilisateur non trouvé pour userId: " + userId);
            return Optional.empty();
        }

        User user = userOptional.get();
        Optional<Portfolio> portfolioOptional = portfolioRepository.findByUserId(userId);
        Portfolio portfolio;

        if (portfolioOptional.isEmpty()) {
            System.out.println("📜 Aucun portfolio existant trouvé pour userId: " + userId + ", création d'un portfolio par défaut.");
            portfolio = Portfolio.builder()
                    .userId(userId)
                    .isPublic(false)
                    .cards(new ArrayList<>())
                    .build();

            // Générer les cartes par défaut
            List<PortfolioCard> defaultCards = List.of(
                    PortfolioCard.builder().section("education").position(0).size("medium").shape("rectangle").build(),
                    PortfolioCard.builder().section("experience").position(1).size("medium").shape("rectangle").build(),
                    PortfolioCard.builder().section("skills").position(2).size("medium").shape("rectangle").build(),
                    PortfolioCard.builder().section("projects").position(3).size("medium").shape("rectangle").build(),
                    PortfolioCard.builder().section("certifications").position(4).size("medium").shape("rectangle").build(),
                    PortfolioCard.builder().section("socialLinks").position(5).size("medium").shape("rectangle").build(),
                    PortfolioCard.builder().section("languages").position(6).size("medium").shape("rectangle").build(),
                    PortfolioCard.builder().section("recommendations").position(7).size("small").shape("square").build(),
                    PortfolioCard.builder().section("interests").position(8).size("small").shape("square").build()
            );
            portfolio.setCards(defaultCards);

            portfolio = portfolioRepository.save(portfolio);
        } else {
            portfolio = portfolioOptional.get();
        }

        PortfolioInternalDTO portfolioDTO = PortfolioInternalDTO.builder()
                .id(portfolio.getId())
                .userId(userId)
                .isPublic(portfolio.isPublic())
                .educations(educationRepository.findByUserId(userId))
                .experiences(experienceRepository.findByUserId(userId))
                .skills(skillRepository.findByUserId(userId))
                .projects(projectRepository.findByUserId(userId))
                .certifications(certificationRepository.findByUserId(userId))
                .socialLinks(socialLinkRepository.findByUserId(userId))
                .languages(languageRepository.findByUserId(userId))
                .recommendations(recommendationRepository.findByUserId(userId))
                .interests(interestRepository.findByUserId(userId))
                .cards(portfolio.getCards())
                .imageIds(user.getImageIds() != null ? user.getImageIds() : new ArrayList<>())
                .build();

        return Optional.of(portfolioDTO);
    }

    // Récupérer le portfolio public (pour les recruteurs)
    public Optional<PortfolioPublicDTO> getPublicPortfolio(String userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            System.out.println("❌ Utilisateur non trouvé pour userId: " + userId);
            return Optional.empty();
        }

        User user = userOptional.get();
        Optional<Portfolio> portfolioOptional = portfolioRepository.findByUserId(userId);
        if (portfolioOptional.isEmpty()) {
            System.out.println("📜 Aucun portfolio trouvé pour userId: " + userId);
            return Optional.empty();
        }

        Portfolio portfolio = portfolioOptional.get();

        // Utiliser les méthodes de repository pour filtrer les sections publiques
        List<Project> publicProjects = projectRepository.findByUserIdAndIsPublicTrue(userId);
        List<Certification> publicCertifications = certificationRepository.findByUserIdAndIsPublicTrue(userId);
        List<SocialLink> publicSocialLinks = socialLinkRepository.findByUserIdAndIsPublicTrue(userId);
        List<Education> publicEducations = educationRepository.findByUserIdAndIsPublicTrue(userId);
        List<Experience> publicExperiences = experienceRepository.findByUserIdAndIsPublicTrue(userId);

        return Optional.of(PortfolioPublicDTO.builder()
                .id(portfolio.getId())
                .userId(userId)
                .isPublic(portfolio.isPublic())
                .cards(portfolio.getCards())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .profilePictureUrl(user.getProfilePictureUrl())
                .bio(user.getBio())
                .projects(publicProjects)
                .certifications(publicCertifications)
                .socialLinks(publicSocialLinks)
                .educations(publicEducations)
                .experiences(publicExperiences)
                .build());
    }

    // Mise à jour automatique du portfolio avec les données de l'utilisateur
    public Optional<Portfolio> updatePortfolioWithUserData(String userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            System.out.println("❌ Utilisateur non trouvé pour userId: " + userId);
            return Optional.empty();
        }

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

        Portfolio portfolio = portfolioRepository.findByUserId(userId)
                .orElse(Portfolio.builder()
                        .userId(userId)
                        .isPublic(true)
                        .cards(List.of())
                        .build());

        // Générer les cartes par défaut si elles n'existent pas
        if (portfolio.getCards().isEmpty()) {
            List<PortfolioCard> defaultCards = List.of(
                    PortfolioCard.builder().section("education").position(0).size("medium").shape("rectangle").build(),
                    PortfolioCard.builder().section("experience").position(1).size("medium").shape("rectangle").build(),
                    PortfolioCard.builder().section("skills").position(2).size("medium").shape("rectangle").build(),
                    PortfolioCard.builder().section("projects").position(3).size("medium").shape("rectangle").build(),
                    PortfolioCard.builder().section("certifications").position(4).size("medium").shape("rectangle").build(),
                    PortfolioCard.builder().section("socialLinks").position(5).size("medium").shape("rectangle").build(),
                    PortfolioCard.builder().section("languages").position(6).size("medium").shape("rectangle").build(),
                    PortfolioCard.builder().section("recommendations").position(7).size("small").shape("square").build(),
                    PortfolioCard.builder().section("interests").position(8).size("small").shape("square").build()
            );
            portfolio.setCards(defaultCards);
        } else {
            // Si des cartes existent mais contiennent des IDs au lieu de noms, corriger
            List<PortfolioCard> correctedCards = portfolio.getCards().stream()
                    .map(card -> {
                        String section = card.getSection();
                        if (section != null && section.startsWith("section-")) {
                            String cleanId = section.replace("section-", "");
                            if (user.getEducationIds().contains(cleanId)) {
                                section = "education";
                            } else if (user.getExperienceIds().contains(cleanId)) {
                                section = "experience";
                            } else if (user.getSkillIds().contains(cleanId)) {
                                section = "skills";
                            } else if (user.getProjectIds().contains(cleanId)) {
                                section = "projects";
                            } else if (user.getCertificationIds().contains(cleanId)) {
                                section = "certifications";
                            } else if (user.getSocialLinkIds().contains(cleanId)) {
                                section = "socialLinks";
                            } else if (user.getLanguageIds().contains(cleanId)) {
                                section = "languages";
                            } else if (user.getRecommendationIds().contains(cleanId)) {
                                section = "recommendations";
                            } else if (user.getInterestIds().contains(cleanId)) {
                                section = "interests";
                            }
                            return PortfolioCard.builder()
                                    .section(section)
                                    .position(card.getPosition())
                                    .size(card.getSize())
                                    .shape(card.getShape() != null ? card.getShape() : "rectangle")
                                    .build();
                        }
                        return card;
                    })
                    .collect(Collectors.toList());
            portfolio.setCards(correctedCards);
        }

        return Optional.of(portfolioRepository.save(portfolio));
    }
}