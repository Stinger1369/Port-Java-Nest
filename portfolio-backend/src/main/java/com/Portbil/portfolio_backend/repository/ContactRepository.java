package com.Portbil.portfolio_backend.repository;

import com.Portbil.portfolio_backend.entity.Contact;
import com.Portbil.portfolio_backend.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.lang.Nullable;

import java.util.List;

public interface ContactRepository extends MongoRepository<Contact, String> {
    List<Contact> findBySenderIdAndIsAccepted(@Nullable String senderId, boolean isAccepted);
    List<Contact> findByReceiverIdAndIsAccepted(String receiverId, boolean isAccepted);
    boolean existsBySenderIdAndReceiverIdAndIsAccepted(@Nullable String senderId, String receiverId, boolean isAccepted);
    List<Contact> findByIsDeveloperContact(boolean isDeveloperContact);
}