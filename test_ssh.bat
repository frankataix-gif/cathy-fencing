@echo off
chcp 65001 >nul
echo First time it will ask (yes/no/[fingerprint]). Type yes and press Enter.
ssh -T git@github.com
pause
