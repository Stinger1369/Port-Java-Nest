package image

import (
	"encoding/base64"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/nfnt/resize"
	"github.com/twinj/uuid"
	"golang.org/x/image/webp"
	"image"
	"image-server/utils"
	"image/jpeg"
	"image/png"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// compressImage compresses the image located at filePath and returns the path to the compressed image
func compressImage(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open file: %v", err)
	}
	defer file.Close()

	// Detect image type based on content, not just extension
	_, format, err := image.DecodeConfig(file) // Supprimé la variable config inutile
	if err != nil {
		return "", fmt.Errorf("failed to decode image config: %v", err)
	}
	file.Seek(0, 0) // Reset file pointer to beginning

	var img image.Image
	ext := strings.ToLower(filepath.Ext(filePath))

	switch format {
	case "jpeg":
		img, err = jpeg.Decode(file)
		if err != nil {
			return "", fmt.Errorf("failed to decode JPEG: %v", err)
		}
	case "png":
		img, err = png.Decode(file)
		if err != nil {
			return "", fmt.Errorf("failed to decode PNG: %v", err)
		}
	case "webp":
		img, err = decodeWebP(file)
		if err != nil {
			return "", fmt.Errorf("failed to decode WebP: %v", err)
		}
	default:
		return "", fmt.Errorf("unsupported image format: %s", format)
	}

	log.Printf("Image format detected (from content): %s, extension: %s", format, ext)

	// Resize image
	m := resize.Resize(500, 0, img, resize.Lanczos3)

	// Prepare compressed file path
	compressedPath := strings.TrimSuffix(filePath, ext) + ".jpg" // Toujours sauvegarder en .jpg

	// Create compressed file
	out, err := os.Create(compressedPath)
	if err != nil {
		return "", fmt.Errorf("failed to create compressed file: %v", err)
	}
	defer out.Close()

	// Encode image in JPEG format with options
	options := &jpeg.Options{Quality: 85} // Qualité JPEG ajustable (85% par défaut)
	err = jpeg.Encode(out, m, options)
	if err != nil {
		return "", fmt.Errorf("failed to encode image as JPEG: %v", err)
	}

	log.Printf("Compressed image created: %s", compressedPath)
	return compressedPath, nil
}

// decodeWebP decodes a WebP image
func decodeWebP(r io.Reader) (image.Image, error) {
	img, err := webp.Decode(r)
	if err != nil {
		return nil, fmt.Errorf("failed to decode WebP: %v", err)
	}
	return img, nil
}

// processImage traite une image pour un utilisateur donné
func processImage(userID, imageName, base64Data string) (string, error) {
	userDir, err := checkAndCreateUserDir(userID)
	if err != nil {
		return "", err
	}

	log.Printf("Processing image for user: %s", userID)

	imageHash := utils.CalculateHash(base64Data)
	log.Printf("Calculated hash: %s", imageHash)

	exists, err := utils.HashExists(userDir, imageHash)
	if err != nil {
		return "", err
	}

	if exists {
		return "", fmt.Errorf("[%s] Image with the same content already exists for user %s", utils.ErrImageAlreadyExists, userID)
	}

	filename := uuid.NewV4().String() + "_" + imageName
	filePath := filepath.Join(userDir, filename)
	data, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return "", fmt.Errorf("[%s] Error decoding base64: %v", utils.ErrDecodingBase64, err)
	}

	if err := ioutil.WriteFile(filePath, data, 0644); err != nil {
		return "", fmt.Errorf("[%s] Error writing file: %v", utils.ErrWritingFile, err)
	}

	isNSFW, err := utils.CheckImageForNSFW(filePath)
	if err != nil {
		os.Remove(filePath)
		return "", fmt.Errorf("[%s] Error checking image for NSFW: %v", utils.ErrNSFWCheck, err)
	}

	if isNSFW {
		os.Remove(filePath)
		return "", fmt.Errorf("[%s] Image is inappropriate (NSFW) and has been removed: %s", utils.ErrImageNSFW, filePath)
	}

	compressedPath, err := compressImage(filePath)
	if err != nil {
		os.Remove(filePath)
		return "", fmt.Errorf("[%s] Error compressing image: %v", utils.ErrImageCompression, err)
	}

	if filePath != compressedPath {
		if err := os.Remove(filePath); err != nil {
			return "", fmt.Errorf("[%s] Error removing original image: %v", utils.ErrRemovingOriginalImage, err)
		}
	}

	if err := utils.AddHash(userDir, imageHash, filename); err != nil {
		return "", fmt.Errorf("[%s] Error adding hash: %v", utils.ErrAddingImageHash, err)
	}

	return generateImageURL(compressedPath), nil
}

