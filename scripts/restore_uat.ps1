# UAT restore: two modes.
#
#   Drill mode (default, safe): restores into a throwaway local postgres:17
#   Docker container that gets torn down afterward. Touches nothing real -
#   use this any time to rehearse or sanity-check a backup.
#
#   Real mode (-TargetUrl / -TargetEnvFile): restores into an actual database
#   instead - DESTRUCTIVE, requires typing RESTORE to confirm. Only meant for
#   an actual recovery, never a routine check.
#
#   -Force skips that typed confirmation. Only for use when a human has
#   already explicitly told the operator (e.g. Claude Code, in chat) to
#   proceed with this specific restore - never as a default or convenience.
#
# Either way, a disposable postgres:17 Docker container is used as the
# pg_restore CLIENT (same approach backup_uat.ps1 uses for pg_dump) - nothing
# is installed permanently on this machine.
#
# Also fixes a gap found in the 2026-09-20 recovery drill: a fresh/empty
# target database doesn't have the pg_trgm feature the schema's search
# indexes depend on, so this script always enables it before restoring.

param(
    [string]$DumpFile,
    [switch]$Drill,
    [string]$TargetUrl,
    [string]$TargetEnvFile,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$RepoRoot        = Split-Path -Parent $PSScriptRoot
$BackupDir       = "C:\Backups\CabioUAT\DB_Backups"
$LogFile         = Join-Path $BackupDir "restore_log.txt"
$DockerDesktopExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
$DockerStartTimeoutSec = 90
$DockerPollIntervalSec = 5
$DrillNetwork    = "cabio-restore-drill-net"
$DrillContainer  = "cabio-restore-drill-db"

$script:DockerStartedByScript = $false
$script:DrillNetworkCreated   = $false
$script:DrillDbCreated        = $false

function Write-Log {
    param([string]$Message)
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $Message"
    Add-Content -Path $LogFile -Value $line
    Write-Host $line
}

function Get-MaskedUrl {
    param([string]$Url)
    if (-not $Url) { return $Url }
    return ($Url -replace '(://[^:@/]+:)[^@]+(@)', '$1****$2')
}

function Test-DockerUp {
    $prevPref = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    docker info *> $null
    $ErrorActionPreference = $prevPref
    return ($LASTEXITCODE -eq 0)
}

function Ensure-DockerRunning {
    if (Test-DockerUp) { return }
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
    if (-not $script:DockerStartedByScript) { return }
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
        Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
    }
    Get-Process -Name "com.docker.*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    $prevPref = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    wsl --shutdown *> $null
    $ErrorActionPreference = $prevPref
    Write-Log "Docker Desktop stopped."
}

function Remove-DrillResources {
    if ($script:DrillDbCreated) {
        docker rm -f $DrillContainer *> $null
    }
    if ($script:DrillNetworkCreated) {
        docker network rm $DrillNetwork *> $null
    }
}

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

