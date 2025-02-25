package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.ContactDTO;
import com.Portbil.portfolio_backend.dto.ContactRequestDTO;
import com.Portbil.portfolio_backend.service.ContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @PostMapping("/request")
    public ContactDTO sendContactRequest(@Valid @RequestBody ContactRequestDTO request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String effectiveSenderId = request.getSenderId();
        if (authentication != null && authentication.getPrincipal() != null && !"anonymousUser".equals(authentication.getName())) {
            String authenticatedUserId = authentication.getName();
            if (request.getSenderId() != null && !authenticatedUserId.equals(request.getSenderId())) {
                throw new RuntimeException("Accès interdit : vous ne pouvez envoyer une demande que pour votre propre compte");
            }
            effectiveSenderId = authenticatedUserId; // Priorité à l'utilisateur authentifié
        }

        return contactService.sendContactRequest(
                effectiveSenderId,
                request.getReceiverId(),
                request.getSenderEmail(),
                request.getSenderPhone(),
                request.getMessage(),
                request.isDeveloperContact(),
                request.getFirstName(), // ✅ Passer le prénom
                request.getLastName(),  // ✅ Passer le nom
                request.getCompany()    // ✅ Passer l'entreprise
        );
    }

    @PostMapping("/accept/{contactId}")
    public ContactDTO acceptContactRequest(@PathVariable String contactId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null || "anonymousUser".equals(authentication.getName())) {
            throw new RuntimeException("Utilisateur non authentifié");
        }
        return contactService.acceptContactRequest(contactId);
    }

    @GetMapping("/pending")
    public List<ContactDTO> getPendingRequests() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null || "anonymousUser".equals(authentication.getName())) {
            throw new RuntimeException("Utilisateur non authentifié");
        }
        String userId = authentication.getName();
        return contactService.getPendingRequests(userId);
    }

    @GetMapping("/accepted")
    public List<ContactDTO> getAcceptedContacts() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null || "anonymousUser".equals(authentication.getName())) {
            throw new RuntimeException("Utilisateur non authentifié");
        }
        String userId = authentication.getName();
        return contactService.getAcceptedContacts(userId);
    }

    @GetMapping("/developer")
    @PreAuthorize("hasAuthority('ADMIN')")
    public List<ContactDTO> getDeveloperContacts() {
        return contactService.getDeveloperContacts();
    }
}