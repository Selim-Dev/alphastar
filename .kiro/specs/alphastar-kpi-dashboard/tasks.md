# Implementation Plan

## Phase 1: Project Setup and Core Infrastructure

- [-] 1. Initialize project structure and configure development environment



  - [x] 1.1 Create monorepo structure with `backend/` and `frontend/` directories


    - Initialize NestJS backend with TypeScript
    - Initialize React frontend with Vite and TypeScript
    - Configure shared ESLint and Prettier settings
    - _Requirements: All_


  - [x] 1.2 Configure backend dependencies and modules

    - Install Mongoose, Passport-JWT, class-validator, xlsx, @aws-sdk/client-s3
    - Set up environment configuration with @nestjs/config
    - Configure Swagger/OpenAPI documentation
    - _Requirements: All_


  - [x] 1.3 Configure frontend dependencies

    - Install Tailwind CSS and shadcn/ui components
    - Install TanStack Query, TanStack Table, React Hook Form, Zod
    - Install Recharts and Framer Motion
    - _Requirements: All_


  - [x] 1.4 Set up MongoDB connection and base schemas






    - Create Mongoose connection module
    - Define base schema options (timestamps, toJSON transforms)
    - _Requirements: All_

  - [ ] 1.5 Set up AWS S3 service module
    - Create S3 service with presigned URL generation
    - Implement file upload and download methods
    - _Requirements: 4.5, 10.5_

## Phase 2: Authentication and User Management

- [x] 2. Implement authentication and RBAC





  - [x] 2.1 Create User schema and repository


    - Define User Mongoose schema with email, passwordHash, name, role
    - Implement unique email index
    - _Requirements: 9.1_

  - [x] 2.2 Implement JWT authentication service


    - Create AuthService with login and token generation
    - Implement password hashing with bcrypt
    - Configure JWT strategy with Passport
    - _Requirements: 9.2_

  - [ ]* 2.3 Write property test for RBAC
    - **Property 14: Role-Based Access Control**
    - **Validates: Requirements 9.3, 9.4, 9.5**

  - [x] 2.4 Implement role-based guards


    - Create RolesGuard for endpoint protection
    - Implement @Roles() decorator
    - _Requirements: 9.3, 9.4, 9.5_

  - [x] 2.5 Create auth controller and DTOs


    - Implement login endpoint with validation
    - Implement user creation endpoint (Admin only)
    - _Requirements: 9.1, 9.2_


- [x] 3. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Aircraft Master Data Module

- [x] 4. Implement Aircraft module





  - [x] 4.1 Create Aircraft schema and repository


    - Define Aircraft Mongoose schema with all fields
    - Implement unique registration index
    - _Requirements: 1.1_

  - [ ]* 4.2 Write property test for aircraft registration uniqueness
    - **Property 1: Aircraft Registration Uniqueness**
    - **Validates: Requirements 1.2**

  - [x] 4.3 Implement Aircraft service with CRUD operations


    - Create, read, update, delete aircraft
    - Implement filtering by fleetGroup, aircraftType, status
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 4.4 Create Aircraft controller and DTOs


    - Define CreateAircraftDto and UpdateAircraftDto with validation
    - Implement REST endpoints
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 4.5 Write unit tests for Aircraft service
    - Test CRUD operations
    - Test filtering logic
    - _Requirements: 1.1, 1.3, 1.4_

## Phase 4: Daily Utilization Counters Module

- [x] 5. Implement Utilization module





  - [x] 5.1 Create DailyCounter schema and repository


    - Define DailyCounter Mongoose schema
    - Implement compound index on aircraftId + date
    - _Requirements: 2.1_

  - [ ]* 5.2 Write property test for monotonic counter validation
    - **Property 2: Monotonic Counter Validation**
    - **Validates: Requirements 2.2**

  - [ ]* 5.3 Write property test for delta calculation
    - **Property 3: Daily Flight Hours Delta Calculation**
    - **Validates: Requirements 2.3**

  - [x] 5.4 Implement Utilization service


    - Create daily counter with monotonic validation
    - Compute daily deltas between consecutive readings
    - Aggregate utilization by day/month/year
    - _Requirements: 2.1, 2.2, 2.3, 2.5_


  - [x] 5.5 Create Utilization controller and DTOs

    - Define CreateDailyCounterDto with validation
    - Implement REST endpoints including aggregations
    - _Requirements: 2.1, 2.5_

  - [ ]* 5.6 Write unit tests for Utilization service
    - Test counter creation and validation
    - Test delta calculation
    - Test aggregations
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [-] 6. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Daily Status and Availability Module

