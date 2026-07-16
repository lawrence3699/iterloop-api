param(
  [Parameter(Mandatory = $true)]
  [string]$CandidateExe,

  [Parameter(Mandatory = $true)]
  [string]$ExpectedCandidateSha,

  [Parameter(Mandatory = $true)]
  [string]$ExpectedVersion,

  [string]$ExpectedCurrentSha = "",
  [string]$InstallRoot = "C:\IterLoopAPI",
  [int]$HealthTimeoutSeconds = 90
)

$ErrorActionPreference = "Stop"
$taskName = "IterLoop API Shadow"
$tunnelTaskName = "IterLoop Tunnel Shadow"
$appExe = Join-Path $InstallRoot "app\iterloop-api.exe"
$nextExe = Join-Path $InstallRoot "app\iterloop-api.next.exe"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $InstallRoot "backups\deploy-$stamp-pre-$ExpectedVersion"
$backupExe = Join-Path $backupDir "iterloop-api.exe"
$ExpectedCandidateSha = $ExpectedCandidateSha.ToLowerInvariant()
$ExpectedCurrentSha = $ExpectedCurrentSha.ToLowerInvariant()

function Get-Sha256([string]$Path) {
  return (Get-FileHash $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-AppProcesses {
  return @(
    Get-CimInstance Win32_Process |
      Where-Object { $_.ExecutablePath -ieq $appExe }
  )
}

function Stop-AppProcesses([int]$TimeoutSeconds = 45) {
  Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  Get-AppProcesses | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
  }

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    if ((Get-AppProcesses).Count -eq 0) {
      return
    }
    Start-Sleep -Milliseconds 500
  } while ((Get-Date) -lt $deadline)

  throw "Timed out waiting for the IterLoop application process to stop"
}

function Wait-Health([int]$TimeoutSeconds) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:28517/healthz" -TimeoutSec 5
      if ([int]$response.StatusCode -eq 200) {
        return $response.Content
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  } while ((Get-Date) -lt $deadline)

  return $null
}

if (-not (Test-Path $CandidateExe)) {
  throw "Missing candidate EXE: $CandidateExe"
}
if (-not (Test-Path $appExe)) {
  throw "Missing installed EXE: $appExe"
}

$currentSha = Get-Sha256 $appExe
if ($ExpectedCurrentSha -and $currentSha -ne $ExpectedCurrentSha) {
  throw "Current EXE changed since preflight: $currentSha"
}

$candidateSha = Get-Sha256 $CandidateExe
if ($candidateSha -ne $ExpectedCandidateSha) {
  throw "Candidate EXE SHA256 mismatch: $candidateSha"
}

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Copy-Item $appExe $backupExe -Force
Copy-Item $CandidateExe $nextExe -Force
if ((Get-Sha256 $nextExe) -ne $ExpectedCandidateSha) {
  throw "Staged app copy SHA256 mismatch"
}

$tunnelStateBefore = (Get-ScheduledTask -TaskName $tunnelTaskName).State.ToString()

try {
  Stop-AppProcesses
  Remove-Item $appExe -Force
  Move-Item $nextExe $appExe -Force

  if ((Get-Sha256 $appExe) -ne $ExpectedCandidateSha) {
    throw "Installed EXE SHA256 mismatch"
  }

  Start-ScheduledTask -TaskName $taskName
  $healthBody = Wait-Health $HealthTimeoutSeconds
  if (-not $healthBody) {
    throw "New version did not become healthy"
  }

  $rootResponse = Invoke-WebRequest -UseBasicParsing -Method Head -Uri "http://127.0.0.1:28517/" -TimeoutSec 10
  $reportedVersion = $rootResponse.Headers["X-New-Api-Version"]
  if ($reportedVersion -ne $ExpectedVersion) {
    throw "Unexpected reported version: $reportedVersion"
  }
} catch {
  $deploymentError = $_.Exception.Message
  Stop-AppProcesses
  Copy-Item $backupExe $appExe -Force
  Start-ScheduledTask -TaskName $taskName
  $rollbackHealth = Wait-Health $HealthTimeoutSeconds
  if (-not $rollbackHealth) {
    throw "Deployment failed and rollback is unhealthy: $deploymentError"
  }
  throw "Deployment failed and was rolled back: $deploymentError"
}

$tunnelStateAfter = (Get-ScheduledTask -TaskName $tunnelTaskName).State.ToString()
$appStateAfter = (Get-ScheduledTask -TaskName $taskName).State.ToString()

[pscustomobject]@{
  Version = $ExpectedVersion
  InstalledSha256 = Get-Sha256 $appExe
  PreviousSha256 = $currentSha
  BackupDirectory = $backupDir
  AppState = $appStateAfter
  TunnelStateBefore = $tunnelStateBefore
  TunnelStateAfter = $tunnelStateAfter
  Health = $healthBody
  ReportedVersion = $reportedVersion
} | ConvertTo-Json -Compress
