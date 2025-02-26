package image

import (
	"encoding/base64"
	"github.com/gin-gonic/gin"
	"image-server/utils"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func UpdateImage(c *gin.Context) {
	userID := c.Param("user_id")
	nom := c.Param("nom")
	var request struct {
		Base64 string `json:"base64"`
	}
	if err := c.BindJSON(&request); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userDir, err := checkAndCreateUserDir(userID) // Utilisation de checkAndCreateUserDir depuis image_utils.go
	if err != nil {
		log.Printf("Error creating user directory: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	filePath := filepath.Join(userDir, nom)
	data, err := base64.StdEncoding.DecodeString(request.Base64)
	if err != nil {
		log.Printf("Error decoding base64: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := ioutil.WriteFile(filePath, data, 0644); err != nil {
		log.Printf("Error writing file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	isNSFW, err := utils.CheckImageForNSFW(filePath)
	if err != nil {
		log.Printf("Error checking image for NSFW: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if isNSFW {
		os.Remove(filePath)
		log.Printf("Image is NSFW: %v", filePath)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image contains inappropriate content"})
		return
	}

	compressedPath, err := compressImage(filePath)
	if err != nil {
		log.Printf("Error compressing image: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Supprimer l'image d'origine après compression
	if err := os.Remove(filePath); err != nil {
		log.Printf("Error removing original image: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Générer l'URL de l'image compressée
	imageURL := generateImageURL(compressedPath)
	log.Printf("Generated image URL: %s", imageURL)

	c.JSON(http.StatusOK, gin.H{"link": imageURL})
}
