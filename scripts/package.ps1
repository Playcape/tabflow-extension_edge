<#
.SYNOPSIS
  Builds per-browser distribution folders and zips from src/.

  Targets:
    dist/chromium  → Edge & Chrome  (service-worker background, favicon API)
    dist/zen       → Zen & Firefox  (event-page background, no Chromium-only
                                     keys, so no manifest warnings)

  src/ itself is directly loadable everywhere for development; this script
  exists so each browser/store gets a clean manifest without foreign keys.

.USAGE
  powershell -ExecutionPolicy Bypass -File scripts/package.ps1
#>

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$src  = Join-Path $root 'src'
$dist = Join-Path $root 'dist'

if (Test-Path $dist) { Remove-Item -Recurse -Force $dist }

$version = (Get-Content (Join-Path $src 'manifest.json') -Raw | ConvertFrom-Json).version

$targets = @(
    @{ name = 'chromium'; zip = "tabflow-$version-chrome-edge.zip" },
    @{ name = 'zen';      zip = "tabflow-$version-zen-firefox.zip" }
)

foreach ($target in $targets) {
    $out = Join-Path $dist $target.name
    New-Item -ItemType Directory -Force $out | Out-Null
    Copy-Item -Recurse -Force (Join-Path $src '*') $out

    $m = Get-Content (Join-Path $src 'manifest.json') -Raw | ConvertFrom-Json

    if ($target.name -eq 'chromium') {
        # Chromium: service worker background; gecko settings are foreign.
        $m.background.PSObject.Properties.Remove('scripts')
        $m.PSObject.Properties.Remove('browser_specific_settings')
    }
    else {
        # Zen/Firefox: event page background; 'favicon' is Chromium-only and
        # triggers the yellow "Error processing permissions" manifest warning.
        $m.background.PSObject.Properties.Remove('service_worker')
        $m.permissions = @($m.permissions | Where-Object { $_ -ne 'favicon' })
    }

    $m | ConvertTo-Json -Depth 10 | Out-File (Join-Path $out 'manifest.json') -Encoding utf8

    $zip = Join-Path $dist $target.zip
    Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zip -Force
    Write-Host "Built $zip"
}

Write-Host ""
Write-Host "Edge/Chrome : load dist/chromium unpacked, or upload the chrome-edge zip."
Write-Host "Zen/Firefox : about:debugging -> Load Temporary Add-on -> dist/zen/manifest.json"
Write-Host "              (for a permanent Zen install, sign the zen-firefox zip on AMO)"
