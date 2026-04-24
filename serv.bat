@echo off
title Serveur Web Python
echo Lancement du serveur sur http://localhost:8000...
echo Appuyez sur CTRL+C pour arreter le serveur.
echo.
python -m http.server 8000
pause