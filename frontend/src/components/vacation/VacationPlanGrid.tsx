import { useState, useCallback, useMemo } from 'react';
import { Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import type { VacationPlan, VacationEmployee } from '@/types';
import { MONTH_NAMES, WEEK_LABELS } from '@/types';

interface VacationPlanGridProps {
  plan: VacationPlan;
  onCellChange: (employeeIndex: number, weekIndex: number, value: number) => void;
  onRemoveEmployee: (employeeIndex: number) => void;
  isEditable?: boolean;
  isLoading?: boolean;
}

/**
 * VacationPlanGrid Component
 * Displays a grid with employee names, 48 week columns, overlap indicators, and totals
 * Requirements: 16.3
 */
export function VacationPlanGrid({
  plan,
  onCellChange,
  onRemoveEmployee,
  isEditable = true,
  isLoading = false,
}: VacationPlanGridProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Generate month/quarter headers
  const monthHeaders = useMemo(() => {
    return MONTH_NAMES.map((month, index) => ({
      name: month,
      shortName: month.substring(0, 3),
      quarter: Math.floor(index / 3) + 1,
      startWeek: index * 4,
    }));
  }, []);

  // Handle cell click to start editing
  const handleCellClick = useCallback(
    (employeeIndex: number, weekIndex: number, currentValue: number) => {
      if (!isEditable || isLoading) return;
      setEditingCell({ row: employeeIndex, col: weekIndex });
      setEditValue(currentValue === 0 ? '' : currentValue.toString());
    },
    [isEditable, isLoading]
  );

  // Handle cell value change
  const handleCellBlur = useCallback(
    (employeeIndex: number, weekIndex: number) => {
      if (editingCell?.row === employeeIndex && editingCell?.col === weekIndex) {
        const numValue = editValue === '' ? 0 : parseFloat(editValue);
        if (!isNaN(numValue) && numValue >= 0) {
          onCellChange(employeeIndex, weekIndex, numValue);
        }
        setEditingCell(null);
        setEditValue('');
      }
    },
    [editingCell, editValue, onCellChange]
  );

  // Handle key press in cell
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, employeeIndex: number, weekIndex: number) => {
      if (e.key === 'Enter') {
        handleCellBlur(employeeIndex, weekIndex);
      } else if (e.key === 'Escape') {
        setEditingCell(null);
        setEditValue('');
      } else if (e.key === 'Tab') {
        handleCellBlur(employeeIndex, weekIndex);
        // Move to next cell
        const nextCol = weekIndex + 1;
        if (nextCol < 48) {
          setTimeout(() => {
            handleCellClick(employeeIndex, nextCol, plan.employees[employeeIndex]?.cells[nextCol] || 0);
          }, 0);
        }
      }
    },
    [handleCellBlur, handleCellClick, plan.employees]
  );

  // Get cell background color based on value
  const getCellBgColor = (value: number) => {
    if (value === 0) return '';
    if (value >= 1) return 'bg-blue-100 dark:bg-blue-900/30';
    return 'bg-blue-50 dark:bg-blue-900/20';
  };

  // Get overlap indicator style
  const getOverlapStyle = (overlap: string) => {
    if (overlap === 'Check') {
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
    }
    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
  };

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No vacation plan data available
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {/* Quarter Headers */}
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 z-20 bg-muted/50 border-b border-r border-border px-3 py-2 text-left font-medium w-40">
                {/* Empty corner cell */}
              </th>
              {[1, 2, 3, 4].map((quarter) => (
                <th
                  key={quarter}
                  colSpan={12}
                  className="border-b border-r border-border px-2 py-1 text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground"
                >
                  Q{quarter}
                </th>
              ))}
              <th className="sticky right-0 z-20 bg-muted/50 border-b border-l border-border px-3 py-2 text-center font-medium w-16">
                {/* Total header */}
              </th>
            </tr>

            {/* Month Headers */}
            <tr className="bg-muted/30">
              <th className="sticky left-0 z-20 bg-muted/30 border-b border-r border-border px-3 py-2 text-left font-medium">
                Employee
              </th>
              {monthHeaders.map((month) => (
                <th
                  key={month.name}
                  colSpan={4}
                  className="border-b border-r border-border px-1 py-1 text-center font-medium text-xs"
                >
                  {month.shortName}
                </th>
              ))}
              <th className="sticky right-0 z-20 bg-muted/30 border-b border-l border-border px-3 py-2 text-center font-medium">
                Total
              </th>
            </tr>

            {/* Week Headers */}
            <tr className="bg-muted/20">
              <th className="sticky left-0 z-20 bg-muted/20 border-b border-r border-border px-3 py-1">
                {/* Empty */}
              </th>
              {Array.from({ length: 12 }).map((_, monthIndex) =>
                WEEK_LABELS.map((week, weekIndex) => (
                  <th
                    key={`${monthIndex}-${weekIndex}`}
                    className="border-b border-r border-border px-1 py-1 text-center text-xs text-muted-foreground font-normal min-w-[40px]"
                  >
                    {week}
                  </th>
                ))
              )}
              <th className="sticky right-0 z-20 bg-muted/20 border-b border-l border-border px-3 py-1">
                {/* Empty */}
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Employee Rows */}
            {plan.employees.map((employee, employeeIndex) => (
              <EmployeeRow
                key={employeeIndex}
                employee={employee}
                employeeIndex={employeeIndex}
                editingCell={editingCell}
                editValue={editValue}
                setEditValue={setEditValue}
                onCellClick={handleCellClick}
                onCellBlur={handleCellBlur}
                onKeyDown={handleKeyDown}
                onRemove={onRemoveEmployee}
                getCellBgColor={getCellBgColor}
                isEditable={isEditable}
              />
            ))}

            {/* Empty state */}
            {plan.employees.length === 0 && (
              <tr>
                <td
                  colSpan={50}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No employees added yet. Click "Add Employee" to get started.
                </td>
              </tr>
            )}

            {/* Overlap Row */}
            {plan.employees.length > 0 && (
              <tr className="bg-muted/10 border-t-2 border-border">
                <td className="sticky left-0 z-20 bg-muted/10 border-r border-border px-3 py-2 font-medium text-muted-foreground">
                  Overlap
                </td>
                {plan.overlaps.map((overlap, weekIndex) => (
                  <td
                    key={weekIndex}
                    className={`border-r border-border px-1 py-1 text-center text-xs font-medium ${getOverlapStyle(overlap)}`}
                  >
                    {overlap === 'Check' ? (
                      <span className="flex items-center justify-center" title="Multiple employees on vacation">
                        <AlertCircle size={14} />
                      </span>
                    ) : (
                      <span className="flex items-center justify-center" title="No overlap">
                        <CheckCircle size={14} />
                      </span>
                    )}
                  </td>
                ))}
                <td className="sticky right-0 z-20 bg-muted/10 border-l border-border px-3 py-2 text-center font-medium">
                  {/* Empty total cell for overlap row */}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// Employee Row Component
// ============================================

interface EmployeeRowProps {
  employee: VacationEmployee;
  employeeIndex: number;
  editingCell: { row: number; col: number } | null;
  editValue: string;
  setEditValue: (value: string) => void;
  onCellClick: (employeeIndex: number, weekIndex: number, currentValue: number) => void;
  onCellBlur: (employeeIndex: number, weekIndex: number) => void;
  onKeyDown: (e: React.KeyboardEvent, employeeIndex: number, weekIndex: number) => void;
  onRemove: (employeeIndex: number) => void;
  getCellBgColor: (value: number) => string;
  isEditable: boolean;
}

function EmployeeRow({
  employee,
  employeeIndex,
  editingCell,
  editValue,
  setEditValue,
  onCellClick,
  onCellBlur,
  onKeyDown,
  onRemove,
  getCellBgColor,
  isEditable,
}: EmployeeRowProps) {
  const isEditing = (weekIndex: number) =>
    editingCell?.row === employeeIndex && editingCell?.col === weekIndex;

  return (
    <tr className="hover:bg-muted/5 transition-colors">
      {/* Employee Name Cell */}
      <td className="sticky left-0 z-10 bg-card border-b border-r border-border px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate max-w-[120px]" title={employee.name}>
            {employee.name}
          </span>
          {isEditable && (
            <button
              onClick={() => onRemove(employeeIndex)}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              title="Remove employee"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </td>

      {/* Week Cells */}
      {employee.cells.map((value, weekIndex) => (
        <td
          key={weekIndex}
          className={`border-b border-r border-border p-0 text-center ${getCellBgColor(value)}`}
        >
          {isEditing(weekIndex) ? (
            <input
              type="number"
              min="0"
              step="0.5"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => onCellBlur(employeeIndex, weekIndex)}
              onKeyDown={(e) => onKeyDown(e, employeeIndex, weekIndex)}
              className="w-full h-full px-1 py-1 text-center text-sm bg-background border-2 border-primary focus:outline-none"
              autoFocus
            />
          ) : (
            <button
              onClick={() => onCellClick(employeeIndex, weekIndex, value)}
              className={`w-full h-full px-1 py-1 text-sm ${
                isEditable ? 'cursor-pointer hover:bg-muted/20' : 'cursor-default'
              }`}
              disabled={!isEditable}
            >
              {value > 0 ? value : ''}
            </button>
          )}
        </td>
      ))}

      {/* Total Cell */}
      <td className="sticky right-0 z-10 bg-card border-b border-l border-border px-3 py-2 text-center font-semibold">
        {employee.total}
      </td>
    </tr>
  );
}

export default VacationPlanGrid;
