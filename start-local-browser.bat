@echo off
setlocal EnableExtensions

set "ROOT=C:\Users\LENOVO\Desktop\PROYECTO IKERNELL"
set "FRONTEND=%ROOT%\frontend"
set "BACKEND=%ROOT%\backend\backend\backend"
set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.11"
set "PATH=%JAVA_HOME%\bin;%PATH%"

where psql >nul 2>nul
if errorlevel 1 (
    set "PG_BIN=C:\Program Files\PostgreSQL\18\bin"
    set "PATH=%PG_BIN%;%PATH%"
)

sc query postgresql-x64-18 >nul 2>nul
if not errorlevel 1 (
    net start postgresql-x64-18 >nul 2>nul
)

start "IKernell Frontend" cmd /k "cd /d \"%FRONTEND%\" && pnpm install --frozen-lockfile && pnpm run dev -- --host 0.0.0.0 --port 5173"
start "IKernell Backend" cmd /k "cd /d \"%BACKEND%\" && set JAVA_HOME=%JAVA_HOME% && set PATH=%PATH% && .\mvnw spring-boot:run"

ping 127.0.0.1 -n 12 >nul
start "" http://localhost:5173/
start "" http://localhost:8080/

cmd /k "echo Proyecto IKernell levantado. && echo Frontend: http://localhost:5173/ && echo Backend: http://localhost:8080/ && echo Base de datos: localhost:5432 && echo. && echo Presiona Ctrl+C para cerrar esta ventana."
