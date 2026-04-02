$base = "https://youkongwa.com/api"
$results = @()

function Test($name, $block) {
    try {
        $r = & $block
        $Script:results += [PSCustomObject]@{Test=$name; Status="PASS"; Detail=$r}
        Write-Host "PASS: $name" -ForegroundColor Green
        return $r
    } catch {
        $msg = $_.Exception.Message
        if ($_.ErrorDetails) { $msg += " | " + $_.ErrorDetails.Message }
        $Script:results += [PSCustomObject]@{Test=$name; Status="FAIL"; Detail=$msg}
        Write-Host "FAIL: $name -> $msg" -ForegroundColor Red
        return $null
    }
}

function Post($url, $bodyObj, $headers) {
    $json = $bodyObj | ConvertTo-Json -Depth 3
    $params = @{Uri=$url; Method="POST"; Body=$json; ContentType="application/json"}
    if ($headers) { $params.Headers = $headers }
    return Invoke-RestMethod @params
}

# 1. Register
$rand = Get-Random
$testEmail = "autotest_$rand@test.com"
$testUser = "autotest_$rand"
Test "1. Register" {
    $r = Post "$base/auth/register" @{username=$testUser; email=$testEmail; password="Test123456"}
    if (-not $r.success) { throw "failed" }
    return "OK"
}

# 2. Login
$token = $null
Test "2. Login" {
    $r = Post "$base/auth/login" @{email=$testEmail; password="Test123456"}
    if (-not $r.success) { throw "failed" }
    $Script:token = $r.data.tokens.accessToken
    return "OK"
}

$authH = @{Authorization="Bearer $token"}

# 3. Get me
Test "3. GET /auth/me" {
    $r = Invoke-RestMethod -Uri "$base/auth/me" -Headers $authH
    if (-not $r.success) { throw "failed" }
    return "OK: $($r.data.user.username)"
}

# 4. Create treasure (no Chinese chars to avoid encoding issues)
$treasureId = $null
Test "4. Create Treasure" {
    $json = '{"title":"AutoTest","description":"test","type":"note","content":{"text":"hello"},"location":{"coordinates":[121.40411,31.16357],"discoveryRadius":50}}'
    $r = Invoke-RestMethod -Uri "$base/treasures" -Method POST -Body $json -ContentType "application/json" -Headers $authH
    if (-not $r.success) { throw "failed: $($r.message)" }
    $Script:treasureId = $r.data._id
    return "OK: id=$($r.data._id)"
}

# 5. Nearby (guest)
Test "5. Nearby (guest)" {
    $r = Invoke-RestMethod -Uri "$base/treasures/nearby?lat=31.16357&lng=121.40411&radius=5000"
    if (-not $r.success) { throw "failed" }
    return "OK: $($r.count) found"
}

# 6. Nearby (auth)
Test "6. Nearby (auth)" {
    $r = Invoke-RestMethod -Uri "$base/treasures/nearby?lat=31.16357&lng=121.40411&radius=5000" -Headers $authH
    if (-not $r.success) { throw "failed" }
    return "OK: $($r.count) found"
}

# 7. Detail
if ($treasureId) {
    Test "7. Treasure Detail" {
        $r = Invoke-RestMethod -Uri "$base/treasures/$Script:treasureId" -Headers $authH
        if (-not $r.success) { throw "failed" }
        return "OK: $($r.data.title)"
    }
}

# 8. Like
if ($treasureId) {
    Test "8. Like" {
        $r = Invoke-RestMethod -Uri "$base/treasures/$Script:treasureId/like" -Method POST -Headers $authH -ContentType "application/json"
        if (-not $r.success) { throw "failed" }
        return "OK: $($r.data.action)"
    }
}

# 9. My treasures
Test "9. My Treasures" {
    $r = Invoke-RestMethod -Uri "$base/treasures/my" -Headers $authH
    if (-not $r.success) { throw "failed" }
    return "OK: $($r.data.Count) items"
}

# 10. Discover
if ($treasureId) {
    Test "10. Discover" {
        $json = '{"lat":31.16357,"lng":121.40411}'
        $r = Invoke-RestMethod -Uri "$base/treasures/$Script:treasureId/discover" -Method POST -Body $json -ContentType "application/json" -Headers $authH
        if (-not $r.success) { throw "failed: $($r.message)" }
        return "OK"
    }
}

# 11. Discovered
Test "11. Discovered" {
    $r = Invoke-RestMethod -Uri "$base/treasures/discovered" -Headers $authH
    if (-not $r.success) { throw "failed" }
    return "OK: $($r.data.Count) discovered"
}

# 12. Delete
if ($treasureId) {
    Test "12. Delete" {
        $r = Invoke-RestMethod -Uri "$base/treasures/$Script:treasureId" -Method DELETE -Headers $authH -ContentType "application/json"
        if (-not $r.success) { throw "failed" }
        return "OK"
    }
}

# 13. AI Chat
Test "13. AI Chat" {
    $json = '{"message":"hi","conversationHistory":[]}'
    $r = Invoke-RestMethod -Uri "$base/ai/chat" -Method POST -Body $json -ContentType "application/json" -Headers $authH -TimeoutSec 30
    if (-not $r.success) { throw "failed" }
    return "OK: AI replied"
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
$pass = ($results | Where-Object Status -eq "PASS").Count
$fail = ($results | Where-Object Status -eq "FAIL").Count
$results | Format-Table Test, Status, Detail -AutoSize
Write-Host "TOTAL: $($results.Count) | PASS: $pass | FAIL: $fail" -ForegroundColor $(if($fail -gt 0){"Yellow"}else{"Green"})
