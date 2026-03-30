# =============================================================================
# InsightGov Africa - Diagnostic Script (Windows PowerShell)
# =============================================================================
# Ce script vérifie l'état de l'application et diagnostique les problèmes
# Usage: .\diagnose.ps1
# =============================================================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🔍 InsightGov Africa - Diagnostic" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "📦 Vérification Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    Write-Host "✅ Docker installé: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    Write-Host "   Téléchargez: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check Docker daemon
Write-Host ""
Write-Host "🐳 Vérification Docker daemon..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker daemon actif" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker daemon ne fonctionne pas" -ForegroundColor Red
    Write-Host "   Démarrez Docker Desktop et réessayez" -ForegroundColor Yellow
    exit 1
}

# Check .env file
Write-Host ""
Write-Host "📄 Vérification configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ Fichier .env présent" -ForegroundColor Green
    
    # Check GROQ_API_KEY
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "gsk_") {
        Write-Host "✅ GROQ_API_KEY configurée" -ForegroundColor Green
    } else {
        Write-Host "⚠️  GROQ_API_KEY non configurée" -ForegroundColor Yellow
        Write-Host "   Obtenez une clé sur: https://console.groq.com/keys" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Fichier .env manquant" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "   Copie de .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "   ⚠️  Veuillez éditer .env avec votre GROQ_API_KEY" -ForegroundColor Yellow
    }
}

# Check containers
Write-Host ""
Write-Host "🐳 Vérification conteneurs..." -ForegroundColor Yellow
$containers = docker ps --format "{{.Names}} {{.Status}}" 2>$null

$dbRunning = $containers | Select-String "insightgov-db.*Up"
$appRunning = $containers | Select-String "insightgov-app.*Up"

if ($dbRunning) {
    Write-Host "✅ PostgreSQL conteneur actif" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL conteneur inactif" -ForegroundColor Red
}

if ($appRunning) {
    Write-Host "✅ App conteneur actif" -ForegroundColor Green
} else {
    Write-Host "❌ App conteneur inactif" -ForegroundColor Red
}

# Check port 3000
Write-Host ""
Write-Host "🔌 Vérification port 3000..." -ForegroundColor Yellow
try {
    $connection = Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "✅ Port 3000 accessible" -ForegroundColor Green
        
        # Try to call health endpoint
        Write-Host ""
        Write-Host "🏥 Test Health Check..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
            Write-Host "✅ Health check OK" -ForegroundColor Green
            Write-Host $response.Content
        } catch {
            Write-Host "⚠️  Health check échoué: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Port 3000 non accessible (app pas démarrée ?)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Impossible de tester le port 3000" -ForegroundColor Yellow
}

# Show logs if app container exists
Write-Host ""
Write-Host "📋 Dernières logs de l'application:" -ForegroundColor Yellow
Write-Host "----------------------------------------"
docker-compose logs app --tail=30 2>$null

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🏁 Diagnostic terminé" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Commandes utiles:" -ForegroundColor White
Write-Host "  Démarrer:     docker-compose up -d" -ForegroundColor Gray
Write-Host "  Logs:         docker-compose logs -f app" -ForegroundColor Gray
Write-Host "  Redémarrer:   docker-compose restart app" -ForegroundColor Gray
Write-Host "  Reconstruire: docker-compose build --no-cache; docker-compose up -d" -ForegroundColor Gray
