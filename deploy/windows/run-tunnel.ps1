param(
  [string]$InstallRoot = "C:\IterLoopAPI"
)

$ErrorActionPreference = "Stop"
$cloudflared = Join-Path $InstallRoot "cloudflared\cloudflared.exe"
$config = Join-Path $InstallRoot "cloudflared\config.yml"
$logDir = Join-Path $InstallRoot "logs"

if (-not (Test-Path $cloudflared)) {
  throw "Missing cloudflared binary: $cloudflared"
}
if (-not (Test-Path $config)) {
  throw "Missing tunnel config: $config"
}

New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$logFile = Join-Path $logDir "cloudflared-iterloop.log"

& $cloudflared tunnel --config $config --logfile $logFile run
exit $LASTEXITCODE

