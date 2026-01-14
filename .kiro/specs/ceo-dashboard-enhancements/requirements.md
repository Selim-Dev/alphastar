# Requirements Document

## Introduction

The Alpha Star Aviation KPIs Dashboard requires comprehensive enhancements to transform the current operational dashboard into a CEO-ready presentation tool with advanced operational insights. This feature adds dedicated sections to the existing Admin Dashboard for executive insights, fleet health scoring, performance comparisons, real-time alerts, operational efficiency metrics, maintenance forecasting, activity tracking, and visual enhancements that make the dashboard modern, impactful, and suitable for board-level presentations. All enhancements integrate into the existing DashboardPage accessible to Admin users, without modifying core business logic or creating separate views.

## Glossary

- **Fleet_Health_Score**: A composite metric (0-100) combining availability, AOG status, budget health, and maintenance efficiency
- **Period_Comparison**: Side-by-side metrics showing current period vs previous period with delta indicators
- **Alert_Panel**: A dedicated section displaying items requiring immediate executive attention
- **Sparkline**: A miniature trend chart embedded within a KPI card showing recent performance
- **Target_Line**: A reference line on charts indicating performance targets or thresholds
- **Status_Summary_Bar**: A horizontal bar showing fleet distribution by status (active, AOG, maintenance)
- **Cost_Efficiency_Metric**: Calculated values like cost per flight hour and cost per cycle
- **Executive_Summary**: A condensed view of all critical KPIs designed for quick executive review
- **MTBF**: Mean Time Between Failures - average time between equipment failures
- **MTTR**: Mean Time To Repair - average time to restore equipment to operational status
- **Dispatch_Reliability**: Percentage of flights departing without technical delays
- **Activity_Feed**: Chronological list of recent system events and updates
- **Maintenance_Forecast**: Upcoming scheduled maintenance based on utilization trends
- **Data_Quality_Indicator**: Visual indicator showing data freshness and completeness
- **Defect_Pattern**: Analysis of recurring issues by ATA chapter with trend visualization
- **YoY_Comparison**: Year-over-Year comparison of key metrics

## Requirements

### Requirement 1

**User Story:** As a CEO, I want to see a Fleet Health Score on the dashboard, so that I can instantly understand overall fleet performance with a single metric.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display a Fleet_Health_Score as a prominent circular gauge with value 0-100
2. WHEN computing Fleet_Health_Score THEN the KPI_Dashboard SHALL calculate a weighted composite of availability (40%), AOG impact (25%), budget health (20%), and maintenance efficiency (15%)
3. WHEN Fleet_Health_Score is below 70 THEN the KPI_Dashboard SHALL display the gauge in warning colors (amber/red)
4. WHEN Fleet_Health_Score is 70-89 THEN the KPI_Dashboard SHALL display the gauge in caution colors (yellow)
5. WHEN Fleet_Health_Score is 90 or above THEN the KPI_Dashboard SHALL display the gauge in healthy colors (green)

### Requirement 2

**User Story:** As a CEO, I want to see period-over-period comparisons on KPI cards, so that I can quickly understand performance trends without navigating to detailed views.

#### Acceptance Criteria

1. WHEN a KPI card renders THEN the KPI_Dashboard SHALL display the current value and a delta indicator showing change from previous period
2. WHEN the delta is positive and favorable THEN the KPI_Dashboard SHALL display an upward arrow with green color
3. WHEN the delta is negative and unfavorable THEN the KPI_Dashboard SHALL display a downward arrow with red color
4. WHEN computing period comparison THEN the KPI_Dashboard SHALL compare current period to the same-length previous period (e.g., last 30 days vs prior 30 days)
5. WHEN the previous period has no data THEN the KPI_Dashboard SHALL display "N/A" for the delta indicator

### Requirement 3

**User Story:** As a CEO, I want to see sparkline trends on KPI cards, so that I can visualize recent performance patterns at a glance.

#### Acceptance Criteria

1. WHEN a KPI card renders THEN the KPI_Dashboard SHALL display a small sparkline chart showing the last 7 data points
2. WHEN the sparkline trend is upward THEN the KPI_Dashboard SHALL render the line in green
3. WHEN the sparkline trend is downward THEN the KPI_Dashboard SHALL render the line in red
4. WHEN the sparkline trend is flat THEN the KPI_Dashboard SHALL render the line in neutral color
5. WHEN hovering over the sparkline THEN the KPI_Dashboard SHALL display a tooltip with the exact values

### Requirement 4

