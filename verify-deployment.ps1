# PowerShell script to verify deployment readiness
Write-Host "=== ERP System Deployment Verification ===" -ForegroundColor Green

# Check backend files
Write-Host "`n1. Checking Backend Files..." -ForegroundColor Yellow
$backendFiles = @(
    "GrowURBuisness.API/Program.cs",
    "GrowURBuisness.API/appsettings.json",
    "GrowURBuisness.API/Controllers/ReportsController.cs",
    "GrowURBuisness.API/Models/SampleData.cs"
)

foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $file" -ForegroundColor Red
    }
}

# Check frontend files
Write-Host "`n2. Checking Frontend Files..." -ForegroundColor Yellow
$frontendFiles = @(
    "GrowURBuisness-ui/src/environments/environment.ts",
    "GrowURBuisness-ui/src/environments/environment.prod.ts",
    "GrowURBuisness-ui/src/app/services/dashboard.service.ts",
    "GrowURBuisness-ui/src/app/services/reports.service.ts"
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $file" -ForegroundColor Red
    }
}

# Check deployment scripts
Write-Host "`n3. Checking Deployment Scripts..." -ForegroundColor Yellow
$scriptFiles = @(
    "deploy-backend.sh",
    "deploy-frontend.sh",
    "DEPLOYMENT_GUIDE.md",
    "QUICK_DEPLOY.md"
)

foreach ($file in $scriptFiles) {
    if (Test-Path $file) {
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $file" -ForegroundColor Red
    }
}

# Check configuration
Write-Host "`n4. Checking Configuration..." -ForegroundColor Yellow

# Check backend configuration
$backendConfig = Get-Content "GrowURBuisness.API/appsettings.json" -Raw
if ($backendConfig -match "YOUR_SERVER") {
    Write-Host "  [WARNING] Backend still has placeholder database connection" -ForegroundColor Yellow
} else {
    Write-Host "  [OK] Backend database connection configured" -ForegroundColor Green
}

# Check frontend configuration
$frontendConfig = Get-Content "GrowURBuisness-ui/src/environments/environment.prod.ts" -Raw
if ($frontendConfig -match "your-backend-url") {
    Write-Host "  [WARNING] Frontend still has placeholder backend URL" -ForegroundColor Yellow
} else {
    Write-Host "  [OK] Frontend backend URL configured" -ForegroundColor Green
}

Write-Host "`n=== Verification Complete ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update database connection string in appsettings.json" -ForegroundColor White
Write-Host "2. Update backend URL in environment.prod.ts" -ForegroundColor White
Write-Host "3. Follow DEPLOYMENT_GUIDE.md for cloud deployment" -ForegroundColor White
