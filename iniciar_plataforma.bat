@echo off
title AlphaPulse Market Terminal
echo ========================================================
echo   INICIANDO ALPHAPULSE - TERMINAL FINANCIERO Y ALERTAS
echo ========================================================
echo.
cd /d "C:\Users\Carol\.gemini\antigravity\scratch\market-terminal"

echo Abriendo navegador en http://localhost:5000 ...
timeout /t 2 /nobreak >nul
start http://localhost:5000

echo Iniciando servidor Node.js...
node server/index.js
pause
