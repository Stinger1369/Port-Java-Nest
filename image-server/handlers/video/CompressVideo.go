package video

import (
    "os/exec"
    "log"
)

func CompressVideo(filePath string) (string, error) {
    compressedPath := filePath + "_compressed.mp4"
    cmd := exec.Command("ffmpeg", "-i", filePath, "-vcodec", "h264", "-acodec", "aac", compressedPath)
    err := cmd.Run()
    if err != nil {
        log.Printf("Error compressing video: %v", err)
        return "", err
    }

    log.Printf("Compressed video created: %s", compressedPath)
    return compressedPath, nil
}
