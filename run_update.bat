@echo off
chcp 65001 >nul
cd /d "G:\我的云端硬盘\1 Devin\Cathy Fencing"

echo [1/4] Fetching USA Fencing tournaments...
python cathy_data\fetch_usa_fencing_tournaments.py

echo [2/4] Rename CSV...
if exist cathy_data\tournaments.csv (
  move cathy_data\tournaments.csv cathy_data\usa_fencing_all_tournaments.csv
)

echo [3/4] Updating HTML...
python cathy_data\import_to_html.py

echo [4/4] Done.
echo.
echo 现在请运行 git_push_to_github.bat 推送到 GitHub。
pause
