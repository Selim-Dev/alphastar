import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BudgetProjectDetailPage } from './BudgetProjectDetailPage';
import * as useBudgetProjectsModule from '@/hooks/useBudgetProjects';
import * as useBudgetAnalyticsModule from '@/hooks/useBudgetAnalytics';

// Mock the hooks
vi.mock('@/hooks/useBudgetProjects');
vi.mock('@/hooks/useBudgetAnalytics');

const mockProject = {
  _id: 'project-123',
  name: 'RSAF FY2025 Budget',
  templateType: 'RSAF',
  dateRange: {
    start: new Date('2025-01-01'),
    end: new Date('2025-12-31'),
  },
  currency: 'USD',
  aircraftScope: {
    type: 'type' as const,
    aircraftTypes: ['A330', 'G650ER'],
  },
  status: 'active' as const,
  createdBy: 'user-123',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockKPIs = {
  totalBudgeted: 1000000,
  totalSpent: 250000,
  remainingBudget: 750000,
  budgetUtilization: 25,
  burnRate: 83333,
  averageMonthlySpend: 83333,
  forecastMonthsRemaining: 9,
  forecastDepletionDate: new Date('2025-10-01'),
};

describe('BudgetProjectDetailPage', () => {
  let queryClient: QueryClient;
  let mockUseProject: any;
  let mockUseKPIs: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Setup mock implementations
    mockUseProject = vi.fn(() => ({
      data: mockProject,
      isLoading: false,
      error: null,
    }));

    mockUseKPIs = vi.fn(() => ({
      data: mockKPIs,
      isLoading: false,
      error: null,
    }));

    vi.mocked(useBudgetProjectsModule.useBudgetProjects).mockReturnValue({
      useProject: mockUseProject,
      useTableData: vi.fn(() => ({
        data: {
          projectId: 'project-123',
          periods: [],
          rows: [],
          columnTotals: {},
          grandTotal: { budgeted: 0, spent: 0, remaining: 0 },
        },
        isLoading: false,
        error: null,
      })),
      useUpdatePlanRow: vi.fn(() => ({
        mutateAsync: vi.fn().mockResolvedValue(undefined),
      })),
      useUpdateActual: vi.fn(() => ({
        mutateAsync: vi.fn().mockResolvedValue(undefined),
      })),
      useProjects: vi.fn(),
      useCreateProject: vi.fn(),
      useUpdateProject: vi.fn(),
      useDeleteProject: vi.fn(),
    });

    vi.mocked(useBudgetAnalyticsModule.useBudgetAnalytics).mockReturnValue({
      useKPIs: mockUseKPIs,
      useMonthlySpend: vi.fn(),
      useCumulativeSpend: vi.fn(),
      useSpendDistribution: vi.fn(),
      useBudgetedVsSpent: vi.fn(),
      useTop5Overspend: vi.fn(),
      useHeatmap: vi.fn(),
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/budget-projects/project-123']}>
          <Routes>
            <Route path="/budget-projects/:id" element={<BudgetProjectDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('Page Header and Navigation', () => {
    it('should render breadcrumb navigation', () => {
      renderComponent();

      expect(screen.getByText('Budget Projects')).toBeInTheDocument();
      expect(screen.getAllByText('RSAF FY2025 Budget').length).toBeGreaterThan(0);
    });

    it('should display project name and metadata', () => {
      renderComponent();

      expect(screen.getAllByText('RSAF FY2025 Budget').length).toBeGreaterThan(0);
      expect(screen.getByText(/Template: RSAF/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 1, 2025/)).toBeInTheDocument();
      expect(screen.getAllByText(/USD/).length).toBeGreaterThan(0);
    });

    it('should display project status badge', () => {
      renderComponent();

      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('should render Export to Excel button', () => {
      renderComponent();

      const exportButton = screen.getByRole('button', { name: /Export to Excel/i });
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Sticky KPI Cards', () => {
    it('should display Total Budgeted KPI', () => {
      renderComponent();

      expect(screen.getByText('Total Budgeted')).toBeInTheDocument();
      expect(screen.getByText('USD 1,000,000')).toBeInTheDocument();
    });

    it('should display Total Spent KPI with utilization', () => {
      renderComponent();

      expect(screen.getByText('Total Spent')).toBeInTheDocument();
      expect(screen.getByText('USD 250,000')).toBeInTheDocument();
      expect(screen.getByText('25.0% utilized')).toBeInTheDocument();
    });

    it('should display Remaining Budget KPI', () => {
      renderComponent();

      expect(screen.getByText('Remaining')).toBeInTheDocument();
      expect(screen.getByText('USD 750,000')).toBeInTheDocument();
    });

    it('should display Burn Rate KPI', () => {
      renderComponent();

      expect(screen.getByText('Burn Rate')).toBeInTheDocument();
      expect(screen.getByText('USD 83,333')).toBeInTheDocument();
      expect(screen.getByText('per month')).toBeInTheDocument();
    });

    it('should show loading state for KPIs', () => {
      mockUseKPIs.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderComponent();

      // Should show loading skeletons
      const loadingElements = screen.getAllByRole('generic').filter(el =>
        el.className.includes('animate-pulse')
      );
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Tabs Navigation', () => {
    it('should render all three tabs', () => {
      renderComponent();

      expect(screen.getByText('Table View')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Audit Log')).toBeInTheDocument();
    });

    it('should default to Table View tab', () => {
      renderComponent();

      // Table View should be active (you can check for active styling)
      const tableTab = screen.getByText('Table View').closest('button');
      expect(tableTab).toHaveClass('bg-primary');
    });

    it('should switch to Analytics tab when clicked', async () => {
      renderComponent();

      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText('Analytics Coming Soon')).toBeInTheDocument();
      });
    });

    it('should switch to Audit Log tab when clicked', async () => {
      renderComponent();

      const auditTab = screen.getByText('Audit Log');
      fireEvent.click(auditTab);

      await waitFor(() => {
        // Audit log component should be rendered
        // This will depend on the actual audit log implementation
        const auditTabButton = screen.getByText('Audit Log').closest('button');
        expect(auditTabButton).toHaveClass('bg-primary');
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state when project is loading', () => {
      mockUseProject.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderComponent();

      expect(screen.getByText('Loading project...')).toBeInTheDocument();
    });

    it('should show error state when project fails to load', () => {
      mockUseProject.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      renderComponent();

      expect(screen.getByText('Failed to load project')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Back to Projects/i })).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should trigger Excel export when button is clicked', async () => {
      // Mock fetch for export
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })),
      });

      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:test');
      global.URL.revokeObjectURL = vi.fn();

      renderComponent();

      const exportButton = screen.getByRole('button', { name: /Export to Excel/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/budget-export/project-123/excel',
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: expect.stringContaining('Bearer'),
            }),
          })
        );
      });
    });

    it('should show alert on export failure', async () => {
      // Mock fetch to fail
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      // Mock alert
      global.alert = vi.fn();

      renderComponent();

      const exportButton = screen.getByRole('button', { name: /Export to Excel/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Failed to export Excel file. Please try again.'
        );
      });
    });
  });

  describe('Color Coding', () => {
    it('should show green color for positive remaining budget', () => {
      renderComponent();

      const remainingText = screen.getByText('USD 750,000');
      expect(remainingText.className).toMatch(/text-green/);
    });

    it('should show red color for negative remaining budget', () => {
      mockUseKPIs.mockReturnValue({
        data: {
          ...mockKPIs,
          remainingBudget: -50000,
        },
        isLoading: false,
        error: null,
      });

      renderComponent();

      const remainingText = screen.getByText('USD -50,000');
      expect(remainingText.className).toMatch(/text-red/);
    });
  });
});
