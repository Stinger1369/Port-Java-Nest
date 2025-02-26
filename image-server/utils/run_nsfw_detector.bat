@echo off
call venv\Scripts\activate.bat
python utils\nsfw_detector.py %1
