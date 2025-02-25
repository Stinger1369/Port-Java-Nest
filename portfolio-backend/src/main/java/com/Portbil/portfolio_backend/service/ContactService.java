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
import java.util.Optional;
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
                                         @Nullable String message, boolean isDeveloperContact,
                                         String firstName, String lastName, @Nullable String company) {
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        User sender = null;
        String effectiveSenderId = senderId;
        String senderName = "Anonymous"; // Par défaut pour utilisateurs non connectés
        String senderSlug = "N/A";
        String portfolioLink = "Non disponible";

        if (senderId == null && senderEmail != null) {
            Optional<User> existingUser = userRepository.findByEmail(senderEmail);
            if (existingUser.isPresent() && existingUser.get().getId().equals(receiverId)) {
                throw new RuntimeException("Vous ne pouvez pas vous contacter vous-même avec cet email.");
            }
        }
        if (senderId == null && senderPhone != null) {
            Optional<User> existingUser = userRepository.findByPhone(senderPhone);
            if (existingUser.isPresent() && existingUser.get().getId().equals(receiverId)) {
                throw new RuntimeException("Vous ne pouvez pas vous contacter vous-même avec ce numéro de téléphone.");
            }
        }

        if (senderId != null && !senderId.equals("anonymous") && !senderId.isEmpty()) {
            sender = userRepository.findById(senderId)
                    .orElseThrow(() -> new RuntimeException("Sender not found"));
            effectiveSenderId = senderId;
            senderName = sender.getFirstName() + " " + sender.getLastName();
            senderSlug = sender.getSlug() != null ? sender.getSlug() : "N/A";
            portfolioLink = "http://localhost:5173/portfolio/" + sender.getFirstName() + "/" + sender.getLastName() + "/" + senderSlug;

            if (effectiveSenderId.equals(receiverId)) {
                throw new RuntimeException("Vous ne pouvez pas vous contacter vous-même.");
            }
        } else {
            if (senderEmail == null || senderPhone == null || message == null) {
                throw new RuntimeException("Sender email, phone, and message are required for an unknown sender");
            }
            effectiveSenderId = null;
            senderName = firstName + " " + lastName; // ✅ Utiliser firstName et lastName pour l'email
        }

        if (effectiveSenderId != null && contactRepository.existsBySenderIdAndReceiverIdAndIsAccepted(effectiveSenderId, receiverId, false)) {
            throw new RuntimeException("Contact request already exists");
        }

        Contact contact = Contact.builder()
                .senderId(effectiveSenderId)
                .receiverId(receiverId)
                .senderEmail(senderEmail)
                .senderPhone(senderPhone)
                .message(message)
                .isAccepted(false)
                .isDeveloperContact(isDeveloperContact)
                .senderFirstName(firstName) // ✅ Stocker le prénom
                .senderLastName(lastName)   // ✅ Stocker le nom
                .build();
        contact = contactRepository.save(contact);

        String subject = isDeveloperContact ? "Nouvelle demande de contact développeur" : "Nouvelle demande de contact";
        String htmlMessage = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
                .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
                a { color: #4CAF50; text-decoration: none; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>%s</h2>
                </div>
                <div class="content">
                    <p>Bonjour <strong>%s</strong>,</p>
                    <p>Vous avez reçu une nouvelle demande de contact de la part de <strong>%s</strong>.</p>
                    <p><strong>Détails du demandeur :</strong></p>
                    <ul>
                        <li>Email : %s</li>
                        <li>Téléphone : %s</li>
                        %s
                        %s
                    </ul>
                    <p>Consultez son portfolio ici : <a href="%s">%s</a></p>
                    <p>Pour répondre ou accepter cette demande, connectez-vous à votre compte et consultez vos demandes de contact.</p>
                </div>
                <div class="footer">
                    <p>© 2025 Votre Application. Tous droits réservés.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(
                subject,
                receiver.getFirstName() != null ? receiver.getFirstName() : "Utilisateur",
                senderName,
                effectiveSenderId != null ? sender.getEmail() : senderEmail,
                effectiveSenderId != null ? (sender.getPhone() != null ? sender.getPhone() : "Non fourni") : (senderPhone != null ? senderPhone : "Non fourni"),
                message != null ? "<li>Message : " + message + "</li>" : "",
                company != null ? "<li>Entreprise : " + company + "</li>" : "",
                portfolioLink,
                portfolioLink
        );

        emailService.sendEmail(receiver.getEmail(), subject, htmlMessage);

        return convertToDTO(contact, sender, receiver);
    }

    public ContactDTO acceptContactRequest(String contactId) {
        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contact request not found"));

        contact.setAccepted(true);
        contact.setAcceptedAt(LocalDateTime.now());
        contact = contactRepository.save(contact);

        User receiver = userRepository.findById(contact.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));
        User sender = null;
        String senderName = contact.getSenderFirstName() != null && contact.getSenderLastName() != null
                ? contact.getSenderFirstName() + " " + contact.getSenderLastName() : "Anonymous"; // ✅ Utiliser les champs stockés
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
                    String senderName = contact.getSenderFirstName() != null && contact.getSenderLastName() != null
                            ? contact.getSenderFirstName() + " " + contact.getSenderLastName() : "Anonymous"; // ✅ Utiliser les champs stockés
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
        return contactRepository.findByReceiverIdAndIsAccepted(userId, true)
                .stream()
                .map(contact -> {
                    User sender = null;
                    User receiver = user;
                    String senderName = contact.getSenderFirstName() != null && contact.getSenderLastName() != null
                            ? contact.getSenderFirstName() + " " + contact.getSenderLastName() : "Anonymous"; // ✅ Utiliser les champs stockés
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

    public List<ContactDTO> getDeveloperContacts() {
        return contactRepository.findByIsDeveloperContact(true)
                .stream()
                .map(contact -> {
                    User sender = null;
                    User receiver = userRepository.findById(DEVELOPER_ID)
                            .orElseThrow(() -> new RuntimeException("Developer not found"));
                    String senderName = contact.getSenderFirstName() != null && contact.getSenderLastName() != null
                            ? contact.getSenderFirstName() + " " + contact.getSenderLastName() : "Anonymous"; // ✅ Utiliser les champs stockés
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
                .senderName(sender != null ? sender.getFirstName() + " " + sender.getLastName() :
                        (contact.getSenderFirstName() != null && contact.getSenderLastName() != null ?
                                contact.getSenderFirstName() + " " + contact.getSenderLastName() : "Anonymous")) // ✅ Logique mise à jour
                .receiverName(receiver != null ? receiver.getFirstName() + " " + receiver.getLastName() : "Developer")
                .isDeveloperContact(contact.isDeveloperContact())
                .createdAt(contact.getCreatedAt())
                .acceptedAt(contact.getAcceptedAt())
                .build();
    }
}