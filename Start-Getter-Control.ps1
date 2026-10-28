param(
    [string]$DataDir,
    [int]$Port = 3120,
    [switch]$Prepare
)
$ErrorActionPreference = 'Stop'
$getterRepository = $PSScriptRoot
$getterTools = Join-Path (Split-Path $getterRepository -Parent) 'tools'
$getterBundledNode = Join-Path $getterTools 'getter-runtime\node-v26.12.1-win-x64\node.exe'
$getterNode = if (Test-Path -LiteralPath $getterBundledNode) { $getterBundledNode } else { (Get-Command node -ErrorAction Stop).Source }
$getterOriginalPath = $env:PATH
Push-Location $getterRepository
try {
    $env:PATH = (Split-Path $getterNode -Parent) + [System.IO.Path]::PathSeparator + $env:PATH
    if ($Prepare) {
        $getterPnpmEntry = Join-Path $getterTools 'getter-control-runtime\tooling\node_modules\pnpm\bin\pnpm.cjs'
        if (Test-Path -LiteralPath $getterPnpmEntry) {
            & $getterNode $getterPnpmEntry getter-control:prepare
        } else {
            & pnpm getter-control:prepare
        }
        if ($LASTEXITCODE -ne 0) { throw 'Getter Control source preparation failed.' }
    }
    $getterArguments = @((Join-Path $getterRepository 'scripts\getter-control.mjs'), '--port', [string]$Port)
    if ($DataDir) { $getterArguments += @('--home', $DataDir) }
    & $getterNode @getterArguments
    exit $LASTEXITCODE
} finally {
    $env:PATH = $getterOriginalPath
    Pop-Location
}
