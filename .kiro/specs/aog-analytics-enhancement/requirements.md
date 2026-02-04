# AOG Analytics Page Enhancement - Requirements

## 1. Overview

### 1.1 Purpose
Transform the AOG Analytics page from a basic reporting tool into a visually stunning, insight-rich executive dashboard that will "astonish" stakeholders with comprehensive downtime analysis, predictive insights, and actionable intelligence.

### 1.2 Business Context
The current AOG Analytics page shows only basic three-bucket breakdown charts with no data visualization due to missing milestone timestamps in historical events. The customer expects a world-class analytics experience that:
- Provides immediate visual impact
- Reveals hidden patterns and trends
- Enables data-driven decision making
- Supports executive presentations

### 1.3 Current Issues
1. **No Data Display**: Charts show "No downtime data available" because historical AOG events lack milestone timestamps (reportedAt, procurementRequestedAt, etc.)
2. **PDF Export Failure**: Export functionality fails with "PDF export failed. Please try again" error
3. **Limited Visualizations**: Only 2 charts (bar and pie) - insufficient for comprehensive analysis
4. **Missing Insights**: No predictive analytics, trend analysis, or actionable recommendations
5. **Poor Data Handling**: System doesn't gracefully handle legacy events without milestone data

## 2. User Stories

### 2.1 Executive User Stories

**US-1**: As an executive, I want to see a visually stunning analytics dashboard so that I can quickly understand fleet AOG performance at a glance.

**US-2**: As an executive, I want to export professional PDF reports so that I can share insights with board members and stakeholders.

**US-3**: As an executive, I want to see trend analysis and predictions so that I can anticipate future issues and allocate resources proactively.

**US-4**: As an executive, I want to identify top problem aircraft and root causes so that I can focus improvement efforts effectively.

### 2.2 Operations Manager User Stories

**US-5**: As an operations manager, I want to see detailed bottleneck analysis so that I can identify and eliminate process inefficiencies.

**US-6**: As an operations manager, I want to compare performance across time periods so that I can measure improvement initiatives.

**US-7**: As an operations manager, I want to drill down into specific aircraft or fleet groups so that I can investigate problem areas.

**US-8**: As an operations manager, I want to see cost impact analysis so that I can justify budget requests and process improvements.

### 2.3 Maintenance Team User Stories

**US-9**: As a maintenance lead, I want to see technical vs procurement vs ops time breakdown so that I can identify where delays occur.

**US-10**: As a maintenance lead, I want to see part availability patterns so that I can improve inventory management.

**US-11**: As a maintenance lead, I want to see recurring issue patterns so that I can implement preventive measures.

## 3. Functional Requirements

### 3.1 Data Handling & Backward Compatibility

**FR-1.1**: System MUST gracefully handle legacy AOG events without milestone timestamps
- Display total downtime (clearedAt - detectedAt) for legacy events
- Show "Limited Analytics" badge for legacy events
- Exclude legacy events from three-bucket breakdown (or show in separate "Legacy" category)
- Provide clear messaging about data quality and completeness

**FR-1.2**: System MUST compute fallback metrics for events with partial milestone data
- If reportedAt is missing, use detectedAt as fallback
- If upAndRunningAt is missing, use clearedAt as fallback
- Calculate available bucket times even if some milestones are missing
- Document assumptions in tooltips and export reports

**FR-1.3**: System MUST provide data quality indicators
- Show percentage of events with complete milestone data
- Display data completeness score (0-100%)
- Highlight time periods with incomplete data
- Provide recommendations for improving data quality

### 3.2 Enhanced Visualizations