try {
    Ensure-DockerRunning

    if (-not $DumpFile) {
        $latest = Get-ChildItem -Path $BackupDir -Filter "cabio_uat_*.dump" |
            Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if (-not $latest) { throw "No backup dump found in $BackupDir and -DumpFile not specified" }
        $DumpFile = $latest.FullName
        Write-Log "No -DumpFile given, using latest: $DumpFile"
    }
    if (-not (Test-Path $DumpFile)) { throw "Dump file not found: $DumpFile" }

    $isDrillMode = $Drill -or (-not $TargetUrl -and -not $TargetEnvFile)
    $dockerNetArgs = @()

    if ($isDrillMode) {
        Write-Log "Mode: DRILL (safe, disposable local database)"
        docker network create $DrillNetwork | Out-Null
        $script:DrillNetworkCreated = $true
        docker run -d --name $DrillContainer --network $DrillNetwork `
            -e POSTGRES_PASSWORD=drillpass -e POSTGRES_DB=postgres postgres:17 | Out-Null
        $script:DrillDbCreated = $true
        Start-Sleep -Seconds 5
        docker exec $DrillContainer pg_isready -U postgres | Out-Null
        docker exec $DrillContainer psql -U postgres -c "CREATE DATABASE cabio_drill;" | Out-Null
        $dbUrl = "postgres://postgres:drillpass@${DrillContainer}:5432/cabio_drill"
        $dockerNetArgs = @("--network", $DrillNetwork)
    }
    else {
        if ($TargetEnvFile) {
            if (-not (Test-Path $TargetEnvFile)) { throw "Env file not found: $TargetEnvFile" }
            $line = Get-Content $TargetEnvFile | Where-Object { $_ -match '^ADMIN_DATABASE_URL=' }
            if (-not $line) { throw "ADMIN_DATABASE_URL not found in $TargetEnvFile" }
            $TargetUrl = ($line -replace '^ADMIN_DATABASE_URL=', '').Trim()
        }
        $dbUrl = $TargetUrl
        $masked = Get-MaskedUrl $dbUrl

        Write-Log "Mode: REAL RESTORE into $masked"
        Write-Host ""
        Write-Host "*** WARNING: this restores into a REAL database, not a drill copy. ***" -ForegroundColor Yellow
        Write-Host "Target: $masked" -ForegroundColor Yellow
        Write-Host "This can overwrite existing data at that target." -ForegroundColor Yellow
        Write-Host ""
        if ($Force) {
            Write-Log "Confirmation skipped: -Force was passed (a human must have already explicitly approved this exact restore)."
        }
        else {
            $confirm = Read-Host "Type RESTORE (all caps) to proceed"
            if ($confirm -ne "RESTORE") {
                throw "Confirmation not given - aborting before touching the target."
            }
        }
    }

    Write-Log "Ensuring required extensions exist on target (pg_trgm)..."
    $prevPref = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    docker run --rm @dockerNetArgs postgres:17 `
        psql --dbname="$dbUrl" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" 2>&1 |
        ForEach-Object { Write-Log $_ }
    $ErrorActionPreference = $prevPref
    if ($LASTEXITCODE -ne 0) {
        throw "Could not connect to target / enable pg_trgm - see $LogFile"
    }

    $dumpFileName = Split-Path -Leaf $DumpFile
    $start = Get-Date
    $prevPref = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $restoreOutput = docker run --rm @dockerNetArgs -v "${BackupDir}:/backup" postgres:17 `
        pg_restore --no-owner --no-privileges --dbname="$dbUrl" "/backup/$dumpFileName" 2>&1
    $ErrorActionPreference = $prevPref
    $restoreExit = $LASTEXITCODE
    $elapsedSec = ((Get-Date) - $start).TotalSeconds
    $restoreOutput | ForEach-Object { Write-Log $_ }
    Write-Log "pg_restore finished in $([math]::Round($elapsedSec,1))s (exit code $restoreExit)"

    # "schema public already exists" (plus its own summary/context lines) is
    # expected noise on any target that already has a default public schema -
    # only other errors are fatal.
    $realErrors = $restoreOutput | Where-Object {
        $_ -match 'error' -and
        $_ -notmatch 'already exists' -and
        $_ -notmatch 'errors ignored on restore' -and
        $_ -notmatch 'Command was: CREATE SCHEMA public'
    }
    if ($realErrors) {
        throw "pg_restore reported unexpected errors - see $LogFile"
    }

    Write-Log "Verifying restored table/row counts..."
    $prevPref = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    docker run --rm @dockerNetArgs postgres:17 `
        psql --dbname="$dbUrl" -c "SELECT count(*) AS tables FROM information_schema.tables WHERE table_schema='public';" 2>&1 |
        ForEach-Object { Write-Log $_ }
    docker run --rm @dockerNetArgs postgres:17 `
        psql --dbname="$dbUrl" -c "SELECT 'account' AS table_name, count(*) FROM account UNION ALL SELECT 'opportunity', count(*) FROM opportunity UNION ALL SELECT 'activity', count(*) FROM activity;" 2>&1 |
        ForEach-Object { Write-Log $_ }
    $ErrorActionPreference = $prevPref

    Write-Log "RESTORE COMPLETE"
}
catch {
    Write-Log "FAILED: $($_.Exception.Message)"
    throw
}
finally {
    Remove-DrillResources
    Stop-DockerIfStartedByScript
}
