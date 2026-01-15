# Seed 2025 Historical Data for YoY Comparison
# This script adds daily status and utilization records for 2025

Write-Host "`n📅 Seeding 2025 historical data for Year-over-Year comparison...`n" -ForegroundColor Cyan

npx ts-node -r tsconfig-paths/register src/scripts/seed-2025.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ 2025 data seeding completed successfully!`n" -ForegroundColor Green
} else {
    Write-Host "`n❌ Error seeding 2025 data. Check the output above for details.`n" -ForegroundColor Red
}
