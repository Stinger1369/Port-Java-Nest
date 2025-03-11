package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.dto.PortfolioCardPreferencesDTO;
import com.Portbil.portfolio_backend.entity.Portfolio;
import com.Portbil.portfolio_backend.entity.PortfolioCard;
import com.Portbil.portfolio_backend.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioCardService {

    private final PortfolioRepository portfolioRepository;

    public Optional<Portfolio> customizePortfolioCards(String userId, List<PortfolioCardPreferencesDTO> preferences) {
        Optional<Portfolio> portfolioOptional = portfolioRepository.findByUserId(userId);
        if (portfolioOptional.isEmpty()) return Optional.empty();

        Portfolio portfolio = portfolioOptional.get();

        // Convertir les préférences DTO en PortfolioCard
        List<PortfolioCard> updatedCards = preferences.stream()
                .map(dto -> PortfolioCard.builder()
                        .section(dto.getSection())
                        .position(dto.getPosition())
                        .size(dto.getSize())
                        .shape(dto.getShape())
                        .build())
                .collect(Collectors.toList());

        portfolio.setCards(updatedCards);
        return Optional.of(portfolioRepository.save(portfolio));
    }
}