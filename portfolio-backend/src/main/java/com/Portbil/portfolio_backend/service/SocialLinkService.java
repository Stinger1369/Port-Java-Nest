package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.entity.SocialLink;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.SocialLinkRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SocialLinkService {

    private final SocialLinkRepository socialLinkRepository;
    private final UserRepository userRepository;
    private final PortfolioService portfolioService;

    public List<SocialLink> getAllSocialLinks() {
        return socialLinkRepository.findAll();
    }

    public List<SocialLink> getSocialLinksByUserId(String userId) {
        return socialLinkRepository.findByUserId(userId);
    }

    public Optional<SocialLink> getSocialLinkById(String id) {
        return socialLinkRepository.findById(id);
    }

    public Optional<SocialLink> createSocialLink(SocialLink socialLink) {
        Optional<User> userOptional = userRepository.findById(socialLink.getUserId());
        if (userOptional.isEmpty()) {
            return Optional.empty();
        }

        SocialLink savedLink = socialLinkRepository.save(socialLink);
        User user = userOptional.get();
        user.getSocialLinkIds().add(savedLink.getId());
        userRepository.save(user);
        portfolioService.updatePortfolioWithUserData(user.getId());

        return Optional.of(savedLink);
    }

    public Optional<SocialLink> updateSocialLink(String id, SocialLink updatedSocialLink) {
        return socialLinkRepository.findById(id).map(existingLink -> {
            existingLink.setPlatform(updatedSocialLink.getPlatform());
            existingLink.setUrl(updatedSocialLink.getUrl());
            existingLink.setPublic(updatedSocialLink.isPublic()); // Ajout de la mise à jour de isPublic
            SocialLink savedLink = socialLinkRepository.save(existingLink);
            portfolioService.updatePortfolioWithUserData(existingLink.getUserId()); // Mise à jour du portfolio
            return savedLink;
        });
    }

    public void deleteSocialLink(String id) {
        socialLinkRepository.findById(id).ifPresent(socialLink -> {
            userRepository.findById(socialLink.getUserId()).ifPresent(user -> {
                user.getSocialLinkIds().remove(id);
                userRepository.save(user);
                portfolioService.updatePortfolioWithUserData(user.getId());
            });

            socialLinkRepository.deleteById(id);
        });
    }
}