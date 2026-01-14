import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ColumnDef } from '@tanstack/react-table';
import { KPICard } from '@/components/ui/KPICard';
import { ChartContainer, BarChartWrapper, PieChartWrapper } from '@/components/ui/Charts';
import { DataTable } from '@/components/ui/DataTable';
import { ExportButton } from '@/components/ui/ExportButton';
import {
  useBudgetVariance,
  useBurnRate,
  useSpendByPeriod,
  useSpendByAircraftGroup,
  useDistinctAircraftGroups,
  useAvailableBudgetYears,
  useCloneBudgetPlans,
  BudgetVarianceResult,
} from '@/hooks/useBudget';
import { useAuth } from '@/contexts/AuthContext';

// Icons
const BudgetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const TrendUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PercentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function BudgetPage() {
  const currentYear = new Date().getFullYear();
  const [fiscalYear, setFiscalYear] = useState(currentYear);
  const [selectedAircraftGroup, setSelectedAircraftGroup] = useState<string>('');
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneSourceYear, setCloneSourceYear] = useState<number>(currentYear - 1);
  const [cloneTargetYear, setCloneTargetYear] = useState<number>(currentYear);
  const [adjustmentPercentage, setAdjustmentPercentage] = useState<number>(0);
  const [cloneError, setCloneError] = useState<string>('');
  const [cloneSuccess, setCloneSuccess] = useState<string>('');

  const { user } = useAuth();
  const canEdit = user?.role === 'Admin' || user?.role === 'Editor';

  // Fetch data
  const { data: aircraftGroups } = useDistinctAircraftGroups(fiscalYear);
  const { data: availableYears } = useAvailableBudgetYears();
  const { data: variance, isLoading: varianceLoading } = useBudgetVariance({
    fiscalYear,
    aircraftGroup: selectedAircraftGroup || undefined,
  });
  const { data: burnRate, isLoading: burnRateLoading } = useBurnRate({
    fiscalYear,
    aircraftGroup: selectedAircraftGroup || undefined,
  });
  const { data: spendByPeriod } = useSpendByPeriod({
    startPeriod: `${fiscalYear}-01`,
    endPeriod: `${fiscalYear}-12`,
    aircraftGroup: selectedAircraftGroup || undefined,
  });
  const { data: spendByGroup } = useSpendByAircraftGroup({ fiscalYear });

  const cloneMutation = useCloneBudgetPlans();

  const handleClone = async () => {
    setCloneError('');
    setCloneSuccess('');

    if (cloneSourceYear === cloneTargetYear) {
      setCloneError('Source and target years must be different');
      return;
    }

    try {
      const result = await cloneMutation.mutateAsync({
        sourceYear: cloneSourceYear,
        targetYear: cloneTargetYear,
        adjustmentPercentage,
      });

      setCloneSuccess(
        `Successfully cloned ${result.clonedCount} budget plans from FY${result.sourceYear} to FY${result.targetYear}` +
        (result.skippedCount > 0 ? `. ${result.skippedCount} plans were skipped (already exist).` : '') +
        (result.adjustmentPercentage !== 0 ? ` Applied ${result.adjustmentPercentage}% adjustment.` : '')
      );

      // Update the fiscal year selector to show the new year
      setFiscalYear(cloneTargetYear);

      // Close modal after a short delay
      setTimeout(() => {
        setShowCloneModal(false);
        setCloneSuccess('');
      }, 3000);
    } catch (error) {
      setCloneError((error as Error).message || 'Failed to clone budget plans');
    }
  };

  // Calculate totals from variance data
  const totals = useMemo(() => {
    if (!variance || variance.length === 0) {
      return {
        totalPlanned: 0,
        totalActual: 0,
        totalVariance: 0,
        utilizationPercentage: 0,
      };
    }
    const totalPlanned = variance.reduce((sum, v) => sum + v.plannedAmount, 0);
    const totalActual = variance.reduce((sum, v) => sum + v.actualAmount, 0);
    return {
      totalPlanned,
      totalActual,
      totalVariance: totalPlanned - totalActual,
      utilizationPercentage: totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0,
    };
  }, [variance]);

  // Transform spend by period for chart
  const spendTrendData = useMemo(() => {
    if (!spendByPeriod) return [];
    return spendByPeriod.map((item) => ({
      name: item.period,
      spend: item.totalAmount,
    }));
  }, [spendByPeriod]);

  // Transform spend by group for pie chart
  const spendByGroupData = useMemo(() => {
    if (!spendByGroup) return [];
    return spendByGroup.map((item) => ({
      name: item.aircraftGroup || 'Unassigned',
      value: item.totalAmount,
    }));
  }, [spendByGroup]);

  // Variance table columns
  const varianceColumns: ColumnDef<BudgetVarianceResult>[] = useMemo(() => [
    {
      accessorKey: 'clauseId',
      header: 'Clause',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.clauseId}</span>
      ),
    },
    {
      accessorKey: 'clauseDescription',
      header: 'Description',
    },
    {
      accessorKey: 'aircraftGroup',
      header: 'Aircraft Group',
    },
    {
      accessorKey: 'plannedAmount',
      header: 'Planned',
      cell: ({ row }) => formatCurrency(row.original.plannedAmount),
    },
    {
      accessorKey: 'actualAmount',
      header: 'Actual',
      cell: ({ row }) => formatCurrency(row.original.actualAmount),
    },
    {
      accessorKey: 'variance',
      header: 'Variance',
      cell: ({ row }) => (
        <span className={row.original.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
          {formatCurrency(row.original.variance)}
        </span>
      ),
    },
    {
      accessorKey: 'utilizationPercentage',
      header: 'Utilization',
      cell: ({ row }) => {
        const percentage = row.original.utilizationPercentage;
        let colorClass = 'text-green-600';
        if (percentage > 100) colorClass = 'text-red-600';
        else if (percentage > 80) colorClass = 'text-yellow-600';
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <span className={colorClass}>{percentage.toFixed(1)}%</span>
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          Budget & Cost Analytics
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-wrap items-center gap-3"
        >
          {/* Fiscal Year Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Fiscal Year:</label>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-card text-foreground"
            >
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Aircraft Group Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Aircraft Group:</label>
            <select
              value={selectedAircraftGroup}
              onChange={(e) => setSelectedAircraftGroup(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-card text-foreground"
            >
              <option value="">All Groups</option>
              {aircraftGroups?.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          {/* Export Button */}
          <ExportButton
            exportType="budget-plans"
            filters={{ fiscalYear, aircraftGroup: selectedAircraftGroup || undefined }}
            filename={`budget-plans-FY${fiscalYear}${selectedAircraftGroup ? `-${selectedAircraftGroup}` : ''}.xlsx`}
            label="Export"
          />

          {/* Clone from Previous Year Button */}
          {canEdit && (
            <button
              onClick={() => {
                setCloneSourceYear(fiscalYear - 1);
                setCloneTargetYear(fiscalYear);
                setAdjustmentPercentage(0);
                setCloneError('');
                setCloneSuccess('');
                setShowCloneModal(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <CopyIcon />
              Clone Budget
            </button>
          )}
        </motion.div>
      </div>

      {/* Clone Budget Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Clone Budget Plans</h3>
              <button
                onClick={() => setShowCloneModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <XIcon />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Clone all budget plans from a previous fiscal year to a new year. Optionally apply a percentage adjustment to all amounts.
              </p>

              {/* Source Year */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Source Year
                </label>
                <select
                  value={cloneSourceYear}
                  onChange={(e) => setCloneSourceYear(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground"
                >
                  {(availableYears && availableYears.length > 0 ? availableYears : [currentYear - 2, currentYear - 1, currentYear]).map((year) => (
                    <option key={year} value={year}>
                      FY {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Year */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Target Year
                </label>
                <select
                  value={cloneTargetYear}
                  onChange={(e) => setCloneTargetYear(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground"
                >
                  {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((year) => (
                    <option key={year} value={year}>
                      FY {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjustment Percentage */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Adjustment Percentage (optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={adjustmentPercentage}
                    onChange={(e) => setAdjustmentPercentage(Number(e.target.value))}
                    min={-100}
                    max={1000}
                    step={0.5}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground"
                    placeholder="0"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a positive value for increase (e.g., 5 for 5% increase) or negative for decrease.
                </p>
              </div>

              {/* Error Message */}
              {cloneError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {cloneError}
                </div>
              )}

              {/* Success Message */}
              {cloneSuccess && (
                <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md">
                  {cloneSuccess}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <button
                onClick={() => setShowCloneModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClone}
                disabled={cloneMutation.isPending || !!cloneSuccess}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cloneMutation.isPending ? 'Cloning...' : 'Clone Budget Plans'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Budget"
          value={varianceLoading ? '...' : formatCurrency(totals.totalPlanned)}
          subtitle={`FY ${fiscalYear} planned budget`}
          icon={<BudgetIcon />}
        />

        <KPICard
          title="Total Spent"
          value={varianceLoading ? '...' : formatCurrency(totals.totalActual)}
          subtitle={`${totals.utilizationPercentage.toFixed(1)}% of budget used`}
          icon={<TrendUpIcon />}
          className={totals.utilizationPercentage > 100 ? 'border-red-500/50' : ''}
        />

        <KPICard
          title="Remaining Budget"
          value={varianceLoading ? '...' : formatCurrency(totals.totalVariance)}
          subtitle={totals.totalVariance >= 0 ? 'Under budget' : 'Over budget'}
          icon={<PercentIcon />}
          className={totals.totalVariance < 0 ? 'border-red-500/50 bg-red-500/5' : 'border-green-500/50'}
        />

        <KPICard
          title="Months Remaining"
          value={burnRateLoading ? '...' : burnRate?.projectedMonthsRemaining === -1 ? '∞' : formatNumber(burnRate?.projectedMonthsRemaining ?? 0)}
          subtitle={`Avg. monthly: ${formatCurrency(burnRate?.averageMonthlySpend ?? 0)}`}
          icon={<ClockIcon />}
          className={burnRate && burnRate.projectedMonthsRemaining !== -1 && burnRate.projectedMonthsRemaining < 3 ? 'border-yellow-500/50' : ''}
        />
      </div>

      {/* Burn Rate Details */}
      {burnRate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Burn Rate Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Planned</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(burnRate.totalPlanned)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(burnRate.totalSpent)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Months with Data</p>
              <p className="text-xl font-semibold text-foreground">{burnRate.monthsWithData}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Monthly Spend</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(burnRate.averageMonthlySpend)}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Budget Utilization</span>
              <span className={totals.utilizationPercentage > 100 ? 'text-red-600' : 'text-foreground'}>
                {totals.utilizationPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(totals.utilizationPercentage, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full ${totals.utilizationPercentage > 100 ? 'bg-red-500' : totals.utilizationPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Monthly Spend Trend" subtitle={`FY ${fiscalYear}`} height={300}>
          {spendTrendData.length > 0 ? (
            <BarChartWrapper
              data={spendTrendData}
              bars={[{ dataKey: 'spend', color: '#3b82f6', name: 'Spend (USD)' }]}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No spend data for selected period
            </div>
          )}
        </ChartContainer>

        <ChartContainer title="Spend by Aircraft Group" subtitle={`FY ${fiscalYear}`} height={300}>
          {spendByGroupData.length > 0 ? (
            <PieChartWrapper data={spendByGroupData} innerRadius={50} outerRadius={90} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No spend data by aircraft group
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Budget Variance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Budget vs Actual by Clause</h3>
        <DataTable
          data={variance ?? []}
          columns={varianceColumns}
          searchPlaceholder="Search clauses..."
          searchColumn="clauseDescription"
        />
      </motion.div>
    </div>
  );
}
