Write-Host "=== Pushing ERP Project to GitHub ===" -ForegroundColor Green

# Try to find Git installation
$gitPaths = @(
    "C:\Program Files\Git\bin\git.exe",
    "C:\Program Files (x86)\Git\bin\git.exe",
    "C:\Git\bin\git.exe"
)

$gitPath = $null
foreach ($path in $gitPaths) {
    if (Test-Path $path) {
        $gitPath = $path
        break
    }
}

if ($gitPath) {
    Write-Host "Found Git at: $gitPath" -ForegroundColor Yellow
    
    Set-Location "d:\Akash\ERP Shop"
    
    Write-Host "Initializing Git repository..." -ForegroundColor Cyan
    & $gitPath init
    
    Write-Host "Adding all files..." -ForegroundColor Cyan
    & $gitPath add .
    
    Write-Host "Creating initial commit..." -ForegroundColor Cyan
    & $gitPath commit -m "Initial commit: Complete ERP system with Angular frontend and ASP.NET Core backend"
    
    Write-Host "Setting main branch..." -ForegroundColor Cyan
    & $gitPath branch -M main
    
    Write-Host "Adding GitHub remote..." -ForegroundColor Cyan
    & $gitPath remote add origin https://github.com/akcb1792-afk/ERP-Project-.git
    
    Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
    & $gitPath push -u origin main
    
    Write-Host "=== Push completed! ===" -ForegroundColor Green
} else {
    Write-Host "Git not found. Please use Git Bash manually." -ForegroundColor Red
    Write-Host "Open Git Bash and run:" -ForegroundColor White
    Write-Host 'cd "d:/Akash/ERP Shop"' -ForegroundColor Gray
    Write-Host "git init" -ForegroundColor Gray
    Write-Host "git add ." -ForegroundColor Gray
    Write-Host 'git commit -m "Initial commit: Complete ERP system with Angular frontend and ASP.NET Core backend"' -ForegroundColor Gray
    Write-Host "git branch -M main" -ForegroundColor Gray
    Write-Host "git remote add origin https://github.com/akcb1792-afk/ERP-Project-.git" -ForegroundColor Gray
    Write-Host "git push -u origin main" -ForegroundColor Gray
}
