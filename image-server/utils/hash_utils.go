package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
)

// HashInfo contient les détails du hash
type HashInfo struct {
	Hash string `json:"hash"`
	Path string `json:"path"`
}

// CalculateHash calcule le hachage SHA-256 d'une chaîne base64
func CalculateHash(base64String string) string {
	hasher := sha256.New()
	hasher.Write([]byte(base64String))
	return hex.EncodeToString(hasher.Sum(nil))
}

// HashExists vérifie si un hachage existe déjà pour un utilisateur donné
func HashExists(userDir string, hash string) (bool, error) {
	hashFilePath := filepath.Join(userDir, "hashes.json")
	if _, err := os.Stat(hashFilePath); os.IsNotExist(err) {
		return false, nil
	}

	data, err := ioutil.ReadFile(hashFilePath)
	if err != nil {
		return false, err
	}

	var hashes map[string]HashInfo
	if err := json.Unmarshal(data, &hashes); err != nil {
		return false, err
	}

	log.Printf("Current hashes in %s: %v", hashFilePath, hashes)
	_, exists := hashes[hash]
	log.Printf("Hash %s exists: %v", hash, exists)
	return exists, nil
}

// AddHash ajoute un hachage au fichier hashes.json pour un utilisateur donné
func AddHash(userDir string, hash, filePath string) error {
	hashFilePath := filepath.Join(userDir, "hashes.json")
	var hashes map[string]HashInfo

	if _, err := os.Stat(hashFilePath); os.IsNotExist(err) {
		hashes = make(map[string]HashInfo)
	} else {
		data, err := ioutil.ReadFile(hashFilePath)
		if err != nil {
			return err
		}
		if err := json.Unmarshal(data, &hashes); err != nil {
			return err
		}
	}

	hashes[hash] = HashInfo{Hash: hash, Path: filePath}
	data, err := json.Marshal(hashes)
	if err != nil {
		return err
	}

	log.Printf("Adding hash: %s to user directory: %s", hash, userDir)
	log.Printf("Updated hashes: %v", hashes)
	return ioutil.WriteFile(hashFilePath, data, 0644)
}

// RemoveHash supprime un hachage du fichier hashes.json pour un utilisateur donné
func RemoveHash(userDir, fileName string) error {
	hashFilePath := filepath.Join(userDir, "hashes.json")
	var hashes map[string]HashInfo

	if _, err := os.Stat(hashFilePath); os.IsNotExist(err) {
		log.Printf("File %s does not exist", hashFilePath)
		return nil // Si le fichier n'existe pas, rien à supprimer
	}

	data, err := ioutil.ReadFile(hashFilePath)
	if err != nil {
		return fmt.Errorf("failed to read hashes.json: %v", err)
	}

	if err := json.Unmarshal(data, &hashes); err != nil {
		return fmt.Errorf("failed to unmarshal hashes.json: %v", err)
	}

	log.Printf("Current hashes before removal: %v", hashes)
	found := false
	for hash, info := range hashes {
		log.Printf("Checking hash %s with path %s against fileName %s", hash, info.Path, fileName)
		if info.Path == fileName {
			delete(hashes, hash)
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("no hash found for file: %s", fileName)
	}

	data, err = json.Marshal(hashes)
	if err != nil {
		return fmt.Errorf("failed to marshal updated hashes: %v", err)
	}

	tempFilePath := hashFilePath + ".tmp"
	if err := ioutil.WriteFile(tempFilePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write temporary hashes.json: %v", err)
	}

	// Remplacer le fichier original par le fichier temporaire
	if err := os.Rename(tempFilePath, hashFilePath); err != nil {
		return fmt.Errorf("failed to rename temporary hashes.json: %v", err)
	}

	log.Printf("Successfully removed hash and updated hashes.json for user directory: %s", userDir)
	log.Printf("Updated hashes after removal: %v", hashes)
	return nil
}

// RemoveHashByBaseName supprime un hachage en comparant uniquement le nom de base, en ignorant l'extension
func RemoveHashByBaseName(userDir, baseName string) error {
	hashFilePath := filepath.Join(userDir, "hashes.json")
	var hashes map[string]HashInfo

	if _, err := os.Stat(hashFilePath); os.IsNotExist(err) {
		log.Printf("File %s does not exist", hashFilePath)
		return nil // Si le fichier n'existe pas, rien à supprimer
	}

	data, err := ioutil.ReadFile(hashFilePath)
	if err != nil {
		return fmt.Errorf("failed to read hashes.json: %v", err)
	}

	if err := json.Unmarshal(data, &hashes); err != nil {
		return fmt.Errorf("failed to unmarshal hashes.json: %v", err)
	}

	log.Printf("Current hashes before removal by base name: %v", hashes)
	found := false
	for hash, info := range hashes {
		fileBaseName := strings.TrimSuffix(info.Path, filepath.Ext(info.Path))
		log.Printf("Checking base name %s against target base name %s", fileBaseName, baseName)
		if fileBaseName == baseName {
			delete(hashes, hash)
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("no hash found for base name: %s", baseName)
	}

	data, err = json.Marshal(hashes)
	if err != nil {
		return fmt.Errorf("failed to marshal updated hashes: %v", err)
	}

	tempFilePath := hashFilePath + ".tmp"
	if err := ioutil.WriteFile(tempFilePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write temporary hashes.json: %v", err)
	}

	// Remplacer le fichier original par le fichier temporaire
	if err := os.Rename(tempFilePath, hashFilePath); err != nil {
		return fmt.Errorf("failed to rename temporary hashes.json: %v", err)
	}

	log.Printf("Successfully removed hash by base name and updated hashes.json for user directory: %s", userDir)
	log.Printf("Updated hashes after removal by base name: %v", hashes)
	return nil
}
