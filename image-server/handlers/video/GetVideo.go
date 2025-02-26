package video

import (
    "path/filepath"
    "github.com/gin-gonic/gin"
    "log"
)

func GetVideo(c *gin.Context) {
    nom := c.Param("nom")
    filePath := filepath.Join("public/videos", nom)
    log.Printf("Fetching video: %s", filePath)
    c.File(filePath)
}
