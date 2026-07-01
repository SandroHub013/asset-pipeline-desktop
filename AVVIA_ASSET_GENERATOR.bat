@echo off
title Rogue Idle - Asset Suite
echo ========================================================
echo Avvio della Suite di Sviluppo Rogue Idle in corso...
echo ========================================================

:: 1. Avvia Piskel Server (Porta 9001) in background silenziato
echo [System] Avvio Piskel Editor su porta 9001...
start /b cmd /c "cd /d "%~dp0..\scratch\piskel" && node scripts/serve.js" >nul 2>&1

:: 2. Avvia Animator Preview (Porta 9002) in background silenziato
echo [System] Avvio Animator Preview su porta 9002...
start /b cmd /c "cd /d "%~dp0.." && node scratch/serve_preview.js" >nul 2>&1

:: 3. Avvia la Desktop App Electron + Express Pipeline (Porta 9003)
echo [System] Avvio Desktop App Pipeline su porta 9003...
cd /d "%~dp0"
npm run app
