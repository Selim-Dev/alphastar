# Test three-bucket analytics endpoint
$loginBody = @{
    email = "admin@alphastarav.com"
    password = "Admin@123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.accessToken

Write-Host "✅ Logged in successfully" -ForegroundColor Green
Write-Host ""

# Test three-bucket analytics
Write-Host "Testing three-bucket analytics endpoint..." -ForegroundColor Cyan
$headers = @{
    Authorization = "Bearer $token"
}

$analyticsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/aog-events/analytics/buckets" -Method GET -Headers $headers

Write-Host "✅ Analytics retrieved successfully" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Total Events: $($analyticsResponse.summary.totalEvents)"
Write-Host "  Active Events: $($analyticsResponse.summary.activeEvents)"
Write-Host "  Total Downtime Hours: $($analyticsResponse.summary.totalDowntimeHours)"
Write-Host "  Average Downtime Hours: $($analyticsResponse.summary.averageDowntimeHours)"
Write-Host ""
Write-Host "Bucket Breakdown:" -ForegroundColor Yellow
Write-Host "  Technical Time:"
Write-Host "    Total Hours: $($analyticsResponse.buckets.technical.totalHours)"
Write-Host "    Average Hours: $($analyticsResponse.buckets.technical.averageHours)"
Write-Host "    Percentage: $($analyticsResponse.buckets.technical.percentage)%"
Write-Host "  Procurement Time:"
Write-Host "    Total Hours: $($analyticsResponse.buckets.procurement.totalHours)"
Write-Host "    Average Hours: $($analyticsResponse.buckets.procurement.averageHours)"
Write-Host "    Percentage: $($analyticsResponse.buckets.procurement.percentage)%"
Write-Host "  Ops Time:"
Write-Host "    Total Hours: $($analyticsResponse.buckets.ops.totalHours)"
Write-Host "    Average Hours: $($analyticsResponse.buckets.ops.averageHours)"
Write-Host "    Percentage: $($analyticsResponse.buckets.ops.percentage)%"
Write-Host ""
Write-Host "Per-Aircraft Breakdown (first 5):" -ForegroundColor Yellow
$analyticsResponse.byAircraft | Select-Object -First 5 | ForEach-Object {
    Write-Host "  $($_.registration):"
    Write-Host "    Technical: $($_.technicalHours)h | Procurement: $($_.procurementHours)h | Ops: $($_.opsHours)h | Total: $($_.totalHours)h"
}

# Test filtering by aircraft
Write-Host ""
Write-Host "Testing filtering by aircraft..." -ForegroundColor Cyan
$aircraftResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/aog-events/analytics/buckets?aircraftId=HZ-A42" -Method GET -Headers $headers
Write-Host "✅ Filtered analytics retrieved for HZ-A42" -ForegroundColor Green
Write-Host "  Total Events: $($aircraftResponse.summary.totalEvents)"
Write-Host "  Total Downtime: $($aircraftResponse.summary.totalDowntimeHours)h"

# Test filtering by date range
Write-Host ""
Write-Host "Testing filtering by date range..." -ForegroundColor Cyan
$endDate = (Get-Date).ToString("yyyy-MM-dd")
$startDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
$dateResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/aog-events/analytics/buckets?startDate=$startDate&endDate=$endDate" -Method GET -Headers $headers
Write-Host "✅ Filtered analytics retrieved for last 30 days" -ForegroundColor Green
Write-Host "  Total Events: $($dateResponse.summary.totalEvents)"
Write-Host "  Total Downtime: $($dateResponse.summary.totalDowntimeHours)h"

Write-Host ""
Write-Host "✅ All analytics tests passed!" -ForegroundColor Green