- [x] 7. Implement Daily Status module





  - [x] 7.1 Create DailyStatus schema and repository


    - Define DailyStatus Mongoose schema
    - Implement compound index on aircraftId + date
    - _Requirements: 3.1_

  - [ ]* 7.2 Write property test for availability calculation
    - **Property 4: Availability Percentage Calculation**
    - **Validates: Requirements 3.2, 3.5**

  - [x] 7.3 Implement DailyStatus service


    - Create daily status with default values (pos=24, fmc=24)
    - Compute availability percentage for date ranges
    - Aggregate availability by day/month/year per aircraft
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_


  - [x] 7.4 Create DailyStatus controller and DTOs

    - Define CreateDailyStatusDto with validation
    - Implement REST endpoints including availability metrics
    - _Requirements: 3.1, 3.3, 3.5_

  - [ ]* 7.5 Write unit tests for DailyStatus service
    - Test status creation with defaults
    - Test availability calculation
    - Test date range filtering
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

## Phase 6: AOG Events Module

- [x] 8. Implement AOG Events module





  - [x] 8.1 Create AOGEvent schema and repository


    - Define AOGEvent Mongoose schema
    - Implement indexes on aircraftId and responsibleParty
    - _Requirements: 4.1_

  - [ ]* 8.2 Write property test for timestamp validation
    - **Property 5: AOG Timestamp Validation**
    - **Validates: Requirements 4.6**

  - [ ]* 8.3 Write property test for duration calculation
    - **Property 6: AOG Downtime Duration Calculation**
    - **Validates: Requirements 4.3**

  - [ ]* 8.4 Write property test for responsible party enum
    - **Property 7: Responsible Party Enum Validation**
    - **Validates: Requirements 4.2**

  - [ ]* 8.5 Write property test for downtime grouping
    - **Property 8: AOG Downtime Grouping by Responsibility**
    - **Validates: Requirements 4.4**

  - [x] 8.6 Implement AOGEvent service


    - Create AOG event with timestamp validation
    - Compute downtime duration
    - Aggregate downtime by responsible party
    - Handle file attachments via S3
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 8.7 Create AOGEvent controller and DTOs


    - Define CreateAOGEventDto with validation
    - Implement REST endpoints including analytics
    - _Requirements: 4.1, 4.4_

  - [ ]* 8.8 Write unit tests for AOGEvent service
    - Test event creation and validation
    - Test duration calculation
    - Test responsibility grouping
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

- [ ] 9. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Maintenance Tasks Module

- [x] 10. Implement Maintenance Tasks module





  - [x] 10.1 Create MaintenanceTask schema and repository


    - Define MaintenanceTask Mongoose schema
    - Implement indexes on aircraftId and date
    - _Requirements: 5.1_

  - [ ]* 10.2 Write property test for maintenance summary aggregation
    - **Property 15: Maintenance Summary Aggregation**
    - **Validates: Requirements 5.2**

  - [x] 10.3 Implement MaintenanceTask service


    - Create maintenance task with work order linking
    - Aggregate tasks by date/shift/aircraft/taskType
    - Rank aircraft by maintenance cost
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 10.4 Create MaintenanceTask controller and DTOs


    - Define CreateMaintenanceTaskDto with validation
    - Implement REST endpoints including summary
    - _Requirements: 5.1, 5.2, 5.5_

  - [ ]* 10.5 Write unit tests for MaintenanceTask service
    - Test task creation
    - Test aggregation logic
    - Test cost ranking
    - _Requirements: 5.1, 5.2, 5.5_

## Phase 8: Work Orders and Discrepancies Module

- [x] 11. Implement Work Orders module



  - [x] 11.1 Create WorkOrder schema and repository


    - Define WorkOrder Mongoose schema
    - Implement unique woNumber index
    - _Requirements: 6.1_

  - [ ]* 11.2 Write property test for turnaround calculation
    - **Property 9: Work Order Turnaround Calculation**
    - **Validates: Requirements 6.2**

  - [ ]* 11.3 Write property test for overdue detection
    - **Property 10: Overdue Work Order Detection**
    - **Validates: Requirements 6.6**


  - [x] 11.4 Implement WorkOrder service
    - Create work order with status management
    - Compute turnaround time for closed orders
    - Detect and flag overdue work orders
    - _Requirements: 6.1, 6.2, 6.5, 6.6_


  - [x] 11.5 Create WorkOrder controller and DTOs

    - Define CreateWorkOrderDto with validation
    - Implement REST endpoints including status distribution
    - _Requirements: 6.1, 6.5_

