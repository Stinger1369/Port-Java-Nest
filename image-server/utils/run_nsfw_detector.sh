#!/bin/bash
# Activer l'environnement virtuel
source venv/bin/activate
# Exécuter le script Python
python3 utils/nsfw_detector.py "$1"
