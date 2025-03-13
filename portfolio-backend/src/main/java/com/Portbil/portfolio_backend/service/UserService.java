package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.dto.UserCoordinatesDTO;
import com.Portbil.portfolio_backend.dto.UserDTO;
import com.Portbil.portfolio_backend.dto.WeatherDTO;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.service.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserAuthService userAuthService;
    private final UserCoreService userCoreService;
    private final UserInteractionService userInteractionService;
    private final UserMetadataService userMetadataService;
    private final UserProfileService userProfileService;
    private final UserRelationService userRelationService;

    // Délégation aux services spécifiques

    // UserCoreService
    public List<User> getAllUsers() {
        return userCoreService.getAllUsers();
    }

    public Optional<User> getUserById(String id) {
        return userCoreService.getUserById(id);
    }

    public Optional<User> getUserByEmail(String email) {
        return userCoreService.getUserByEmail(email);
    }

    public void deleteUser(String id) {
        userCoreService.deleteUser(id);
    }

    // UserAuthService
    public User registerUser(String email, String password, Locale locale) {
        return userAuthService.registerUser(email, password, locale);
    }

    public boolean verifyUser(String email, String code, Locale locale) {
        return userAuthService.verifyUser(email, code, locale);
    }

    public void resendVerificationCode(String email, Locale locale) {
        userAuthService.resendVerificationCode(email, locale);
    }

    public boolean checkPassword(User user, String rawPassword) {
        return userAuthService.checkPassword(user, rawPassword);
    }

    public void forgotPassword(String email, Locale locale) {
        userAuthService.forgotPassword(email, locale);
    }

    public void resetPassword(String token, String newPassword, Locale locale) {
        userAuthService.resetPassword(token, newPassword, locale);
    }

    // UserProfileService
    public Optional<User> updateUser(String id, UserDTO userDTO, Locale locale) {
        return userProfileService.updateUser(id, userDTO, locale);
    }

    public String getProfilePictureUrl(String userId, Locale locale) {
        return userProfileService.getProfilePictureUrl(userId, locale);
    }

    public void updateProfilePictureUrl(String userId, String imagePath, Locale locale) {
        userProfileService.updateProfilePictureUrl(userId, imagePath, locale);
    }

    // UserMetadataService
    public Optional<User> updateUserCoordinates(String id, UserCoordinatesDTO coordinatesDTO, Locale locale) {
        return userMetadataService.updateUserCoordinates(id, coordinatesDTO, locale);
    }

    public User updateUserAddressFromCoordinates(String userId, Locale locale) {
        return userMetadataService.updateUserAddressFromCoordinates(userId, locale);
    }

    public WeatherDTO getWeatherForUser(String userId, Locale locale) {
        return userMetadataService.getWeatherForUser(userId, locale);
    }

    // UserInteractionService
    public void likeUser(String likerId, String likedId, Locale locale) {
        userInteractionService.likeUser(likerId, likedId, locale);
    }

    public void unlikeUser(String likerId, String likedId, Locale locale) {
        userInteractionService.unlikeUser(likerId, likedId, locale);
    }

    public List<String> getUserChatIds(String userId, Locale locale) {
        return userInteractionService.getUserChatIds(userId, locale);
    }

    // Délégation à UserRelationService pour blocage et signalement
    public void blockUser(String blockerId, String blockedId, Locale locale) {
        userRelationService.blockUser(blockerId, blockedId, locale);
    }

    public void unblockUser(String blockerId, String blockedId, Locale locale) {
        userRelationService.unblockUser(blockerId, blockedId, locale);
    }

    // Méthode mise à jour avec messageId
    public void reportUser(String reporterId, String reportedId, String reason, String messageId, Locale locale) {
        userRelationService.reportUser(reporterId, reportedId, reason, messageId, locale);
    }

    // UserRelationService
    public void removeFriend(String userId, String friendId, Locale locale) {
        userRelationService.removeFriend(userId, friendId, locale);
    }

    public void sendUserContactRequest(String senderId, String receiverId, Locale locale) {
        userRelationService.sendUserContactRequest(senderId, receiverId, locale);
    }

    public List<String> getUserContacts(String userId, Locale locale) {
        return userRelationService.getUserContacts(userId, locale);
    }

    public void sendDeveloperContactRequest(String userId, Locale locale) {
        userRelationService.sendDeveloperContactRequest(userId, locale);
    }

    public void acceptDeveloperContactRequest(String userId, Locale locale) {
        userRelationService.acceptDeveloperContactRequest(userId, locale);
    }

    public void sendFriendRequest(String senderId, String receiverId, Locale locale) {
        userRelationService.sendFriendRequest(senderId, receiverId, locale);
    }

    public void acceptFriendRequest(String userId, String friendId, Locale locale) {
        userRelationService.acceptFriendRequest(userId, friendId, locale);
    }

    public void rejectFriendRequest(String userId, String friendId, Locale locale) {
        userRelationService.rejectFriendRequest(userId, friendId, locale);
    }

    public void cancelFriendRequest(String senderId, String receiverId, Locale locale) {
        userRelationService.cancelFriendRequest(senderId, receiverId, locale);
    }

    public List<User> getFriends(String userId, Locale locale) {
        return userRelationService.getFriends(userId, locale);
    }

    public List<User> getSentFriendRequests(String userId, Locale locale) {
        return userRelationService.getSentFriendRequests(userId, locale);
    }

    public List<User> getReceivedFriendRequests(String userId, Locale locale) {
        return userRelationService.getReceivedFriendRequests(userId, locale);
    }
}