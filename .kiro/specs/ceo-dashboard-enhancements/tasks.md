# Implementation Plan

## 1. Backend: Executive Dashboard Endpoints

- [x] 1.1 Create Fleet Health Score endpoint
  - Add `getFleetHealthScore()` method to DashboardService
  - Implement weighted composite calculation (availability 40%, AOG 25%, budget 20%, maintenance 15%)
  - Add `/dashboard/health-score` GET endpoint to DashboardController
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.2 Create Alerts endpoint
  - Add `getExecutiveAlerts()` method to DashboardService
  - Query active AOG events, overdue work orders, low availability aircraft, budget overruns
  - Categorize alerts by priority (critical, warning, info)
  - Add `/dashboard/alerts` GET endpoint
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 1.3 Create Period Comparison endpoint
  - Add `getPeriodComparison()` method to DashboardService
  - Calculate current vs previous period KPIs with deltas
  - Add `/dashboard/period-comparison` GET endpoint
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 1.4 Create Cost Efficiency endpoint
  - Add `getCostEfficiency()` method to DashboardService
  - Calculate cost per flight hour and cost per cycle from budget and utilization data
  - Add `/dashboard/cost-efficiency` GET endpoint
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 1.5 Create Fleet Comparison endpoint
  - Add `getFleetComparison()` method to DashboardService
  - Query and rank aircraft by availability, return top 3 and bottom 3
  - Add `/dashboard/fleet-comparison` GET endpoint
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [x] 1.6 Create Operational Efficiency endpoint
  - Add `getOperationalEfficiency()` method to DashboardService
  - Calculate MTBF from AOG events (time between failures)
  - Calculate MTTR from AOG event durations (detected to cleared)
  - Calculate dispatch reliability from daily status data
  - Add `/dashboard/operational-efficiency` GET endpoint
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 1.7 Create Maintenance Forecast endpoint
  - Add `getMaintenanceForecast()` method to DashboardService
  - Query work orders with due dates in next 30 days
  - Categorize by priority based on days until due
  - Add `/dashboard/maintenance-forecast` GET endpoint
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 1.8 Create Recent Activity endpoint
  - Add `getRecentActivity()` method to DashboardService
  - Aggregate recent events from AOG, work orders, daily status
  - Return last 10 events sorted by timestamp
  - Add `/dashboard/recent-activity` GET endpoint
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 1.9 Create Insights endpoint
  - Add `getInsights()` method to DashboardService
  - Generate insights based on availability changes, maintenance duration, budget pacing
  - Categorize insights as positive, neutral, or concerning
  - Add `/dashboard/insights` GET endpoint
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 1.10 Create Year-over-Year Comparison endpoint
  - Add `getYoYComparison()` method to DashboardService
  - Compare current period metrics to same period last year
  - Calculate change percentages and trends
  - Add `/dashboard/yoy-comparison` GET endpoint
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 1.11 Create Defect Patterns endpoint
  - Add `getDefectPatterns()` method to DashboardService
  - Aggregate discrepancies by ATA chapter
  - Calculate trends by comparing to previous period
  - Add `/dashboard/defect-patterns` GET endpoint
  - _Requirements: 16.1, 16.2, 16.3_

- [x] 1.12 Create Data Quality endpoint
  - Add `getDataQuality()` method to DashboardService
  - Check last update timestamps across collections
  - Calculate data coverage percentages
  - Identify aircraft missing data
  - Add `/dashboard/data-quality` GET endpoint
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ]* 1.13 Write property test for Fleet Health Score bounds
  - **Property 1: Fleet Health Score Bounds**
  - **Validates: Requirements 1.1, 1.2**
  - Test that score is always between 0 and 100 for any input combination
  - _Requirements: 1.1, 1.2_

- [ ]* 1.14 Write property test for Fleet Health Score weights
  - **Property 2: Fleet Health Score Component Weights**
  - **Validates: Requirements 1.2**
  - Test that component weights always sum to 1.0
  - _Requirements: 1.2_

- [ ]* 1.15 Write property test for Period Comparison symmetry
  - **Property 3: Period Comparison Symmetry**
  - **Validates: Requirements 2.4**
  - Test that current and previous period lengths are always equal
  - _Requirements: 2.4_

- [ ]* 1.16 Write property test for Alert categorization
  - **Property 4: Alert Categorization Completeness**
  - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**
  - Test that every alert has exactly one priority level
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ]* 1.17 Write property test for Status Summary Bar totals
  - **Property 5: Status Summary Bar Totals**
  - **Validates: Requirements 5.2, 5.5**
  - Test that segment counts always sum to total aircraft count
  - _Requirements: 5.2, 5.5_

- [ ]* 1.18 Write property test for Cost Efficiency calculation
  - **Property 6: Cost Efficiency Calculation**
  - **Validates: Requirements 7.3**
  - Test that cost per flight hour equals total cost / total flight hours
  - _Requirements: 7.3_

