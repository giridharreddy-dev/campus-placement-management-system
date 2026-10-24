$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot '.env'))) { throw 'Run npm install and npm run setup before starting CPMS Angular. See README.md.' }
$nodeExecutable = (Get-Command node.exe -ErrorAction Stop).Source
$angularCli = Join-Path $PSScriptRoot 'node_modules\@angular\cli\bin\ng.js'
if (-not (Test-Path -LiteralPath $angularCli)) { throw 'Dependencies are missing. Run npm install in this folder first.' }
$logFolder = Join-Path $PSScriptRoot '.verification\launch'
New-Item -ItemType Directory -Path $logFolder -Force | Out-Null
$started = @()
foreach ($service in @(@{Name='api';Port=5100;Args=@('backend/server.js')},@{Name='angular';Port=4200;Args=@('"'+$angularCli+'"','serve','--host','127.0.0.1','--port','4200')})) {
    $listener = Get-NetTCPConnection -LocalPort $service.Port -State Listen -ErrorAction SilentlyContinue
    if ($listener) {
        $owner = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + @($listener)[0].OwningProcess)
        if (-not $owner -or $owner.CommandLine -notmatch 'ng.js|angular|backend[/\\]server.js') { throw ('Port ' + $service.Port + ' is occupied by another program. Close it or run CPMS manually on different ports.') }
        continue
    }
    $process = Start-Process -FilePath $nodeExecutable -ArgumentList $service.Args -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logFolder ($service.Name+'.out.log')) -RedirectStandardError (Join-Path $logFolder ($service.Name+'.error.log')) -PassThru
    $started += [PSCustomObject]@{Name=$service.Name;ProcessId=$process.Id;Port=$service.Port}
}
if ($started.Count) { $started | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $logFolder 'processes.json') }
$ready = $false
for ($attempt = 0; $attempt -lt 60; $attempt++) {
    try {
        $page = Invoke-WebRequest -Uri 'http://127.0.0.1:4200/login' -TimeoutSec 2 -UseBasicParsing
        $health = Invoke-RestMethod -Uri 'http://127.0.0.1:5100/api/health' -TimeoutSec 2
        if ($page.Content -match 'CPMS Angular' -and $health.database -eq 'Connected') { $ready = $true; break }
    } catch { }
    Start-Sleep -Seconds 1
}
if (-not $ready) { throw 'Startup did not finish. Check .verification\launch for the API and Angular logs.' }
Start-Process 'http://127.0.0.1:4200'
Write-Host 'CPMS Angular is ready at http://127.0.0.1:4200'
