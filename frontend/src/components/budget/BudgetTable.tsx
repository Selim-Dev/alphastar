import { useState, useCallback, useRef, useEffect } from 'react';
import { useBudgetProjects } from '@/hooks/useBudgetProjects';
import { Loader2, AlertCircle, Check } from 'lucide-react';

interface BudgetTableProps {
  projectId: string;
  readOnly?: boolean;
}

interface EditingCell {
  rowId: string;
  columnType: 'planned' | 'actual';
  period?: string;
  value: string;
  originalValue: number;
}

interface ValidationError {
  rowId: string;
  columnType: 'planned' | 'actual';
  period?: string;
  message: string;
}

interface ToastMessage {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

/**
 * Budget Table Component
 * 
 * Features:
 * - Display spending terms as rows, months as columns
 * - Show planned amount column before monthly actuals
 * - Sticky headers (term names, month columns)
 * - Display row totals and column totals
 * - Show grand totals (budgeted, spent, remaining)
 * - Loading skeleton and error states
 * - Inline cell editing with validation
 * - Optimistic updates with rollback on error
 * - Debounced saves (300ms)
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9, 2.10
 */
export function BudgetTable({ projectId, readOnly = false }: BudgetTableProps) {
  const { useTableData, useUpdatePlanRow, useUpdateActual } = useBudgetProjects();
  const { data: tableData, isLoading, error } = useTableData(projectId);
  const updatePlanRow = useUpdatePlanRow();
  const updateActual = useUpdateActual();

  // State for inline editing
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  
  // Refs for input and debounce timer
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Simple toast implementation
  const showToast = useCallback((message: ToastMessage) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Validate input value
  const validateValue = useCallback((value: string): { valid: boolean; error?: string } => {
    // Check if empty
    if (value.trim() === '') {
      return { valid: false, error: 'Value cannot be empty' };
    }

    // Check if numeric
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return { valid: false, error: 'Value must be a number' };
    }

    // Check if non-negative
    if (numValue < 0) {
      return { valid: false, error: 'Value cannot be negative' };
    }

    return { valid: true };
  }, []);

  // Start editing a cell
  const startEditing = useCallback((
    rowId: string,
    columnType: 'planned' | 'actual',
    period: string | undefined,
    currentValue: number
  ) => {
    // Prevent editing if read-only
    if (readOnly) return;
    
    setEditingCell({
      rowId,
      columnType,
      period,
      value: currentValue.toString(),
      originalValue: currentValue,
    });
    setValidationError(null);
  }, [readOnly]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setEditingCell(null);
    setValidationError(null);
  }, []);

  // Save cell value with debouncing
  const saveCellValue = useCallback(async (cell: EditingCell) => {
    // Validate
    const validation = validateValue(cell.value);
    if (!validation.valid) {
      setValidationError({
        rowId: cell.rowId,
        columnType: cell.columnType,
        period: cell.period,
        message: validation.error!,
      });
      return;
    }

    const numValue = parseFloat(cell.value);
    
    // Check if value actually changed
    if (numValue === cell.originalValue) {
      cancelEditing();
      return;
    }

    // Set saving state
    const cellKey = `${cell.rowId}-${cell.columnType}-${cell.period || 'planned'}`;
    setSavingCell(cellKey);
    setValidationError(null);

    try {
      if (cell.columnType === 'planned') {
        // Update planned amount
        await updatePlanRow.mutateAsync({
          projectId,
          rowId: cell.rowId,
          dto: {
            plannedAmount: numValue,
          },
        });
        
        showToast({
          title: 'Saved',
          description: 'Planned amount updated successfully',
        });
      } else if (cell.columnType === 'actual' && cell.period) {
        // Update actual amount
        // Extract termId from rowId (format: termId-aircraftId or termId-all)
        const parts = cell.rowId.split('-');
        const termId = parts.slice(0, -1).join('-'); // Everything except the last part (aircraftId or 'all')
        
        await updateActual.mutateAsync({
          projectId,
          period: cell.period,
          dto: {
            termId,
            amount: numValue,
          },
        });
        
        showToast({
          title: 'Saved',
          description: 'Actual amount updated successfully',
        });
      }

      // Clear editing state
      setEditingCell(null);
    } catch (error) {
      // Show error and keep editing state
      setValidationError({
        rowId: cell.rowId,
        columnType: cell.columnType,
        period: cell.period,
        message: error instanceof Error ? error.message : 'Failed to save',
      });
      
      showToast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingCell(null);
    }
  }, [projectId, validateValue, updatePlanRow, updateActual, showToast, cancelEditing]);

