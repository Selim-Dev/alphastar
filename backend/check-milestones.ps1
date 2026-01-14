# Check if AOG events have milestone timestamps
$loginBody = @{
    email = "admin@alphastarav.com"
    password = "Admin@123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.accessToken

$headers = @{
    Authorization = "Bearer $token"
}

# Get a few AOG events
$events = Invoke-RestMethod -Uri "http://localhost:3000/api/aog-events" -Method GET -Headers $headers

Write-Host "Checking first 5 AOG events for milestone timestamps:" -ForegroundColor Cyan
Write-Host ""

$count = 0
foreach ($event in $events) {
    if ($count -ge 5) { break }
    $count++
    Write-Host "Event ID: $($event._id)" -ForegroundColor Yellow
    Write-Host "  Aircraft: $($event.aircraftId)"
    Write-Host "  Detected At: $($event.detectedAt)"
    Write-Host "  Cleared At: $($event.clearedAt)"
    Write-Host "  Reported At: $($event.reportedAt)"
    Write-Host "  Procurement Requested At: $($event.procurementRequestedAt)"
    Write-Host "  Available At Store At: $($event.availableAtStoreAt)"
    Write-Host "  Installation Complete At: $($event.installationCompleteAt)"
    Write-Host "  Test Start At: $($event.testStartAt)"
    Write-Host "  Up And Running At: $($event.upAndRunningAt)"
    Write-Host "  Technical Time Hours: $($event.technicalTimeHours)"
    Write-Host "  Procurement Time Hours: $($event.procurementTimeHours)"
    Write-Host "  Ops Time Hours: $($event.opsTimeHours)"
    Write-Host "  Total Downtime Hours: $($event.totalDowntimeHours)"
    Write-Host ""
}
