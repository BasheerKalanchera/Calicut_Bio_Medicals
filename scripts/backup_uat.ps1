# UAT backup: pg_dump (schema public only) via a throwaway postgres:17
# Docker container, matching the live UAT server's actual version (17.6) so
# pg_dump/pg_restore stay compatible. Keeps 14 days locally. Read-only against
# UAT. Starts Docker Desktop if it isn't already running, and stops it again
# afterwards if this script was the one that started it.

$ErrorActionPreference = "Stop"

$RepoRoot        = Split-Path -Parent $PSScriptRoot
$EnvFile         = Join-Path $RepoRoot "backend\.env.uat"
$BackupDir       = "C:\Backups\CabioUAT"
$LogFile         = Join-Path $BackupDir "backup_log.txt"
$RetentionDays   = 14
$GoogleDrivePath = "G:\My Drive\CabioUATBackups"  # adjust once Google Drive for Desktop is installed
$DockerDesktopExe    = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
$DockerStartTimeoutSec = 90
$DockerPollIntervalSec = 5
$script:DockerStartedByScript = $false

function Write-Log {
    param([string]$Message)
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $Message"
    Add-Content -Path $LogFile -Value $line
    Write-Host $line
}

function Test-DockerUp {
    $prevPref = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    docker info *> $null
    $ErrorActionPreference = $prevPref
    return ($LASTEXITCODE -eq 0)
}

function Ensure-DockerRunning {
    if (Test-DockerUp) {
        return
    }

    Write-Log "Docker not running, starting Docker Desktop..."
    Start-Process -FilePath $DockerDesktopExe
    $script:DockerStartedByScript = $true

    $elapsed = 0
    while ($elapsed -lt $DockerStartTimeoutSec) {
        Start-Sleep -Seconds $DockerPollIntervalSec
        $elapsed += $DockerPollIntervalSec
        if (Test-DockerUp) {
            Write-Log "Docker is up after ${elapsed}s."
            return
        }
    }

    throw "Docker did not come up within $DockerStartTimeoutSec seconds"
}

function Stop-DockerIfStartedByScript {
    if (-not $script:DockerStartedByScript) {
        return
    }

    Write-Log "Stopping Docker Desktop (started by this script)..."

    $proc = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
    if ($proc) {
        $proc | ForEach-Object { $_.CloseMainWindow() | Out-Null }

        $elapsed = 0
        while ($elapsed -lt 30 -and (Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue)) {
            Start-Sleep -Seconds 2
            $elapsed += 2
        }
    }

    if (Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue) {
        Write-Log "Docker Desktop did not close gracefully after 30s, forcing..."
        Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
    }

    # "Docker Desktop" is only the tray/dashboard frontend -- the actual engine
    # runs as separate com.docker.* backend processes, which stay alive after
    # the frontend closes and silently relaunch a new frontend (--reason=open-
    # tray) to keep the tray icon present. Stop those too, or this function
    # just causes Docker Desktop to reopen itself.
    Get-Process -Name "com.docker.*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

    $prevPref = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    wsl --shutdown *> $null
    $ErrorActionPreference = $prevPref
    Write-Log "Docker Desktop stopped."
}

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

try {
    Ensure-DockerRunning

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

    $tocLines = docker run --rm `
        -v "${BackupDir}:/backup" `
        postgres:17 `
        pg_restore --list "/backup/$dumpFile"

    if ($LASTEXITCODE -ne 0) {
        throw "pg_restore --list failed with exit code $LASTEXITCODE (dump may be corrupt)"
    }

    $tocCount = ($tocLines | Where-Object { $_ -match '^\d+;' } | Measure-Object).Count
    if ($tocCount -eq 0) {
        throw "pg_restore --list returned 0 TOC entries (dump appears empty or corrupt)"
    }
    Write-Log "Verify: TOC has $tocCount entries"

    $cutoff = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -Path $BackupDir -Filter "cabio_uat_*.dump" |
        Where-Object { $_.LastWriteTime -lt $cutoff } |
        ForEach-Object {
            Remove-Item $_.FullName -Force
            Write-Log "Pruned old dump: $($_.Name)"
        }

    # Google Drive copy disabled for now — Google Drive for Desktop not set up yet.
    # if (Test-Path $GoogleDrivePath) {
    #     Copy-Item -Path $dumpPath -Destination $GoogleDrivePath -Force
    #     Write-Log "Copied to Google Drive: $GoogleDrivePath\$dumpFile"
    # } else {
    #     Write-Log "SKIPPED Google Drive copy: path not found ($GoogleDrivePath) — set up Google Drive for Desktop and re-check the path in this script"
    # }
}
catch {
    Write-Log "FAILED: $($_.Exception.Message)"
    throw
}
finally {
    Stop-DockerIfStartedByScript
}