**User Story:** As a CEO, I want to see an Alerts Panel on the dashboard, so that I can immediately identify items requiring my attention.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display an Alerts Panel section with categorized alerts
2. WHEN there are active AOG events THEN the KPI_Dashboard SHALL display them as critical alerts with red indicators
3. WHEN there are overdue work orders THEN the KPI_Dashboard SHALL display them as warning alerts with amber indicators
4. WHEN aircraft availability is below 85% THEN the KPI_Dashboard SHALL display an alert for that aircraft
5. WHEN budget utilization exceeds 90% for any clause THEN the KPI_Dashboard SHALL display a budget alert
6. WHEN there are no alerts THEN the KPI_Dashboard SHALL display a "All Systems Normal" message with green indicator

### Requirement 5

**User Story:** As a CEO, I want to see a Fleet Status Summary Bar, so that I can visualize the distribution of aircraft status at a glance.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display a horizontal Status_Summary_Bar showing aircraft distribution
2. WHEN rendering the bar THEN the KPI_Dashboard SHALL show segments for Active (green), In Maintenance (amber), and AOG (red) aircraft
3. WHEN hovering over a segment THEN the KPI_Dashboard SHALL display a tooltip with count and percentage
4. WHEN clicking a segment THEN the KPI_Dashboard SHALL filter the availability view to show only aircraft in that status
5. WHEN the bar renders THEN the KPI_Dashboard SHALL display the total aircraft count prominently

### Requirement 6

**User Story:** As a CEO, I want to see target lines on trend charts, so that I can compare actual performance against organizational targets.

#### Acceptance Criteria

1. WHEN the availability trend chart renders THEN the KPI_Dashboard SHALL display a horizontal target line at 92% (configurable)
2. WHEN the budget chart renders THEN the KPI_Dashboard SHALL display a target line representing planned budget
3. WHEN actual values are below target THEN the KPI_Dashboard SHALL highlight the gap visually
4. WHEN actual values exceed target THEN the KPI_Dashboard SHALL display the achievement in green
5. WHEN hovering over the target line THEN the KPI_Dashboard SHALL display a tooltip explaining the target

### Requirement 7

**User Story:** As a CEO, I want to see cost efficiency metrics, so that I can understand operational cost performance per unit of utilization.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display Cost Per Flight Hour metric
2. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display Cost Per Cycle metric
3. WHEN computing cost metrics THEN the KPI_Dashboard SHALL use total maintenance and operational costs divided by utilization
4. WHEN cost metrics increase from previous period THEN the KPI_Dashboard SHALL display a warning indicator
5. WHEN cost data is unavailable THEN the KPI_Dashboard SHALL display "Insufficient Data" with guidance

### Requirement 8

**User Story:** As a CEO, I want to see a Fleet Comparison section, so that I can identify best and worst performing aircraft.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display a Fleet Comparison section with top 3 and bottom 3 performers
2. WHEN ranking aircraft THEN the KPI_Dashboard SHALL use availability percentage as the primary metric
3. WHEN displaying performers THEN the KPI_Dashboard SHALL show registration, availability %, and trend indicator
4. WHEN clicking an aircraft in the comparison THEN the KPI_Dashboard SHALL navigate to that aircraft's detail page
5. WHEN all aircraft have equal availability THEN the KPI_Dashboard SHALL use utilization as a tiebreaker

### Requirement 9

**User Story:** As a CEO, I want the dashboard to have a modern, executive-appropriate visual design, so that it makes a strong impression during board presentations.

#### Acceptance Criteria

1. WHEN the dashboard renders THEN the KPI_Dashboard SHALL use a clean, data-dense layout with clear visual hierarchy
2. WHEN displaying numbers THEN the KPI_Dashboard SHALL use large, bold typography for primary metrics
3. WHEN displaying sections THEN the KPI_Dashboard SHALL use subtle card elevation and consistent spacing
4. WHEN animations play THEN the KPI_Dashboard SHALL use smooth, professional transitions without excessive motion
5. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display a subtle loading skeleton before data appears

### Requirement 10

**User Story:** As a CEO, I want to export an executive summary report, so that I can share dashboard insights with stakeholders who don't have system access.

#### Acceptance Criteria

1. WHEN a user clicks Export Executive Summary THEN the KPI_Dashboard SHALL generate a PDF report
2. WHEN generating the report THEN the KPI_Dashboard SHALL include Fleet Health Score, all KPIs, alerts, and key charts
3. WHEN generating the report THEN the KPI_Dashboard SHALL include the Alpha Star Aviation logo and report date
4. WHEN generating the report THEN the KPI_Dashboard SHALL format data for print-friendly presentation
5. WHEN the export completes THEN the KPI_Dashboard SHALL download the file with naming convention "AlphaStar-Executive-Summary-YYYY-MM-DD.pdf"

