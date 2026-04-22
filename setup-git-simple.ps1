# Simple PowerShell script for Git setup
Write-Host "Setting up Git repository..." -ForegroundColor Green

Set-Location "D:\Akash\ERP Shop"

# Using full path to git.exe
$gitPath = "C:\Program Files\Git\bin\git.exe"

# Initialize Git
& $gitPath init

# Add all files
& $gitPath add .

# Create initial commit
& $gitPath commit -m "Initial commit: ERP Angular application with modern UI and database integration"

Write-Host "Git repository initialized successfully!" -ForegroundColor Green
Write-Host "Project is ready for GitHub push." -ForegroundColor Cyan
