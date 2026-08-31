# 以管理员身份运行 PowerShell 后执行此脚本，设置每天早上 7 点自动刷新赛事列表
# Right-click PowerShell -> Run as Administrator, then run this script

$ProjectDir = 'G:\我的云端硬盘\1 New 7-8\AgentAI\1'
$Command = "python 'cathy_data\fetch_usa_fencing_tournaments.py'; python 'cathy_data\import_to_html.py'"

$Action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -Command `"$Command`"" -WorkingDirectory $ProjectDir
$Trigger = New-ScheduledTaskTrigger -Daily -At '07:00'
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName 'CathyFencing_UpdateTournaments' `
  -Action $Action `
  -Trigger $Trigger `
  -Settings $Settings `
  -Description '每天更新 Cathy 击剑 USA Fencing 赛事列表并导入 HTML' `
  -Force

Write-Host '每日任务已创建。'
