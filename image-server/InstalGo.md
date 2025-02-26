
## Configuration de l'environnement Go

Assurez-vous que Go est installé sur votre système et que vous avez configuré correctement votre GOPATH et GOROOT si nécessaire.

Naviguez vers le répertoire image-server :

```bash
cd image-server
```

### Installez les dépendances Go définies dans go.mod :

```bash
go mod tidy
```

### Compiler et démarrer le serveur

Compilez le projet Go :

```bash
go build
```

Démarrez le serveur Go :

```bash
./image-server
```

Le serveur d'images Go devrait maintenant être opérationnel sur votre machine locale.

## Configuration de l'environnement Python pour les dépendances

Si votre projet utilise des dépendances Python comme TensorFlow, OpenCV, Pytesseract et Pillow, vous devez configurer un environnement Python virtuel pour les gérer séparément.

### Créer et activer un environnement virtuel Python

Ouvrez un nouveau terminal (ou utilisez votre terminal actuel si vous ne l'avez pas fermé depuis l'étape précédente) et exécutez les commandes suivantes :

Installez virtualenv si ce n'est pas déjà fait :

```bash
pip install virtualenv
```

Créez un nouvel environnement virtuel dans le répertoire image-server (ou utilisez un chemin spécifique si vous préférez) :

```bash
python -m venv venv
```

Activez l'environnement virtuel (Windows) :

```bash
venv\Scripts\activate
```

Pour Linux/macOS :

```bash
source venv/bin/activate
```

### Installer les dépendances Python

Avec l'environnement virtuel activé, installez les dépendances à partir de requirements.txt :

```bash
pip install -r requirements.txt
```

Cela installera TensorFlow, OpenCV, Pytesseract, Pillow et d'autres dépendances spécifiées dans requirements.txt.

### Exécuter le serveur

```bash
go run main.go
```

### Afficher l'arborescence du répertoire

```bash
tree H:\recruteProject\image-server /F
```

### Exécuter le script Python de détection NSFW

```bash
python .\utils\nsfw_detector.py .\public\images\1.jpg
```
ssh -i C:\Users\bilel\.ssh\id_rsa ubuntu@57.129.35.0
transfert local to server "scp -r H:/gitServeurImage/ImageServer/* ubuntu@57.129.35.0:/home/ubuntu/project/"


scp -r /mnt/h/NextStep/image-server ubuntu@135.125.244.65:~
