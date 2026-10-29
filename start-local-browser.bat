@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"
set "BACKEND=%ROOT%backend\backend\backend"
set "FRONTEND_PORT=5173"

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

for /L %%I in (5173,1,5183) do (
    powershell -NoProfile -Command "$port = %%I; try { $client = [System.Net.Sockets.TcpClient]::new(); $client.Connect('127.0.0.1', $port); $client.Dispose(); exit 1 } catch { exit 0 }" >nul 2>nul
    if not errorlevel 1 (
        set "FRONTEND_PORT=%%I"
        goto :puerto_frontend_encontrado
    )
)
:puerto_frontend_encontrado

start "IKernell Frontend" cmd /k "cd /d ""%FRONTEND%"" && pnpm install --frozen-lockfile && pnpm run dev -- --host 0.0.0.0 --port %FRONTEND_PORT% --strictPort"
start "IKernell Backend" cmd /k "cd /d ""%BACKEND%"" && .\mvnw.cmd spring-boot:run"

ping 127.0.0.1 -n 12 >nul
start "" http://localhost:%FRONTEND_PORT%/

cmd /k "echo Proyecto IKernell levantado. && echo Frontend: http://localhost:%FRONTEND_PORT%/ && echo Backend API: http://localhost:8080/api/auth/csrf && echo Base de datos: localhost:5432 && echo. && echo Presiona Ctrl+C para cerrar esta ventana."
