# Clear all AOG events to allow re-seeding with milestone timestamps
Write-Host "⚠️  WARNING: This will delete all AOG events!" -ForegroundColor Red
Write-Host "Press Ctrl+C to cancel, or any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

$loginBody = @{
    email = "admin@alphastarav.com"
    password = "Admin@123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.accessToken

$headers = @{
    Authorization = "Bearer $token"
}

# Get all AOG events
Write-Host "Fetching all AOG events..." -ForegroundColor Cyan
$events = Invoke-RestMethod -Uri "http://localhost:3000/api/aog-events" -Method GET -Headers $headers

Write-Host "Found $($events.Count) AOG events" -ForegroundColor Yellow

# Delete each event
$deleted = 0
foreach ($event in $events) {
    try {
        Invoke-RestMethod -Uri "http://localhost:3000/api/aog-events/$($event._id)" -Method DELETE -Headers $headers | Out-Null
        $deleted++
        if ($deleted % 10 -eq 0) {
            Write-Host "  Deleted $deleted events..." -ForegroundColor Gray
        }
    } catch {
        Write-Host "  Failed to delete event $($event._id): $_" -ForegroundColor Red
    }
}

Write-Host "✅ Deleted $deleted AOG events" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run 'npm run seed' to create new events with milestone timestamps" -ForegroundColor Cyan