- [ ]* 1.19 Write property test for Fleet Comparison ranking
  - **Property 7: Fleet Comparison Ranking**
  - **Validates: Requirements 8.2**
  - Test that top performers have availability >= fleet average
  - _Requirements: 8.2_

- [ ]* 1.20 Write property test for MTTR warning threshold
  - **Property 8: MTTR Warning Threshold**
  - **Validates: Requirements 11.4**
  - Test that warning is true iff MTTR > 24 hours
  - _Requirements: 11.4_

- [ ]* 1.21 Write property test for Maintenance Forecast priority
  - **Property 9: Maintenance Forecast Priority**
  - **Validates: Requirements 12.2, 12.3**
  - Test priority assignment based on days until due
  - _Requirements: 12.2, 12.3_

- [ ]* 1.22 Write property test for Activity Feed limit
  - **Property 10: Activity Feed Limit**
  - **Validates: Requirements 13.1**
  - Test that activities array never exceeds 10 items
  - _Requirements: 13.1_

- [ ]* 1.23 Write property test for Insight categorization
  - **Property 11: Insight Categorization**
  - **Validates: Requirements 14.5**
  - Test that every insight has exactly one category
  - _Requirements: 14.5_

- [ ]* 1.24 Write property test for YoY trend calculation
  - **Property 12: YoY Trend Calculation**
  - **Validates: Requirements 15.3, 15.4**
  - Test that trend is not 'flat' when change > 5%
  - _Requirements: 15.3, 15.4_

- [ ]* 1.25 Write property test for Defect Pattern ordering
  - **Property 13: Defect Pattern Ordering**
  - **Validates: Requirements 16.1**
  - Test that patterns are ordered by count descending
  - _Requirements: 16.1_

- [ ]* 1.26 Write property test for Data Staleness threshold
  - **Property 14: Data Staleness Threshold**
  - **Validates: Requirements 17.2**
  - Test that isStale is true iff lastUpdate > 24 hours ago
  - _Requirements: 17.2_

- [ ]* 1.27 Write unit tests for new dashboard service methods
  - Test Fleet Health Score calculation with edge cases
  - Test alert categorization logic
  - Test period comparison date calculations
  - Test MTBF/MTTR calculations
  - Test insight generation logic
  - _Requirements: 1.2, 4.2, 2.4, 11.2, 14.2_

## 2. Frontend: New UI Components

- [x] 2.1 Create FleetHealthGauge component
  - Circular gauge with animated fill (0-100)
  - Color transitions based on score thresholds
  - Display score value and "Fleet Health" label
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [x] 2.2 Create Sparkline component
  - Mini trend chart (80x24px) for embedding in KPI cards
  - Accept data array and render smooth curve
  - Color based on trend direction (green up, red down)
  - Tooltip on hover showing values
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.3 Create AlertsPanel component
  - Grouped alerts by priority (critical, warning, info)
  - Each alert shows icon, title, description, action link
  - Collapsible sections, max height with scroll
  - "All Systems Normal" state when no alerts
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 2.4 Create StatusSummaryBar component
  - Horizontal bar showing aircraft distribution
  - Segments for Active (green), Maintenance (amber), AOG (red)
  - Hover tooltips with count and percentage
  - Click handler for filtering
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2.5 Create KPICardEnhanced component
  - Extend existing KPICard with sparkline and delta indicator
  - Delta shows arrow (up/down) with percentage change
  - Color coding for favorable/unfavorable changes
  - _Requirements: 2.1, 2.2, 2.3, 3.1_

- [x] 2.6 Create FleetComparison component
  - Display top 3 and bottom 3 performers side by side
  - Show registration, availability %, trend indicator
  - Click to navigate to aircraft detail
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 2.7 Create CostEfficiencyCard component
  - Display cost per flight hour and cost per cycle
  - Include trend indicator vs previous period
  - Warning styling when costs increase
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [x] 2.8 Add target line support to TrendChart
  - Extend existing TrendChart to accept target value prop
  - Render dashed horizontal line at target
  - Add tooltip explaining target
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2.9 Create OperationalEfficiencyPanel component
  - Display MTBF, MTTR, and dispatch reliability metrics
  - Warning styling when MTTR exceeds 24 hours
  - Trend indicators for each metric
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 2.10 Create MaintenanceForecast component
  - List upcoming maintenance items with priority badges
  - Show aircraft registration, type, and due date
  - Click to navigate to aircraft detail
  - Color coding by priority (info/warning/critical)
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 2.11 Create RecentActivityFeed component
  - Chronological list of recent events
  - Event type icons and descriptions
  - Timestamps and user attribution
  - Click to navigate to relevant page
  - "No recent activity" empty state
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 2.12 Create InsightsPanel component
  - Display automatically generated insights
  - Color coding by category (positive/neutral/concerning)
  - Metric change indicators where applicable
  - Collapsible for space efficiency
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 2.13 Create YoYComparison component
  - Side-by-side current vs previous year metrics
  - Change percentage with trend arrows
  - Green/red styling based on favorable/unfavorable
  - "No historical data" fallback state
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 2.14 Create DefectPatterns component
  - Bar chart or list of top 5 ATA chapters
  - Count and trend indicator for each
  - Warning highlight for increasing trends
  - Click to filter discrepancies page
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 2.15 Create DataQualityIndicator component
  - Badge showing data freshness status
  - Stale data warning when > 24 hours
  - Hover tooltip with detailed breakdown
  - Link to guidance for resolving issues
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

