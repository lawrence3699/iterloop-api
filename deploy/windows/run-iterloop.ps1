param(
  [string]$InstallRoot = "C:\IterLoopAPI"
)

$ErrorActionPreference = "Stop"
$envFile = Join-Path $InstallRoot "config\iterloop.env"
$exe = Join-Path $InstallRoot "app\iterloop-api.exe"
$logDir = Join-Path $InstallRoot "logs"

if (-not (Test-Path $envFile)) {
  throw "Missing environment file: $envFile"
}
if (-not (Test-Path $exe)) {
  throw "Missing application binary: $exe"
}

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) {
    return
  }
  $separator = $line.IndexOf("=")
  if ($separator -lt 1) {
    throw "Invalid environment line: $line"
  }
  $name = $line.Substring(0, $separator).Trim()
  $value = $line.Substring($separator + 1)
  [Environment]::SetEnvironmentVariable($name, $value, "Process")
}

New-Item -ItemType Directory -Path $logDir -Force | Out-Null
Set-Location (Join-Path $InstallRoot "data")

$stamp = Get-Date -Format "yyyyMMdd"
$stdout = Join-Path $logDir "iterloop-$stamp.log"
$stderr = Join-Path $logDir "iterloop-$stamp.error.log"

& $exe --log-dir $logDir 1>> $stdout 2>> $stderr
exit $LASTEXITCODE

