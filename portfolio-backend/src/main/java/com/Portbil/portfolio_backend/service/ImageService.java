package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.dto.ImageDTO;
import com.Portbil.portfolio_backend.entity.Image;
import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.repository.ImageRepository;
import com.Portbil.portfolio_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final ImageRepository imageRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    /**
     * Upload d'une image unique
     */
    public ImageDTO uploadImage(String userId, String name, MultipartFile file, String imageUrl, boolean isNSFW, boolean isProfilePicture) {
        try {
            System.out.println("🔹 Début de l'upload d'image pour userId: " + userId + ", name: " + name + ", isProfilePicture: " + isProfilePicture);
            String fullName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);

            Image image = Image.builder()
                    .userId(userId)
                    .name(fullName)
                    .path(imageUrl.replace("http://localhost:7000/", ""))
                    .isNSFW(isNSFW)
                    .isProfilePicture(isProfilePicture)
                    .uploadedAt(LocalDateTime.now())
                    .build();

            Image savedImage = imageRepository.save(image);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
            if (user.getImageIds() == null) {
                user.setImageIds(new ArrayList<>());
            }
            user.getImageIds().add(savedImage.getId());

            if (isProfilePicture) {
                // Désactiver les autres photos de profil
                imageRepository.findByUserId(userId).stream()
                        .filter(img -> !img.getId().equals(savedImage.getId()) && img.isProfilePicture())
                        .forEach(img -> {
                            img.setIsProfilePicture(false);
                            imageRepository.save(img);
                        });
                userService.updateProfilePictureUrl(userId, "http://localhost:7000/" + savedImage.getPath());
            }

            userRepository.save(user);
            System.out.println("✅ Image uploadée avec succès: " + savedImage);
            return mapToDTO(savedImage);
        } catch (Exception e) {
            System.out.println("❌ Erreur inattendue lors de l'upload: " + e.getMessage());
            throw new RuntimeException("Échec de l'upload de l'image: " + e.getMessage(), e);
        }
    }

    /**
     * Récupérer toutes les images d'un utilisateur depuis MongoDB
     */
    public List<ImageDTO> getAllImagesByUserId(String userId) {
        try {
            System.out.println("🔹 Récupération des images depuis MongoDB pour userId: " + userId);
            List<Image> images = imageRepository.findByUserId(userId);
            List<ImageDTO> imageDTOs = images.stream().map(this::mapToDTO).collect(Collectors.toList());
            System.out.println("✅ Images récupérées depuis MongoDB: " + imageDTOs);
            return imageDTOs;
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la récupération des images depuis MongoDB: " + e.getMessage());
            throw new RuntimeException("Échec de la récupération des images: " + e.getMessage(), e);
        }
    }

    /**
     * Supprimer une image dans MongoDB et mettre à jour l'utilisateur
     */
    public void deleteImage(String userId, String name) {
        try {
            System.out.println("🔹 Début de la suppression d'image dans MongoDB pour userId: " + userId + ", name: " + name);

            Optional<Image> imageOpt = imageRepository.findByUserIdAndName(userId, name);
            if (imageOpt.isEmpty()) {
                System.out.println("⚠️ Image non trouvée dans MongoDB pour userId: " + userId + ", name: " + name);
                throw new IllegalArgumentException("Image introuvable dans la base de données: " + name);
            }
            Image deletedImage = imageOpt.get();
            imageRepository.delete(deletedImage);
            System.out.println("✅ Image supprimée de MongoDB : " + deletedImage.getId());

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
            boolean removed = user.getImageIds().remove(deletedImage.getId());
            if (!removed) {
                System.out.println("⚠️ L'image " + deletedImage.getId() + " n'était pas dans la liste imageIds de l'utilisateur");
            }

            if (deletedImage.isProfilePicture()) {
                List<Image> remainingImages = imageRepository.findByUserId(userId);
                Image newProfileImage = null;
                if (!remainingImages.isEmpty()) {
                    newProfileImage = remainingImages.stream()
                            .max((img1, img2) -> img1.getUploadedAt().compareTo(img2.getUploadedAt()))
                            .orElse(null);
                    if (newProfileImage != null) {
                        newProfileImage.setIsProfilePicture(true);
                        imageRepository.save(newProfileImage);
                        System.out.println("✅ Nouvelle photo de profil définie : " + newProfileImage.getId());
                    }
                }
                String newProfilePictureUrl = newProfileImage != null ? "http://localhost:7000/" + newProfileImage.getPath() : null;
                userService.updateProfilePictureUrl(userId, newProfilePictureUrl);
            }

            userRepository.save(user);
            System.out.println("✅ Utilisateur mis à jour avec succès");
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la suppression de l'image: " + e.getMessage());
            throw new RuntimeException("Échec de la suppression de l'image: " + e.getMessage(), e);
        }
    }

    /**
     * Récupérer les images par IDs avec option de filtrage par isProfilePicture
     */
    public List<ImageDTO> getImagesByIds(List<String> imageIds, boolean filterProfile) {
        try {
            System.out.println("🔹 Récupération des images par IDs: " + imageIds + ", Filtre profil: " + filterProfile);
            List<Image> images = imageRepository.findAllById(imageIds);
            List<ImageDTO> imageDTOs = images.stream()
                    .filter(image -> !filterProfile || image.isProfilePicture())
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());
            System.out.println("✅ Images récupérées par IDs: " + imageDTOs);
            return imageDTOs;
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la récupération des images par IDs: " + e.getMessage());
            throw new RuntimeException("Échec de la récupération des images par IDs: " + e.getMessage(), e);
        }
    }

    /**
     * Récupérer uniquement les images de profil d'un utilisateur
     */
    public List<ImageDTO> getProfileImagesByUserId(String userId) {
        try {
            System.out.println("🔹 Récupération des images de profil pour userId: " + userId);
            List<Image> images = imageRepository.findByUserId(userId);
            List<ImageDTO> profileImages = images.stream()
                    .filter(Image::isProfilePicture)
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());
            System.out.println("✅ Images de profil récupérées pour userId: " + userId + " - " + profileImages);
            return profileImages;
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la récupération des images de profil: " + e.getMessage());
            throw new RuntimeException("Échec de la récupération des images de profil: " + e.getMessage(), e);
        }
    }

    /**
     * Définir une image comme photo de profil
     */
    public ImageDTO setProfilePicture(String imageId) {
        try {
            Image image = imageRepository.findById(imageId)
                    .orElseThrow(() -> new IllegalArgumentException("Image introuvable : " + imageId));
            String userId = image.getUserId();

            // Désactiver toutes les autres photos de profil pour cet utilisateur
            imageRepository.findByUserId(userId).stream()
                    .filter(img -> !img.getId().equals(imageId) && img.isProfilePicture())
                    .forEach(img -> {
                        img.setIsProfilePicture(false);
                        imageRepository.save(img);
                    });

            // Activer cette image comme photo de profil
            image.setIsProfilePicture(true);
            Image updatedImage = imageRepository.save(image);

            // Mettre à jour l'URL de la photo de profil dans User
            userService.updateProfilePictureUrl(userId, "http://localhost:7000/" + updatedImage.getPath());

            System.out.println("✅ Image " + imageId + " définie comme photo de profil pour userId: " + userId);
            return mapToDTO(updatedImage);
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la définition de la photo de profil: " + e.getMessage());
            throw new RuntimeException("Échec de la définition de la photo de profil: " + e.getMessage(), e);
        }
    }

    /**
     * Mapper une entité Image vers un DTO
     */
    private ImageDTO mapToDTO(Image image) {
        return ImageDTO.builder()
                .id(image.getId())
                .userId(image.getUserId())
                .name(image.getName())
                .path(image.getPath())
                .isNSFW(image.isNSFW())
                .isProfilePicture(image.isProfilePicture())
                .uploadedAt(image.getUploadedAt() != null ? image.getUploadedAt().toString() : null)
                .build();
    }
}