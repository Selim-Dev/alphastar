import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BudgetTable } from './BudgetTable';
import * as useBudgetProjectsModule from '@/hooks/useBudgetProjects';

// Mock the hooks
vi.mock('@/hooks/useBudgetProjects');

const mockTableData = {
  projectId: 'project-123',
  periods: ['2025-01', '2025-02', '2025-03'],
  rows: [
    {
      termId: 'off-base-maint-intl',
      termName: 'Off Base Maintenance International',
      termCategory: 'Maintenance',
      aircraftId: undefined,
      aircraftType: undefined,
      plannedAmount: 100000,
      actuals: {
        '2025-01': 8000,
        '2025-02': 9000,
        '2025-03': 0,
      },
      totalSpent: 17000,
      remaining: 83000,
      variance: 83000,
      variancePercent: 83,
    },
    {
      termId: 'scheduled-maint',
      termName: 'Scheduled Maintenance',
      termCategory: 'Maintenance',
      aircraftId: undefined,
      aircraftType: undefined,
      plannedAmount: 50000,
      actuals: {
        '2025-01': 4000,
        '2025-02': 4500,
        '2025-03': 5000,
      },
      totalSpent: 13500,
      remaining: 36500,
      variance: 36500,
      variancePercent: 73,
    },
  ],
  columnTotals: {
    '2025-01': 12000,
    '2025-02': 13500,
    '2025-03': 5000,
  },
  grandTotal: {
    budgeted: 150000,
    spent: 30500,
    remaining: 119500,
  },
};

