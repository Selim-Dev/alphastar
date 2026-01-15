# Test script to check YoY data availability
Write-Host "Testing Year-over-Year Data Availability" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Test current year data (2026)
Write-Host "1. Testing 2026 data (Dec 16, 2025 - Jan 15, 2026):" -ForegroundColor Yellow
$response2026 = Invoke-RestMethod -Uri "http://localhost:3003/api/dashboard/kpis?startDate=2025-12-16&endDate=2026-01-15" -Method Get
Write-Host "   Fleet Availability: $($response2026.fleetAvailabilityPercentage)%" -ForegroundColor Green
Write-Host "   Flight Hours: $($response2026.totalFlightHours)" -ForegroundColor Green
Write-Host "   Cycles: $($response2026.totalCycles)" -ForegroundColor Green
Write-Host ""

# Test previous year data (2025) - same date range
Write-Host "2. Testing 2025 data (Dec 16, 2024 - Jan 15, 2025):" -ForegroundColor Yellow
$response2025 = Invoke-RestMethod -Uri "http://localhost:3003/api/dashboard/kpis?startDate=2024-12-16&endDate=2025-01-15" -Method Get
Write-Host "   Fleet Availability: $($response2025.fleetAvailabilityPercentage)%" -ForegroundColor Green
Write-Host "   Flight Hours: $($response2025.totalFlightHours)" -ForegroundColor Green
Write-Host "   Cycles: $($response2025.totalCycles)" -ForegroundColor Green
Write-Host ""

# Test full year 2025
Write-Host "3. Testing full year 2025 (Jan 1 - Dec 31, 2025):" -ForegroundColor Yellow
$response2025Full = Invoke-RestMethod -Uri "http://localhost:3003/api/dashboard/kpis?startDate=2025-01-01&endDate=2025-12-31" -Method Get
Write-Host "   Fleet Availability: $($response2025Full.fleetAvailabilityPercentage)%" -ForegroundColor Green
Write-Host "   Flight Hours: $($response2025Full.totalFlightHours)" -ForegroundColor Green
Write-Host "   Cycles: $($response2025Full.totalCycles)" -ForegroundColor Green
Write-Host ""

# Test full year 2024
Write-Host "4. Testing full year 2024 (Jan 1 - Dec 31, 2024):" -ForegroundColor Yellow
$response2024Full = Invoke-RestMethod -Uri "http://localhost:3003/api/dashboard/kpis?startDate=2024-01-01&endDate=2024-12-31" -Method Get
Write-Host "   Fleet Availability: $($response2024Full.fleetAvailabilityPercentage)%" -ForegroundColor Green
Write-Host "   Flight Hours: $($response2024Full.totalFlightHours)" -ForegroundColor Green
Write-Host "   Cycles: $($response2024Full.totalCycles)" -ForegroundColor Green
Write-Host ""

Write-Host "Analysis:" -ForegroundColor Cyan
Write-Host "=========" -ForegroundColor Cyan
if ($response2026.totalFlightHours -gt 0) {
    Write-Host "✓ You have data for 2026 (current period)" -ForegroundColor Green
} else {
    Write-Host "✗ No data for 2026 (current period)" -ForegroundColor Red
}

if ($response2025.totalFlightHours -gt 0) {
    Write-Host "✓ You have data for 2025 (same date range as current)" -ForegroundColor Green
} else {
    Write-Host "✗ No data for 2025 (same date range) - This is why YoY shows zeros!" -ForegroundColor Red
}

if ($response2025Full.totalFlightHours -gt 0) {
    Write-Host "✓ You have data somewhere in 2025 (full year)" -ForegroundColor Green
    Write-Host "  Solution: The data exists but not in the Dec 16 - Jan 15 range" -ForegroundColor Yellow
} else {
    Write-Host "✗ No data at all in 2025" -ForegroundColor Red
}

if ($response2024Full.totalFlightHours -gt 0) {
    Write-Host "✓ You have data in 2024" -ForegroundColor Green
} else {
    Write-Host "✗ No data in 2024" -ForegroundColor Red
}
