@echo off
echo Adding GitHub remote and pushing...
cd /d "Akash\ERP Shop"

echo Adding remote origin...
"C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/akcb1792-afk/ERP-Project-.git

echo Pushing to GitHub...
"C:\Program Files\Git\bin\git.exe" push -u origin master

echo.
echo GitHub setup complete!
pause
