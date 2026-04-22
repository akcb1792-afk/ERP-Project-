@echo off
echo Initializing Git repository...
cd /d "Akash\ERP Shop"
git init

echo Adding files to Git...
git add .

echo Creating initial commit...
git commit -m "Initial commit: ERP Angular application with modern UI and database integration"

echo Git repository is ready!
echo.
echo To push to GitHub:
echo 1. Create a new repository on GitHub
echo 2. Add remote: git remote add origin <your-repo-url>
echo 3. Push: git push -u origin master
pause
