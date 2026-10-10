# EduFarm E2E — full student + lecturer + admin journeys against local dev server.
# Needs: dev server on :3000, migrated edufarm_dev, psql on PATH-equivalent.
# Creates 3 test accounts, exercises every API, then deletes all test data.
# Usage: powershell -ExecutionPolicy Bypass -File web\scripts\e2e.ps1

$ErrorActionPreference = "Continue"
$Base = "http://localhost:3000"
$Psql = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
$Db = @("-U", "postgres", "-h", "localhost", "-d", "edufarm_dev")
$Fails = 0

function Check($name, $cond, $detail = "") {
  if ($cond) { Write-Host "PASS  $name" }
  else { Write-Host "FAIL  $name  $detail"; $script:Fails++ }
}

function Api($method, $path, $session, $body = $null) {
  $p = @{ Uri = "$Base$path"; Method = $method; WebSession = $session; ContentType = "application/json" }
  if ($body -ne $null) { $p.Body = ($body | ConvertTo-Json -Depth 6) }
  try {
    $r = Invoke-WebRequest @p -UseBasicParsing
    return @{ ok = $true; code = $r.StatusCode; json = ($r.Content | ConvertFrom-Json) }
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    $txt = ""
    try { $txt = $_.ErrorDetails.Message } catch {}
    return @{ ok = $false; code = $code; text = $txt }
  }
}

function Sql($sql) {
  $f = "$env:TEMP\e2e.sql"
  $sql | Set-Content $f
  & $Psql @Db -f $f | Out-Null
  Remove-Item $f
}

$S1 = New-Object Microsoft.PowerShell.Commands.WebRequestSession  # student
$S2 = New-Object Microsoft.PowerShell.Commands.WebRequestSession  # lecturer
$S3 = New-Object Microsoft.PowerShell.Commands.WebRequestSession  # admin
$PW = "E2e-Test-Pass-123!"

# 0. Health
$h = Api GET "/api/health" $S1
Check "health" ($h.ok) $h.code

# 1. Student register -> verify -> login
$r = Api POST "/api/auth/sign-up/email" $S1 @{ name = "E2E Student"; email = "e2e-student@test.local"; password = $PW }
Check "student signup" ($r.code -eq 200) $r.code
Sql 'UPDATE "user" SET email_verified = true WHERE email = ''e2e-student@test.local'';'
$r = Api POST "/api/auth/sign-in/email" $S1 @{ email = "e2e-student@test.local"; password = $PW }
Check "student login" ($r.code -eq 200) $r.code
$me = Api GET "/api/me" $S1
Check "student session" ($me.ok -and $me.json.user.role -eq "student") $me.code

# 2. Courses + profile
$r = Api POST "/api/courses" $S1 @{ code = "ANA 101"; title = "E2E Anatomy"; lecturerName = "Dr E2E"; unitLoad = 3; session = "2025/2026" }
Check "add course" ($r.code -eq 201) $r.code
$courseId = $r.json.id
$r = Api GET "/api/courses" $S1
Check "list courses" ($r.ok -and $r.json.courses.Count -ge 1) $r.code
$r = Api POST "/api/profile" $S1 @{ matricNo = "E2E001"; department = "Anatomy"; level = "100" }
Check "save profile" ($r.code -eq 200) $r.code

# 3. Lecturer register -> promote -> login
$r = Api POST "/api/auth/sign-up/email" $S2 @{ name = "E2E Lecturer"; email = "e2e-lecturer@test.local"; password = $PW }
Check "lecturer signup" ($r.code -eq 200) $r.code
Sql 'UPDATE "user" SET email_verified = true, role = ''lecturer'' WHERE email = ''e2e-lecturer@test.local'';'
$r = Api POST "/api/auth/sign-in/email" $S2 @{ email = "e2e-lecturer@test.local"; password = $PW }
Check "lecturer login" ($r.code -eq 200) $r.code

