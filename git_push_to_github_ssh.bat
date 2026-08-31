@echo off
chcp 65001 >nul
cd /d "G:\我的云端硬盘\1 Devin\Cathy Fencing"

echo Step 1: Init local git...
git init
git add .
git -c user.name="Cathy Parent" -c user.email="cathy@fencing.local" commit -m "update"
git branch -M main

echo.
echo Step 2: Push via SSH...
git remote remove origin 2>nul
git remote add origin git@github.com:frankataix-gif/cathy-fencing.git
git push -f -u origin main

if %errorlevel% == 0 (
  echo.
  echo Success.
) else (
  echo.
  echo Push failed. Run test_ssh.bat first to confirm SSH connection.
)

pause
