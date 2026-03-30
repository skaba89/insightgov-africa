@echo off
REM =============================================================================
REM InsightGov Africa - Docker Startup Script for Windows
REM =============================================================================
REM Usage: docker-start.bat [command]
REM
REM Commands:
REM   start     - Start all services (default)
REM   stop      - Stop all services
REM   rebuild   - Rebuild and restart all services
REM   logs      - Show logs
REM   clean     - Stop and remove all containers/volumes
REM   setup     - Run database migrations
REM   reset     - Full reset (clean + rebuild + setup)
REM =============================================================================

setlocal EnableDelayedExpansion

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [91m❌ Docker is not running. Please start Docker Desktop first.[0m
    exit /b 1
)

REM Main command
set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=start

if "%COMMAND%"=="start" goto start_services
if "%COMMAND%"=="stop" goto stop_services
if "%COMMAND%"=="rebuild" goto rebuild_services
if "%COMMAND%"=="logs" goto show_logs
if "%COMMAND%"=="clean" goto clean_all
if "%COMMAND%"=="setup" goto setup_database
if "%COMMAND%"=="reset" goto full_reset
goto usage

:start_services
echo [94m🚀 Starting InsightGov Africa...[0m

REM Create .env if not exists
if not exist .env (
    echo [93m📝 Creating .env file...[0m
    copy .env.example .env >nul
    echo [93m⚠️  Please edit .env and add your GROQ_API_KEY[0m
)

docker-compose up -d

echo.
echo [92m✅ Services started![0m
echo [92m   - App: http://localhost:3000[0m
echo [92m   - Database Admin: http://localhost:8080[0m
echo.
echo [94m📋 Next steps:[0m
echo    1. Wait 10-15 seconds for services to be ready
echo    2. Run: docker-start.bat setup
echo    3. Open: http://localhost:3000
goto end

:stop_services
echo [93m🛑 Stopping services...[0m
docker-compose down
echo [92m✅ Services stopped![0m
goto end

:rebuild_services
echo [93m🔄 Rebuilding services...[0m
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo [92m✅ Services rebuilt and started![0m
echo [93m⚠️  Run 'docker-start.bat setup' to initialize the database[0m
goto end

:show_logs
docker-compose logs -f app
goto end

:clean_all
echo [93m🧹 Cleaning up...[0m
docker-compose down -v --remove-orphans
docker system prune -f
echo [92m✅ All cleaned up![0m
goto end

:setup_database
echo [94m🗄️  Setting up database...[0m

echo [93m⏳ Waiting for PostgreSQL to be ready...[0m
timeout /t 10 /nobreak >nul

echo [93m📦 Generating Prisma client...[0m
docker-compose exec -T app bunx prisma generate

echo [93m🔄 Pushing database schema...[0m
docker-compose exec -T app bunx prisma db push --accept-data-loss

echo.
echo [92m✅ Database setup complete![0m
echo [92m   You can now access: http://localhost:3000[0m
goto end

:full_reset
echo [93m🔄 Full reset in progress...[0m

echo [93m1/4 Stopping services...[0m
docker-compose down -v --remove-orphans

echo [93m2/4 Rebuilding containers...[0m
docker-compose build --no-cache

echo [93m3/4 Starting services...[0m
docker-compose up -d

echo [93m4/4 Waiting for PostgreSQL...[0m
timeout /t 15 /nobreak >nul

echo [93mSetting up database...[0m
docker-compose exec -T app bunx prisma generate
docker-compose exec -T app bunx prisma db push --accept-data-loss

echo.
echo [92m✅ Full reset complete![0m
echo [92m   - App: http://localhost:3000[0m
echo [92m   - Database Admin: http://localhost:8080[0m
goto end

:usage
echo.
echo [93mUsage: %0 {start^|stop^|rebuild^|logs^|clean^|setup^|reset}[0m
echo.
echo Commands:
echo   start     - Start all services
echo   stop      - Stop all services
echo   rebuild   - Rebuild and restart
echo   logs      - Show application logs
echo   clean     - Remove all containers and volumes
echo   setup     - Initialize database
echo   reset     - Full reset (clean + rebuild + setup)
exit /b 1

:end
endlocal
