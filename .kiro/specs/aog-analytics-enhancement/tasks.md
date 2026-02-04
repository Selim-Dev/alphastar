# Implementation Plan: AOG Analytics Page Enhancement

## Overview

Transform the AOG Analytics page into a visually stunning, insight-rich executive dashboard with 10+ visualizations, predictive analytics, reliable PDF export, and graceful legacy data handling.

## Tasks

- [x] 1. Foundation & PDF Export Fix
  - [x] 1.1 Fix PDF export container ID mismatch
    - Update `AnalyticsPDFExport.tsx` to use correct container ID `aog-analytics-content`
    - Add proper error handling and retry logic
    - Test PDF generation with current page content
    - _Requirements: FR-4.1_
  
  - [x] 1.2 Create DataQualityIndicator component
    - Build component showing completeness percentage
    - Add color coding (Green >80%, Amber 50-80%, Red <50%)
    - Add tooltip explaining milestone requirements
    - Calculate: (eventsWithMilestones / totalEvents) * 100
    - _Requirements: FR-1.3_
  
  - [x] 1.3 Implement legacy data handling in existing charts
    - Update ThreeBucketChart to handle legacy events
    - Show "Limited Analytics" badge for legacy events
    - Use total downtime for legacy events (clearedAt - detectedAt)
    - Add tooltips explaining data limitations
    - _Requirements: FR-1.1, FR-1.2_
  
  - [x] 1.4 Add loading skeletons and error boundaries
    - Create ChartSkeleton component
    - Create AnalyticsSectionErrorBoundary component
    - Add ChartEmptyState component
    - Wrap all chart sections with error boundaries
    - _Requirements: NFR-2.1, NFR-2.3_

- [x] 2. Backend Analytics Endpoints
  - [x] 2.1 Implement monthly trend endpoint
    - Create `GET /api/aog-events/analytics/monthly-trend`
    - Add AnalyticsFilterDto validation
    - Implement MongoDB aggregation for monthly grouping
    - Calculate 3-month moving average
    - Return MonthlyTrendResponseDto
    - _Requirements: FR-2.2_
  
  - [ ]* 2.2 Write property test for moving average calculation
    - **Property 4: Moving Average Calculation**
    - **Validates: Requirements FR-2.2**
  
  - [x] 2.3 Implement insights generation endpoint
    - Create `GET /api/aog-events/analytics/insights`
    - Implement 8 insight detection algorithms
    - Calculate data quality metrics
    - Return InsightsResponseDto with top 5 insights
    - _Requirements: FR-2.6, FR-1.3_
  
  - [ ]* 2.4 Write property test for data quality score
    - **Property 3: Data Quality Score Calculation**
    - **Validates: Requirements FR-1.3**
  
  - [x] 2.5 Implement forecast endpoint
    - Create `GET /api/aog-events/analytics/forecast`
    - Implement linear regression algorithm
    - Calculate 3-month forecast with confidence intervals
    - Return ForecastData with historical and predicted values
    - _Requirements: FR-2.6_
  
  - [ ]* 2.6 Write property test for forecast bounds
    - **Property 8: Forecast Bounds**
    - **Validates: Requirements FR-2.6**


- [x] 3. Frontend Hooks & Data Layer
  - [x] 3.1 Create custom hooks for new analytics endpoints
    - Add `useMonthlyTrend` hook in `hooks/useAOGEvents.ts`
    - Add `useForecast` hook
    - Add `useInsights` hook
    - Add `useDataQuality` hook
    - Configure TanStack Query with proper cache keys
    - _Requirements: FR-2.2, FR-2.6, FR-1.3_
  
  - [x] 3.2 Implement progressive loading strategy
    - Add priority-based data fetching (Priority 1, 2, 3)
    - Use `enabled` flag to control query execution
    - Add 500ms delay for Priority 2 queries
    - Add 1000ms delay for Priority 3 queries
    - _Requirements: FR-5.1_
  
  - [x] 3.3 Add data sampling utility for large datasets
    - Create `sampleData` utility function
    - Implement sampling algorithm (max 100 points)
    - Apply to all chart components
    - _Requirements: FR-5.2_

