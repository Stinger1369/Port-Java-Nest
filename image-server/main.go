package main

import (
	"github.com/gin-gonic/gin"
	"image-server/config"
	"image-server/handlers/image"
	"image-server/handlers/video"
	"image-server/middleware"
	"log"
)

func main() {
	r := gin.Default()
	r.Use(middleware.CORSMiddleware())

	r.Static("/images", "./public/images")

	// Routes pour les images
	r.POST("/server-image/ajouter-image", image.AjouterImage)
	r.POST("/server-image/ajouter-images", image.AjouterImages)
	r.GET("/server-image/image/:user_id/:nom", image.GetImage)
	r.GET("/server-image/all-images/:user_id", image.GetAllImages) // Corrigé ici
	r.PUT("/server-image/update-image/:user_id/:nom", image.UpdateImage)
	r.DELETE("/server-image/delete-image/:user_id/:nom", image.DeleteImage)

	// Routes pour les vidéos
	r.POST("/server-video/ajouter-video", video.AjouterVideo)
	r.GET("/server-video/video/:user_id/:nom", video.GetVideo)
	r.PUT("/server-video/update-video/:user_id/:nom", video.UpdateVideo)
	r.DELETE("/server-video/delete-video/:user_id/:nom", video.DeleteVideo)

	port := config.GetEnv("SERVER_PORT", "7000")
	log.Printf("Server starting on port %s", port)
	r.Run(":" + port)
}
