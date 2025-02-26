package video

import (
    "net/http"
    "os"
    "path/filepath"
    "github.com/gin-gonic/gin"
    "log"
)

func DeleteVideo(c *gin.Context) {
    nom := c.Param("nom")
    filePath := filepath.Join("public/videos", nom)
    if err := os.Remove(filePath); err != nil {
        log.Printf("Error deleting file: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"message": "Video deleted successfully"})
}
