package com.Portbil.portfolio_backend.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "images")
public class Image {

    @Id
    private String id;
    private String userId;
    private String name;
    private String path;
    private boolean isNSFW;
    private boolean isProfilePicture;
    private LocalDateTime uploadedAt;

    // Constructeurs
    public Image() {}

    public Image(String id, String userId, String name, String path, boolean isNSFW, boolean isProfilePicture, LocalDateTime uploadedAt) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.path = path;
        this.isNSFW = isNSFW;
        this.isProfilePicture = isProfilePicture;
        this.uploadedAt = uploadedAt;
    }

    // Builder statique (simule @Builder)
    public static ImageBuilder builder() {
        return new ImageBuilder();
    }

    public static class ImageBuilder {
        private String id;
        private String userId;
        private String name;
        private String path;
        private boolean isNSFW;
        private boolean isProfilePicture;
        private LocalDateTime uploadedAt;

        public ImageBuilder id(String id) {
            this.id = id;
            return this;
        }

        public ImageBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public ImageBuilder name(String name) {
            this.name = name;
            return this;
        }

        public ImageBuilder path(String path) {
            this.path = path;
            return this;
        }

        public ImageBuilder isNSFW(boolean isNSFW) {
            this.isNSFW = isNSFW;
            return this;
        }

        public ImageBuilder isProfilePicture(boolean isProfilePicture) {
            this.isProfilePicture = isProfilePicture;
            return this;
        }

        public ImageBuilder uploadedAt(LocalDateTime uploadedAt) {
            this.uploadedAt = uploadedAt;
            return this;
        }

        public Image build() {
            return new Image(id, userId, name, path, isNSFW, isProfilePicture, uploadedAt);
        }
    }

    // Getters et Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public boolean isNSFW() {
        return isNSFW;
    }

    public void setNSFW(boolean isNSFW) {
        this.isNSFW = isNSFW;
    }

    public boolean isProfilePicture() {
        return isProfilePicture;
    }

    public void setIsProfilePicture(boolean isProfilePicture) {
        this.isProfilePicture = isProfilePicture;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}