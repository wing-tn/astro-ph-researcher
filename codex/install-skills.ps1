$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$CodexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
$Dest = Join-Path $CodexHome "skills"
New-Item -ItemType Directory -Force -Path $Dest | Out-Null
Get-ChildItem -Path (Join-Path $Root "skills") -Directory | ForEach-Object {
    $Target = Join-Path $Dest $_.Name
    if (Test-Path $Target) { Remove-Item -Recurse -Force $Target }
    Copy-Item -Recurse -Force $_.FullName $Target
    Write-Host "installed $($_.Name) -> $Target"
}
Write-Host "done. Restart Codex and invoke the skills by name."