// checkAndCreateUserDir vérifie et crée le répertoire utilisateur si nécessaire
func checkAndCreateUserDir(userID string) (string, error) {
	userDir := filepath.Join("public", "images", userID)
	if _, err := os.Stat(userDir); os.IsNotExist(err) {
		err = os.MkdirAll(userDir, os.ModePerm)
		if err != nil {
			return "", err
		}
		log.Printf("User directory created: %s", userDir)
	} else {
		log.Printf("User directory already exists: %s", userDir)
	}
	return userDir, nil
}

// countUserImages compte le nombre d'images existantes pour un utilisateur
func countUserImages(userID string) (int, error) {
	userDir := filepath.Join("public", "images", userID)
	if _, err := os.Stat(userDir); os.IsNotExist(err) {
		return 0, nil // Répertoire inexistant = 0 images
	}

	files, err := os.ReadDir(userDir)
	if err != nil {
		return 0, err
	}

	imageCount := 0
	for _, file := range files {
		if !file.IsDir() && !strings.HasSuffix(file.Name(), "hashes.json") {
			imageCount++
		}
	}
	return imageCount, nil
}

// generateImageURL génère l'URL publique de l'image
func generateImageURL(filePath string) string {
	relativePath := strings.ReplaceAll(filePath[len("public/"):], "\\", "/")
	return utils.ServerBaseURL + relativePath
}

