package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.dto.ContactDTO;
import com.Portbil.portfolio_backend.entity.Contact;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.ContactRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${app.developer.id}")
    private String DEVELOPER_ID;

    public ContactDTO sendContactRequest(@Nullable String senderId, String receiverId,
                                         @Nullable String senderEmail, @Nullable String senderPhone,
                                         @Nullable String message, boolean isDeveloperContact) {
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        User sender = null;
        String effectiveSenderId = senderId; // Peut être null pour un expéditeur anonyme
        String senderName = "Anonymous";

        // Gestion explicite des cas où senderId est fourni
        if (senderId != null && !senderId.equals("anonymous") && !senderId.isEmpty()) {
            sender = userRepository.findById(senderId)
                    .orElseThrow(() -> new RuntimeException("Sender not found"));
            effectiveSenderId = senderId;
            senderName = sender.getFirstName() + " " + sender.getLastName();
        } else {
            // Cas d'un expéditeur anonyme (senderId null ou "anonymous")
            if (senderEmail == null || senderPhone == null || message == null) {
                throw new RuntimeException("Sender email, phone, and message are required for an unknown sender");
            }
            effectiveSenderId = null; // Forcer à null pour les anonymes
        }

        // Vérifie si une demande existe déjà (uniquement pour les utilisateurs inscrits)
        if (effectiveSenderId != null && contactRepository.existsBySenderIdAndReceiverIdAndIsAccepted(effectiveSenderId, receiverId, false)) {
            throw new RuntimeException("Contact request already exists");
        }

        Contact contact = Contact.builder()
                .senderId(effectiveSenderId) // Null pour un anonyme
                .receiverId(receiverId)
                .senderEmail(senderEmail)
                .senderPhone(senderPhone)
                .message(message)
                .isAccepted(false)
                .isDeveloperContact(isDeveloperContact)
                .build();
        contact = contactRepository.save(contact);

        // Envoyer un email de notification au receiver
        String subject = isDeveloperContact ? "New Developer Contact Request" : "New Contact Request";
        StringBuilder messageBody = new StringBuilder();
        messageBody.append(isDeveloperContact
                ? "You have a new contact request from a user: " + senderName
                : "You have a new contact request from " + senderName);

        if (senderEmail != null) messageBody.append("\nEmail: ").append(senderEmail);
        if (senderPhone != null) messageBody.append("\nPhone: ").append(senderPhone);
        if (message != null) messageBody.append("\nMessage: ").append(message);

        emailService.sendEmail(receiver.getEmail(), subject, messageBody.toString());

        return convertToDTO(contact, sender, receiver);
    }

    // Les autres méthodes restent inchangées
    public ContactDTO acceptContactRequest(String contactId) {
        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contact request not found"));

        contact.setAccepted(true);
        contact.setAcceptedAt(LocalDateTime.now());
        contact = contactRepository.save(contact);

        User receiver = userRepository.findById(contact.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));
        User sender = null;
        String senderName = "Anonymous";
        String senderEmail = contact.getSenderEmail();
        String senderPhone = contact.getSenderPhone();

        if (contact.getSenderId() != null && !contact.getSenderId().equals("anonymous")) {
            sender = userRepository.findById(contact.getSenderId())
                    .orElseThrow(() -> new RuntimeException("Sender not found"));
            senderName = sender.getFirstName() + " " + sender.getLastName();
            senderEmail = sender.getEmail();
            senderPhone = sender.getPhone();
        }

        String subject = contact.isDeveloperContact() ? "Developer Contact Request Accepted" : "Contact Request Accepted";
        StringBuilder messageBody = new StringBuilder();
        messageBody.append(contact.isDeveloperContact()
                ? receiver.getFirstName() + " " + receiver.getLastName() + " accepted your developer contact request"
                : receiver.getFirstName() + " " + receiver.getLastName() + " accepted your contact request");

        if (senderEmail != null) messageBody.append("\nYour Email: ").append(senderEmail);
        if (senderPhone != null) messageBody.append("\nYour Phone: ").append(senderPhone);
        if (contact.getMessage() != null) messageBody.append("\nMessage: ").append(contact.getMessage());

        if (contact.getSenderId() != null && !contact.getSenderId().equals("anonymous")) {
            emailService.sendEmail(sender.getEmail(), subject, messageBody.toString());
        } else if (senderEmail != null) {
            emailService.sendEmail(senderEmail, subject, messageBody.toString());
        }

        return convertToDTO(contact, sender, receiver);
    }

    public List<ContactDTO> getPendingRequests(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return contactRepository.findByReceiverIdAndIsAccepted(userId, false)
                .stream()
                .map(contact -> {
                    User sender = null;
                    User receiver = user;
                    String senderName = "Anonymous";
                    String senderEmail = contact.getSenderEmail();
                    String senderPhone = contact.getSenderPhone();

                    if (contact.getSenderId() != null && !contact.getSenderId().equals("anonymous")) {
                        sender = userRepository.findById(contact.getSenderId())
                                .orElseThrow(() -> new RuntimeException("Sender not found"));
                        senderName = sender.getFirstName() + " " + sender.getLastName();
                        senderEmail = sender.getEmail();
                        senderPhone = sender.getPhone();
                    }

                    return convertToDTO(contact, sender, receiver);
                })
                .collect(Collectors.toList());
    }

    public List<ContactDTO> getAcceptedContacts(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return contactRepository.findBySenderIdAndIsAccepted(userId, true)
                .stream()
                .map(contact -> {
                    User sender = user;
                    User receiver = userRepository.findById(contact.getReceiverId())
                            .orElseThrow(() -> new RuntimeException("Receiver not found"));
                    String senderName = sender.getFirstName() + " " + sender.getLastName();
                    String senderEmail = sender.getEmail();
                    String senderPhone = sender.getPhone();
                    return convertToDTO(contact, sender, receiver);
                })
                .collect(Collectors.toList());
    }

    public List<ContactDTO> getDeveloperContacts() {
        return contactRepository.findByIsDeveloperContact(true)
                .stream()
                .map(contact -> {
                    User sender = null;
                    User receiver = userRepository.findById(DEVELOPER_ID)
                            .orElseThrow(() -> new RuntimeException("Developer not found"));
                    String senderName = "Anonymous";
                    String senderEmail = contact.getSenderEmail();
                    String senderPhone = contact.getSenderPhone();

                    if (contact.getSenderId() != null && !contact.getSenderId().equals("anonymous")) {
                        sender = userRepository.findById(contact.getSenderId())
                                .orElseThrow(() -> new RuntimeException("Sender not found"));
                        senderName = sender.getFirstName() + " " + sender.getLastName();
                        senderEmail = sender.getEmail();
                        senderPhone = sender.getPhone();
                    }

                    return convertToDTO(contact, sender, receiver);
                })
                .collect(Collectors.toList());
    }

    private ContactDTO convertToDTO(Contact contact, User sender, User receiver) {
        return ContactDTO.builder()
                .id(contact.getId())
                .senderId(contact.getSenderId())
                .receiverId(contact.getReceiverId())
                .isAccepted(contact.isAccepted())
                .senderEmail(contact.getSenderEmail())
                .senderPhone(contact.getSenderPhone())
                .message(contact.getMessage())
                .senderName(sender != null ? sender.getFirstName() + " " + sender.getLastName() : "Anonymous")
                .receiverName(receiver != null ? receiver.getFirstName() + " " + receiver.getLastName() : "Developer")
                .isDeveloperContact(contact.isDeveloperContact())
                .build();
    }
}