  // Handle input change with debouncing
  const handleInputChange = useCallback((value: string) => {
    if (!editingCell) return;

    setEditingCell({ ...editingCell, value });
    setValidationError(null);

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer for debounced save (300ms)
    saveTimerRef.current = setTimeout(() => {
      saveCellValue({ ...editingCell, value });
    }, 300);
  }, [editingCell, saveCellValue]);

  // Handle key press in input
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingCell) {
        // Clear debounce timer and save immediately
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }
        saveCellValue(editingCell);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  }, [editingCell, saveCellValue, cancelEditing]);

  // Check if a cell is currently being edited
  const isCellEditing = useCallback((rowId: string, columnType: 'planned' | 'actual', period?: string): boolean => {
    if (!editingCell) return false;
    return (
      editingCell.rowId === rowId &&
      editingCell.columnType === columnType &&
      editingCell.period === period
    );
  }, [editingCell]);

  // Check if a cell has validation error
  const getCellError = useCallback((rowId: string, columnType: 'planned' | 'actual', period?: string): string | null => {
    if (!validationError) return null;
    if (
      validationError.rowId === rowId &&
      validationError.columnType === columnType &&
      validationError.period === period
    ) {
      return validationError.message;
    }
    return null;
  }, [validationError]);

  // Check if a cell is saving
  const isCellSaving = useCallback((rowId: string, columnType: 'planned' | 'actual', period?: string): boolean => {
    const cellKey = `${rowId}-${columnType}-${period || 'planned'}`;
    return savingCell === cellKey;
  }, [savingCell]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
          <span className="text-muted-foreground">Loading table data...</span>
        </div>
        {/* Loading skeleton */}
        <div className="mt-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-destructive p-8">
        <div className="flex items-center justify-center text-destructive">
          <AlertCircle className="w-8 h-8 mr-3" />
          <div>
            <p className="font-semibold">Failed to load table data</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!tableData || tableData.rows.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">No budget data available</p>
        <p className="text-sm text-muted-foreground mt-2">
          Start by entering planned amounts for each spending term.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Read-only Notice */}
      {readOnly && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Read-only access</span>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 ml-7">
            You have view-only permissions. Contact an Editor or Admin to make changes.
          </p>
        </div>
      )}

      {/* Sticky KPI Cards */}
      <div className="sticky top-0 z-30 bg-background pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Budgeted */}
          <div className="bg-card rounded-lg border border-border p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Total Budgeted</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-1 truncate">
                  {tableData.grandTotal.budgeted.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 ml-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Spent */}
          <div className="bg-card rounded-lg border border-border p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Total Spent</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-1 truncate">
                  {tableData.grandTotal.spent.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {tableData.grandTotal.budgeted > 0
                    ? `${((tableData.grandTotal.spent / tableData.grandTotal.budgeted) * 100).toFixed(1)}% utilized`
                    : '0% utilized'}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 ml-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Remaining Budget */}
          <div className="bg-card rounded-lg border border-border p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Remaining Budget</p>
                <p className={`text-xl sm:text-2xl font-bold mt-1 truncate ${
                  tableData.grandTotal.remaining >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {tableData.grandTotal.remaining.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {tableData.grandTotal.remaining >= 0 ? 'Under budget' : 'Over budget'}
                </p>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ml-2 ${
                tableData.grandTotal.remaining >= 0
                  ? 'bg-green-500/10'
                  : 'bg-red-500/10'
              }`}>
                <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  tableData.grandTotal.remaining >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Burn Rate */}
          <div className="bg-card rounded-lg border border-border p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Burn Rate</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-1 truncate">
                  {tableData.periods.length > 0
                    ? (tableData.grandTotal.spent / tableData.periods.length).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })
                    : '0'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">per month</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 ml-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Desktop/Tablet Table View - Horizontal scroll on tablets, hidden on mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Table Header */}
            <thead className="bg-muted/50 sticky top-0 z-20">
              <tr>
                {/* Spending Term Column Header */}
                <th className="sticky left-0 z-30 bg-muted/50 px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-r border-border min-w-[250px]">
                  Spending Term
                </th>
                
                {/* Category Column Header */}
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-r border-border min-w-[150px]">
                  Category
                </th>
                
                {/* Planned Amount Column Header */}
                <th className="px-4 py-3 text-right text-sm font-semibold text-foreground border-b border-r border-border min-w-[120px] bg-blue-500/10">
                  Planned
                </th>
                
                {/* Monthly Actual Column Headers */}
                {tableData.periods.map((period) => (
                  <th
                    key={period}
                    className="px-4 py-3 text-right text-sm font-semibold text-foreground border-b border-r border-border min-w-[120px]"
                  >
                    {period}
                  </th>
                ))}
                
                {/* Total Spent Column Header */}
                <th className="px-4 py-3 text-right text-sm font-semibold text-foreground border-b border-r border-border min-w-[120px] bg-amber-500/10">
                  Total Spent
                </th>
                
                {/* Remaining Column Header */}
                <th className="px-4 py-3 text-right text-sm font-semibold text-foreground border-b border-border min-w-[120px] bg-green-500/10">
                  Remaining
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {tableData.rows.map((row, rowIndex) => (
                <tr
                  key={`${row.termId}-${row.aircraftId || 'all'}`}
                  className={`
                    hover:bg-muted/30 transition-colors
                    ${rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                  `}
                >
                  {/* Spending Term Name */}
                  <td className="sticky left-0 z-10 px-4 py-3 text-sm text-foreground border-b border-r border-border bg-inherit">
                    <div className="font-medium">{row.termName}</div>
                    {row.aircraftType && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {row.aircraftType}
                      </div>
                    )}
                  </td>
                  
                  {/* Category */}
                  <td className="px-4 py-3 text-sm text-muted-foreground border-b border-r border-border">
                    {row.termCategory}
                  </td>
                  
                  {/* Planned Amount */}
                  <td 
                    className={`px-4 py-3 text-sm text-right font-medium text-foreground border-b border-r border-border bg-blue-500/5 ${
                      readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-blue-500/10'
                    } transition-colors`}
                    onClick={() => !readOnly && startEditing(`${row.termId}-${row.aircraftId || 'all'}`, 'planned', undefined, row.plannedAmount)}
                  >
                    {isCellEditing(`${row.termId}-${row.aircraftId || 'all'}`, 'planned') ? (
                      <div className="relative">
                        <input
                          ref={inputRef}
                          type="text"
                          value={editingCell?.value || ''}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={() => {
                            if (editingCell) {
                              // Clear debounce timer and save immediately on blur
                              if (saveTimerRef.current) {
                                clearTimeout(saveTimerRef.current);
                                saveTimerRef.current = null;
                              }
                              saveCellValue(editingCell);
                            }
                          }}
                          className="w-full px-2 py-1 text-right border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
                        />
                        {isCellSaving(`${row.termId}-${row.aircraftId || 'all'}`, 'planned') && (
                          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <span>{row.plannedAmount.toLocaleString()}</span>
                        {isCellSaving(`${row.termId}-${row.aircraftId || 'all'}`, 'planned') && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    )}
                    {getCellError(`${row.termId}-${row.aircraftId || 'all'}`, 'planned') && (
                      <div className="absolute z-50 mt-1 px-2 py-1 text-xs text-white bg-red-500 rounded shadow-lg whitespace-nowrap">
                        {getCellError(`${row.termId}-${row.aircraftId || 'all'}`, 'planned')}
                      </div>
                    )}
                  </td>
                  
                  {/* Monthly Actuals */}
                  {tableData.periods.map((period) => {
                    const cellId = `${row.termId}-${row.aircraftId || 'all'}`;
                    const actualValue = row.actuals[period] || 0;
                    
                    return (
                      <td
                        key={period}
                        className={`px-4 py-3 text-sm text-right text-foreground border-b border-r border-border ${
                          readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50'
                        } transition-colors relative`}
                        onClick={() => !readOnly && startEditing(cellId, 'actual', period, actualValue)}
                      >
                        {isCellEditing(cellId, 'actual', period) ? (
                          <div className="relative">
                            <input
                              ref={inputRef}
                              type="text"
                              value={editingCell?.value || ''}
                              onChange={(e) => handleInputChange(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onBlur={() => {
                                if (editingCell) {
                                  // Clear debounce timer and save immediately on blur
                                  if (saveTimerRef.current) {
                                    clearTimeout(saveTimerRef.current);
                                    saveTimerRef.current = null;
                                  }
                                  saveCellValue(editingCell);
                                }
                              }}
                              className="w-full px-2 py-1 text-right border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                            />
                            {isCellSaving(cellId, 'actual', period) && (
                              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span>{actualValue > 0 ? actualValue.toLocaleString() : '-'}</span>
                            {isCellSaving(cellId, 'actual', period) && (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        )}
                        {getCellError(cellId, 'actual', period) && (
                          <div className="absolute z-50 mt-1 px-2 py-1 text-xs text-white bg-red-500 rounded shadow-lg whitespace-nowrap right-0">
                            {getCellError(cellId, 'actual', period)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  
                  {/* Total Spent */}
                  <td className="px-4 py-3 text-sm text-right font-semibold text-foreground border-b border-r border-border bg-amber-500/5">
                    {row.totalSpent.toLocaleString()}
                  </td>
                  
                  {/* Remaining */}
                  <td
                    className={`
                      px-4 py-3 text-sm text-right font-semibold border-b border-border
                      ${
                        row.remaining >= 0
                          ? 'text-green-600 dark:text-green-400 bg-green-500/5'
                          : 'text-red-600 dark:text-red-400 bg-red-500/5'
                      }
                    `}
                  >
                    {row.remaining.toLocaleString()}
                  </td>
                </tr>
              ))}

              {/* Column Totals Row */}
              <tr className="bg-muted/50 font-semibold border-t-2 border-border">
                <td className="sticky left-0 z-10 px-4 py-3 text-sm text-foreground border-b border-r border-border bg-muted/50">
                  Column Totals
                </td>
                <td className="px-4 py-3 text-sm text-foreground border-b border-r border-border"></td>
                <td className="px-4 py-3 text-sm text-right text-foreground border-b border-r border-border bg-blue-500/10">
                  {tableData.grandTotal.budgeted.toLocaleString()}
                </td>
                {tableData.periods.map((period) => (
                  <td
                    key={period}
                    className="px-4 py-3 text-sm text-right text-foreground border-b border-r border-border"
                  >
                    {tableData.columnTotals[period]?.toLocaleString() || '0'}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-right text-foreground border-b border-r border-border bg-amber-500/10">
                  {tableData.grandTotal.spent.toLocaleString()}
                </td>
                <td
                  className={`
                    px-4 py-3 text-sm text-right border-b border-border
                    ${
                      tableData.grandTotal.remaining >= 0
                        ? 'text-green-600 dark:text-green-400 bg-green-500/10'
                        : 'text-red-600 dark:text-red-400 bg-red-500/10'
                    }
                  `}
                >
                  {tableData.grandTotal.remaining.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Shown only on mobile (<768px) */}
        <div className="md:hidden divide-y divide-border">
          {tableData.rows.map((row) => {
            const cellId = `${row.termId}-${row.aircraftId || 'all'}`;
            return (
              <div key={cellId} className="p-4 space-y-3">
                {/* Term Header */}
                <div className="border-b border-border pb-2">
                  <div className="font-semibold text-foreground">{row.termName}</div>
                  {row.aircraftType && (
                    <div className="text-xs text-muted-foreground mt-1">{row.aircraftType}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">{row.termCategory}</div>
                </div>

                {/* Planned Amount */}
                <div className="flex items-center justify-between bg-blue-500/5 rounded p-2">
                  <span className="text-sm font-medium text-muted-foreground">Planned:</span>
                  <span className="text-sm font-semibold text-foreground">
                    {row.plannedAmount.toLocaleString()}
                  </span>
                </div>

                {/* Monthly Actuals - Scrollable */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase">Monthly Actuals:</div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {tableData.periods.map((period) => {
                      const actualValue = row.actuals[period] || 0;
                      return (
                        <div key={period} className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-muted/30">
                          <span className="text-muted-foreground">{period}:</span>
                          <span className="font-medium text-foreground">
                            {actualValue > 0 ? actualValue.toLocaleString() : '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between bg-amber-500/5 rounded p-2">
                    <span className="text-sm font-medium text-muted-foreground">Total Spent:</span>
                    <span className="text-sm font-semibold text-foreground">
                      {row.totalSpent.toLocaleString()}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between rounded p-2 ${
                    row.remaining >= 0
                      ? 'bg-green-500/5'
                      : 'bg-red-500/5'
                  }`}>
                    <span className="text-sm font-medium text-muted-foreground">Remaining:</span>
                    <span className={`text-sm font-semibold ${
                      row.remaining >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {row.remaining.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Grand Totals Card */}
          <div className="p-4 bg-muted/30 space-y-2">
            <div className="font-semibold text-foreground mb-3">Grand Totals</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Budgeted:</span>
              <span className="text-sm font-semibold text-foreground">
                {tableData.grandTotal.budgeted.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Spent:</span>
              <span className="text-sm font-semibold text-foreground">
                {tableData.grandTotal.spent.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Remaining:</span>
              <span className={`text-sm font-semibold ${
                tableData.grandTotal.remaining >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {tableData.grandTotal.remaining.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      {/* Table Footer with Summary */}
      <div className="bg-muted/30 px-4 py-3 border-t border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            Showing {tableData.rows.length} spending terms across {tableData.periods.length} periods
          </span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Budget Utilization:</span>
            <span className="font-semibold text-foreground">
              {tableData.grandTotal.budgeted > 0
                ? ((tableData.grandTotal.spent / tableData.grandTotal.budgeted) * 100).toFixed(1)
                : '0.0'}
              %
            </span>
          </div>
        </div>
      </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div className={`rounded-lg border shadow-lg p-4 min-w-[300px] ${
            toastMessage.variant === 'destructive'
              ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              : 'bg-card border-border'
          }`}>
            <div className="flex items-start gap-3">
              {toastMessage.variant === 'destructive' ? (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              ) : (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-semibold text-sm ${
                  toastMessage.variant === 'destructive'
                    ? 'text-red-900 dark:text-red-100'
                    : 'text-foreground'
                }`}>
                  {toastMessage.title}
                </p>
                <p className={`text-sm mt-1 ${
                  toastMessage.variant === 'destructive'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-muted-foreground'
                }`}>
                  {toastMessage.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
