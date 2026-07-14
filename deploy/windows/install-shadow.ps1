param(
  [string]$InstallRoot = "C:\IterLoopAPI",
  [switch]$StartTasks
)

$ErrorActionPreference = "Stop"
$appTaskName = "IterLoop API Shadow"
$tunnelTaskName = "IterLoop Tunnel Shadow"
$appScript = Join-Path $InstallRoot "scripts\run-iterloop.ps1"
$tunnelScript = Join-Path $InstallRoot "scripts\run-tunnel.ps1"

if (Get-ScheduledTask -TaskName $appTaskName -ErrorAction SilentlyContinue) {
  throw "Task already exists: $appTaskName"
}
if (Get-ScheduledTask -TaskName $tunnelTaskName -ErrorAction SilentlyContinue) {
  throw "Task already exists: $tunnelTaskName"
}
if (Get-NetTCPConnection -LocalPort 28517 -State Listen -ErrorAction SilentlyContinue) {
  throw "Port 28517 is already listening. No task was created."
}
if (-not (Test-Path $appScript)) {
  throw "Missing app launcher: $appScript"
}
if (-not (Test-Path $tunnelScript)) {
  throw "Missing tunnel launcher: $tunnelScript"
}

$directories = @("app", "config", "data", "logs", "scripts", "backups", "cloudflared")
foreach ($directory in $directories) {
  New-Item -ItemType Directory -Path (Join-Path $InstallRoot $directory) -Force | Out-Null
}

$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Days 3650) `
  -RestartCount 999 `
  -RestartInterval (New-TimeSpan -Minutes 1)
$trigger = New-ScheduledTaskTrigger -AtStartup

$appAction = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$appScript`" -InstallRoot `"$InstallRoot`""
$tunnelAction = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$tunnelScript`" -InstallRoot `"$InstallRoot`""

Register-ScheduledTask -TaskName $appTaskName -Action $appAction -Trigger $trigger -Settings $settings -Principal $principal | Out-Null
Register-ScheduledTask -TaskName $tunnelTaskName -Action $tunnelAction -Trigger $trigger -Settings $settings -Principal $principal | Out-Null

Write-Host "Created isolated tasks without modifying or restarting any existing task."
Write-Host "  $appTaskName"
Write-Host "  $tunnelTaskName"

if ($StartTasks) {
  Start-ScheduledTask -TaskName $appTaskName
  Start-ScheduledTask -TaskName $tunnelTaskName
  Write-Host "Started only the two IterLoop shadow tasks."
} else {
  Write-Host "Tasks were not started. Validate configuration, then start them explicitly."
}