- [x] 12. Implement Discrepancies module





  - [x] 12.1 Create Discrepancy schema and repository


    - Define Discrepancy Mongoose schema
    - Implement index on ataChapter
    - _Requirements: 6.3_

  - [ ]* 12.2 Write property test for ATA chapter grouping
    - **Property 16: Discrepancy ATA Chapter Grouping**
    - **Validates: Requirements 6.4**


  - [x] 12.3 Implement Discrepancy service

    - Create discrepancy with ATA chapter
    - Aggregate discrepancies by ATA chapter
    - _Requirements: 6.3, 6.4_

  - [x] 12.4 Create Discrepancy controller and DTOs


    - Define CreateDiscrepancyDto with validation
    - Implement REST endpoints including analytics
    - _Requirements: 6.3, 6.4_

  - [ ]* 12.5 Write unit tests for WorkOrder and Discrepancy services
    - Test work order creation and turnaround
    - Test overdue detection
    - Test discrepancy ATA grouping
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: Budget Module

- [x] 14. Implement Budget module





  - [x] 14.1 Create BudgetPlan and ActualSpend schemas


    - Define BudgetPlan Mongoose schema
    - Define ActualSpend Mongoose schema
    - Implement appropriate indexes
    - _Requirements: 7.1, 7.2_

  - [ ]* 14.2 Write property test for budget variance calculation
    - **Property 11: Budget Variance Calculation**
    - **Validates: Requirements 7.3**

  - [ ]* 14.3 Write property test for cost per flight hour
    - **Property 12: Cost Per Flight Hour Calculation**
    - **Validates: Requirements 7.6**

  - [x] 14.4 Implement Budget service


    - Import budget plan from Excel
    - Record actual spend
    - Compute budget variance and remaining budget
    - Calculate burn rate
    - Compute cost per flight hour and cost per cycle
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 14.5 Create Budget controller and DTOs


    - Define CreateBudgetPlanDto and CreateActualSpendDto
    - Implement REST endpoints including analytics
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [ ]* 14.6 Write unit tests for Budget service
    - Test budget plan import
    - Test variance calculation
    - Test burn rate calculation
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

## Phase 10: Excel Import/Export Module

- [x] 15. Implement Import/Export module





  - [x] 15.1 Create ImportLog schema and repository


    - Define ImportLog Mongoose schema
    - _Requirements: 10.5_

  - [ ]* 15.2 Write property test for Excel round-trip
    - **Property 13: Excel Import Round-Trip**
    - **Validates: Requirements 2.4, 5.4, 10.2, 10.3, 10.4**

  - [x] 15.3 Implement Excel template generation service


    - Generate templates for each data type (utilization, tasks, AOG, budget)
    - Include headers, data types, and example rows
    - _Requirements: 10.1_

  - [x] 15.4 Implement Excel parsing and validation service


    - Parse uploaded Excel files using xlsx library
    - Validate rows against DTOs
    - Collect and report row-level errors
    - _Requirements: 10.2, 10.3_

  - [x] 15.5 Implement import confirmation service


    - Store valid rows in database
    - Upload original file to S3
    - Create import log record
    - _Requirements: 10.4, 10.5_

  - [x] 15.6 Implement export service


    - Export aircraft, utilization, events, budget data to Excel
    - _Requirements: 1.5, 8.5, 11.5_

  - [x] 15.7 Create Import/Export controller


    - Implement template download endpoints
    - Implement upload and confirm endpoints
    - Implement export endpoints
    - _Requirements: 10.1, 10.2, 10.4_

  - [ ]* 15.8 Write unit tests for Import/Export services
    - Test template generation
    - Test parsing and validation
    - Test export functionality
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 11: Dashboard and KPI Aggregation

- [x] 17. Implement Dashboard module






  - [x] 17.1 Create Dashboard service

    - Aggregate fleet availability percentage
    - Aggregate total flight hours and cycles
    - Count active AOG events
    - Generate trend data for charts
    - _Requirements: 8.1, 8.2, 8.4_

  - [ ]* 17.2 Write property test for dashboard KPI consistency
    - **Property 17: Dashboard KPI Consistency**
    - **Validates: Requirements 8.1, 8.4**


  - [x] 17.3 Create Dashboard controller

    - Implement KPI summary endpoint
    - Implement trends endpoint with date range filter
    - _Requirements: 8.1, 8.2, 8.4_

  - [ ]* 17.4 Write unit tests for Dashboard service
    - Test KPI aggregation
    - Test trend data generation
    - _Requirements: 8.1, 8.2_

## Phase 12: Frontend Core Setup

