@echo off
echo Initializing Git repository...
cd /d "Akash\ERP Shop"

"C:\Program Files\Git\bin\git.exe" init
echo Adding files...
"C:\Program Files\Git\bin\git.exe" add .
echo Creating commit...
"C:\Program Files\Git\bin\git.exe" commit -m "Initial commit: ERP Angular application with modern UI and database integration"

echo.
echo Git repository is ready!
echo Now create GitHub repository and add remote:
echo git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
echo git push -u origin master
echo.
pause