### Requirement 11

**User Story:** As a maintenance manager, I want to see operational efficiency metrics, so that I can track maintenance performance and identify improvement opportunities.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display Mean Time Between Failures (MTBF) metric calculated from AOG events
2. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display Mean Time To Repair (MTTR) metric calculated from AOG event durations
3. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display Dispatch Reliability percentage based on technical delays
4. WHEN MTTR exceeds 24 hours THEN the KPI_Dashboard SHALL display a warning indicator
5. WHEN computing efficiency metrics THEN the KPI_Dashboard SHALL use data from the selected date range

### Requirement 12

**User Story:** As a maintenance planner, I want to see upcoming maintenance indicators, so that I can proactively plan resources and minimize aircraft downtime.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display a Maintenance Forecast section showing upcoming scheduled maintenance
2. WHEN maintenance is due within 7 days THEN the KPI_Dashboard SHALL display it as an info-level alert
3. WHEN maintenance is due within 3 days THEN the KPI_Dashboard SHALL display it as a warning-level alert
4. WHEN displaying maintenance items THEN the KPI_Dashboard SHALL show aircraft registration, maintenance type, and due date
5. WHEN clicking a maintenance item THEN the KPI_Dashboard SHALL navigate to the aircraft detail page

### Requirement 13

**User Story:** As a user, I want to see a recent activity feed, so that I can quickly understand what changes have occurred in the system.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display a Recent Activity section showing the last 10 system events
2. WHEN displaying activities THEN the KPI_Dashboard SHALL show event type, description, timestamp, and user who made the change
3. WHEN an activity relates to an aircraft THEN the KPI_Dashboard SHALL display the aircraft registration
4. WHEN clicking an activity THEN the KPI_Dashboard SHALL navigate to the relevant detail page
5. WHEN no recent activities exist THEN the KPI_Dashboard SHALL display "No recent activity" message

### Requirement 14

**User Story:** As a CEO, I want to see automated insights and trend analysis, so that I can quickly understand significant changes without manual analysis.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display an Insights section with automatically generated observations
2. WHEN availability changes by more than 5% from previous period THEN the KPI_Dashboard SHALL generate an insight highlighting the change
3. WHEN an aircraft has been in maintenance for more than 7 consecutive days THEN the KPI_Dashboard SHALL generate an insight
4. WHEN budget utilization exceeds 80% before month 9 THEN the KPI_Dashboard SHALL generate a budget pacing insight
5. WHEN displaying insights THEN the KPI_Dashboard SHALL categorize them as positive (green), neutral (blue), or concerning (amber)

### Requirement 15

**User Story:** As a CEO, I want to see year-over-year comparisons, so that I can understand long-term performance trends.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display YoY comparison for key metrics (availability, utilization, costs)
2. WHEN computing YoY comparison THEN the KPI_Dashboard SHALL compare current period to the same period in the previous year
3. WHEN YoY improvement exceeds 5% THEN the KPI_Dashboard SHALL display a positive indicator with green styling
4. WHEN YoY decline exceeds 5% THEN the KPI_Dashboard SHALL display a negative indicator with red styling
5. WHEN previous year data is unavailable THEN the KPI_Dashboard SHALL display "No historical data" message

### Requirement 16

**User Story:** As a maintenance manager, I want to see defect pattern analysis, so that I can identify recurring issues and prioritize corrective actions.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display a Defect Patterns section showing top 5 ATA chapters by discrepancy count
2. WHEN displaying defect patterns THEN the KPI_Dashboard SHALL show ATA chapter, description, count, and trend indicator
3. WHEN a defect pattern shows increasing trend THEN the KPI_Dashboard SHALL highlight it with warning styling
4. WHEN clicking a defect pattern THEN the KPI_Dashboard SHALL navigate to the discrepancies page filtered by that ATA chapter
5. WHEN no discrepancies exist THEN the KPI_Dashboard SHALL display "No defect patterns detected" message

### Requirement 17

**User Story:** As a user, I want to see data quality indicators, so that I can trust the accuracy of the displayed metrics.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the KPI_Dashboard SHALL display a data freshness indicator showing last data update timestamp
2. WHEN data is older than 24 hours THEN the KPI_Dashboard SHALL display a stale data warning
3. WHEN aircraft are missing daily status entries THEN the KPI_Dashboard SHALL display a data completeness warning
4. WHEN hovering over the data quality indicator THEN the KPI_Dashboard SHALL display detailed breakdown of data coverage
5. WHEN data quality issues exist THEN the KPI_Dashboard SHALL provide guidance on how to resolve them