describe('BudgetTable', () => {
  let queryClient: QueryClient;
  let mockUseTableData: any;
  let mockUseUpdatePlanRow: any;
  let mockUseUpdateActual: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Setup mock implementations
    mockUseTableData = vi.fn(() => ({
      data: mockTableData,
      isLoading: false,
      error: null,
    }));

    mockUseUpdatePlanRow = vi.fn(() => ({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    }));

    mockUseUpdateActual = vi.fn(() => ({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    }));

    vi.mocked(useBudgetProjectsModule.useBudgetProjects).mockReturnValue({
      useTableData: mockUseTableData,
      useUpdatePlanRow: mockUseUpdatePlanRow,
      useUpdateActual: mockUseUpdateActual,
      useProjects: vi.fn(),
      useProject: vi.fn(),
      useCreateProject: vi.fn(),
      useUpdateProject: vi.fn(),
      useDeleteProject: vi.fn(),
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BudgetTable projectId="project-123" />
      </QueryClientProvider>
    );
  };

  describe('Display and Layout', () => {
    it('should render sticky KPI cards with correct values', () => {
      renderComponent();

      expect(screen.getAllByText('Total Budgeted').length).toBeGreaterThan(0);
      expect(screen.getAllByText('150,000').length).toBeGreaterThan(0);
      
      expect(screen.getAllByText('Total Spent').length).toBeGreaterThan(0);
      expect(screen.getAllByText('30,500').length).toBeGreaterThan(0);
      
      expect(screen.getByText('Remaining Budget')).toBeInTheDocument();
      expect(screen.getAllByText('119,500').length).toBeGreaterThan(0);
      
      expect(screen.getByText('Burn Rate')).toBeInTheDocument();
    });

    it('should render table with spending terms as rows', () => {
      renderComponent();

      expect(screen.getByText('Off Base Maintenance International')).toBeInTheDocument();
      expect(screen.getByText('Scheduled Maintenance')).toBeInTheDocument();
    });

    it('should render planned amount column before monthly actuals', () => {
      renderComponent();

      const headers = screen.getAllByRole('columnheader');
      const headerTexts = headers.map(h => h.textContent);
      
      expect(headerTexts).toContain('Planned');
      expect(headerTexts).toContain('2025-01');
      expect(headerTexts).toContain('2025-02');
      
      // Planned should come before monthly columns
      const plannedIndex = headerTexts.indexOf('Planned');
      const monthIndex = headerTexts.indexOf('2025-01');
      expect(plannedIndex).toBeLessThan(monthIndex);
    });

    it('should display row totals and column totals', () => {
      renderComponent();

      // Row totals
      expect(screen.getByText('17,000')).toBeInTheDocument();
      expect(screen.getAllByText('13,500').length).toBeGreaterThan(0);
      
      // Column totals row
      expect(screen.getByText('Column Totals')).toBeInTheDocument();
      expect(screen.getByText('12,000')).toBeInTheDocument();
    });

    it('should display grand totals', () => {
      renderComponent();

      // Grand totals are shown in KPI cards and column totals row
      const budgetedElements = screen.getAllByText('150,000');
      expect(budgetedElements.length).toBeGreaterThan(0);
      
      const spentElements = screen.getAllByText('30,500');
      expect(spentElements.length).toBeGreaterThan(0);
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading skeleton when data is loading', () => {
      mockUseTableData.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderComponent();

      expect(screen.getByText('Loading table data...')).toBeInTheDocument();
    });

    it('should show error message when data fetch fails', () => {
      mockUseTableData.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      renderComponent();

      expect(screen.getByText('Failed to load table data')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    it('should show empty state when no data available', () => {
      mockUseTableData.mockReturnValue({
        data: { ...mockTableData, rows: [] },
        isLoading: false,
        error: null,
      });

      renderComponent();

      expect(screen.getByText('No budget data available')).toBeInTheDocument();
    });
  });

  describe('Inline Editing - Planned Amount', () => {
    it('should enable editing when clicking on planned amount cell', async () => {
      renderComponent();

      const plannedCell = screen.getAllByText('100,000')[0];
      fireEvent.click(plannedCell);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('100000');
      });
    });

    it('should validate non-negative numbers for planned amount', async () => {
      renderComponent();

      const plannedCell = screen.getAllByText('100,000')[0];
      fireEvent.click(plannedCell);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: '-500' } });
      });

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText('Value cannot be negative')).toBeInTheDocument();
      });
    });

    it('should validate numeric input for planned amount', async () => {
      renderComponent();

      const plannedCell = screen.getAllByText('100,000')[0];
      fireEvent.click(plannedCell);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'abc' } });
      });

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText('Value must be a number')).toBeInTheDocument();
      });
    });

    it('should save planned amount on Enter key', async () => {
      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseUpdatePlanRow.mockReturnValue({ mutateAsync });

      renderComponent();

      const plannedCell = screen.getAllByText('100,000')[0];
      fireEvent.click(plannedCell);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: '120000' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          projectId: 'project-123',
          rowId: 'off-base-maint-intl-all',
          dto: { plannedAmount: 120000 },
        });
      });
    });

    it('should cancel editing on Escape key', async () => {
      renderComponent();

      const plannedCell = screen.getAllByText('100,000')[0];
      fireEvent.click(plannedCell);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: '120000' } });
        fireEvent.keyDown(input, { key: 'Escape' });
      });

      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Inline Editing - Actual Amount', () => {
    it('should enable editing when clicking on actual amount cell', async () => {
      renderComponent();

      // Find the first actual amount cell (8,000 for 2025-01)
      const actualCell = screen.getByText('8,000');
      fireEvent.click(actualCell);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('8000');
      });
    });

    it('should save actual amount on Enter key', async () => {
      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseUpdateActual.mockReturnValue({ mutateAsync });

      renderComponent();

      const actualCell = screen.getByText('8,000');
      fireEvent.click(actualCell);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: '9500' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          projectId: 'project-123',
          period: '2025-01',
          dto: {
            termId: 'off-base-maint-intl', // Correctly extracted without the '-all' suffix
            amount: 9500,
          },
        });
      });
    });

    it('should validate non-negative numbers for actual amount', async () => {
      renderComponent();

      const actualCell = screen.getByText('8,000');
      fireEvent.click(actualCell);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: '-100' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Value cannot be negative')).toBeInTheDocument();
      });
    });
  });

  describe('Optimistic Updates and Error Handling', () => {
    it('should show success toast after successful save', async () => {
      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseUpdatePlanRow.mockReturnValue({ mutateAsync });

      renderComponent();

      const plannedCell = screen.getAllByText('100,000')[0];
      fireEvent.click(plannedCell);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: '120000' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument();
        expect(screen.getByText('Planned amount updated successfully')).toBeInTheDocument();
      });
    });

    it('should show error toast on save failure', async () => {
      const mutateAsync = vi.fn().mockRejectedValue(new Error('Network error'));
      mockUseUpdatePlanRow.mockReturnValue({ mutateAsync });

      renderComponent();

      const plannedCell = screen.getAllByText('100,000')[0];
      fireEvent.click(plannedCell);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: '120000' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to save changes. Please try again.')).toBeInTheDocument();
      });
    });

    it('should not save if value has not changed', async () => {
      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseUpdatePlanRow.mockReturnValue({ mutateAsync });

      renderComponent();

      const plannedCell = screen.getAllByText('100,000')[0];
      fireEvent.click(plannedCell);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        // Don't change the value, just press Enter
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(mutateAsync).not.toHaveBeenCalled();
      });
    });
  });

  describe('Calculations', () => {
    it('should calculate burn rate correctly', () => {
      renderComponent();

      // Burn rate = Total Spent / Number of Periods
      // 30,500 / 3 = 10,167 (rounded)
      const burnRateText = screen.getByText(/10,167|10,166/);
      expect(burnRateText).toBeInTheDocument();
    });

    it('should calculate budget utilization correctly', () => {
      renderComponent();

      // Budget Utilization = (Spent / Budgeted) * 100
      // (30,500 / 150,000) * 100 = 20.3%
      const utilizationTexts = screen.getAllByText(/20\.3/);
      expect(utilizationTexts.length).toBeGreaterThan(0);
    });

    it('should show remaining budget with correct color coding', () => {
      renderComponent();

      const remainingElements = screen.getAllByText('119,500');
      // Should have green color class for positive remaining
      const remainingInKPI = remainingElements.find(el => 
        el.className.includes('text-green')
      );
      expect(remainingInKPI).toBeInTheDocument();
    });
  });
});
