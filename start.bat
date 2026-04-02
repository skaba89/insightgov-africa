@echo off
REM =============================================================================
REM InsightGov Africa - Quick Start Script (Windows)
REM =============================================================================
REM Usage: start.bat [command]
REM Commands: start, stop, rebuild, logs, clean, diagnose
REM =============================================================================

setlocal enabledelayedexpansion

REM Colors (using PowerShell for color output)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "CYAN=[96m"
set "NC=[0m"

REM Default command
set "CMD=%~1"
if "%CMD%"=="" set "CMD=start"

echo.
echo %CYAN%========================================%NC%
echo %CYAN%  InsightGov Africa%NC%
echo %CYAN%========================================%NC%
echo.

if "%CMD%"=="start" goto :start
if "%CMD%"=="stop" goto :stop
if "%CMD%"=="rebuild" goto :rebuild
if "%CMD%"=="logs" goto :logs
if "%CMD%"=="clean" goto :clean
if "%CMD%"=="diagnose" goto :diagnose
if "%CMD%"=="setup" goto :setup
goto :help

:start
echo %GREEN%🚀 Démarrage des services...%NC%
echo.

REM Check .env
if not exist .env (
    echo %YELLOW%⚠️  Fichier .env manquant%NC%
    if exist .env.example (
        echo %YELLOW%   Copie de .env.example...%NC%
        copy .env.example .env >nul
        echo %YELLOW%   ⚠️  Veuillez éditer .env avec votre GROQ_API_KEY%NC%
    )
)

REM Start Docker services
docker-compose up -d

echo.
echo %GREEN%✅ Services démarrés !%NC%
echo.
echo    Application:  http://localhost:3000
echo    Base de données: http://localhost:8080
echo.
echo    Commandes utiles:
echo      start.bat logs      - Voir les logs
echo      start.bat diagnose  - Diagnostiquer
echo      start.bat stop      - Arrêter
echo.
goto :end

:stop
echo %YELLOW%🛑 Arrêt des services...%NC%
docker-compose down
echo %GREEN%✅ Services arrêtés%NC%
goto :end

:rebuild
echo %YELLOW%🔄 Reconstruction...%NC%
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
echo %GREEN%✅ Reconstruction terminée%NC%
goto :end

:logs
echo %CYAN%📋 Logs de l'application (Ctrl+C pour quitter):%NC%
docker-compose logs -f app
goto :end

:clean
echo %RED%🧹 Nettoyage complet...%NC%
docker-compose down -v --remove-orphans
docker system prune -f
echo %GREEN%✅ Nettoyage terminé%NC%
goto :end

:diagnose
echo %CYAN%🔍 Diagnostic...%NC%
powershell -ExecutionPolicy Bypass -File diagnose.ps1
goto :end

:setup
echo %CYAN%🗄️ Initialisation base de données...%NC%
echo.
echo Attente de PostgreSQL...
timeout /t 5 /nobreak >nul

echo Génération du client Prisma...
docker-compose exec app bunx prisma generate

echo Synchronisation du schéma...
docker-compose exec app bunx prisma db push

echo.
echo %GREEN%✅ Base de données initialisée !%NC%
echo.
echo Comptes de test:
echo   Email: admin@sante.gouv.sn
echo   Mot de passe: password123
echo.
goto :end

:help
echo.
echo %CYAN%Commandes disponibles:%NC%
echo.
echo   start     - Démarrer les services (défaut)
echo   stop      - Arrêter les services
echo   rebuild   - Reconstruire les conteneurs
echo   logs      - Voir les logs en temps réel
echo   clean     - Nettoyer tout (supprime les données)
echo   diagnose  - Lancer le diagnostic
echo   setup     - Initialiser la base de données
echo.
echo Usage: start.bat [command]
echo.
goto :end

:end
endlocal
