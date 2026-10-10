# R2 upload chain test: lecturer signs URL -> PUTs file -> creates + confirms material -> gets view link. Cleans up.
$ErrorActionPreference = "Continue"
$Base = "http://localhost:3000"
$Psql = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
$Db = @("-U", "postgres", "-h", "localhost", "-d", "edufarm_dev")
$Fails = 0
function Check($n, $c, $d = "") { if ($c) { Write-Host "PASS  $n" } else { Write-Host "FAIL  $n  $d"; $script:Fails++ } }
function Api($m, $p, $s, $b = $null) {
  $q = @{ Uri = "$Base$p"; Method = $m; WebSession = $s; ContentType = "application/json" }
  if ($b -ne $null) { $q.Body = ($b | ConvertTo-Json -Depth 6) }
  try { $r = Invoke-WebRequest @q -UseBasicParsing; return @{ ok = $true; code = $r.StatusCode; json = ($r.Content | ConvertFrom-Json) } }
  catch { return @{ ok = $false; code = $_.Exception.Response.StatusCode.value__; text = $_.ErrorDetails.Message } }
}
function Sql($s) { $f = "$env:TEMP\r2t.sql"; $s | Set-Content $f; & $Psql @Db -f $f | Out-Null; Remove-Item $f }

$S = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$PW = "R2-Test-Pass-123!"
$r = Api POST "/api/auth/sign-up/email" $S @{ name = "R2 Lecturer"; email = "r2-lecturer@test.local"; password = $PW }
Check "signup" ($r.code -eq 200) $r.code
Sql 'UPDATE "user" SET email_verified = true, role = ''lecturer'' WHERE email = ''r2-lecturer@test.local'';'
$r = Api POST "/api/auth/sign-in/email" $S @{ email = "r2-lecturer@test.local"; password = $PW }
Check "login" ($r.code -eq 200) $r.code
$r = Api POST "/api/courses" $S @{ code = "R2 101"; title = "R2 Course" }
Check "course" ($r.code -eq 201) $r.code
$courseId = $r.json.id

# sign -> PUT -> record
$pdf = "%PDF-1.4 E2E R2 test file"
$r = Api POST "/api/uploads/sign" $S @{ purpose = "material"; contentType = "application/pdf"; size = $pdf.Length; ext = "pdf" }
Check "sign URL (was 503 before keys)" ($r.ok -and $r.json.url -and $r.json.key) ($r.code + " " + $r.text)
$key = $r.json.key
$put = Invoke-WebRequest -Uri $r.json.url -Method PUT -Body $pdf -ContentType "application/pdf" -UseBasicParsing
Check "PUT to R2" ($put.StatusCode -eq 200) $put.StatusCode
$r = Api POST "/api/materials" $S @{ courseId = $courseId; title = "R2 Notes"; type = "note"; filePath = $key; allowDownload = $true }
Check "material draft" ($r.code -eq 201) $r.code
$matId = $r.json.id
$r = Api PATCH "/api/materials" $S @{ id = $matId; action = "confirm-publish" }
Check "confirm+publish" ($r.ok) $r.code
$r = Api GET "/api/materials?id=$matId&as=view" $S
Check "signed view URL" ($r.ok -and $r.json.url -like "https://*") $r.code
$r = Api GET "/api/materials?id=$matId&as=download" $S
Check "signed download URL" ($r.ok -and $r.json.url -like "https://*") $r.code

# cleanup incl. R2 object
Sql @"
DELETE FROM materials WHERE uploader_id IN (SELECT id FROM "user" WHERE email = 'r2-lecturer@test.local');
DELETE FROM courses WHERE created_by IN (SELECT id FROM "user" WHERE email = 'r2-lecturer@test.local');
DELETE FROM account WHERE user_id IN (SELECT id FROM "user" WHERE email = 'r2-lecturer@test.local');
DELETE FROM session WHERE user_id IN (SELECT id FROM "user" WHERE email = 'r2-lecturer@test.local');
DELETE FROM "user" WHERE email = 'r2-lecturer@test.local';
"@
$e = Get-Content "C:\Users\HomePC\Downloads\EDUFARM 2\web\.env.local"
$id = (($e | Select-String -Pattern "^R2_ACCESS_KEY_ID=(.*)$").Matches[0].Groups[1].Value)
$sec = (($e | Select-String -Pattern "^R2_SECRET_ACCESS_KEY=(.*)$").Matches[0].Groups[1].Value)
$ep = (($e | Select-String -Pattern "^R2_ENDPOINT=(.*)$").Matches[0].Groups[1].Value)
$env:RK1 = $id; $env:RK2 = $sec; $env:REP = $ep
& "C:\Program Files\nodejs\node.exe" -e "const {S3Client,DeleteObjectCommand}=require('./node_modules/@aws-sdk/client-s3');(async()=>{const s=new S3Client({region:'auto',endpoint:process.env.REP,credentials:{accessKeyId:process.env.RK1,secretAccessKey:process.env.RK2}});await s.send(new DeleteObjectCommand({Bucket:'edufarm-dev',Key:process.argv[1]}));console.log('R2 object deleted')})()" "$key"
Remove-Item Env:\RK1,Env:\RK2,Env:\REP
Write-Host "cleanup done"
if ($Fails -eq 0) { Write-Host "R2 CHAIN: ALL PASS"; exit 0 } else { Write-Host "R2 CHAIN: $Fails FAILURES"; exit 1 }
