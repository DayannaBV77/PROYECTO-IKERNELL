@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"
set "BACKEND=%ROOT%backend\backend\backend"

if not defined JAVA_HOME (
    if exist "C:\Program Files\Java\jdk-21.0.11\bin\java.exe" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.11"
        set "PATH=C:\Program Files\Java\jdk-21.0.11\bin;%PATH%"
    )
)

where psql >nul 2>nul
if errorlevel 1 (
    if exist "C:\Program Files\PostgreSQL\18\bin\psql.exe" (
        set "PG_BIN=C:\Program Files\PostgreSQL\18\bin"
        set "PATH=C:\Program Files\PostgreSQL\18\bin;%PATH%"
    )
)

sc query postgresql-x64-18 >nul 2>nul
if not errorlevel 1 (
    net start postgresql-x64-18 >nul 2>nul
)

start "IKernell Frontend" cmd /k "cd /d ""%FRONTEND%"" && pnpm install --frozen-lockfile && pnpm run dev -- --host 0.0.0.0 --port 5173"
start "IKernell Backend" cmd /k "cd /d ""%BACKEND%"" && .\mvnw.cmd spring-boot:run"

ping 127.0.0.1 -n 12 >nul
start "" http://localhost:5173/

cmd /k "echo Proyecto IKernell levantado. && echo Frontend: http://localhost:5173/ && echo Backend API: http://localhost:8080/api/auth/csrf && echo Base de datos: localhost:5432 && echo. && echo Presiona Ctrl+C para cerrar esta ventana."
