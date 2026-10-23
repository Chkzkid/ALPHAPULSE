@echo off
title AlphaPulse Desktop App
cd /d "C:\Users\Carol\.gemini\antigravity\scratch\market-terminal"

REM Iniciar backend en segundo plano si no esta corriendo
start /b node server/index.js >nul 2>&1

timeout /t 2 /nobreak >nul

REM Intentar abrir en modo aplicacion con Edge o Chrome
start msedge --app=http://localhost:5000 2>nul || start chrome --app=http://localhost:5000 2>nul || start http://localhost:5000
