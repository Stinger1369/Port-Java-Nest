package image

import (
    "github.com/gin-gonic/gin"
    "log"
    "path/filepath"
)

func GetImage(c *gin.Context) {
    userID := c.Param("user_id")
    nom := c.Param("nom")
    filePath := filepath.Join("public/images", userID, nom)
    log.Printf("Fetching image: %s", filePath)
    c.File(filePath)
}
