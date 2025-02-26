package image

import (
	"encoding/base64"
	"fmt"
	"github.com/gin-gonic/gin"
	"image-server/utils"
	"log"
	"net/http"
	"os"
	"path/filepath"
    "strings"
)

func DeleteImage(c *gin.Context) {
	userID := c.Param("user_id")
	nom := c.Param("nom")
	filePath := filepath.Join("public/images", userID, nom)

	log.Printf("Attempting to delete image: %s", filePath)

	// Vérifier si le fichier existe et obtenir son extension réelle
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		log.Printf("Image not found: %s", filePath)
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	// Lire le contenu de l'image pour calculer le hachage avant suppression
	fileContent, err := os.ReadFile(filePath)
	if err != nil {
		log.Printf("Error reading file for hash calculation: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	fileBase64 := base64.StdEncoding.EncodeToString(fileContent)
	imageHash := utils.CalculateHash(fileBase64)

	log.Printf("Deleting image: %s with hash: %s", filePath, imageHash)

	// Supprimer l'image
	if err := os.Remove(filePath); err != nil {
		log.Printf("Error deleting file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Supprimer le hachage du fichier hashes.json
	userDir := filepath.Join("public/images", userID)
	log.Printf("Attempting to remove hash for file: %s in directory: %s", nom, userDir)

	// Obtenir l'extension réelle du fichier pour une correspondance plus robuste
	baseName := strings.TrimSuffix(nom, filepath.Ext(nom))
	actualFileName := nom // Conserver le nom original pour la vérification
	err = utils.RemoveHash(userDir, actualFileName)
	if err != nil {
		// Si l'extension ne correspond pas, essayer avec une extension générique
		if err.Error() == "no hash found for file: "+actualFileName {
			log.Printf("Trying to match hash with base name: %s (ignoring extension)", baseName)
			err = utils.RemoveHashByBaseName(userDir, baseName)
			if err != nil {
				log.Printf("Error removing hash for base name %s: %v", baseName, err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to remove hash: %v", err)})
				return
			}
		} else {
			log.Printf("Error removing hash for file %s: %v", actualFileName, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to remove hash: %v", err)})
			return
		}
	}

	log.Printf("Successfully deleted image and removed hash for: %s", filePath)
	c.JSON(http.StatusOK, gin.H{"message": "Image deleted successfully"})
}
