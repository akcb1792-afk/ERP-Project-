@echo off
echo Opening Git Bash and pushing to GitHub...
echo.

REM Create a temporary script for Git Bash
echo cd "d:/Akash/ERP Shop" > temp_git_commands.sh
echo git init >> temp_git_commands.sh
echo git add . >> temp_git_commands.sh
echo git commit -m "Initial commit: Complete ERP system with Angular frontend and ASP.NET Core backend" >> temp_git_commands.sh
echo git branch -M main >> temp_git_commands.sh
echo git remote add origin https://github.com/akcb1792-afk/ERP-Project-.git >> temp_git_commands.sh
echo git push -u origin main >> temp_git_commands.sh
echo echo "Push completed!" >> temp_git_commands.sh
echo read -p "Press Enter to close..." >> temp_git_commands.sh

REM Run Git Bash with the script
"C:\Program Files\Git\git-bash.exe" --cd="d:/Akash/ERP Shop" temp_git_commands.sh

REM Clean up
del temp_git_commands.sh

echo.
echo Git operations completed!
