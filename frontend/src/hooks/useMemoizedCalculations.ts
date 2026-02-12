import { useMemo } from 'react';
import type { BudgetTableData } from '@/types/budget-projects';

/**
 * Custom hook for memoizing expensive budget calculations
 * Prevents unnecessary recalculations on re-renders
 */
export function useMemoizedCalculations(tableData: BudgetTableData | undefined) {
  // Memoize row totals calculation
  const rowTotals = useMemo(() => {
    if (!tableData) return {};
    
    const totals: Record<string, number> = {};
    tableData.rows.forEach((row) => {
      const rowId = `${row.termId}-${row.aircraftId || 'all'}`;
      totals[rowId] = row.totalSpent;
    });
    
    return totals;
  }, [tableData]);

  // Memoize column totals calculation
  const columnTotals = useMemo(() => {
    if (!tableData) return {};
    return tableData.columnTotals;
  }, [tableData]);

  // Memoize grand totals
  const grandTotals = useMemo(() => {
    if (!tableData) {
      return {
        budgeted: 0,
        spent: 0,
        remaining: 0,
        utilization: 0,
      };
    }

    const utilization =
      tableData.grandTotal.budgeted > 0
        ? (tableData.grandTotal.spent / tableData.grandTotal.budgeted) * 100
        : 0;

    return {
      ...tableData.grandTotal,
      utilization,
    };
  }, [tableData]);

  // Memoize burn rate calculation
  const burnRate = useMemo(() => {
    if (!tableData || tableData.periods.length === 0) return 0;
    return tableData.grandTotal.spent / tableData.periods.length;
  }, [tableData]);

  // Memoize variance percentages for each row
  const rowVariances = useMemo(() => {
    if (!tableData) return {};
    
    const variances: Record<string, number> = {};
    tableData.rows.forEach((row) => {
      const rowId = `${row.termId}-${row.aircraftId || 'all'}`;
      variances[rowId] =
        row.plannedAmount > 0
          ? ((row.plannedAmount - row.totalSpent) / row.plannedAmount) * 100
          : 0;
    });
    
    return variances;
  }, [tableData]);

  return {
    rowTotals,
    columnTotals,
    grandTotals,
    burnRate,
    rowVariances,
  };
}
