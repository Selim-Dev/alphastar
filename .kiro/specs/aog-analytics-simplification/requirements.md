# Requirements Document

## Introduction

This document specifies requirements for simplifying the AOG (Aircraft On Ground) workflow and analytics to focus on accurate downtime tracking and client-ready visualizations. The client review concluded that the current 18-state workflow is too complex and should be simplified to focus on three primary downtime buckets: Technical, Procurement, and Ops involvement.

Additionally, this includes preparing the dashboard UI for upcoming aircraft status features with a "Coming Soon" section.

## Glossary

- **AOG**: Aircraft On Ground - an aircraft that cannot fly due to maintenance issues
- **Technical_Time**: Time spent on technical troubleshooting and installation work
- **Procurement_Time**: Time spent waiting for parts to arrive
- **Ops_Time**: Time spent on operational testing and validation
- **Total_Downtime**: Complete duration from AOG detection to aircraft return to service
- **MRO**: Maintenance, Repair, and Overhaul organization
- **Workflow_Timestamp**: Key milestone timestamp in the AOG resolution process
- **Internal_Cost**: Labor and man-hours costs
- **External_Cost**: Vendor and third-party service costs

---

## Requirements

### Requirement 1: Simplified AOG Workflow States

**User Story:** As an MCC operator, I want a simplified workflow with clear milestones, so that I can track AOG progress without unnecessary complexity.

#### Acceptance Criteria

1. THE System SHALL support the following workflow milestones: Reported, Procurement Requested, Available at Store, Issued Back, Installation Complete, Test Start, Up & Running
2. WHEN an AOG event is created, THE System SHALL record the Reported timestamp
3. WHEN parts are not needed, THE System SHALL allow skipping procurement milestones
4. WHEN parts are already in store, THE System SHALL allow immediate transition to Available at Store
5. WHEN operational testing is not required, THE System SHALL allow skipping Test Start milestone
6. THE System SHALL preserve existing detectedAt and clearedAt fields as authoritative start/end timestamps

### Requirement 2: Three-Bucket Downtime Calculation

**User Story:** As a manager, I want to see AOG downtime broken into Technical, Procurement, and Ops buckets, so that I can identify bottlenecks accurately.

#### Acceptance Criteria

1. THE System SHALL compute Technical_Time as: (Reported → Procurement Requested) + (Available at Store → Installation Complete)
2. THE System SHALL compute Procurement_Time as: (Procurement Requested → Available at Store)
3. THE System SHALL compute Ops_Time as: (Test Start → Up & Running)
4. WHEN no part is needed, THE System SHALL set Procurement_Time to 0
5. WHEN part is already in store, THE System SHALL set Procurement_Time to 0 or near-zero
6. WHEN no ops test is required, THE System SHALL set Ops_Time to 0
7. THE System SHALL compute Total_Downtime as: (Reported → Up & Running)
8. THE System SHALL store computed metrics on the AOG event record for reuse

### Requirement 3: AOG Workflow Timestamps

**User Story:** As an auditor, I want to see all key timestamps for an AOG event, so that I can verify the timeline.

#### Acceptance Criteria

1. THE System SHALL record timestamps for: Reported, Procurement Requested, Available at Store, Issued Back, Installation Complete, Test Start, Up & Running
2. THE System SHALL validate that timestamps are in chronological order
3. THE System SHALL allow null values for optional milestones (procurement, ops test)
4. THE System SHALL display timestamps in a timeline view
5. THE System SHALL preserve who recorded each timestamp

### Requirement 4: AOG Cost Tracking (Simplified)

**User Story:** As a finance manager, I want to see Internal and External costs for each AOG event, so that I can track maintenance expenses.

#### Acceptance Criteria

1. THE System SHALL track Internal_Cost (labor and man-hours)
2. THE System SHALL track External_Cost (vendor and third-party services)
3. THE System SHALL compute Total_Cost as Internal_Cost + External_Cost
4. THE System SHALL highlight Internal and External as the primary cost categories
5. THE System SHALL support optional cost breakdown fields for backward compatibility

### Requirement 5: AOG Analytics Page

**User Story:** As a manager, I want an AOG analysis page with accurate metrics, so that I can identify maintenance bottlenecks.

#### Acceptance Criteria

1. THE System SHALL provide filters: Aircraft, Fleet, Date Range
2. THE System SHALL display total downtime across selected filters
3. THE System SHALL display breakdown chart: Technical Hours vs Procurement Hours vs Ops Hours
4. THE System SHALL display aggregated metrics: sum and average downtime
5. THE System SHALL remove or archive irrelevant complexity (ports/finance/customs states)

### Requirement 6: Dashboard AOG Charts

**User Story:** As an executive, I want dashboard charts that match the analysis page, so that I see consistent metrics.

#### Acceptance Criteria