// AjouterImage gère l'upload d'une image via form-data
func AjouterImage(c *gin.Context) {
	log.Println("Received request to add image")

	// Récupérer et logger les champs du formulaire pour le débogage
	log.Printf("Request Form Values: %v", c.Request.PostForm)
	userID := c.PostForm("user_id")
	name := c.PostForm("name")
	file, err := c.FormFile("file")
	log.Printf("Parsed form data - user_id: %s, name: %s, file present: %v", userID, name, file != nil)

	if err != nil {
		log.Printf("[%s] Error binding form data: %v", utils.ErrInvalidRequestFormat, err)
		c.JSON(http.StatusBadRequest, gin.H{
			"code":  utils.ErrInvalidRequestFormat,
			"error": fmt.Sprintf("Invalid request format: %v", err),
		})
		return
	}

	// Vérifier que userID n'est pas vide
	if userID == "" {
		log.Printf("[%s] UserID is empty", utils.ErrEmptyUserID)
		c.JSON(http.StatusBadRequest, gin.H{
			"code":  utils.ErrEmptyUserID,
			"error": "User ID is required",
		})
		return
	}

	// Vérifier le nombre maximum d'images par utilisateur
	userDir, err := checkAndCreateUserDir(userID)
	if err != nil {
		log.Printf("[%s] Failed to create or check user directory: %v", utils.ErrCreatingUserDirectory, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":  utils.ErrCreatingUserDirectory,
			"error": "Failed to create or check user directory",
		})
		return
	}

	imageCount, err := countUserImages(userID)
	if err != nil {
		log.Printf("[%s] Failed to count user images: %v", utils.ErrCountingUserImages, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":  utils.ErrCountingUserImages,
			"error": "Failed to count user images",
		})
		return
	}
	if imageCount >= utils.MaxImagesPerUser {
		log.Printf("[%s] User %s has reached the maximum number of images", utils.ErrMaxImagesReached, userID)
		c.JSON(http.StatusBadRequest, gin.H{
			"code":  utils.ErrMaxImagesReached,
			"error": "Maximum number of images reached for this user",
		})
		return
	}

	// Générer un nom unique pour le fichier
	uuid := uuid.NewV4().String()
	log.Printf("Generated UUID for file: %s", uuid)
	fileExt := filepath.Ext(name)
	if fileExt == "" {
		fileExt = ".jpg" // Par défaut
	}
	newFileName := uuid + "_" + name
	destPath := filepath.Join(userDir, newFileName)
	log.Printf("Destination path for file: %s", destPath)

	// Sauvegarder le fichier téléchargé
	if err := c.SaveUploadedFile(file, destPath); err != nil {
		log.Printf("[%s] Failed to save uploaded file: %v", utils.ErrWritingFile, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":  utils.ErrWritingFile,
			"error": "Failed to save uploaded file",
		})
		return
	}

	// Lire le contenu du fichier pour calculer le hash
	fileContent, err := os.ReadFile(destPath)
	if err != nil {
		log.Printf("[%s] Failed to read file for hash calculation: %v", utils.ErrAddingImageHash, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":  utils.ErrAddingImageHash,
			"error": "Failed to read file for hash calculation",
		})
		return
	}
	base64Data := base64.StdEncoding.EncodeToString(fileContent)
	log.Printf("Calculated base64 data length: %d", len(base64Data))
	imageHash := utils.CalculateHash(base64Data)
	log.Printf("Calculated image hash: %s", imageHash)

	// Vérifier si l'image existe déjà via son hash
	exists, err := utils.HashExists(userDir, imageHash)
	if err != nil {
		log.Printf("[%s] Failed to check if image exists: %v", utils.ErrAddingImageHash, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":  utils.ErrAddingImageHash,
			"error": "Failed to check if image exists",
		})
		return
	}
	if exists {
		log.Printf("[%s] Image already exists with hash: %s", utils.ErrImageAlreadyExists, imageHash)
		os.Remove(destPath) // Supprimer le fichier dupliqué
		c.JSON(http.StatusBadRequest, gin.H{
			"code":  utils.ErrImageAlreadyExists,
			"error": "Image already exists",
		})
		return
	}
	if err := utils.AddHash(userDir, imageHash, newFileName); err != nil {
		log.Printf("[%s] Failed to add image hash: %v", utils.ErrAddingImageHash, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":  utils.ErrAddingImageHash,
			"error": "Failed to add image hash",
		})
		return
	}

	// Vérifier NSFW
	isNSFW, err := utils.CheckImageForNSFW(destPath)
	if err != nil {
		log.Printf("[%s] Failed to check image for NSFW: %v", utils.ErrNSFWCheck, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":  utils.ErrNSFWCheck,
			"error": "Error checking image for NSFW",
		})
		return
	}
	if isNSFW {
		log.Printf("[%s] Image contains NSFW content: %s", utils.ErrImageNSFW, destPath)
		os.Remove(destPath) // Supprimer l'image NSFW
		c.JSON(http.StatusBadRequest, gin.H{
			"code":  utils.ErrImageNSFW,
			"error": "Image contains NSFW content",
		})
		return
	}

	// Compresser l'image
	compressedPath, err := compressImage(destPath)
	if err != nil {
		log.Printf("[%s] Failed to compress image: %v", utils.ErrImageCompression, err)
		os.Remove(destPath)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":  utils.ErrImageCompression,
			"error": fmt.Sprintf("Error compressing image: %v", err),
		})
		return
	}

	if destPath != compressedPath {
		log.Printf("Removing original file: %s", destPath)
		if err := os.Remove(destPath); err != nil {
			log.Printf("[%s] Failed to remove original image: %v", utils.ErrRemovingOriginalImage, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":  utils.ErrRemovingOriginalImage,
				"error": "Failed to remove original image",
			})
			return
		}
	}

	// Répondre avec l'URL de l'image compressée
	imageURL := generateImageURL(compressedPath)
	log.Printf("Generated image URL: %s", imageURL)
	c.JSON(http.StatusOK, gin.H{
		"link": imageURL,
	})
}
