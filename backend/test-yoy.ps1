# Test Year-over-Year Comparison Endpoint
# This script tests the YoY comparison API to verify 2025 data is available

Write-Host "`n🧪 Testing Year-over-Year Comparison Endpoint...`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3003/api"

# Test YoY comparison (default: last 30 days)
Write-Host "Testing YoY comparison (last 30 days)..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/dashboard/yoy-comparison" -Method Get -ContentType "application/json"

Write-Host "`nResponse:" -ForegroundColor Green
$response | ConvertTo-Json -Depth 5

Write-Host "`n✅ YoY Comparison Test Complete!`n" -ForegroundColor Green
Write-Host "Has Historical Data: $($response.hasHistoricalData)" -ForegroundColor Cyan
Write-Host "Current Period: $($response.currentPeriod.year)" -ForegroundColor Cyan
Write-Host "Previous Period: $($response.previousPeriod.year)" -ForegroundColor Cyan
Write-Host "Metrics Count: $($response.metrics.Count)`n" -ForegroundColor Cyan