## 3. Frontend: Dashboard Integration

- [x] 3.1 Create useDashboardExecutive hook (partial)
  - Add queries for health-score, alerts, period-comparison, cost-efficiency, fleet-comparison
  - Handle loading and error states
  - _Requirements: 1.1, 4.1, 2.1, 7.1, 8.1_

- [x] 3.1.1 Extend useDashboardExecutive hook with remaining queries
  - Add queries for operational-efficiency, maintenance-forecast, recent-activity, insights, yoy-comparison, defect-patterns, data-quality
  - Handle loading and error states
  - _Requirements: 11.1, 12.1, 13.1, 14.1, 15.1, 16.1, 17.1_

- [x] 3.2 Update DashboardPage with executive sections
  - Add Fleet Health Gauge in prominent position (top left)
  - Add Alerts Panel (top right)
  - Add Status Summary Bar (full width below header)
  - Replace KPICard with KPICardEnhanced
  - Add Cost Efficiency Cards section
  - Add Fleet Comparison section
  - Add target lines to existing trend charts
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 3.3 Update DashboardPage with operational sections
  - Add Operational Efficiency Panel section
  - Add Maintenance Forecast section
  - Add Recent Activity Feed section
  - Add Insights Panel section
  - Add Year-over-Year Comparison section
  - Add Defect Patterns section
  - Add Data Quality Indicator to header
  - _Requirements: 11.1, 12.1, 13.1, 14.1, 15.1, 16.1, 17.1_

- [x] 3.4 Add loading skeletons for new sections
  - Skeleton for Fleet Health Gauge ✓
  - Skeleton for Alerts Panel ✓
  - Skeleton for Status Summary Bar ✓
  - Skeleton for Fleet Comparison ✓
  - Skeleton for KPICardEnhanced ✓
  - Skeleton for Operational Efficiency Panel ✓
  - Skeleton for Maintenance Forecast ✓
  - Skeleton for Recent Activity Feed ✓
  - _Requirements: 9.5_

## 4. PDF Export Feature

- [x] 4.1 Create ExecutivePDFExport component
  - Button to trigger PDF generation
  - Use html2canvas + jsPDF for client-side generation
  - Include Alpha Star logo, date, all KPIs, charts
  - Include operational efficiency metrics and insights
  - Format for print-friendly A4 layout
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 4.2 Add PDF export button to dashboard header
  - Position next to existing export button
  - Loading state during generation
  - Download with proper filename
  - _Requirements: 10.1, 10.5_

## 5. Checkpoint - Verify Core Features

- [x] 5.1 Ensure all tests pass, ask the user if questions arise.

## 6. Dashboard Layout Organization

- [x] 6.1 Organize dashboard into logical sections
  - Executive Overview section (Fleet Health, Alerts, Status Bar)
  - KPI Metrics section (Enhanced KPI cards with sparklines)
  - Operational Insights section (Efficiency, Defect Patterns, Insights)
  - Activity & Forecast section (Recent Activity, Maintenance Forecast)
  - Comparison section (Fleet Comparison, YoY Comparison)
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 6.2 Add collapsible sections for space management
  - Allow users to collapse/expand dashboard sections
  - Remember user preferences in localStorage
  - _Requirements: 9.1_

## 7. Final Polish

- [x] 7.1 Add smooth animations to new components
  - Gauge fill animation on load ✓
  - Sparkline draw animation ✓
  - Alert panel slide-in ✓
  - Activity feed fade-in ✓
  - _Requirements: 9.4_

- [x] 7.2 Verify responsive behavior
  - Test on desktop, tablet, mobile viewports
  - Ensure components stack properly on smaller screens
  - Ensure all new sections are mobile-friendly
  - _Requirements: 9.1_

- [ ]* 7.3 Write integration tests for dashboard page
  - Test that all new sections render
  - Test navigation from Fleet Comparison
  - Test navigation from Defect Patterns
  - Test PDF export generates file
  - _Requirements: 8.4, 10.1, 16.4_

## 8. Documentation Update

- [x] 8.1 Update steering document with new dashboard features
  - Add new API endpoints to `.kiro/steering/system-architecture.md`
  - Document Fleet Health Score formula and component weights
  - Add new frontend components to component reference
  - Document alert priority levels and thresholds
  - Add operational efficiency metrics (MTBF, MTTR) calculations
  - Update dashboard KPIs section with new metrics
  - _Requirements: All_

## 9. Final Checkpoint

- [x] 9.1 Ensure all tests pass, ask the user if questions arise.
