<#
.SYNOPSIS
  Copies the old exam PDFs (LEN, ProPa, NuMa) onto the server. They are KIT material, so they are
  not in git (public/*-exams/ is ignored) and a `git pull` on the server never brings them.

.DESCRIPTION
  Uploads public/len-exams, public/propa-exams and public/numa-exams from this computer into the same
  folders of the site on the server, over SSH (ssh and scp come with Windows). Files already on the
  server are overwritten; nothing there is deleted.

  With -NumaFolder it first (re)builds public/numa-exams from the downloaded NuMa course folder,
  under the names numa-exams.js expects (17-ss.pdf, 17-ss-loesung.pdf, ..., 26-ss-loesung.pdf).

.PARAMETER Server
  Where to copy to: user@host, or a Host alias from ~/.ssh/config.

.PARAMETER RemoteDir
  The site's folder on the server (the one with server.js in it). Default: ~/studycompanion

.PARAMETER Courses
  Which courses' exams to upload. Default: len, propa, numa.

.PARAMETER NumaFolder
  The downloaded NuMa course folder; when given, public/numa-exams is rebuilt from it first.

.PARAMETER DryRun
  Only show what would be copied.

.EXAMPLE
  .\tools\upload-exams.ps1 -Server me@my-server -RemoteDir /srv/studycompanion

.EXAMPLE
  .\tools\upload-exams.ps1 -Server me@my-server -Courses numa -NumaFolder "$HOME\Downloads\Numerische Mathematik  fuer die Fachrichtungen Informatik und Ingenieurwesen (SS26)"
#>
param(
  [string]$Server,
  [string]$RemoteDir = "~/studycompanion",
  [ValidateSet("len", "propa", "numa")][string[]]$Courses = @("len", "propa", "numa"),
  [string]$NumaFolder,
  [switch]$DryRun
)
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot

# NuMa: semester in the downloaded file names -> id used by the site.
$numaIds = [ordered]@{ "ss17" = "17-ss"; "ws1718" = "1718-ws"; "ss19" = "19-ss"; "ws1920" = "1920-ws"; "ss20" = "20-ss";
  "ws2021" = "2021-ws"; "ss22" = "22-ss"; "ws2223" = "2223-ws"; "ss24" = "24-ss"; "ws2425" = "2425-ws" }

if ($NumaFolder) {
  $alt = Join-Path $NumaFolder "Altklausuren"
  if (-not (Test-Path -LiteralPath $alt)) { throw "No 'Altklausuren' folder in $NumaFolder" }
  $dest = Join-Path $repo "public\numa-exams"
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  $n = 0
  foreach ($k in $numaIds.Keys) {
    $id = $numaIds[$k]
    $exam = Get-ChildItem -LiteralPath $alt -Filter "klausur_numii_${k}_Aufgaben.pdf" -ErrorAction SilentlyContinue | Select-Object -First 1
    $sol = Get-ChildItem -LiteralPath $alt -Filter "klausur_numii_${k}_Loes*.pdf" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($exam) { Copy-Item -LiteralPath $exam.FullName -Destination (Join-Path $dest "$id.pdf") -Force; $n++ } else { Write-Warning "NuMa ${k}: no exam PDF found" }
    if ($sol) { Copy-Item -LiteralPath $sol.FullName -Destination (Join-Path $dest "$id-loesung.pdf") -Force; $n++ }
  }
  # SS 26: only the solution sketch, which contains the tasks.
  $ss26 = Get-ChildItem -LiteralPath $NumaFolder -Filter "Loesungsskizze_Klausur_ss26.pdf" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($ss26) { Copy-Item -LiteralPath $ss26.FullName -Destination (Join-Path $dest "26-ss-loesung.pdf") -Force; $n++ } else { Write-Warning "NuMa ss26: no Loesungsskizze_Klausur_ss26.pdf found" }
  Write-Host "Rebuilt public\numa-exams: $n PDFs"
}

if (-not $Server) {
  if ($NumaFolder) { return }
  throw "Say where to copy to: -Server user@host (and -RemoteDir if the site isn't in ~/studycompanion)."
}

$folders = foreach ($c in $Courses) {
  $local = Join-Path $repo "public\$c-exams"
  $files = @(Get-ChildItem -LiteralPath $local -Filter *.pdf -File -ErrorAction SilentlyContinue)
  if (-not $files.Count) { Write-Warning "public\$c-exams has no PDFs here - skipped"; continue }
  [pscustomobject]@{ Course = $c; Remote = "$RemoteDir/public/$c-exams"; Files = $files }
}
if (-not $folders) { throw "Nothing to upload." }

foreach ($f in $folders) {
  $mb = [math]::Round(($f.Files | Measure-Object Length -Sum).Sum / 1MB, 1)
  Write-Host ("{0,-6} {1,3} PDFs, {2} MB -> {3}:{4}" -f $f.Course, $f.Files.Count, $mb, $Server, $f.Remote)
}
if ($DryRun) { Write-Host "Dry run: nothing copied."; return }

# Remote shell commands go as base64 (Windows PowerShell mangles quotes in native arguments and puts
# a byte-order mark in front of anything piped to ssh). "~" becomes $HOME so it still expands inside
# the quotes.
$rd = $RemoteDir -replace '^~(?=/|$)', '$HOME'
function Invoke-Remote([string]$line) {
  $b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($line))
  & ssh $Server "echo $b64 | base64 -d | sh" | Out-Host
  return $LASTEXITCODE
}

$mk = ($folders | ForEach-Object { "mkdir -p `"$rd/public/$($_.Course)-exams`"" }) -join " && "
if (Invoke-Remote "test -f `"$rd/server.js`" || { echo 'No server.js in $RemoteDir - wrong -RemoteDir?' >&2; exit 3; }; $mk") {
  throw "ssh failed - check -Server and -RemoteDir."
}
foreach ($f in $folders) {
  & scp -q @($f.Files.FullName) "${Server}:$($f.Remote)/"
  if ($LASTEXITCODE) { throw "scp of $($f.Course) failed (exit $LASTEXITCODE)." }
  Write-Host "Copied $($f.Course)."
}
Invoke-Remote (($folders | ForEach-Object { "echo `"$($_.Course) on the server: `$(ls `"$rd/public/$($_.Course)-exams`" | wc -l) files`"" }) -join "; ") | Out-Null
Write-Host "Done. The server needs no restart for these files."
