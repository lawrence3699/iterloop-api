param(
  [string]$InstallRoot = "C:\IterLoopAPI",
  [string]$PostgresBin = "C:\Program Files\PostgreSQL\15\bin"
)

$ErrorActionPreference = "Stop"
$psql = Join-Path $PostgresBin "psql.exe"
$sql = Join-Path $InstallRoot "scripts\retention.sql"

if (-not (Test-Path $psql)) {
  throw "Missing psql: $psql"
}
if (-not (Test-Path $sql)) {
  throw "Missing retention SQL: $sql"
}

& $psql --set ON_ERROR_STOP=1 --dbname $env:ITERLOOP_DATABASE_URL --file $sql
if ($LASTEXITCODE -ne 0) {
  throw "Retention job failed with exit code $LASTEXITCODE"
}

