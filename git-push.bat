@echo off
echo Pushing to GitHub...
cd /d "Akash\ERP Shop"

REM Try to add files
"C:\Program Files\Git\bin\git.exe" add .

REM Try to commit
"C:\Program Files\Git\bin\git.exe" commit -m "Initial commit: ERP Angular application with modern UI and database integration"

echo.
echo If you see errors above, Git may not be installed or not in PATH
echo Otherwise, your repository is ready for GitHub remote setup
echo.
echo Next steps:
echo 1. Create repository on GitHub
echo 2. Add remote: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
echo 3. Push: git push -u origin master
pause
