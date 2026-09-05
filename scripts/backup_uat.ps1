# Daily UAT backup: pg_dump (schema public only) via a throwaway postgres:17
# Docker container, matching the live UAT server's actual version (17.6) so
# pg_dump/pg_restore stay compatible. Keeps 14 days locally, mirrors to
# Google Drive when that path exists. Read-only against UAT.

$ErrorActionPreference = "Stop"

$RepoRoot      = Split-Path -Parent $PSScriptRoot
$EnvFile       = Join-Path $RepoRoot "backend\.env.uat"
$BackupDir     = "C:\Backups\CabioUAT"
$LogFile       = Join-Path $BackupDir "backup_log.txt"
$RetentionDays = 14
$GoogleDrivePath = "G:\My Drive\CabioUATBackups"  # adjust once Google Drive for Desktop is installed

function Write-Log {
    param([string]$Message)
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $Message"
    Add-Content -Path $LogFile -Value $line
    Write-Host $line
}

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

try {
    if (-not (Test-Path $EnvFile)) {
        throw "Env file not found: $EnvFile"
    }

    $adminUrlLine = Get-Content $EnvFile | Where-Object { $_ -match '^ADMIN_DATABASE_URL=' }
    if (-not $adminUrlLine) {
        throw "ADMIN_DATABASE_URL not found in $EnvFile"
    }
    $adminUrl = ($adminUrlLine -replace '^ADMIN_DATABASE_URL=', '').Trim()

    $dateStamp = Get-Date -Format 'yyyy-MM-dd'
    $dumpFile  = "cabio_uat_$dateStamp.dump"
    $dumpPath  = Join-Path $BackupDir $dumpFile

    docker run --rm `
        -v "${BackupDir}:/backup" `
        postgres:17 `
        pg_dump --schema=public -Fc --dbname="$adminUrl" --file="/backup/$dumpFile"

    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
    if (-not (Test-Path $dumpPath)) {
        throw "Expected dump file was not created: $dumpPath"
    }

    $size = (Get-Item $dumpPath).Length
    Write-Log "OK: dump created ($dumpFile, $size bytes)"

    $cutoff = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -Path $BackupDir -Filter "cabio_uat_*.dump" |
        Where-Object { $_.LastWriteTime -lt $cutoff } |
        ForEach-Object {
            Remove-Item $_.FullName -Force
            Write-Log "Pruned old dump: $($_.Name)"
        }

    if (Test-Path $GoogleDrivePath) {
        Copy-Item -Path $dumpPath -Destination $GoogleDrivePath -Force
        Write-Log "Copied to Google Drive: $GoogleDrivePath\$dumpFile"
    } else {
        Write-Log "SKIPPED Google Drive copy: path not found ($GoogleDrivePath) — set up Google Drive for Desktop and re-check the path in this script"
    }
}
catch {
    Write-Log "FAILED: $($_.Exception.Message)"
    throw
}
