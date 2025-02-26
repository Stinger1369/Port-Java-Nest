package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	root := "."

	// Liste des répertoires à ignorer
	ignoredDirs := []string{"venv", "node_modules", "build"}

	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Ignorer les répertoires spécifiés
		for _, ignoredDir := range ignoredDirs {
			if info.IsDir() && strings.Contains(path, ignoredDir) {
				return filepath.SkipDir
			}
		}

		fmt.Println(path)
		return nil
	})
	if err != nil {
		fmt.Println("Error:", err)
	}
}
