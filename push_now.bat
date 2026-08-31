@echo off
chcp 65001 >nul
cd /d "G:\我的云端硬盘\1 Devin\Cathy Fencing"

echo 当前本地 commit 数量:
git log --oneline origin..HEAD
echo.
echo Step 1: Enter your GitHub Personal Access Token (repo + workflow scope required):
set /p GHTOKEN="Token: "

git remote remove origin 2>nul
git remote add origin https://%GHTOKEN%@github.com/frankataix-gif/cathy-fencing.git
git push -v -u origin main
git remote set-url origin https://github.com/frankataix-gif/cathy-fencing.git

echo.
pause
