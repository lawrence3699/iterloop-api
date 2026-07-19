param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[A-Za-z0-9_-]{8,64}$')]
  [string]$InviteCode,

  [string]$InstallRoot = 'C:\IterLoopAPI',
  [int]$KeyQuota = 5000000,
  [int]$ExpireDays = 7
)

$ErrorActionPreference = 'Stop'

if ($KeyQuota -le 0) {
  throw 'KeyQuota must be positive'
}
if ($ExpireDays -lt 1 -or $ExpireDays -gt 3650) {
  throw 'ExpireDays must be between 1 and 3650'
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

$now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$sql = @"
BEGIN;

WITH starter AS (
  INSERT INTO issuance_profiles (
    name, description, mode, balance_quota, key_quota,
    unlimited_quota, key_count, expire_days,
    codex_models, claude_models, grok_models,
    codex_group, claude_group, grok_group, combined_group,
    allow_ips, enabled, created_time, updated_time, created_by
  ) VALUES (
    'Desktop Starter 7 Days', 'IterLoop desktop beta starter', 'combined',
    0, $KeyQuota, false, 1, $ExpireDays,
    'gpt-5.4', 'claude-sonnet-4-6', '',
    'codex-standard', 'claude-standard', 'grok-standard', 'combined-standard',
    '', true, $now, $now, 1
  )
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    mode = EXCLUDED.mode,
    balance_quota = EXCLUDED.balance_quota,
    key_quota = EXCLUDED.key_quota,
    unlimited_quota = EXCLUDED.unlimited_quota,
    key_count = EXCLUDED.key_count,
    expire_days = EXCLUDED.expire_days,
    codex_models = EXCLUDED.codex_models,
    claude_models = EXCLUDED.claude_models,
    grok_models = EXCLUDED.grok_models,
    codex_group = EXCLUDED.codex_group,
    claude_group = EXCLUDED.claude_group,
    grok_group = EXCLUDED.grok_group,
    combined_group = EXCLUDED.combined_group,
    allow_ips = EXCLUDED.allow_ips,
    enabled = EXCLUDED.enabled,
    updated_time = EXCLUDED.updated_time
  RETURNING id
)
INSERT INTO options (key, value)
SELECT 'desktop_setting.starter_profile_id', id::text FROM starter
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO options (key, value) VALUES
  ('desktop_setting.enabled', 'true'),
  ('desktop_setting.minimum_client_version', '0.1.0'),
  ('desktop_setting.recommended_codex_model', 'gpt-5.4'),
  ('desktop_setting.recommended_claude_model', 'claude-sonnet-4-6'),
  ('desktop_setting.legal_version', '2026-07-19'),
  ('desktop_setting.beta_invite_required', 'true'),
  ('desktop_setting.beta_invite_secret', '$InviteCode')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

COMMIT;
"@

& $psql -X -v ON_ERROR_STOP=1 -d $dsn -c $sql
if ($LASTEXITCODE -ne 0) {
  throw "Desktop beta configuration failed with exit code $LASTEXITCODE"
}

$summarySql = @"
SELECT p.id, p.name, p.mode, p.key_quota, p.expire_days,
       p.codex_models, p.claude_models, p.combined_group, p.enabled
FROM issuance_profiles p
JOIN options o ON o.key = 'desktop_setting.starter_profile_id'
WHERE p.id = CAST(o.value AS integer);
"@
& $psql -X -A -t -F '|' -d $dsn -c $summarySql
if ($LASTEXITCODE -ne 0) {
  throw "Desktop beta verification failed with exit code $LASTEXITCODE"
}
