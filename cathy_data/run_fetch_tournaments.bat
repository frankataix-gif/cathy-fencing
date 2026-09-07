@echo off
chcp 65001 >nul

cd /d "G:\我的云端硬盘\1 Devin\02_个人家庭\01_Cathy Fencing"

python "cathy_data\fetch_usa_fencing_tournaments.py"
python "cathy_data\import_to_html.py"

pause
