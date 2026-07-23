param(
  [switch]$Apply,
  [string]$InstallRoot = 'C:\IterLoopAPI'
)

$ErrorActionPreference = 'Stop'

if (-not $Apply) {
  throw 'This script changes live billing ratios. Review it, back up PostgreSQL, then rerun with -Apply.'
}

$environmentPath = Join-Path $InstallRoot 'config\iterloop.env'
$psql = Join-Path $InstallRoot 'PostgreSQL15\bin\psql.exe'
if (-not (Test-Path $environmentPath)) {
  throw "Missing IterLoop environment file: $environmentPath"
}
if (-not (Test-Path $psql)) {
  throw "Missing PostgreSQL client: $psql"
}

$dsnLine = Get-Content $environmentPath |
  Where-Object { $_ -like 'SQL_DSN=*' } |
  Select-Object -First 1
if (-not $dsnLine) {
  throw 'SQL_DSN is not configured'
}
$dsn = ($dsnLine -split '=', 2)[1].Trim('"')

$backupDirectory = Join-Path $InstallRoot 'backups\pricing-options'
New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
$backupPath = Join-Path $backupDirectory ("pricing-options-{0}.json" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
$backupSql = @'
SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)::text
FROM options
WHERE key IN (
  'ModelRatio', 'CompletionRatio', 'CacheRatio', 'CreateCacheRatio', 'GroupRatio',
  'iterloop_pricing_setting.codex_ratio',
  'iterloop_pricing_setting.claude_ratio',
  'iterloop_pricing_setting.cny_exchange_rate',
  'iterloop_pricing_setting.aud_exchange_rate',
  'iterloop_pricing_setting.reference_url',
  'iterloop_pricing_setting.reference_date'
);
'@
$backupPayload = & $psql -X -A -t -v ON_ERROR_STOP=1 -d $dsn -c $backupSql
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace(($backupPayload -join ''))) {
  throw 'Unable to export the current pricing options; no changes were applied'
}
$backupPayload | Set-Content -Path $backupPath -Encoding UTF8

$sql = @'
BEGIN;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM options WHERE key IN ('ModelRatio', 'CompletionRatio', 'CacheRatio', 'CreateCacheRatio', 'GroupRatio')) <> 5 THEN
    RAISE EXCEPTION 'One or more pricing ratio options are missing';
  END IF;
END $$;

UPDATE options
SET value = (
  value::jsonb || jsonb_build_object(
    'codex-standard', 1.0,
    'claude-standard', 1.0,
    'combined-standard', 1.0
  )
)::text
WHERE key = 'GroupRatio';

UPDATE options
SET value = (
  value::jsonb || jsonb_build_object(
    'codex-auto-review', 0.3935,
    'gpt-5.4', 0.3935,
    'gpt-5.4-mini', 0.3935,
    'gpt-5.5', 0.7,
    'gpt-5.6-luna', 0.175,
    'gpt-5.6-sol', 0.7,
    'gpt-5.6-terra', 0.3935,
    'claude-fable-5', 6.0,
    'claude-haiku-4-5-20251001', 0.7,
    'claude-opus-4-5-20251101', 3.5,
    'claude-opus-4-6', 3.5,
    'claude-opus-4-7', 3.5,
    'claude-opus-4-8', 3.5,
    'claude-sonnet-4-5-20250929', 2.1,
    'claude-sonnet-4-6', 2.1,
    'claude-sonnet-5', 2.1
  )
)::text
WHERE key = 'ModelRatio';

UPDATE options
SET value = (
  value::jsonb || jsonb_build_object(
    'codex-auto-review', 6.0,
    'gpt-5.5', 8.0,
    'gpt-5.6-luna', 8.0,
    'gpt-5.6-sol', 8.0,
    'gpt-5.6-terra', 6.3 / 0.787,
    'claude-fable-5', 5.0,
    'claude-sonnet-5', 5.0
  )
)::text
WHERE key = 'CompletionRatio';

UPDATE options
SET value = (
  value::jsonb || jsonb_build_object(
    'codex-auto-review', 0.263 / 0.787,
    'gpt-5.4', 0.263 / 0.787,
    'gpt-5.4-mini', 0.263 / 0.787,
    'gpt-5.5', 0.438 / 1.4,
    'gpt-5.6-luna', 0.5,
    'gpt-5.6-sol', 0.438 / 1.4,
    'gpt-5.6-terra', 0.263 / 0.787,
    'claude-fable-5', 0.1,
    'claude-haiku-4-5-20251001', 0.125,
    'claude-opus-4-5-20251101', 0.125,
    'claude-opus-4-6', 0.125,
    'claude-opus-4-7', 0.125,
    'claude-opus-4-8', 0.125,
    'claude-sonnet-4-5-20250929', 0.125,
    'claude-sonnet-4-6', 0.125,
    'claude-sonnet-5', 0.125
  )
)::text
WHERE key = 'CacheRatio';

UPDATE options
SET value = (
  (
    value::jsonb
      - 'gpt-5.6-luna'
      - 'gpt-5.6-sol'
      - 'gpt-5.6-terra'
  ) || jsonb_build_object(
    'claude-fable-5', 10.0 / 12.0,
    'claude-haiku-4-5-20251001', 2.19 / 1.4,
    'claude-opus-4-5-20251101', 1.25,
    'claude-opus-4-6', 1.25,
    'claude-opus-4-7', 1.25,
    'claude-opus-4-8', 1.25,
    'claude-sonnet-4-5-20250929', 1.25,
    'claude-sonnet-4-6', 1.25,
    'claude-sonnet-5', 1.25
  )
)::text
WHERE key = 'CreateCacheRatio';

INSERT INTO options (key, value) VALUES
  ('iterloop_pricing_setting.codex_ratio', '1'),
  ('iterloop_pricing_setting.claude_ratio', '1'),
  ('iterloop_pricing_setting.cny_exchange_rate', '7.3'),
  ('iterloop_pricing_setting.aud_exchange_rate', '1.52'),
  ('iterloop_pricing_setting.reference_url', 'https://faroapi.com/pricing'),
  ('iterloop_pricing_setting.reference_date', '2026-07-19')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

COMMIT;
'@

& $psql -X -v ON_ERROR_STOP=1 -d $dsn -c $sql
if ($LASTEXITCODE -ne 0) {
  throw "Faro pricing configuration failed with exit code $LASTEXITCODE"
}

$verifySql = @'
SELECT key, value
FROM options
WHERE key IN (
  'iterloop_pricing_setting.codex_ratio',
  'iterloop_pricing_setting.claude_ratio',
  'iterloop_pricing_setting.cny_exchange_rate',
  'iterloop_pricing_setting.aud_exchange_rate',
  'iterloop_pricing_setting.reference_url',
  'iterloop_pricing_setting.reference_date'
)
ORDER BY key;

SELECT o.key, COUNT(entry.key) AS configured_entries
FROM options o
CROSS JOIN LATERAL jsonb_object_keys(o.value::jsonb) AS entry(key)
WHERE o.key IN ('ModelRatio', 'CompletionRatio', 'CacheRatio', 'CreateCacheRatio', 'GroupRatio')
GROUP BY o.key
ORDER BY o.key;
'@

& $psql -X -v ON_ERROR_STOP=1 -d $dsn -c $verifySql
if ($LASTEXITCODE -ne 0) {
  throw "Faro pricing verification failed with exit code $LASTEXITCODE"
}

Write-Host "Previous pricing options: $backupPath"
