@echo off
chcp 65001 >nul
title Sistema de Turnos
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [X] No se encontro Node.js.
  echo      Instalalo desde https://nodejs.org ^(version LTS^) y volve a abrir este archivo.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias por primera vez...
  call npm install --omit=dev
  if errorlevel 1 ( pause & exit /b 1 )
)

if not exist .env (
  echo.
  echo Primera vez: vamos a configurar el sistema.
  call npm run setup
  if errorlevel 1 ( pause & exit /b 1 )
)

echo.
echo Iniciando... Para apagar el sistema, cerra esta ventana o apreta Ctrl + C.
echo.
start "" http://localhost:3000
call npm start
pause
