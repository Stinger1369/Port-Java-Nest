package image

import (
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// GetImage récupère une image spécifique pour un utilisateur donné
func GetImage(c *gin.Context) {
	userID := c.Param("user_id")
	nom := c.Param("nom")
	filePath := filepath.Join("public/images", userID, nom)
	log.Printf("Fetching image: %s", filePath)
	c.File(filePath)
}

// GetAllImages récupère toutes les images pour un utilisateur spécifique
func GetAllImages(c *gin.Context) {
	userID := c.Param("user_id")
	if userID == "" {
		log.Printf("UserID is empty")
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "ERR001",
			"error":   "User ID is required",
			"message": "User ID is required",
		})
		return
	}

	// Construction du chemin du répertoire utilisateur
	baseDir := filepath.Join("public/images", userID)
	log.Printf("Fetching all images for user %s from directory: %s", userID, baseDir)

	// Vérifie si le répertoire existe
	if _, err := os.Stat(baseDir); os.IsNotExist(err) {
		log.Printf("Directory not found for user %s: %s", userID, baseDir)
		c.JSON(http.StatusOK, []interface{}{})
		return
	} else if err != nil {
		log.Printf("Error accessing directory %s: %v", baseDir, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "ERR005",
			"error":   "Failed to access directory",
			"message": "Failed to access directory",
		})
		return
	}

	var images []map[string]interface{}
	err := filepath.Walk(baseDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			log.Printf("Error processing path %s: %v", path, err)
			return err
		}
		log.Printf("Checking file: %s", path)
		if !info.IsDir() && !strings.HasSuffix(info.Name(), "hashes.json") {
			name := info.Name()
			relPath := filepath.Join("images", userID, name)
			// Normalise les séparateurs pour utiliser / au lieu de \
			relPath = strings.ReplaceAll(relPath, "\\", "/")
			log.Printf("Adding image: %s (relPath: %s)", name, relPath)
			images = append(images, map[string]interface{}{
				"userId": userID,
				"name":   name,
				"path":   relPath,
				"isNSFW": false,
			})
		}
		return nil
	})

	if err != nil {
		log.Printf("Error walking directory for user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "ERR005",
			"error":   "Failed to list images",
			"message": "Failed to list images",
		})
		return
	}

	log.Printf("Found %d images for user %s", len(images), userID)
	c.JSON(http.StatusOK, images)
}