# 4. Lecturer creates assignment + session + announcement + test
$r = Api POST "/api/assignments" $S2 @{ courseId = $courseId; title = "E2E Essay"; instructions = "Write 500 words."; allowText = $true; allowFile = $false }
Check "create assignment" ($r.code -eq 201) $r.code
$assignId = $r.json.id
$r = Api POST "/api/sessions" $S2 @{ courseId = $courseId; title = "E2E Review"; meetingUrl = "https://meet.google.com/e2e-test"; startsAt = "2026-11-01T10:00:00Z" }
Check "schedule session" ($r.code -eq 201) $r.code
$r = Api POST "/api/announcements" $S2 @{ courseId = $courseId; body = "E2E midterm moved to Friday." }
Check "announce" ($r.code -eq 201) $r.code
$r = Api POST "/api/tests" $S2 @{
  courseId = $courseId; title = "E2E Quiz"; instructions = "Pick one."
  questions = @(
    @{ kind = "mcq"; prompt = "2+2?"; options = @("3", "4", "5"); answerIndex = 1; marks = 2 },
    @{ kind = "mcq"; prompt = "H2O?"; options = @("Water", "Salt"); answerIndex = 0; marks = 3 }
  )
}
Check "create test" ($r.code -eq 201) ($r.text)
$testId = $r.json.id

# 5. Student: sees assignment, submits, score hidden until publish
$r = Api GET "/api/assignments" $S1
Check "assignment visible" ($r.ok -and $r.json.assignments.Count -ge 1) $r.code
$r = Api POST "/api/assignments/$assignId/submit" $S1 @{ bodyText = "E2E answer text." }
Check "submit receipt" ($r.ok -and $r.json.received -eq $true) $r.code
$d = Api GET "/api/assignments/$assignId" $S1
Check "pre-publish hidden" ($d.ok -and $d.json.submission.score -eq $null) $d.code

# 6. Lecturer: draft mark keeps hidden, publish reveals
$det = Api GET "/api/assignments/$assignId" $S2
$subId = $det.json.submissions[0].id
$r = Api PATCH "/api/assignments/$assignId/mark" $S2 @{ submissionId = $subId; score = 8; feedbackDraft = "Good."; publish = $false }
Check "draft mark" ($r.ok) $r.code
$d = Api GET "/api/assignments/$assignId" $S1
Check "draft still hidden" ($d.ok -and $d.json.submission.score -eq $null) $d.code
$r = Api PATCH "/api/assignments/$assignId/mark" $S2 @{ submissionId = $subId; score = 8; feedbackDraft = "Good."; publish = $true }
Check "publish mark" ($r.ok -and $r.json.published -eq $true) $r.code
$d = Api GET "/api/assignments/$assignId" $S1
Check "published visible" ($d.ok -and $d.json.submission.score -eq 8 -and $d.json.submission.feedback -eq "Good.") $d.code
$res = Api GET "/api/results" $S1
Check "results has assignment" ($res.ok -and $res.json.results.Count -ge 1) $res.code

# 7. Student takes MCQ test (auto-publish), answers hidden from student view
$td = Api GET "/api/tests/$testId" $S1
$hasAnswers = ($td.json.questions | Where-Object { $_.PSObject.Properties.Name -contains "answerIndex" }).Count
Check "answers stripped" ($td.ok -and $hasAnswers -eq 0) $td.code
$qids = $td.json.questions.id
$r = Api POST "/api/tests/$testId/attempt" $S1 @{ answers = @{ "$($qids[0])" = @{ selected = 1 }; "$($qids[1])" = @{ selected = 0 } } }
Check "test submit" ($r.code -eq 201 -and $r.json.published -eq $true) $r.code
$res = Api GET "/api/results" $S1
$tscore = ($res.json.testResults | Where-Object { $_.assignment -eq "E2E Quiz" }).score
Check "test score 5/5" ($tscore -eq 5) "got $tscore"

