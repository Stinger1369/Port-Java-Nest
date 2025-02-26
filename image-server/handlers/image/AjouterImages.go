package image

import (
    "github.com/gin-gonic/gin"
    "image-server/utils"
    "log"
    "net/http"
)

func AjouterImages(c *gin.Context) {
    log.Println("Received request to add multiple images")

    var request struct {
        UserID string `json:"user_id"`
        Images []struct {
            Nom    string `json:"nom"`
            Base64 string `json:"base64"`
        } `json:"images"`
    }

    if err := c.BindJSON(&request); err != nil {
        log.Printf("[%s] Error binding JSON: %v", utils.ErrInvalidRequestFormat, err)
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "code": utils.ErrInvalidRequestFormat})
        return
    }

    if request.UserID == "" {
        log.Printf("[%s] UserID is empty", utils.ErrEmptyUserID)
        c.JSON(http.StatusBadRequest, gin.H{"error": "UserID is required", "code": utils.ErrEmptyUserID})
        return
    }

    userImageCount, err := countUserImages(request.UserID)
    if err != nil {
        log.Printf("[%s] Error counting user images: %v", utils.ErrCountingUserImages, err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count user images", "code": utils.ErrCountingUserImages})
        return
    }

    if userImageCount >= utils.MaxImagesPerUser {
        log.Printf("[%s] User %s has reached the maximum number of images", utils.ErrMaxImagesReached, request.UserID)
        c.JSON(http.StatusBadRequest, gin.H{"error": "Maximum number of images reached", "code": utils.ErrMaxImagesReached})
        return
    }

    var results []gin.H
    for _, img := range request.Images {
        if userImageCount >= utils.MaxImagesPerUser {
            break
        }

        imageURL, err := processImage(request.UserID, img.Nom, img.Base64)
        if err != nil {
            log.Printf("Error processing image %s: %v", img.Nom, err)
            results = append(results, gin.H{"error": err.Error(), "name": img.Nom})
            continue
        }

        results = append(results, gin.H{"link": imageURL, "name": img.Nom})
        userImageCount++
    }

    c.JSON(http.StatusOK, gin.H{"results": results})
}
