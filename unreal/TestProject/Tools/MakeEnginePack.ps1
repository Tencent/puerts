<#
.SYNOPSIS
  Make the "editor runtime" overlay of Mini427 so that RunTests.ps1 can run on a GitHub hosted runner.

  Mini427 only contains what BuildPlugin needs (UHT, import libs, headers). Running the editor additionally needs the
  editor dlls, the engine content loaded at startup, config, shaders, slate resources and ICU data. This script finds
  exactly those files by running the tests on a full engine, and packs the ones Mini427 lacks.

  collect : run RunTests.ps1 on the full engine, record loaded dlls and packages -> EnginePack/manifest_<platform>.txt
  pack    : copy manifest files missing in Mini427 to a staging dir, tar it  -> build/<Name>.tgz
  verify  : Mini427 + overlay into a scratch engine dir, run RunTests.ps1 on it

.EXAMPLE
  ./Tools/MakeEnginePack.ps1 -FullEngine 'D:\Program Files\Epic Games\UE_4.27' -MiniEngine E:\AIWorkspace
  ./Tools/MakeEnginePack.ps1 -Steps pack,verify ...      # reuse an existing manifest
#>
param(
    [Parameter(Mandatory)] [string]$FullEngine,
    [Parameter(Mandatory)] [string]$MiniEngine,
    [string[]]$Steps = @('collect', 'pack', 'verify'),
    [string]$Name = 'Mini427_win64_editor_runtime',
    [string]$WorkDir = (Join-Path $PSScriptRoot '..\..\..\build\enginepack'),
    [int]$TimeoutSec = 2400
)

