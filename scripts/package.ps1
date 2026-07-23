<#
.SYNOPSIS
  Builds per-browser distribution folders and zips from src/.

  Targets:
    dist/chromium  → Edge & Chrome  (service-worker background, favicon API)
    dist/zen       → Zen & Firefox  (event-page background, no Chromium-only
                                     keys, so no manifest warnings)

  src/ itself is directly loadable everywhere for development; this script
  exists so each browser/store gets a clean manifest without foreign keys.

  Implementation notes (both bit us in the wild):
    • Zips are written with System.IO.Compression using forward-slash entry
      names. Compress-Archive uses backslashes, which Firefox cannot read —
      every nested file 404s inside the extension.
    • The manifest is read/written as UTF-8 explicitly. Windows PowerShell
      otherwise decodes it as ANSI and mangles non-ASCII (the "—" in the
      extension name became "â€™"-style garbage).

.USAGE
  powershell -ExecutionPolicy Bypass -File scripts/package.ps1
#>

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = Split-Path -Parent $PSScriptRoot
$src  = Join-Path $root 'src'
$dist = Join-Path $root 'dist'
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

if (Test-Path $dist) { Remove-Item -Recurse -Force $dist }

function Read-Manifest {
    [System.IO.File]::ReadAllText((Join-Path $src 'manifest.json'), $utf8NoBom) | ConvertFrom-Json
}

function New-ExtensionZip([string]$folder, [string]$zipPath) {
    $stream  = [System.IO.File]::Create($zipPath)
    $archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        Get-ChildItem $folder -Recurse -File | ForEach-Object {
            # Forward slashes are mandatory: Firefox rejects backslash entries.
            $entryName = $_.FullName.Substring($folder.Length + 1).Replace('\', '/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $archive, $_.FullName, $entryName,
                [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    }
    finally {
        $archive.Dispose()
        $stream.Dispose()
    }
}

$version = (Read-Manifest).version

$targets = @(
    @{ name = 'chromium'; zip = "tabflow-$version-chrome-edge.zip" },
    @{ name = 'zen';      zip = "tabflow-$version-zen-firefox.zip" }
)

foreach ($target in $targets) {
    $out = Join-Path $dist $target.name
    New-Item -ItemType Directory -Force $out | Out-Null
    Copy-Item -Recurse -Force (Join-Path $src '*') $out

    $m = Read-Manifest

    if ($target.name -eq 'chromium') {
        # Chromium: service worker background (src is already Chromium-native);
        # gecko settings are foreign. 'scripts' is dropped defensively in case
        # someone re-adds the MV2-style key to src/manifest.json.
        $m.background.PSObject.Properties.Remove('scripts')
        $m.PSObject.Properties.Remove('browser_specific_settings')
    }
    else {
        # Zen/Firefox: event-page background. Firefox has no service worker in
        # MV3, so swap it for the 'scripts' array. 'favicon' is Chromium-only
        # and triggers the yellow "Error processing permissions" warning.
        $m.background.PSObject.Properties.Remove('service_worker')
        $m.background | Add-Member -NotePropertyName 'scripts' -NotePropertyValue @('background.js') -Force
        $m.permissions = @($m.permissions | Where-Object { $_ -ne 'favicon' })
    }

    $json = $m | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText((Join-Path $out 'manifest.json'), $json, $utf8NoBom)

    New-ExtensionZip -folder $out -zipPath (Join-Path $dist $target.zip)
    Write-Host "Built dist/$($target.name) and dist/$($target.zip)"
}

Write-Host ""
Write-Host "Edge/Chrome : load dist/chromium unpacked, or upload the chrome-edge zip."
Write-Host "Zen/Firefox : about:debugging -> Load Temporary Add-on -> dist/zen/manifest.json"
Write-Host "              (for a permanent Zen install, sign the zen-firefox zip on AMO)"
