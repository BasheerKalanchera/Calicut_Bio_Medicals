# Regenerates docs/Physical-Schema.sql from a fully-migrated Dev database.
#
# Why this script exists, not a raw pg_dump command: `pg_dump --schema-only`
# always writes a brand-new file starting from its own "-- PostgreSQL
# database dump --" banner on line 1 -- there is no pg_dump flag that
# preserves a preamble, so any `pg_dump ... > docs/Physical-Schema.sql`
# command structurally destroys the file's hand-maintained header comment
# block on every single run, not just occasionally. This script rebuilds
# that header itself (regen date + which migration this catches up to) and
# prepends it to the dump, so there's no manual "remember to restore the
# header afterward" step left to forget.
#
# Usage:
#   .\scripts\regen_physical_schema.ps1
#   .\scripts\regen_physical_schema.ps1 -Note "two new columns: ..."
#
# -Note overrides the auto-detected one-line summary (pulled from the
# latest migration file's own docstring title) if you want something more
# descriptive than that title alone.

param(
    [string]$Note = ""
)

$ErrorActionPreference = "Stop"

$RepoRoot        = Split-Path -Parent $PSScriptRoot
$EnvFile         = Join-Path $RepoRoot "backend\.env"
$VersionsDir     = Join-Path $RepoRoot "backend\alembic\versions"
$SchemaFile      = Join-Path $RepoRoot "docs\Physical-Schema.sql"
$PostgresImage   = "postgres:17"  # matches Dev's actual server version -- pg_dump refuses to run against a newer server

function Get-LatestMigration {
    $latest = Get-ChildItem -Path $VersionsDir -Filter "*.py" |
        Where-Object { $_.Name -match '^\d+_' } |
        Sort-Object Name -Descending |
        Select-Object -First 1
    if (-not $latest) {
        throw "No migration files found in $VersionsDir"
    }
    $revision = ($latest.Name -split '_')[0]
    $content = Get-Content $latest.FullName -Raw
    $titleMatch = [regex]::Match($content, '"""(.+)')
    $title = if ($titleMatch.Success) { $titleMatch.Groups[1].Value.Trim() } else { $latest.BaseName }
    return @{ Revision = $revision; Title = $title }
}

if (-not (Test-Path $EnvFile)) {
    throw "Env file not found: $EnvFile"
}
$adminUrlLine = Get-Content $EnvFile | Where-Object { $_ -match '^ADMIN_DATABASE_URL=' }
if (-not $adminUrlLine) {
    throw "ADMIN_DATABASE_URL not found in $EnvFile"
}
$adminUrl = ($adminUrlLine -replace '^ADMIN_DATABASE_URL=', '').Trim()

$migration = Get-LatestMigration
$summary = if ($Note) { $Note } else { $migration.Title }
$dateStamp = Get-Date -Format 'yyyy-MM-dd'

$tempDir = Join-Path $env:TEMP "cabio_schema_regen"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
$dumpFileName = "schema_dump.sql"
$dumpPath = Join-Path $tempDir $dumpFileName

try {
    docker run --rm `
        -v "${tempDir}:/out" `
        $PostgresImage `
        pg_dump "$adminUrl" --schema-only --no-owner --no-privileges --schema=public `
        --file="/out/$dumpFileName"

    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
    if (-not (Test-Path $dumpPath)) {
        throw "Expected dump file was not created: $dumpPath"
    }

    $dumpContent = Get-Content $dumpPath -Raw

    $header = @"
-- ==============================================================================
-- CABIO SALES OS - PHYSICAL SCHEMA
-- Target: PostgreSQL 17 / Supabase
-- ==============================================================================
--
-- THIS FILE IS MACHINE-GENERATED. DO NOT HAND-EDIT.
--
-- Source of truth for the schema is the Alembic migration chain
-- (backend/alembic/versions/). This file is a read-only reference snapshot,
-- regenerated from a fully-migrated database via ``pg_dump --schema-only`` --
-- it is not consumed by Alembic or the application at runtime, and cannot be
-- used as an ``alembic stamp <rev>`` checkpoint.
--
-- Regenerated $dateStamp from the Dev database, catching up migration
-- $($migration.Revision): $summary
-- See docs/Backend-Implementation-Standards.md's migration workflow.
--
-- Regenerate with: .\scripts\regen_physical_schema.ps1
-- (never a raw pg_dump command -- see that script's own header for why)
-- ==============================================================================

"@
    # Normalize to LF in the header we author, matching the dump's own line
    # endings, so the combined file doesn't mix CRLF/LF.
    $header = $header -replace "`r`n", "`n"

    Set-Content -Path $SchemaFile -Value ($header + $dumpContent) -NoNewline -Encoding utf8

    Write-Host "OK: docs/Physical-Schema.sql regenerated, caught up to migration $($migration.Revision)."
    Write-Host "Review the diff (git diff docs/Physical-Schema.sql) before committing."
}
finally {
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
