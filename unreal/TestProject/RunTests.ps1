<#
.SYNOPSIS
  Build the PuertsTest host project and run PuerTS automation tests headless.

.EXAMPLE
  ./RunTests.ps1                                  # build + run Puerts.Functional
  ./RunTests.ps1 -SkipBuild -Filter Puerts.Functional.Lifecycle
  ./RunTests.ps1 -UpdateBaseline                  # rewrite Baseline/*.txt from the current implementation
  ./RunTests.ps1 -Bench -BenchLabel before_m1     # run Puerts.Bench, result in Saved/PuertsBench/before_m1.json
#>
param(
    [string]$Engine = $(if ($env:UE_ROOT) { $env:UE_ROOT } else { 'D:\Program Files\Epic Games\UE_5.8' }),
    [string]$Filter = 'Puerts.Functional',
    [switch]$SkipBuild,
    [switch]$UpdateBaseline,
    [switch]$Bench,
    [string]$BenchLabel = 'latest',
    [string]$Configuration = 'Development',
    [int]$TimeoutSec = 600
)

$ErrorActionPreference = 'Stop'
$ProjectDir = $PSScriptRoot
$Project = Join-Path $ProjectDir 'PuertsTest.uproject'
$PluginSrc = (Resolve-Path (Join-Path $ProjectDir '..\Puerts')).Path

# 1. plugin junction (UBT only discovers the UHT exporter plugin of plugins under <Project>/Plugins)
$PluginLink = Join-Path $ProjectDir 'Plugins\Puerts'
if (-not (Test-Path $PluginLink)) {
    New-Item -ItemType Directory -Force -Path (Split-Path $PluginLink) | Out-Null
    New-Item -ItemType Junction -Path $PluginLink -Target $PluginSrc | Out-Null
    Write-Host "created junction $PluginLink -> $PluginSrc"
}

# 2. runtime scripts of the plugin (puerts/*.js etc.) must be under <Project>/Content/JavaScript
$JsDst = Join-Path $ProjectDir 'Content\JavaScript'
Get-ChildItem (Join-Path $PluginSrc 'Content\JavaScript') -Directory | ForEach-Object {
    $dst = Join-Path $JsDst $_.Name
    if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
    Copy-Item -Recurse -Force $_.FullName $dst
}

# 3. build
if (-not $SkipBuild) {
    & (Join-Path $Engine 'Engine\Build\BatchFiles\Build.bat') PuertsTestEditor Win64 $Configuration "-Project=$Project" -WaitMutex
    if ($LASTEXITCODE -ne 0) { throw "build failed ($LASTEXITCODE)" }
}

# 4. run
if ($Bench) { $Filter = 'Puerts.Bench' }
$ReportDir = Join-Path $ProjectDir 'Saved\AutomationReport'
if (Test-Path $ReportDir) { Remove-Item -Recurse -Force $ReportDir }
$LogFile = Join-Path $ProjectDir 'Saved\Logs\RunTests.log'
New-Item -ItemType Directory -Force -Path (Split-Path $LogFile) | Out-Null

$EditorCmd = Join-Path $Engine 'Engine\Binaries\Win64\UnrealEditor-Cmd.exe'
$EditorArgs = @(
    $Project,
    "-ExecCmds=Automation RunTests $Filter;Quit",
    '-TestExit=Automation Test Queue Empty',
    "-ReportExportPath=$ReportDir",
'-unattended', '-nullrhi', '-nosplash', '-nosound', '-NoP4', '-stdout', '-FullStdOutLogOutput',
    "-abslog=$LogFile"
)
if ($UpdateBaseline) { $EditorArgs += '-PuertsUpdateBaseline' }
if ($Bench) { $EditorArgs += "-PuertsBenchLabel=$BenchLabel" }

Write-Host "running: $Filter (timeout ${TimeoutSec}s)"
$Quoted = $EditorArgs | ForEach-Object { if ($_ -match '[\s;]') { '"' + $_ + '"' } else { $_ } }
$Proc = Start-Process -FilePath $EditorCmd -ArgumentList $Quoted -PassThru -NoNewWindow -RedirectStandardOutput (Join-Path $ProjectDir 'Saved\Logs\RunTests.stdout.txt')
if (-not $Proc.WaitForExit($TimeoutSec * 1000)) {
    Stop-Process -Id $Proc.Id -Force -ErrorAction SilentlyContinue
    Write-Host "TIMEOUT after ${TimeoutSec}s, editor killed. Last log lines:"
    Get-Content $LogFile -Tail 15 | ForEach-Object { Write-Host "  $_" }
    exit 2
}
$EditorExit = $Proc.ExitCode

# 5. report
$Index = Join-Path $ReportDir 'index.json'
if (-not (Test-Path $Index)) { throw "no automation report generated (editor exit $EditorExit), see $LogFile" }
$Report = Get-Content -Raw -Encoding UTF8 $Index | ConvertFrom-Json

foreach ($t in $Report.tests) {
    $mark = if ($t.state -eq 'Success') { 'PASS' } else { $t.state.ToUpper() }
    Write-Host ("{0,-6} {1}" -f $mark, $t.fullTestPath)
    foreach ($e in $t.entries) {
        $type = $e.event.type
        if ($type -eq 'Error' -or $type -eq 'Warning' -or ($Bench -and $type -eq 'Info')) {
            Write-Host ("       [{0}] {1}" -f $type, $e.event.message)
        }
    }
}
Write-Host ("succeeded={0} warnings={1} failed={2} notRun={3}" -f $Report.succeeded, $Report.succeededWithWarnings, $Report.failed, $Report.notRun)
Write-Host "log: $LogFile"

if ($Report.failed -gt 0 -or $Report.tests.Count -eq 0) { exit 1 }
exit 0
