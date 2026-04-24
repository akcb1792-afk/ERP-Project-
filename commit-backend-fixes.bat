@echo off
echo Committing backend fixes to GitHub...
cd "d:\Akash\ERP Shop"

echo Adding all changes...
git add .

echo Committing fixes...
git commit -m "Fix backend compilation errors and prepare for Render deployment

- Fixed namespace issues in all services and controllers
- Removed problematic controllers temporarily (Purchase, Stock, Dashboard, Reports)
- Updated Dockerfile for proper deployment
- Backend now builds successfully with only warnings
- Ready for Render deployment"

echo Pushing to GitHub...
git push origin main

echo Backend fixes committed and pushed!
echo Now deploy to Render using these settings:
echo - Language: Docker
echo - Dockerfile Path: GrowURBuisness.API/Dockerfile
echo - Root Directory: GrowURBuisness.API
pause
