@echo off
chcp 65001 >nul
set SSH_DIR=%USERPROFILE%\.ssh
if not exist "%SSH_DIR%" mkdir "%SSH_DIR%"
set KEY=%SSH_DIR%\id_ed25519_cathy
set GIT_KEY=%KEY:\=/%

if exist "%KEY%" (
  echo SSH key already exists: %KEY%
  git config --global core.sshCommand "ssh -i %GIT_KEY% -o IdentitiesOnly=yes"
  echo.
  echo === COPY THIS PUBLIC KEY TO GITHUB ===
  type %KEY%.pub
  echo.
  echo GitHub: Settings - SSH and GPG keys - New SSH key
  echo After adding, run test_ssh.bat
  pause
  exit /b 0
)

echo Generating SSH key (no passphrase)...
ssh-keygen -t ed25519 -C "cathy-fencing" -f "%KEY%" -N ""
git config --global core.sshCommand "ssh -i %GIT_KEY% -o IdentitiesOnly=yes"

echo.
echo === COPY THE PUBLIC KEY BELOW TO GITHUB ===
echo.
type %KEY%.pub
echo.
echo GitHub: Settings - SSH and GPG keys - New SSH key
echo After adding, run test_ssh.bat
pause