# 8. Q&A + report + admin moderation
$r = Api POST "/api/qa" $S1 @{ courseId = $courseId; question = "E2E: what is anatomy?" }
Check "ask question" ($r.code -eq 201) $r.code
$threadId = $r.json.id
$r = Api POST "/api/qa/$threadId/replies" $S2 @{ body = "E2E: study of structure." }
Check "reply" ($r.code -eq 201) $r.code
$r = Api PATCH "/api/qa" $S1 @{ threadId = $threadId; reason = "E2E test report" }
Check "report (moderation v0)" ($r.ok) $r.code

# 9. Admin: third account, resolve report, verification approve, devotional publish
$r = Api POST "/api/auth/sign-up/email" $S3 @{ name = "E2E Admin"; email = "e2e-admin@test.local"; password = $PW }
Sql 'UPDATE "user" SET email_verified = true, role = ''admin'' WHERE email = ''e2e-admin@test.local'';'
$r = Api POST "/api/auth/sign-in/email" $S3 @{ email = "e2e-admin@test.local"; password = $PW }
Check "admin login" ($r.code -eq 200) $r.code
$ov = Api GET "/api/admin/overview" $S3
Check "admin overview" ($ov.ok -and $ov.json.totalUsers -ge 3) $ov.code
$mod = Api GET "/api/admin/moderation" $S3
$repId = ($mod.json.reports | Where-Object { $_.status -eq "open" })[0].id
$r = Api PATCH "/api/admin/moderation" $S3 @{ id = $repId; outcome = "dismissed"; resolutionNote = "E2E false alarm" }
Check "moderation resolve" ($r.ok) $r.code
Sql 'INSERT INTO lecturer_verifications (id, user_id, evidence_paths, department, status) SELECT ''e2e-verif-1'', id, ''["k"]'', ''Anatomy'', ''pending'' FROM "user" WHERE email = ''e2e-lecturer@test.local'';'
$r = Api PATCH "/api/admin/verification" $S3 @{ id = "e2e-verif-1"; decision = "approved"; note = "E2E ok" }
Check "verification approve" ($r.ok) $r.code
$r = Api POST "/api/admin/devotionals" $S3 @{ title = "E2E Light"; verseRef = "John 8:12"; body = "E2E devotional body." }
Check "devotional draft" ($r.code -eq 201) $r.code
$devId = $r.json.id
$r = Api PATCH "/api/admin/devotionals" $S3 @{ id = $devId; action = "publish" }
Check "devotional publish" ($r.ok) $r.code
$cur = Api GET "/api/devotional/current" $S1
Check "public devotional" ($cur.json.devotional.title -eq "E2E Light") $cur.code

# 10. AI (live Gemini key) + R2 graceful gap
$ai = Api POST "/api/ai/student" $S1 @{ question = "Reply with exactly: E2E OK"; mode = "explain" }
Check "AI answers" ($ai.ok -and $ai.json.source -eq "general") ($ai.text)
$up = Api POST "/api/uploads/sign" $S2 @{ purpose = "material"; contentType = "application/pdf"; size = 100; ext = "pdf" }
Check "upload signing live" ($up.ok -and $up.json.url -and $up.json.key) ($up.code + " " + $up.text)

# Cleanup (dependency order; users last via cascade where possible)
Sql @"
DELETE FROM audit_log WHERE actor_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM reports WHERE reporter_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM qa_replies WHERE author_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM qa_threads WHERE author_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM submissions WHERE student_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM test_attempts WHERE student_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM test_questions WHERE test_id IN (SELECT id FROM tests WHERE author_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local'));
DELETE FROM tests WHERE author_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM assignments WHERE author_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM announcements WHERE author_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM live_sessions WHERE host_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM enrollments WHERE student_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM courses WHERE created_by IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM devotionals WHERE author_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM lecturer_verifications WHERE user_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM ai_usage WHERE user_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM account WHERE user_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM session WHERE user_id IN (SELECT id FROM "user" WHERE email LIKE 'e2e-%@test.local');
DELETE FROM "user" WHERE email LIKE 'e2e-%@test.local';
"@
Write-Host "cleanup done"

if ($Fails -eq 0) { Write-Host "E2E: ALL PASS"; exit 0 } else { Write-Host "E2E: $Fails FAILURES"; exit 1 }
