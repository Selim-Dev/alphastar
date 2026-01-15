# Test Year-over-Year Comparison Endpoint
# This script tests the YoY comparison API to verify 2025 data is available

Write-Host "`n🧪 Testing Year-over-Year Comparison Endpoint...`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3003/api"

# Login to get token
Write-Host "Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@alphastarav.com"
    password = "Admin@123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.accessToken

Write-Host "✅ Logged in successfully`n" -ForegroundColor Green

# Test YoY comparison (default: last 30 days)
Write-Host "Testing YoY comparison (last 30 days)..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}
$response = Invoke-RestMethod -Uri "$baseUrl/dashboard/yoy-comparison" -Method Get -Headers $headers -ContentType "application/json"

Write-Host "`nResponse:" -ForegroundColor Green
$response | ConvertTo-Json -Depth 5

Write-Host "`n✅ YoY Comparison Test Complete!`n" -ForegroundColor Green
Write-Host "Has Historical Data: $($response.hasHistoricalData)" -ForegroundColor Cyan
Write-Host "Current Period: $($response.currentPeriod.year)" -ForegroundColor Cyan
Write-Host "Previous Period: $($response.previousPeriod.year)" -ForegroundColor Cyan
Write-Host "Metrics Count: $($response.metrics.Count)`n" -ForegroundColor Cyan

# Display metrics
if ($response.metrics) {
    Write-Host "Metrics:" -ForegroundColor Yellow
    foreach ($metric in $response.metrics) {
        Write-Host "  - $($metric.name): $($metric.currentYear) (2026) vs $($metric.previousYear) (2025) | Change: $($metric.changePercentage)%" -ForegroundColor White
    }
    Write-Host ""
}