1. THE System SHALL display aircraft status distribution (AOG vs Scheduled Maintenance)
2. THE System SHALL display AOG downtime breakdown by the three buckets
3. THE System SHALL ensure dashboard and analysis page show consistent totals for the same filters
4. THE System SHALL update charts to use computed metrics from AOG records

### Requirement 7: Coming Soon Dashboard Section

**User Story:** As a product owner, I want a "Coming Soon" section on the dashboard, so that users know about upcoming features.

#### Acceptance Criteria

1. THE System SHALL display a "Coming Soon" section on the main dashboard
2. THE System SHALL show two placeholder tiles: "Aircraft at MRO" and "Vacation Plan"
3. THE System SHALL use consistent card styling with existing dashboard components
4. THE System SHALL require no backend API calls for these placeholders
5. THE System SHALL allow easy activation when features are ready

### Requirement 7a: Remove Operational Insights Components

**User Story:** As a product owner, I want to remove less valuable dashboard components, so that I can make room for more client-relevant AOG analytics.

#### Acceptance Criteria

1. THE System SHALL remove the OperationalEfficiencyPanel component from the dashboard
2. THE System SHALL remove the InsightsPanel (automated insights) component from the dashboard
3. THE System SHALL remove the CostEfficiencyCard component from the dashboard
4. THE System SHALL remove associated backend endpoints for operational insights
5. THE System SHALL remove associated backend endpoints for automated insights generation
6. THE System SHALL remove associated backend endpoints for cost efficiency metrics
7. THE System SHALL ensure dashboard layout remains balanced after component removal

### Requirement 7b: Dashboard Visual Excellence

**User Story:** As an executive, I want a visually stunning dashboard, so that presentations to stakeholders are impressive and professional.

#### Acceptance Criteria

1. THE System SHALL use a clean, modern card-based layout with consistent spacing
2. THE System SHALL implement smooth transitions and animations for data updates
3. THE System SHALL use a professional color palette with proper contrast ratios
4. THE System SHALL display charts with clear legends, labels, and tooltips
5. THE System SHALL ensure responsive design works beautifully on all screen sizes
6. THE System SHALL use loading skeletons for smooth perceived performance
7. THE System SHALL implement hover effects and interactive elements for better UX
8. THE System SHALL maintain visual hierarchy with proper typography and sizing

### Requirement 8: Seed Data for Demo

**User Story:** As a demo administrator, I want realistic seed data, so that analytics display meaningful results.

#### Acceptance Criteria

1. THE System SHALL seed multiple AOG events with variety: long procurement delays, immediate availability, no-part-needed resolutions, events requiring ops test
2. THE System SHALL seed aircraft status events for dashboard distribution
3. THE System SHALL ensure seeded timestamps produce correct computed hour breakdowns
4. THE System SHALL ensure filtering by aircraft/fleet/date range returns correct results
5. THE System SHALL create demo data that clearly shows different bottlenecks

### Requirement 9: AOG Import/Export (Updated)

**User Story:** As a data administrator, I want to import and export AOG events with the simplified model, so that I can bulk load data.

#### Acceptance Criteria

1. THE System SHALL support importing AOG events with milestone timestamps
2. THE System SHALL compute downtime metrics on import
3. THE System SHALL export AOG events including computed metrics
4. THE System SHALL validate timestamp ordering on import
5. THE System SHALL validate aircraft registration exists on import

### Requirement 10: Backward Compatibility

**User Story:** As a system administrator, I want existing AOG records to work correctly after the update, so that historical data is preserved.

#### Acceptance Criteria

1. THE System SHALL preserve existing AOG event fields
2. THE System SHALL compute metrics for historical events where possible
3. THE System SHALL handle missing milestone timestamps gracefully
4. THE System SHALL display legacy events with appropriate indicators
5. THE System SHALL NOT require mandatory migration of existing records

### Requirement 11: Documentation Updates

**User Story:** As a developer, I want updated documentation, so that I understand the simplified model.

#### Acceptance Criteria

1. THE System SHALL document the three-bucket downtime model
2. THE System SHALL document milestone timestamps and their meanings
3. THE System SHALL document special cases (no part needed, part in store, no ops test)
4. THE System SHALL update API documentation with new computed fields
5. THE System SHALL provide examples of correct downtime calculations

### Requirement 12: Documentation Cleanup

**User Story:** As a developer, I want outdated documentation removed, so that I don't reference deprecated workflows.

#### Acceptance Criteria

1. THE System SHALL create a new steering document explaining the simplified AOG analytics model
2. THE System SHALL remove the outdated aog-wo-vacation-revamp.md steering document
3. THE System SHALL remove the outdated aog-wo-vacation-walkthrough.md steering document
4. THE System SHALL ensure the new steering document covers: simplified workflow, three-bucket model, milestone timestamps, and migration notes
5. THE System SHALL update system-architecture.md to reference the new simplified model

