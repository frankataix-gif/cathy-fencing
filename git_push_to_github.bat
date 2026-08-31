@echo off
chcp 65001 >nul
cd /d "G:\我的云端硬盘\1 Devin\Cathy Fencing"

echo Step 1: Init local git...
git init > push.log 2>&1
git add . >> push.log 2>&1
git -c user.name="Cathy Parent" -c user.email="cathy@fencing.local" commit -m "Initial upload" >> push.log 2>&1
git branch -M main >> push.log 2>&1

echo.
echo Step 2: Enter your GitHub Personal Access Token (repo + workflow scope required):
set /p GHTOKEN="Token: "

echo.
echo Step 3: Push to GitHub... >> push.log 2>&1
echo. >> push.log 2>&1
echo ===== PUSH OUTPUT ===== >> push.log 2>&1
git remote remove origin >> push.log 2>&1
git remote add origin https://%GHTOKEN%@github.com/frankataix-gif/cathy-fencing.git
git push -f -v -u origin main >> push.log 2>&1

echo. >> push.log 2>&1
echo EXIT CODE: %errorlevel% >> push.log 2>&1

git remote set-url origin https://github.com/frankataix-gif/cathy-fencing.git

echo.
echo Done. The full log has been saved to: %cd%\push.log
notepad push.log
pause
