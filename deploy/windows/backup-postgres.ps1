param(
  [string]$InstallRoot = "C:\IterLoopAPI",
  [string]$PostgresBin = "C:\Program Files\PostgreSQL\15\bin",
  [string]$RcloneRemote = "r2:iterloop-backups"
)

$ErrorActionPreference = "Stop"
$pgDump = Join-Path $PostgresBin "pg_dump.exe"
$age = Join-Path $InstallRoot "tools\age.exe"
$rclone = Join-Path $InstallRoot "tools\rclone.exe"
$backupRoot = Join-Path $InstallRoot "backups"
$dailyDir = Join-Path $backupRoot "daily"
$weeklyDir = Join-Path $backupRoot "weekly"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$plain = Join-Path $backupRoot "iterloop-$stamp.dump"
$encrypted = "$plain.age"

foreach ($path in @($dailyDir, $weeklyDir)) {
  New-Item -ItemType Directory -Path $path -Force | Out-Null
}
foreach ($tool in @($pgDump, $age, $rclone)) {
  if (-not (Test-Path $tool)) {
    throw "Missing required tool: $tool"
  }
}
if (-not $env:ITERLOOP_DATABASE_URL) {
  throw "ITERLOOP_DATABASE_URL is not set"
}
if (-not $env:ITERLOOP_BACKUP_AGE_RECIPIENT) {
  throw "ITERLOOP_BACKUP_AGE_RECIPIENT is not set"
}

try {
  & $pgDump --format=custom --no-owner --no-privileges --file $plain $env:ITERLOOP_DATABASE_URL
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed with exit code $LASTEXITCODE"
  }
  & $age -r $env:ITERLOOP_BACKUP_AGE_RECIPIENT -o $encrypted $plain
  if ($LASTEXITCODE -ne 0) {
    throw "age encryption failed with exit code $LASTEXITCODE"
  }
  Remove-Item $plain -Force

  $dailyTarget = Join-Path $dailyDir (Split-Path $encrypted -Leaf)
  Move-Item $encrypted $dailyTarget

  if ((Get-Date).DayOfWeek -eq "Sunday") {
    Copy-Item $dailyTarget (Join-Path $weeklyDir (Split-Path $dailyTarget -Leaf))
  }

  Get-ChildItem $dailyDir -Filter "*.age" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip 7 |
    Remove-Item -Force
  Get-ChildItem $weeklyDir -Filter "*.age" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip 4 |
    Remove-Item -Force

  & $rclone copy $dailyTarget "$RcloneRemote/daily" --immutable
  if ((Get-Date).DayOfWeek -eq "Sunday") {
    & $rclone copy (Join-Path $weeklyDir (Split-Path $dailyTarget -Leaf)) "$RcloneRemote/weekly" --immutable
  }
} finally {
  if (Test-Path $plain) {
    Remove-Item $plain -Force
  }
  if (Test-Path $encrypted) {
    Remove-Item $encrypted -Force
  }
}