$ErrorActionPreference = 'Stop'
$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$RunTests = Join-Path $ProjectDir 'RunTests.ps1'
$Manifest = Join-Path $PSScriptRoot 'EnginePack\manifest_win64.txt'
$FullEngine = (Resolve-Path $FullEngine).Path.TrimEnd('\')
$MiniEngine = (Resolve-Path $MiniEngine).Path.TrimEnd('\')
New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null
$WorkDir = (Resolve-Path $WorkDir).Path

# small, platform independent data the editor reads at startup (relative to the engine root)
$WhitelistDirs = @(
    'Engine\Config',
    'Engine\Shaders',
    'Engine\Content\Slate',
    'Engine\Content\Editor\Slate\Fonts',
    'Engine\Content\Internationalization\icudt64l'
)
$WhitelistFiles = @(
    'Engine\Binaries\Win64\UE4Editor-Cmd.exe',
    'Engine\Binaries\Win64\UE4Editor.modules',
    'Engine\Build\Build.version'
)
$PackageExts = @('.uasset', '.umap', '.uexp', '.ubulk', '.uptnl')

function Rel([string]$Path) { $Path.Substring($FullEngine.Length + 1) }

function Invoke-Editor([string]$Engine, [string]$Log, [string]$ExecCmds) {
    $exe = Join-Path $Engine 'Engine\Binaries\Win64\UE4Editor-Cmd.exe'
    $argList = @((Join-Path $ProjectDir 'PuertsTest.uproject'), "`"-ExecCmds=$ExecCmds`"",
        '-unattended', '-nullrhi', '-nosplash', '-nosound', '-NoP4', "-abslog=$Log")
    $p = Start-Process -FilePath $exe -ArgumentList $argList -PassThru -WindowStyle Hidden
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while (-not $p.HasExited) {
        if ((Get-Date) -gt $deadline) { $p.Kill(); throw "editor timeout: $ExecCmds" }
        if ((Test-Path $Log) -and (Select-String -Path $Log -Pattern '\]Cmd: Quit' -Quiet)) {
            if (-not $p.WaitForExit(30000)) { $p.Kill() }   # 4.27 sometimes hangs on exit after the log is complete
            break
        }
        Start-Sleep -Seconds 1
    }
}

function Step-Collect {
    # 1. dlls: poll the modules of the editor process while the whole test suite runs
    $out = Join-Path $WorkDir 'collect_runtests.log'
    $rt = Start-Process powershell -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $RunTests,
        '-Engine', "`"$FullEngine`"", '-TimeoutSec', $TimeoutSec -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput $out
    $null = $rt.Handle
    $dlls = @{}
    while (-not $rt.HasExited) {
        foreach ($p in Get-Process -Name 'UE4Editor-Cmd' -ErrorAction SilentlyContinue) {
            try { foreach ($m in $p.Modules) { if ($m.FileName.StartsWith($FullEngine + '\')) { $dlls[(Rel $m.FileName)] = 1 } } } catch {}
        }
        Start-Sleep -Milliseconds 300
    }
    $rt.WaitForExit()
    Get-Content $out | Select-String 'succeeded=' | ForEach-Object { Write-Host "full engine: $($_.Line)" }
    if ($rt.ExitCode -ne 0) { throw "RunTests on full engine failed ($($rt.ExitCode)), see $out" }
    Write-Host "loaded engine dlls: $($dlls.Count)"

    # 2. packages: list the packages in memory after editor startup
    $log = Join-Path $WorkDir 'collect_packages.log'
    Invoke-Editor $FullEngine $log 'obj list class=Package, Quit'
    $packages = Select-String -Path $log -Pattern '\sPackage (/\S+)' | ForEach-Object { $_.Matches[0].Groups[1].Value } | Sort-Object -Unique
    Write-Host "loaded packages: $($packages.Count)"

    # 3. plugins owning a loaded dll: .uplugin, .modules, Config; content root is the mount point /<PluginName>/
    $files = @{}
    foreach ($d in $dlls.Keys) { $files[$d] = 1 }
    $mounts = @{ 'Engine' = Join-Path $FullEngine 'Engine\Content' }
    foreach ($d in $dlls.Keys | Where-Object { $_ -like 'Engine\Plugins\*' }) {
        $root = Join-Path $FullEngine ($d -replace '\\Binaries\\.*$', '')
        $up = Get-ChildItem $root -Filter *.uplugin | Select-Object -First 1
        if (-not $up) { continue }
        $files[(Rel $up.FullName)] = 1
        $mounts[$up.BaseName] = Join-Path $root 'Content'
        $mod = Join-Path $root 'Binaries\Win64\UE4Editor.modules'
        if (Test-Path $mod) { $files[(Rel $mod)] = 1 }
        $cfg = Join-Path $root 'Config'
        if (Test-Path $cfg) { Get-ChildItem $cfg -Recurse -File | ForEach-Object { $files[(Rel $_.FullName)] = 1 } }
    }

    $unresolved = @()
    foreach ($pk in $packages) {
        $seg = $pk.Split('/', 3)       # '', mount, rest
        if ($seg.Count -lt 3 -or -not $mounts.ContainsKey($seg[1])) { if ($seg[1] -notin 'Script', 'Temp', 'Game', 'Memory') { $unresolved += $pk }; continue }
        $base = Join-Path $mounts[$seg[1]] ($seg[2] -replace '/', '\')
        $hit = $false
        foreach ($ext in $PackageExts) { if (Test-Path -LiteralPath "$base$ext") { $files[(Rel "$base$ext")] = 1; $hit = $true } }
        if (-not $hit) { $unresolved += $pk }
    }
    if ($unresolved) { Write-Host "packages not found on disk (ignored): $($unresolved -join ', ')" }

    foreach ($w in $WhitelistDirs) { Get-ChildItem (Join-Path $FullEngine $w) -Recurse -File | ForEach-Object { $files[(Rel $_.FullName)] = 1 } }
    foreach ($w in $WhitelistFiles) { $files[$w] = 1 }

    $list = [string[]]($files.Keys | Where-Object { $_ -notlike '*.pdb' } | Sort-Object)
    New-Item -ItemType Directory -Force -Path (Split-Path $Manifest) | Out-Null
    [System.IO.File]::WriteAllLines($Manifest, $list)
    Write-Host "manifest: $($list.Count) files -> $Manifest"
}

function Step-Pack {
    $stage = Join-Path $WorkDir 'stage'
    if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
    $added = 0; $bytes = 0
    foreach ($rel in Get-Content $Manifest) {
        $src = Join-Path $FullEngine $rel
        if (-not (Test-Path -LiteralPath $src)) { Write-Host "missing in full engine: $rel"; continue }
        $mini = Join-Path $MiniEngine $rel
        $si = Get-Item -LiteralPath $src
        if ((Test-Path -LiteralPath $mini) -and (Get-Item -LiteralPath $mini).Length -eq $si.Length) { continue }
        $dst = Join-Path $stage $rel
        New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null
        Copy-Item -LiteralPath $src $dst
        $added++; $bytes += $si.Length
    }
    $tgz = Join-Path $WorkDir "$Name.tgz"
    if (Test-Path $tgz) { Remove-Item $tgz }
    tar -czf ($tgz -replace '\\', '/') -C ($stage -replace '\\', '/') Engine
    if ($LASTEXITCODE -ne 0) { throw 'tar failed' }
    '{0} files, {1:N0} MB raw, {2:N0} MB tgz -> {3}' -f $added, ($bytes / 1MB), ((Get-Item $tgz).Length / 1MB), $tgz | Write-Host
}

function Step-Verify {
    $engine = Join-Path $WorkDir 'engine'
    if (Test-Path $engine) { Remove-Item -Recurse -Force $engine }
    New-Item -ItemType Directory -Force -Path $engine | Out-Null
    Write-Host "assembling $engine (Mini427 + overlay)"
    robocopy (Join-Path $MiniEngine 'Engine') (Join-Path $engine 'Engine') /E /NFL /NDL /NJH /NJS /NP | Out-Null
    tar -xzf ((Join-Path $WorkDir "$Name.tgz") -replace '\\', '/') -C ($engine -replace '\\', '/')
    if ($LASTEXITCODE -ne 0) { throw 'untar failed' }
    & $RunTests -Engine $engine -TimeoutSec $TimeoutSec
    $code = $LASTEXITCODE
    $log = Join-Path $ProjectDir 'Saved\Logs\RunTests.log'
    $suspect = Select-String -Path $log -Pattern "Failed to load|Can't find file|could not be found|Unable to load|Missing" -ErrorAction SilentlyContinue |
        Where-Object { $_.Line -notmatch 'locres' } | Select-Object -First 30
    if ($suspect) { Write-Host 'suspicious log lines:'; $suspect | ForEach-Object { Write-Host "  $($_.Line)" } }
    if ($code -ne 0) { throw "RunTests on assembled engine failed ($code)" }
}

foreach ($s in $Steps) {
    Write-Host "== $s"
    switch ($s) { 'collect' { Step-Collect } 'pack' { Step-Pack } 'verify' { Step-Verify } default { throw "unknown step $s" } }
}
