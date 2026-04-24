@echo off
echo Committing Dockerfile changes to GitHub...
cd "d:\Akash\ERP Shop"
git add GrowURBuisness.API/Dockerfile
git commit -m "Add Dockerfile for Render deployment"
git push origin main
echo Dockerfile pushed to GitHub!
pause
