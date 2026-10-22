param([string]$OutputDirectory = (Join-Path $PSScriptRoot '..\release'))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$ReleaseRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$ReleaseOutput = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $ReleaseOutput | Out-Null
$ReleaseVersion = (Get-Content -LiteralPath (Join-Path $ReleaseRoot 'package.json') -Raw | ConvertFrom-Json).version
$Packages = @(
  @{Name="astro-ph-researcher-$ReleaseVersion-dsh.zip"; Root=$ReleaseRoot; Prefix="astro-ph-researcher-$ReleaseVersion"; English=$false},
  @{Name="astro-ph-researcher-$ReleaseVersion-source.zip"; Root=$ReleaseRoot; Prefix="astro-ph-researcher-$ReleaseVersion"; English=$false},
  @{Name="astro-ph-researcher-$ReleaseVersion-codex-zh.zip"; Root=(Join-Path $ReleaseRoot 'codex'); Prefix='astro-ph-researcher'; English=$false},
  @{Name="astro-ph-researcher-$ReleaseVersion-codex-en.zip"; Root=(Join-Path $ReleaseRoot 'codex'); Prefix='astro-ph-researcher'; English=$true}
)
foreach ($Package in $Packages) {
  $ZipPath = Join-Path $ReleaseOutput $Package.Name
  $ZipStream = [IO.File]::Open($ZipPath, [IO.FileMode]::Create, [IO.FileAccess]::Write, [IO.FileShare]::None)
  $Archive = [IO.Compression.ZipArchive]::new($ZipStream, [IO.Compression.ZipArchiveMode]::Create, $false)
  try {
    foreach ($File in Get-ChildItem -LiteralPath $Package.Root -Recurse -File -Force) {
      $Relative = $File.FullName.Substring($Package.Root.TrimEnd('\','/').Length + 1).Replace('\','/')
      if ($File.FullName.StartsWith($ReleaseOutput + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { continue }
      if ($Relative -match '(^|/)(local-data|node_modules|\.git|release|dist|\.venv|\.dsh-pyenv)/' -or $Relative -match '\.(log|bak)$' -or $Relative -match '(^|/)\.env($|\.)' -or $Relative -match '\.(pem|key)$') { continue }
      $Replacement = $null
      if ($Package.English) {
        if ($Relative -eq 'README.md') { $Replacement = [IO.File]::ReadAllText((Join-Path $Package.Root 'README.en.md')) }
        if ($Relative -eq 'start-ui.cmd') { $Replacement = [IO.File]::ReadAllText((Join-Path $Package.Root 'start-ui-en.cmd')) }
        if ($Relative -eq '.codex/environments/environment.toml') { $Replacement = "version = 1`nname = `"Astro Research Workbench`"`n[setup]`nscript = `"`"`n[[actions]]`nname = `"Open Astro Workbench`"`nicon = `"run`"`ncommand = `"node scripts/open-ui.mjs --lang en`"`n" }
        if ($Relative -eq '.codex-plugin/plugin.json') {
          $EnglishManifest = Get-Content -LiteralPath $File.FullName -Raw | ConvertFrom-Json
          $EnglishManifest.interface.shortDescription = 'Astronomy: literature, writing, learning and research plans'
          $EnglishManifest.interface.longDescription = 'A bilingual local research workbench with literature search and identifier checks, writing projects, section review, a beginner path, research plans and resources. Includes a Codex project action installer.'
          $Replacement = $EnglishManifest | ConvertTo-Json -Depth 20
        }
      }
      $EntryName = $Package.Prefix + '/' + $Relative
      if ($null -ne $Replacement) {
        $Entry = $Archive.CreateEntry($EntryName,[IO.Compression.CompressionLevel]::Optimal)
        $Writer = [IO.StreamWriter]::new($Entry.Open(), [Text.UTF8Encoding]::new($false))
        try { $Writer.Write($Replacement) } finally { $Writer.Dispose() }
      } else { [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($Archive,$File.FullName,$EntryName,[IO.Compression.CompressionLevel]::Optimal) | Out-Null }
    }
  } finally { $Archive.Dispose(); $ZipStream.Dispose() }
  Write-Host $ZipPath
}
$Documents = @('RELEASE_NOTES.md', 'README.md', 'README.en.md', 'DISCLAIMER.md')
foreach ($Document in $Documents) { Copy-Item -LiteralPath (Join-Path $ReleaseRoot $Document) -Destination (Join-Path $ReleaseOutput $Document) -Force }
Copy-Item -LiteralPath (Join-Path $ReleaseRoot 'docs/INSTALL-DSH.md') -Destination (Join-Path $ReleaseOutput 'INSTALL-DSH.md') -Force
$HashLines = @($Packages.Name) + $Documents + @('INSTALL-DSH.md') | ForEach-Object { $Path=Join-Path $ReleaseOutput $_; (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() + '  ' + $_ }
[IO.File]::WriteAllLines((Join-Path $ReleaseOutput 'SHA256SUMS.txt'), $HashLines, [Text.UTF8Encoding]::new($false))
