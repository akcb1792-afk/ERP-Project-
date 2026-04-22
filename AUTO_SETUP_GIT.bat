@echo off
title ERP Project - GitHub Setup
color 0A

echo ========================================
echo    ERP ANGULAR PROJECT SETUP
echo ========================================
echo.

echo Checking system requirements...
echo.

REM Check if Git is already installed
where git >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Git is already installed
    goto :setup_repo
)

echo [INFO] Git is not installed. Downloading Git...
echo.

REM Download Git for Windows
echo Downloading Git installer...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/latest/download' -OutFile 'git-installer.exe'"
if exist git-installer.exe (
    echo [SUCCESS] Git installer downloaded
    goto :install_git
) else (
    echo [ERROR] Failed to download Git installer
    echo Please download manually from: https://git-scm.com/download/win
    pause
    exit /b 1
)

:install_git
echo Installing Git...
start /wait git-installer.exe /VERYSILENT /NORESTART /NOCANCEL /COMPONENTS=EXT,ASSOC,FILEASSOC

echo.
echo Waiting for Git installation to complete...
timeout /t 30 /nobreak

:setup_repo
echo.
echo [SUCCESS] Git setup complete!
echo.
echo Now setting up repository...

cd /d "Akash\ERP Shop"

REM Initialize Git repository
git init

REM Add all files
git add .

REM Create initial commit
git commit -m "Initial commit: ERP Angular application with modern UI and database integration"

echo.
echo ========================================
echo    REPOSITORY IS READY!
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Create GitHub repository at https://github.com
echo 2. Add remote: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
echo 3. Push: git push -u origin master
echo.
echo ========================================
pause
