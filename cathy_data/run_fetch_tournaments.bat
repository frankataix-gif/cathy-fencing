@echo off
chcp 65001 >nul

cd /d "G:\我的云端硬盘\1 New 7-8\AgentAI\1"

python "cathy_data\fetch_usa_fencing_tournaments.py"
python "cathy_data\import_to_html.py"

pause