- [x] 18. Set up frontend infrastructure





  - [x] 18.1 Configure React app with routing


    - Set up React Router with protected routes
    - Configure TanStack Query provider
    - Set up authentication context
    - _Requirements: All_


  - [x] 18.2 Create API client and hooks

    - Create axios instance with JWT interceptor
    - Create TanStack Query hooks for each API endpoint
    - _Requirements: All_

  - [x] 18.3 Create shared UI components


    - Create KPI card component with animations
    - Create data table component with TanStack Table
    - Create form components with React Hook Form
    - Create chart wrapper components
    - _Requirements: 8.1, 8.2_


  - [x] 18.4 Create layout components

    - Create main layout with sidebar navigation
    - Create header with user menu
    - Implement dark/light mode toggle
    - _Requirements: All_

## Phase 13: Frontend Pages

- [x] 19. Implement authentication pages






  - [x] 19.1 Create login page

    - Implement login form with validation
    - Handle JWT storage and redirect
    - _Requirements: 9.2_

- [x] 20. Implement executive dashboard page





  - [x] 20.1 Create dashboard page with KPI cards


    - Display availability, flight hours, cycles, AOG count
    - Implement date range filter
    - Add drill-down navigation
    - _Requirements: 8.1, 8.3, 8.4_


  - [x] 20.2 Create trend charts

    - Implement availability trend chart
    - Implement utilization trend chart
    - Add smooth animations with Framer Motion
    - _Requirements: 8.2_

- [x] 21. Implement fleet availability page





  - [x] 21.1 Create availability list view

    - Display availability by aircraft with filters
    - Implement date range selection
    - _Requirements: 3.3, 3.5_

- [x] 22. Implement aircraft detail page






  - [x] 22.1 Create aircraft detail view

    - Display current counters and status
    - Show availability timeline chart
    - List recent events, work orders, discrepancies
    - Show maintenance history by month
    - _Requirements: 11.1, 11.2, 11.3, 11.4_


  - [x] 22.2 Implement aircraft detail export

    - Export all aircraft data to Excel
    - _Requirements: 11.5_

- [x] 23. Implement maintenance operations page





  - [x] 23.1 Create maintenance task entry form


    - Implement shift-based task logging
    - Support work order linking
    - _Requirements: 5.1, 5.3_

  - [x] 23.2 Create maintenance summary view


    - Display aggregated tasks, man-hours, costs
    - Show top cost drivers
    - _Requirements: 5.2, 5.5_


- [x] 24. Implement AOG and events page





  - [x] 24.1 Create AOG event entry form

    - Implement event creation with all fields
    - Support file attachment upload
    - _Requirements: 4.1, 4.5_


  - [x] 24.2 Create AOG analytics view

    - Display downtime by responsibility
    - Show event timeline
    - _Requirements: 4.4_

- [x] 25. Implement work orders page







  - [x] 25.1 Create work order management view





    - Display work orders with status filters
    - Highlight overdue work orders
    - Show turnaround metrics
    - _Requirements: 6.1, 6.2, 6.5, 6.6_

- [x] 26. Implement discrepancies page






  - [x] 26.1 Create discrepancy management view

    - Display discrepancies with ATA filter
    - Show top ATA chapters chart
    - _Requirements: 6.3, 6.4_

- [x] 27. Implement budget page






  - [x] 27.1 Create budget analytics view

    - Display budget vs actual by clause
    - Show burn rate and remaining budget
    - Display cost efficiency metrics
    - _Requirements: 7.3, 7.4, 7.5, 7.6_


- [x] 28. Implement data import page






  - [ ] 28.1 Create import workflow
    - Implement template download
    - Create file upload with preview
    - Display validation errors
    - Implement import confirmation
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 29. Implement admin settings page






  - [x] 29.1 Create user management view

    - Display user list
    - Implement user creation form
    - _Requirements: 9.1_



  - [x] 29.2 Create aircraft master management
    - Display aircraft list with CRUD
    - Implement aircraft form
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 30. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 14: Seed Scripts and Final Integration

- [x] 31. Create seed scripts






  - [x] 31.1 Create database seed script

    - Seed default admin user
    - Seed aircraft master from provided data
    - Seed sample budget plan
    - _Requirements: All_


  - [x] 31.2 Create historical data import script

    - Import Cessna workbook data (ASH, PT, WO, DCRP)
    - Import fleet utilization snapshot
    - _Requirements: All_

- [x] 32. Final integration and polish





  - [x] 32.1 Add export functionality to all pages


    - Implement Excel export buttons
    - _Requirements: 1.5, 8.5, 11.5_



  - [x] 32.2 Add loading states and error handling
    - Implement skeleton loaders
    - Add error boundaries
    - _Requirements: All_


  - [x] 32.3 Add animations and polish

    - Add page transitions
    - Polish KPI card animations
    - _Requirements: 8.2_

- [ ] 33. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