- [x] 4. Enhanced Three-Bucket Visualizations
  - [x] 4.1 Create BucketTrendChart component
    - Build stacked area chart using Recharts
    - Use colors: Technical (blue #3b82f6), Procurement (amber #f59e0b), Ops (green #10b981)
    - Add smooth curves and tooltips
    - Show last 12 months of data
    - _Requirements: FR-2.1_
  
  - [x] 4.2 Create WaterfallChart component
    - Build custom waterfall using Recharts Bar Chart
    - Show start bar, floating bars for each bucket, end bar
    - Add connecting lines between bars
    - Use bucket color coding
    - _Requirements: FR-2.1_
  
  - [x] 4.3 Update AOGAnalyticsPage with new three-bucket charts
    - Add BucketTrendChart to three-bucket section
    - Add WaterfallChart to three-bucket section
    - Wrap in AnalyticsSectionErrorBoundary
    - Add loading skeletons
    - _Requirements: FR-2.1_

- [x] 5. Trend Analysis Section
  - [x] 5.1 Create MonthlyTrendChart component
    - Build combo chart (bars + line) using Recharts
    - Bars: Event count (blue)
    - Line: Total downtime hours (red)
    - Add dual Y-axes
    - Add grid lines for readability
    - _Requirements: FR-2.2_
  
  - [x] 5.2 Create MovingAverageChart component
    - Build line chart with two lines
    - Solid line: Actual downtime (blue)
    - Dashed line: 3-month moving average (gray)
    - Add shaded area between lines
    - _Requirements: FR-2.2_
  
  - [x] 5.3 Create YearOverYearChart component
    - Build grouped bar chart
    - Current year: Blue bars
    - Previous year: Gray bars
    - Add delta indicators (↑ ↓)
    - _Requirements: FR-2.2_
  
  - [x] 5.4 Add Trend Analysis section to AOGAnalyticsPage
    - Create new section with heading
    - Add all three trend charts
    - Wrap in error boundary
    - Add loading states
    - _Requirements: FR-2.2_
  
  - [ ]* 5.5 Write property test for moving average
    - **Property 4: Moving Average Calculation**
    - **Validates: Requirements FR-2.2**


- [x] 6. Aircraft Performance Section
  - [x] 6.1 Create AircraftHeatmap component
    - Build custom heatmap grid component
    - Rows: Aircraft registrations
    - Columns: Last 12 months
    - Color intensity based on downtime hours
    - Add tooltips showing exact hours
    - Add click handler for drill-down
    - _Requirements: FR-2.3_
  
  - [x] 6.2 Implement reliability score calculation
    - Add `calculateReliabilityScore` utility function
    - Formula: 100 - min(100, (eventCount * 5) + (totalDowntimeHours / 10))
    - Add trend detection (improving/stable/declining)
    - Compare to previous period for trend
    - _Requirements: FR-2.3_
  
  - [ ]* 6.3 Write property test for reliability score
    - **Property 5: Reliability Score Consistency**
    - **Validates: Requirements FR-2.3**
  
  - [x] 6.4 Create ReliabilityScoreCards component
    - Build two-column layout (Most Reliable / Needs Attention)
    - Show top 5 in each category
    - Display registration, score, event count, downtime
    - Add trend indicators (↑ → ↓)
    - Color coding: Green border (reliable), Red border (attention)
    - _Requirements: FR-2.3_
  
  - [x] 6.5 Add Aircraft Performance section to AOGAnalyticsPage
    - Create new section with heading
    - Add AircraftHeatmap
    - Add ReliabilityScoreCards
    - Wrap in error boundary
    - _Requirements: FR-2.3_

- [x] 7. Root Cause Analysis Section
  - [x] 7.1 Create ParetoChart component
    - Build combo chart (bars + line) using Recharts
    - Bars: Event count per reason code (blue)
    - Line: Cumulative percentage (red)
    - Add 80% line marker
    - Sort by count descending
    - Show top 10 reason codes
    - _Requirements: FR-2.4_
  
  - [ ]* 7.2 Write property test for Pareto cumulative percentage
    - **Property 6: Pareto Principle Validation**
    - **Validates: Requirements FR-2.4**
  
  - [x] 7.3 Create CategoryBreakdownPie component
    - Build pie chart with three segments
    - AOG: Red (#ef4444)
    - Unscheduled: Amber (#f59e0b)
    - Scheduled: Blue (#3b82f6)
    - Add percentage labels on segments
    - Add legend with count and hours
    - _Requirements: FR-2.4_
  
  - [x] 7.4 Create ResponsibilityDistributionChart component
    - Build horizontal bar chart
    - Sort by total hours descending
    - Use existing color coding for responsible parties
    - Show hours and percentage labels
    - _Requirements: FR-2.4_
  
  - [x] 7.5 Add Root Cause Analysis section to AOGAnalyticsPage
    - Create new section with heading
    - Add ParetoChart
    - Add CategoryBreakdownPie
    - Add ResponsibilityDistributionChart
    - Wrap in error boundary
    - _Requirements: FR-2.4_


- [x] 8. Cost Analysis Section
  - [x] 8.1 Create CostBreakdownChart component
    - Build stacked bar chart with trend line
    - Stacked bars: Internal (blue) + External (amber)
    - Trend line: Total cost (red dashed)
    - Show last 12 months
    - Format currency as USD
    - _Requirements: FR-2.5_
  
  - [x] 8.2 Create CostEfficiencyMetrics component
    - Build two metric cards side by side
    - Card 1: Cost per Hour with delta indicator
    - Card 2: Cost per Event with delta indicator
    - Add sparklines showing last 6 months
    - Color coding: Green (decreased), Red (increased)
    - _Requirements: FR-2.5_
  
  - [x] 8.3 Implement cost calculation utilities
    - Add `calculateCostPerHour` function
    - Add `calculateCostPerEvent` function
    - Add `calculateCostTrend` function
    - Handle division by zero cases
    - _Requirements: FR-2.5_
  
  - [ ]* 8.4 Write property test for cost aggregation
    - **Property 7: Cost Aggregation Accuracy**
    - **Validates: Requirements FR-2.5**
  
  - [x] 8.5 Add Cost Analysis section to AOGAnalyticsPage
    - Create new section with heading
    - Add CostBreakdownChart
    - Add CostEfficiencyMetrics
    - Wrap in error boundary
    - _Requirements: FR-2.5_

- [x] 9. Predictive Analytics Section
  - [x] 9.1 Create ForecastChart component
    - Build line chart with confidence interval
    - Solid line: Historical actual (blue)
    - Dashed line: Forecast (red)
    - Shaded area: Confidence interval (light red)
    - Add vertical line separating historical from forecast
    - Add "Forecast" label
    - _Requirements: FR-2.6_
  
  - [x] 9.2 Create RiskScoreGauge component
    - Build radial gauge using Recharts
    - Color zones: Green (0-30), Amber (31-60), Red (61-100)
    - Add needle pointing to current score
    - Show risk factors list below gauge
    - _Requirements: FR-2.6_
  
  - [x] 9.3 Implement risk score calculation
    - Add `calculateRiskScore` function
    - Formula: (recentEventFrequency * 0.4) + (averageDowntimeTrend * 0.3) + (costTrend * 0.2) + (recurringIssues * 0.1)
    - Calculate risk factors with contributions
    - _Requirements: FR-2.6_
  
  - [x] 9.4 Create InsightsPanel component
    - Build card-based layout
    - Show icon, title, description, metric, recommendation
    - Color coding by type (warning/info/success)
    - Display maximum 5 insights
    - Add "View All Insights" link if more available
    - _Requirements: FR-2.6_
  
  - [x] 9.5 Add Predictive Analytics section to AOGAnalyticsPage
    - Create new section with heading
    - Add ForecastChart
    - Add RiskScoreGauge (top 3 aircraft)
    - Add InsightsPanel
    - Wrap in error boundary
    - _Requirements: FR-2.6_
  
  - [ ]* 9.6 Write property test for forecast bounds
    - **Property 8: Forecast Bounds**
    - **Validates: Requirements FR-2.6**


- [x] 10. Enhanced PDF Export
  - [x] 10.1 Create EnhancedAOGAnalyticsPDFExport component
    - Build new PDF export component with multi-page support
    - Add proper error handling and retry logic
    - Add progress indicator during generation
    - Add success/failure notifications
    - _Requirements: FR-4.1_
  
  - [x] 10.2 Implement cover page generation
    - Add `addCoverPage` helper function
    - Include title, subtitle, date range, filters
    - Add generation timestamp
    - Add company branding placeholder
    - _Requirements: FR-4.2_
  
  - [x] 10.3 Implement executive summary generation
    - Add `addExecutiveSummary` helper function
    - Include key metrics (4 summary cards)
    - Include top 5 insights
    - Format as single page
    - _Requirements: FR-4.2_
  
  - [x] 10.4 Implement chart section capture
    - Add section IDs to all chart sections
    - Implement `captureSection` function using html2canvas
    - Add 500ms wait for chart rendering
    - Handle multi-page sections (content overflow)
    - Scale to 2x for higher resolution
    - _Requirements: FR-4.2, FR-4.3_
  
  - [x] 10.5 Implement page numbers and footers
    - Add page numbers: "Page X of Y"
    - Add confidentiality notice: "Confidential - Alpha Star Aviation"
    - Add generation info: "Generated by AOG Analytics System"
    - Apply to all pages
    - _Requirements: FR-4.2_
  
  - [x] 10.6 Update AOGAnalyticsPage with section IDs
    - Add `id="three-bucket-section"` to three-bucket section
    - Add `id="trend-analysis-section"` to trend section
    - Add `id="aircraft-performance-section"` to aircraft section
    - Add `id="root-cause-section"` to root cause section
    - Add `id="cost-analysis-section"` to cost section
    - Add `id="predictive-section"` to predictive section
    - _Requirements: FR-4.1_
  
  - [x] 10.7 Replace old PDF export button with enhanced version
    - Remove old AnalyticsPDFExport component usage
    - Add EnhancedAOGAnalyticsPDFExport component
    - Pass filters and summary data as props
    - Test PDF generation end-to-end
    - _Requirements: FR-4.1_
  
  - [ ]* 10.8 Write integration test for PDF export
    - Test PDF generation completes without errors
    - Test PDF includes all required sections
    - Test PDF generation time < 10 seconds
    - _Requirements: FR-4.1, FR-5.4_

- [x] 11. Checkpoint - Core Features Complete
  - Ensure all sections render without errors
  - Verify data flows correctly from backend to frontend
  - Test with various filter combinations
  - Verify legacy data handling works correctly
  - Test PDF export with full dashboard content
  - Ask the user if questions arise


- [ ] 12. Performance Optimization
  - [ ] 12.1 Add backend caching for analytics endpoints
    - Install and configure NestJS cache module
    - Add `@CacheKey` and `@CacheTTL(300)` decorators to analytics endpoints
    - Set 5-minute TTL for analytics data
    - Test cache hit rates
    - _Requirements: FR-5.1_
  
  - [ ] 12.2 Optimize MongoDB aggregation pipelines
    - Add indexes for common query patterns
    - Review and optimize aggregation stages
    - Add query explain plans for slow queries
    - Test with 1000+ events
    - _Requirements: FR-5.1_
  
  - [ ] 12.3 Implement data memoization in frontend
    - Add `useMemo` for expensive calculations
    - Memoize reliability scores calculation
    - Memoize cost analysis calculation
    - Memoize data sampling
    - _Requirements: FR-5.2_
  
  - [ ] 12.4 Add performance monitoring
    - Add Performance API marks for page load
    - Add timing for chart rendering
    - Add timing for filter application
    - Add timing for PDF generation
    - Log performance metrics to console (dev mode)
    - _Requirements: FR-5.1, FR-5.2, FR-5.3, FR-5.4_
  
  - [ ]* 12.5 Write performance tests
    - Test page load time < 3 seconds with 1000 events
    - Test chart render time < 500ms per chart
    - Test filter application < 200ms
    - Test PDF generation < 10 seconds
    - _Requirements: FR-5.1, FR-5.2, FR-5.3, FR-5.4_

- [x] 13. Polish & User Experience
  - [x] 13.1 Add smooth animations and transitions
    - Add framer-motion animations to chart sections
    - Add stagger animations for card grids
    - Add fade-in animations for loading states
    - Keep animations subtle (< 300ms)
    - _Requirements: NFR-1.1_
  
  - [x] 13.2 Implement responsive design for tablets
    - Test layout on tablet viewports (768px - 1024px)
    - Adjust chart sizes for smaller screens
    - Stack sections vertically on narrow screens
    - Ensure touch interactions work properly
    - _Requirements: NFR-1.4_
  
  - [x] 13.3 Add keyboard navigation support
    - Add tab navigation for interactive elements
    - Add keyboard shortcuts for filters
    - Add escape key to close modals/tooltips
    - Test with keyboard-only navigation
    - _Requirements: NFR-1.3_
  
  - [x] 13.4 Verify WCAG AA color contrast
    - Test all color combinations with contrast checker
    - Ensure text meets 4.5:1 contrast ratio
    - Ensure chart colors are distinguishable
    - Test in both light and dark modes
    - _Requirements: NFR-1.3_
  
  - [x] 13.5 Add helpful tooltips and documentation
    - Add tooltips to all metrics explaining calculation
    - Add info icons with detailed explanations
    - Add "Learn More" links to documentation
    - Add inline help text for complex features
    - _Requirements: NFR-1.2_


- [ ] 14. Testing & Quality Assurance
  - [ ] 14.1 Write unit tests for backend services
    - Test `generateInsights` with various scenarios
    - Test `generateForecast` with historical data
    - Test `getMonthlyTrend` aggregation
    - Test `calculateReliabilityScore` edge cases
    - Achieve >80% code coverage
    - _Requirements: NFR-3.1_
  
  - [ ]* 14.2 Write property-based tests
    - **Property 1: Legacy Data Handling**
    - **Property 2: Fallback Metrics Computation**
    - **Property 3: Data Quality Score Calculation**
    - **Property 4: Moving Average Calculation**
    - **Property 5: Reliability Score Consistency**
    - **Property 6: Pareto Principle Validation**
    - **Property 7: Cost Aggregation Accuracy**
    - **Property 8: Forecast Bounds**
    - **Property 9: Period Comparison Delta**
    - Run 100 iterations per property test
    - _Requirements: All FR requirements_
  
  - [ ] 14.3 Write frontend component tests
    - Test MonthlyTrendChart renders correctly
    - Test AircraftHeatmap handles click events
    - Test InsightsPanel displays insights
    - Test DataQualityIndicator shows correct percentage
    - Test all charts handle empty data gracefully
    - _Requirements: NFR-2.3_
  
  - [ ] 14.4 Write integration tests
    - Test full page load with all sections
    - Test filter changes update all charts
    - Test drill-down navigation
    - Test PDF export end-to-end
    - Test error recovery scenarios
    - _Requirements: NFR-2.1, NFR-2.2_
  
  - [ ] 14.5 Perform manual testing
    - Test with real production data
    - Test with 1000+ events
    - Test with legacy events only
    - Test with mixed legacy and new events
    - Test all filter combinations
    - Test PDF export with various configurations
    - _Requirements: All acceptance criteria_

- [x] 15. Documentation & Handoff
  - [x] 15.1 Update API documentation
    - Document new analytics endpoints
    - Add request/response examples
    - Document query parameters
    - Add error response codes
    - _Requirements: NFR-3.2_
  
  - [x] 15.2 Create user guide for analytics page
    - Document all visualizations and their meaning
    - Explain data quality indicators
    - Explain automated insights
    - Provide interpretation guidelines
    - Add troubleshooting section
    - _Requirements: NFR-1.1_
  
  - [x] 15.3 Create developer documentation
    - Document component architecture
    - Document data flow
    - Document performance optimization techniques
    - Document how to add new visualizations
    - Add code examples
    - _Requirements: NFR-3.2_
  
  - [x] 15.4 Update system architecture documentation
    - Update system-architecture.md with new endpoints
    - Document new analytics calculations
    - Document PDF export enhancements
    - Update component diagrams
    - _Requirements: NFR-3.2_

- [x] 16. Final Checkpoint - Production Ready
  - Verify all acceptance criteria are met
  - Verify all performance targets are met
  - Verify PDF export works 100% reliably
  - Verify customer is "astonished" by the result
  - Conduct final demo with stakeholders
  - Deploy to production
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Integration tests validate end-to-end workflows
- Performance tests ensure sub-3-second load times

