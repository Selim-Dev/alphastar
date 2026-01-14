# Requirements Document

## Introduction

Alpha Star Aviation Services is a premium private aviation operator based in Riyadh, Saudi Arabia, providing aircraft management, air ambulance, and airport management services. The company requires a comprehensive KPI Dashboard to replace expensive manual reporting with accurate, dynamic statistics about aircraft availability, utilization, maintenance activities, and costs. The dashboard must support both manual data entry and Excel template uploads, with a polished UI that impresses executives while remaining easy to use for daily operations.

## Glossary

- **Aircraft_Registration**: Unique tail number identifying an aircraft (e.g., HZ-A42, HZ-SKY1)
- **KPI_Dashboard**: The web-based system for tracking and visualizing aviation operational metrics
- **Availability**: Percentage of time an aircraft is bookable/mission-capable vs out-of-service
- **FMC (Fully Mission Capable)**: Hours when aircraft is available for booking/operations
- **TTSN (Total Time Since New)**: Cumulative flight hours since aircraft manufacture
- **TCSN (Total Cycles Since New)**: Cumulative flight cycles since aircraft manufacture
- **AOG (Aircraft On Ground)**: Event where aircraft is grounded due to technical/operational issues
- **Flight_Cycle**: One takeoff and landing sequence (one leg = one cycle)
- **Man_Hours**: Labor time spent on maintenance tasks
- **Downtime_Bucket**: Category of unavailability (Scheduled, Unscheduled, AOG)
- **Responsibility_Attribution**: Assignment of downtime cause (Internal, OEM, Customs, Finance, Other)
- **Work_Order**: Formal maintenance task document with tracking number
- **MEL (Minimum Equipment List)**: List of equipment that can be inoperative while aircraft remains airworthy
- **ATA_Chapter**: Standard aviation maintenance classification system
- **Budget_Clause**: Cost category in financial planning (e.g., Spare Parts, Fuel, Training)
- **Rate_List**: Catalog of standard costs for services, parts, and labor

## Requirements

### Requirement 1

**User Story:** As an operations manager, I want to manage aircraft master data, so that I can maintain an accurate registry of all fleet aircraft with their specifications.

#### Acceptance Criteria

1. WHEN a user creates a new aircraft record THEN the KPI_Dashboard SHALL store the aircraft_registration, fleet_group, aircraft_type, msn, owner, manufacture_date, engines_count, and status
2. WHEN a user attempts to create an aircraft with a duplicate aircraft_registration THEN the KPI_Dashboard SHALL reject the creation and display a validation error
3. WHEN a user updates aircraft master data THEN the KPI_Dashboard SHALL persist the changes and maintain an audit trail of modifications
4. WHEN a user views the aircraft list THEN the KPI_Dashboard SHALL display all aircraft with filtering by fleet_group, aircraft_type, and status
5. WHEN a user exports aircraft master data THEN the KPI_Dashboard SHALL generate an Excel file containing all aircraft records

### Requirement 2

**User Story:** As a maintenance supervisor, I want to record daily utilization counters per aircraft, so that I can track flight hours and cycles accurately over time.

#### Acceptance Criteria

1. WHEN a user submits daily counters for an aircraft THEN the KPI_Dashboard SHALL store airframe_hours_ttsn, airframe_cycles_tcsn, engine_hours, engine_cycles, apu_hours, and apu_cycles with the update_date
2. WHEN a user submits counters where today's value is less than yesterday's value THEN the KPI_Dashboard SHALL reject the submission with a monotonic validation error
3. WHEN the KPI_Dashboard computes daily flight hours THEN the KPI_Dashboard SHALL calculate the delta between consecutive counter readings
4. WHEN a user uploads an Excel template with utilization data THEN the KPI_Dashboard SHALL parse, validate, and store valid rows while reporting invalid rows with specific error messages
5. WHEN a user views utilization history THEN the KPI_Dashboard SHALL display daily, monthly, and yearly aggregations per aircraft and per fleet

### Requirement 3

**User Story:** As an operations manager, I want to record daily aircraft status hours, so that I can compute dynamic availability percentages per aircraft.

#### Acceptance Criteria

