# PowerShell script to initialize Git repository
Write-Host "Initializing Git repository..." -ForegroundColor Green

# Change to the project directory
Set-Location -Path "D:\Akash\ERP Shop"

# Initialize Git repository
& "C:\Program Files\Git\bin\git.exe" init

# Add all files
Write-Host "Adding files to Git..." -ForegroundColor Green
& "C:\Program Files\Git\bin\git.exe" add .

# Create initial commit
Write-Host "Creating initial commit..." -ForegroundColor Green
& "C:\Program Files\Git\bin\git.exe" commit -m "Initial commit: ERP Angular application with modern UI and database integration"

Write-Host "Git repository is ready!" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "To push to GitHub:" -ForegroundColor Yellow
Write-Host "1. Create a new repository on GitHub" -ForegroundColor White
Write-Host "2. Add remote: git remote add origin <your-repo-url>" -ForegroundColor White
Write-Host "3. Push: git push -u origin master" -ForegroundColor White
Write-Host "" -ForegroundColor White
