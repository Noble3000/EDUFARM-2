# EduFarm local backup — Postgres custom-format dumps with timestamp.
# Run nightly via Task Scheduler. Keeps 14 days. Optionally mirrors latest to R2.
# Usage: powershell -ExecutionPolicy Bypass -File web\scripts\backup.ps1

$ErrorActionPreference = "Stop"
$PsqlBin = "C:\Program Files\PostgreSQL\17\bin"
$BackupDir = "C:\Users\HomePC\Downloads\EDUFARM 2\web\backups"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

$stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
foreach ($db in @("edufarm_dev", "edufarm_prod")) {
  $out = Join-Path $BackupDir "$db-$stamp.dump"
  & "$PsqlBin\pg_dump.exe" -U postgres -h localhost -Fc $db -f $out
  Write-Host "backed up $db -> $out"
}

# Retention: keep 14 days of dumps
Get-ChildItem $BackupDir -Filter "*.dump" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-14) } |
  Remove-Item -Force

Write-Host "done."