1. WHEN a user submits daily status for an aircraft THEN the KPI_Dashboard SHALL store pos_hours (baseline), fmc_hours (available), nmcm_s_hours (scheduled downtime), nmcm_u_hours (unscheduled downtime), and notes
2. WHEN the KPI_Dashboard computes availability percentage THEN the KPI_Dashboard SHALL calculate (fmc_hours / pos_hours) * 100 for the selected period
3. WHEN a user views availability trends THEN the KPI_Dashboard SHALL display daily, monthly, and yearly availability percentages per aircraft with visual charts
4. WHEN pos_hours defaults to 24 and fmc_hours defaults to 24 THEN the KPI_Dashboard SHALL pre-populate these values in the input form for user convenience
5. WHEN a user filters availability by date range THEN the KPI_Dashboard SHALL aggregate status hours and compute availability for the filtered period

### Requirement 4

**User Story:** As a maintenance manager, I want to log AOG events with granular details, so that I can track downtime causes and assign responsibility accurately.

#### Acceptance Criteria

1. WHEN a user creates an AOG event THEN the KPI_Dashboard SHALL store aircraft_registration, detected_at, cleared_at, category, reason_code, responsible_party, action_taken, manpower_count, man_hours, and cost fields
2. WHEN a user specifies responsible_party THEN the KPI_Dashboard SHALL accept values from the set (Internal, OEM, Customs, Finance, Other)
3. WHEN the KPI_Dashboard computes downtime duration THEN the KPI_Dashboard SHALL calculate (cleared_at - detected_at) in hours
4. WHEN a user views AOG analytics THEN the KPI_Dashboard SHALL display total downtime hours grouped by responsible_party for accountability reporting
5. WHEN a user attaches files to an AOG event THEN the KPI_Dashboard SHALL upload files to S3 storage and link them to the event record
6. WHEN cleared_at is earlier than detected_at THEN the KPI_Dashboard SHALL reject the submission with a timestamp validation error

### Requirement 5

**User Story:** As a maintenance supervisor, I want to log maintenance tasks per shift, so that I can track work performed, man-hours, and costs per aircraft.

#### Acceptance Criteria

1. WHEN a user creates a maintenance task THEN the KPI_Dashboard SHALL store date, shift, aircraft_registration, task_type, task_description, manpower_count, man_hours, cost, and work_order_reference
2. WHEN a user views maintenance summary THEN the KPI_Dashboard SHALL display total tasks, man-hours, and costs aggregated by date, shift, aircraft, and task_type
3. WHEN a user links a task to a work order THEN the KPI_Dashboard SHALL validate the work_order_reference exists and associate the records
4. WHEN a user uploads an Excel template with maintenance tasks THEN the KPI_Dashboard SHALL parse, validate, and store valid rows while reporting errors for invalid rows
5. WHEN a user views top maintenance cost drivers THEN the KPI_Dashboard SHALL rank aircraft by total maintenance cost for the selected period

### Requirement 6

**User Story:** As a quality manager, I want to track work orders and discrepancies, so that I can monitor maintenance execution and identify recurring issues.

#### Acceptance Criteria

1. WHEN a user creates a work order THEN the KPI_Dashboard SHALL store wo_number, aircraft_registration, description, status, date_in, date_out, due_date, and crs_number
2. WHEN the KPI_Dashboard computes turnaround time THEN the KPI_Dashboard SHALL calculate (date_out - date_in) in days for closed work orders
3. WHEN a user creates a discrepancy THEN the KPI_Dashboard SHALL store date_detected, aircraft_registration, ata_chapter, discrepancy_text, date_corrected, corrective_action, and responsibility
4. WHEN a user views discrepancy analytics THEN the KPI_Dashboard SHALL display counts grouped by ata_chapter to identify top defect categories
5. WHEN a user views work order status distribution THEN the KPI_Dashboard SHALL display counts by status (Open, Closed, In Progress, Deferred)
6. WHEN a work order due_date has passed and status is not Closed THEN the KPI_Dashboard SHALL flag the work order as overdue in the display

### Requirement 7

**User Story:** As a finance manager, I want to track budget plan versus actual spend, so that I can monitor cost performance and identify budget variances.

#### Acceptance Criteria

