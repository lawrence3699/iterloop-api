param(
  [string]$InstallRoot = "C:\IterLoopAPI",
  [string]$PostgresBin = "C:\Program Files\PostgreSQL\15\bin"
)

$ErrorActionPreference = "Stop"
$psql = Join-Path $PostgresBin "psql.exe"
$sql = Join-Path $InstallRoot "scripts\retention.sql"
$envFile = Join-Path $InstallRoot "config\iterloop.env"

if (-not (Test-Path $psql)) {
  throw "Missing psql: $psql"
}
if (-not (Test-Path $sql)) {
  throw "Missing retention SQL: $sql"
}
if (-not $env:ITERLOOP_DATABASE_URL) {
  if (-not (Test-Path $envFile)) {
    throw "ITERLOOP_DATABASE_URL is not set and environment file is missing: $envFile"
  }
  $dsnLine = Get-Content $envFile |
    Where-Object { $_ -match '^SQL_DSN=' } |
    Select-Object -First 1
  if (-not $dsnLine) {
    throw "SQL_DSN is missing from environment file: $envFile"
  }
  $env:ITERLOOP_DATABASE_URL = $dsnLine.Substring("SQL_DSN=".Length)
}

& $psql --set ON_ERROR_STOP=1 --dbname $env:ITERLOOP_DATABASE_URL --file $sql
if ($LASTEXITCODE -ne 0) {
  throw "Retention job failed with exit code $LASTEXITCODE"
}