**FR-2.1**: Three-Bucket Analysis (Enhanced)
- **Bar Chart**: Total hours by bucket with average per event overlay
- **Pie Chart**: Percentage distribution with interactive segments
- **Stacked Area Chart**: Bucket trends over time (NEW)
- **Waterfall Chart**: Downtime composition breakdown (NEW)
- Color coding: Technical (Blue #3b82f6), Procurement (Amber #f59e0b), Ops (Green #10b981)

**FR-2.2**: Trend Analysis Visualizations (NEW)
- **Monthly Trend Line**: Event count and total downtime over 12 months
- **Moving Average**: 3-month moving average to smooth volatility
- **Year-over-Year Comparison**: Current year vs previous year overlay
- **Seasonality Detection**: Highlight recurring patterns

**FR-2.3**: Aircraft Performance Matrix (NEW)
- **Heatmap**: Aircraft (rows) × Months (columns) showing downtime intensity
- **Reliability Score**: Composite score (0-100) per aircraft
- **Top 5 Problem Aircraft**: Ranked by total downtime with trend indicators
- **Top 5 Reliable Aircraft**: Ranked by lowest downtime with recognition badges

**FR-2.4**: Root Cause Analysis (NEW)
- **Pareto Chart**: Top 10 reason codes by frequency and impact
- **Category Breakdown**: AOG vs Unscheduled vs Scheduled distribution
- **Responsibility Distribution**: Pie chart showing Internal vs OEM vs Customs vs Finance vs Other
- **Location Heatmap**: Geographic distribution of AOG events

**FR-2.5**: Cost Impact Analysis (NEW)
- **Cost Breakdown**: Internal vs External costs with trend
- **Cost per Hour**: Average cost per downtime hour
- **Cost by Aircraft**: Top cost drivers
- **Budget Impact**: Projected annual cost based on current trend

**FR-2.6**: Predictive Analytics (NEW)
- **Forecast**: Next 3-month downtime prediction using linear regression
- **Risk Score**: Aircraft-level risk assessment (0-100)
- **Early Warning Indicators**: Aircraft approaching high-risk thresholds
- **Maintenance Recommendations**: AI-generated suggestions based on patterns

### 3.3 Interactive Features

**FR-3.1**: Drill-Down Capabilities
- Click on any chart segment to filter entire dashboard
- Breadcrumb navigation showing active filters
- "Reset Filters" button to return to overview
- Persistent filter state across page refreshes

**FR-3.2**: Time Period Comparison
- Side-by-side comparison mode (e.g., Q1 2025 vs Q1 2024)
- Delta indicators showing improvement/decline
- Percentage change calculations
- Statistical significance indicators

**FR-3.3**: Data Export Options
- **PDF Export**: Professional multi-page report with all visualizations
- **Excel Export**: Raw data with pivot tables and charts
- **PowerPoint Export**: Executive summary slides (optional)
- **Image Export**: Individual chart downloads (PNG/SVG)

### 3.4 PDF Export Requirements

**FR-4.1**: PDF Generation MUST work reliably
- Fix container ID mismatch (use correct ID from page)
- Handle dynamic content and animations
- Support multi-page PDFs for long content
- Include page numbers and timestamps

**FR-4.2**: PDF Content MUST include
- **Cover Page**: Title, date range, filters applied, generation timestamp
- **Executive Summary**: Key metrics and insights (1 page)
- **Detailed Charts**: All visualizations with legends (multiple pages)
- **Data Tables**: Top aircraft breakdown, cost summary
- **Footer**: Page numbers, confidentiality notice, company branding

**FR-4.3**: PDF Styling MUST be professional
- High-resolution charts (300 DPI minimum)
- Consistent color scheme matching brand
- Clear section headers and labels
- Proper spacing and margins
- Print-friendly layout

### 3.5 Performance Requirements

**FR-5.1**: Page load time MUST be < 3 seconds for 1000 events
**FR-5.2**: Chart rendering MUST be < 500ms per chart
**FR-5.3**: Filter application MUST be < 200ms
**FR-5.4**: PDF generation MUST complete < 10 seconds for full report

## 4. Non-Functional Requirements

### 4.1 Usability
- **NFR-1.1**: Dashboard MUST be understandable within 30 seconds for new users
- **NFR-1.2**: All charts MUST have tooltips explaining metrics
- **NFR-1.3**: Color scheme MUST be accessible (WCAG AA compliant)
- **NFR-1.4**: Mobile responsive design for tablet viewing

### 4.2 Reliability
- **NFR-2.1**: System MUST handle missing data gracefully (no crashes)
- **NFR-2.2**: PDF export MUST have 99% success rate
- **NFR-2.3**: Charts MUST render correctly in all supported browsers

### 4.3 Maintainability
- **NFR-3.1**: Code MUST be modular with reusable chart components
- **NFR-3.2**: New visualizations MUST be addable without refactoring
- **NFR-3.3**: Configuration MUST be externalized (colors, thresholds, etc.)

## 5. Acceptance Criteria

### 5.1 Visual Impact
- [ ] Dashboard includes at least 10 distinct visualizations
- [ ] Charts use professional color scheme with consistent branding
- [ ] Animations and transitions enhance user experience
- [ ] Layout is balanced and visually appealing

### 5.2 Data Completeness
- [ ] System displays data quality score prominently
- [ ] Legacy events are handled without errors
- [ ] All available metrics are calculated and displayed
- [ ] Missing data is clearly indicated with explanations

### 5.3 Insights Generation
- [ ] Dashboard provides at least 5 automated insights
- [ ] Predictive analytics show 3-month forecast
- [ ] Top problem areas are highlighted automatically
- [ ] Recommendations are actionable and specific

### 5.4 Export Functionality
- [ ] PDF export works 100% of the time
- [ ] PDF includes all visualizations and data tables
- [ ] PDF is professionally formatted and print-ready
- [ ] Excel export includes raw data and summary tables

### 5.5 Performance
- [ ] Page loads in < 3 seconds with 1000 events
- [ ] All charts render smoothly without lag
- [ ] Filters apply instantly (< 200ms)
- [ ] PDF generates in < 10 seconds

### 5.6 User Satisfaction
- [ ] Customer is "astonished" by the analytics capabilities
- [ ] Dashboard is suitable for executive presentations
- [ ] Users can find insights without training
- [ ] Export reports are board-meeting ready

## 6. Out of Scope

- Real-time data streaming (batch updates only)
- Custom report builder (predefined reports only)
- Integration with external BI tools (standalone dashboard)
- Mobile app (responsive web only)
- Multi-language support (English only)

## 7. Dependencies

- Backend three-bucket analytics API (`/api/aog-events/analytics/buckets`)
- Additional analytics endpoints for new visualizations
- Chart library (Recharts) with advanced chart types
- PDF generation library (jsPDF + html2canvas)
- Excel export library (xlsx or similar)

## 8. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Historical data lacks milestones | High | Certain | Implement fallback calculations and data quality indicators |
| PDF export performance issues | Medium | Medium | Optimize rendering, use progressive loading |
| Chart library limitations | Medium | Low | Evaluate alternative libraries if needed |
| Customer expectations too high | High | Medium | Set clear expectations, deliver incrementally |

## 9. Success Metrics

- **Customer Satisfaction**: "Astonished" feedback achieved
- **Usage**: Analytics page becomes most-visited page
- **Export Adoption**: 80% of users export reports monthly
- **Decision Impact**: 5+ business decisions attributed to insights
- **Performance**: All performance targets met consistently

## 10. Future Enhancements (Post-MVP)

- Machine learning for anomaly detection
- Automated alert system for high-risk aircraft
- Integration with maintenance scheduling system
- Custom dashboard builder for power users
- API for third-party integrations