1. WHEN a user imports a budget plan THEN the KPI_Dashboard SHALL store fiscal_year, clause_id, clause_description, aircraft_group, and planned_amount
2. WHEN a user records actual spend THEN the KPI_Dashboard SHALL store period, aircraft_group, clause_id, amount, currency, vendor, and notes
3. WHEN the KPI_Dashboard computes budget variance THEN the KPI_Dashboard SHALL calculate (planned_amount - actual_amount) and display remaining budget
4. WHEN a user views budget analytics THEN the KPI_Dashboard SHALL display budget vs actual by clause, aircraft_group, and period with visual charts
5. WHEN a user views burn rate THEN the KPI_Dashboard SHALL calculate average monthly spend and project remaining budget duration
6. WHEN utilization data is available THEN the KPI_Dashboard SHALL compute cost_per_flight_hour and cost_per_cycle metrics

### Requirement 8

**User Story:** As an executive, I want to view a polished dashboard with KPI cards and trends, so that I can quickly understand fleet performance at a glance.

#### Acceptance Criteria

1. WHEN a user opens the executive dashboard THEN the KPI_Dashboard SHALL display KPI cards for fleet availability percentage, total flight hours, total cycles, and active AOG count
2. WHEN a user views trend charts THEN the KPI_Dashboard SHALL display availability and utilization trends over the selected time period with smooth animations
3. WHEN a user drills down from a KPI card THEN the KPI_Dashboard SHALL navigate to the detailed view for that metric with filters preserved
4. WHEN a user selects a date range filter THEN the KPI_Dashboard SHALL update all dashboard components to reflect the filtered period
5. WHEN a user exports dashboard data THEN the KPI_Dashboard SHALL generate an Excel report containing the displayed metrics and underlying data

### Requirement 9

**User Story:** As an administrator, I want to manage users and access control, so that I can ensure appropriate permissions for different roles.

#### Acceptance Criteria

1. WHEN an administrator creates a user THEN the KPI_Dashboard SHALL store email, password_hash, name, and role
2. WHEN a user authenticates THEN the KPI_Dashboard SHALL validate credentials and issue a JWT token with role claims
3. WHEN a user with Viewer role attempts to create or modify data THEN the KPI_Dashboard SHALL reject the action with an authorization error
4. WHEN a user with Editor role creates or modifies operational data THEN the KPI_Dashboard SHALL permit the action and log the change
5. WHEN a user with Admin role manages users or system settings THEN the KPI_Dashboard SHALL permit full administrative access

### Requirement 10

**User Story:** As a data entry operator, I want to upload Excel templates for bulk data entry, so that I can efficiently input large amounts of operational data.

#### Acceptance Criteria

1. WHEN a user downloads an Excel template THEN the KPI_Dashboard SHALL generate a file with correct headers, data types, and example rows for the selected data type
2. WHEN a user uploads a completed template THEN the KPI_Dashboard SHALL parse the file and display a preview of rows to be imported
3. WHEN validation errors exist in uploaded data THEN the KPI_Dashboard SHALL display row-by-row error messages identifying the specific validation failures
4. WHEN a user confirms import of valid rows THEN the KPI_Dashboard SHALL store the data and report the count of successfully imported records
5. WHEN a user uploads a file THEN the KPI_Dashboard SHALL store the original file in S3 and create an import_log record with filename, timestamp, row_count, and error_count

### Requirement 11

**User Story:** As a maintenance planner, I want to view aircraft detail pages, so that I can see comprehensive operational history for individual aircraft.

#### Acceptance Criteria

1. WHEN a user opens an aircraft detail page THEN the KPI_Dashboard SHALL display current counters, availability timeline, and recent events for that aircraft
2. WHEN a user views the availability timeline THEN the KPI_Dashboard SHALL render a daily chart showing FMC vs downtime buckets over the selected period
3. WHEN a user views the events list THEN the KPI_Dashboard SHALL display AOG events, work orders, and discrepancies filtered to that aircraft
4. WHEN a user views maintenance history THEN the KPI_Dashboard SHALL display tasks with man-hours and costs aggregated by month
5. WHEN a user exports aircraft detail data THEN the KPI_Dashboard SHALL generate an Excel file containing all displayed information for that aircraft

