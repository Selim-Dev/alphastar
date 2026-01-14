# Implementation Plan

## Phase 1: Design System Foundation

- [x] 1. Update theme tokens and CSS variables





  - [x] 1.1 Update globals.css with aviation-inspired color palette


    - Add light mode tokens (navy/charcoal base, teal accent)
    - Add dark mode tokens with proper contrast
    - Add sidebar-specific tokens
    - Add aviation accent color tokens
    - _Requirements: 3.1, 3.2, 7.1_

  - [x] 1.2 Add typography and spacing tokens


    - Define typography scale classes
    - Define spacing scale utilities
    - Add shadow scale with theme-aware values
    - _Requirements: 3.4, 7.3, 7.4, 7.5_

  - [ ]* 1.3 Write property test for theme token usage
    - **Property 4: Theme Token Usage**
    - **Validates: Requirements 7.2**

## Phase 2: Core Layout Components

- [x] 2. Create AppShell layout component





  - [x] 2.1 Create AppShell component structure


    - Implement root layout with sidebar, topbar, and content areas
    - Add responsive grid/flex layout
    - Handle sidebar state (collapsed/expanded)
    - _Requirements: 1.1, 6.1, 6.2_

  - [x] 2.2 Create sidebar state management


    - Add collapsed state with localStorage persistence
    - Add mobile drawer state
    - Implement toggle handlers
    - _Requirements: 1.2, 6.3_

- [x] 3. Implement premium Sidebar component



  - [x] 3.1 Create Sidebar base structure


    - Implement expanded/collapsed layouts
    - Add smooth width transition animation
    - Style with aviation-inspired dark background
    - _Requirements: 1.1, 1.2, 5.4_


  - [x] 3.2 Create NavGroup component for section grouping
    - Add section labels (Operations, Maintenance, etc.)
    - Style with uppercase, tracking-wider labels
    - Handle collapsed state (hide labels)
    - _Requirements: 1.1_

  - [x] 3.3 Create NavItem component with active states

    - Implement left border accent on active
    - Add subtle background highlight
    - Add optional glow effect on active
    - Style hover transitions
    - _Requirements: 1.3, 1.4_


  - [x] 3.4 Add tooltip for collapsed sidebar
    - Show label tooltip on icon hover when collapsed
    - Position tooltip to the right of icon
    - _Requirements: 1.5_


  - [x] 3.5 Replace emoji icons with Lucide icons

    - Import appropriate Lucide icons for each nav item
    - Size icons consistently (20px)
    - _Requirements: 1.1_

- [x] 4. Implement premium Topbar component





  - [x] 4.1 Create Topbar base structure


    - Implement sticky positioning
    - Add proper height and padding
    - Style with card background and border
    - _Requirements: 2.5_


  - [x] 4.2 Create PageHeader with breadcrumbs
    - Display current page title
    - Add breadcrumb navigation
    - Support dynamic titles based on route
    - _Requirements: 2.1_

  - [ ]* 4.3 Write property test for topbar title matching route
    - **Property 1: Topbar Title Matches Route**
    - **Validates: Requirements 2.1**

  - [x] 4.4 Create UserMenu component

    - Display user avatar (initials-based)
    - Show name and role
    - Add dropdown with logout action
    - _Requirements: 2.3_


  - [x] 4.5 Create premium ThemeToggle component
    - Replace emoji with proper icons (Sun/Moon)
    - Add smooth transition animation
    - Style as icon button
    - _Requirements: 2.2, 3.5, 5.5_


  - [x] 4.6 Add global actions slot
    - Support page-specific action buttons
    - Style consistently with design system
    - _Requirements: 2.4_

- [ ] 5. Checkpoint - Ensure layout components work
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Mobile Responsiveness

- [x] 6. Implement responsive behavior





  - [x] 6.1 Create MobileDrawer component


    - Implement slide-in drawer from left
    - Add backdrop overlay
    - Handle close on outside click
    - _Requirements: 6.3, 6.4_


  - [x] 6.2 Add responsive breakpoint handling

    - Desktop: full sidebar visible
    - Tablet: collapsible sidebar
    - Mobile: drawer navigation
    - _Requirements: 6.1, 6.2, 6.3_


  - [x] 6.3 Update MobileMenu to use new drawer

    - Replace existing mobile menu with MobileDrawer
    - Ensure consistent navigation structure
    - _Requirements: 6.3, 6.5_

## Phase 4: Surface Components

- [x] 7. Enhance Card component






  - [x] 7.1 Update Card styling

    - Add proper elevation and shadow
    - Improve padding and border radius
    - Ensure theme-aware borders and shadows
    - _Requirements: 4.1_

- [x] 8. Enhance KPICard component





  - [x] 8.1 Update KPICard visual design


    - Add icon container with aviation-muted background
    - Emphasize numeric value with display typography
    - Add unit label styling
    - Support trend indicator
    - _Requirements: 4.2_


  - [x] 8.2 Add empty state handling

    - Display elegant empty state for zero/null values
    - Add guidance text for empty states
    - _Requirements: 4.3_

  - [ ]* 8.3 Write property test for KPI card empty state
    - **Property 2: KPI Card Empty State Rendering**
    - **Validates: Requirements 4.3**

- [x] 9. Create FilterBar component






  - [x] 9.1 Implement unified filter bar

    - Create container with consistent styling
    - Add proper spacing between controls
    - Style with muted background and border
    - _Requirements: 4.4_



- [x] 10. Enhance DataTable styling




  - [x] 10.1 Update table visual design

    - Add premium row hover states
    - Add optional zebra striping
    - Implement sticky header
    - _Requirements: 4.5_

## Phase 5: Interactions and Polish


- [x] 11. Add micro-interactions




  - [x] 11.1 Enhance button states


    - Polish hover, active, disabled states
    - Add loading state with spinner
    - Ensure consistent transitions
    - _Requirements: 5.2_

  - [ ]* 11.2 Write property test for button states
    - **Property 3: Button State Consistency**
    - **Validates: Requirements 5.2**

  - [x] 11.3 Update PageTransition component


    - Add subtle fade/slide animation
    - Use Tailwind transitions or existing Framer Motion
    - _Requirements: 5.3_

  - [x] 11.4 Add theme transition smoothing


    - Ensure smooth color transitions on theme change
    - Prevent jarring flashes
    - _Requirements: 3.5, 5.5_

## Phase 6: Page Updates


- [x] 12. Update existing pages to use new shell





  - [x] 12.1 Update MainLayout to use AppShell

    - Replace existing layout with new AppShell
    - Ensure all routes work correctly
    - _Requirements: 6.5_


  - [x] 12.2 Update DashboardPage with new components

    - Use enhanced KPICard components
    - Apply FilterBar for date range
    - Verify charts and data display correctly
    - _Requirements: 4.2, 4.4_


  - [x] 12.3 Update DiscrepanciesPage as reference implementation

    - Apply PageHeader with breadcrumbs
    - Use FilterBar for filters
    - Apply enhanced Card and DataTable styling
    - _Requirements: 2.1, 4.1, 4.4, 4.5_

  - [x] 12.4 Verify all other pages work with new shell


    - Test AvailabilityPage
    - Test MaintenancePage
    - Test AOGEventsPage
    - Test WorkOrdersPage
    - Test BudgetPage
    - Test ImportPage
    - Test AdminPage
    - _Requirements: 6.5_

- [ ] 13. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
