import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, subMonths } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, FileDown, FileUp, TrendingUp, X } from 'lucide-react';

const PAGE_TITLE = 'Work Order Summaries | Alpha Star Aviation';

import { DataTable } from '@/components/ui/DataTable';
import { AircraftSelect } from '@/components/ui/AircraftSelect';
import { Button, Input, Textarea } from '@/components/ui/Form';
import {
  useWorkOrderSummaries,
  useWorkOrderSummaryTrends,
  useCreateWorkOrderSummary,
  useUpdateWorkOrderSummary,
  useDeleteWorkOrderSummary,
} from '@/hooks/useWorkOrderSummaries';
import { useAircraft } from '@/hooks/useAircraft';
import { usePermissions } from '@/hooks/usePermissions';
import { useExportData, downloadBlob } from '@/hooks/useImportExport';
import type { WorkOrderSummary, Aircraft, CreateWorkOrderSummaryDto } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Helper to get period options (last 24 months)
function getPeriodOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const today = new Date();
  for (let i = 0; i < 24; i++) {
    const date = subMonths(today, i);
    const value = format(date, 'yyyy-MM');
    const label = format(date, 'MMMM yyyy');
    options.push({ value, label });
  }
  return options;
}

// Summary Statistics Cards
function SummaryCards({
  totalSummaries,
  totalWorkOrders,
  totalCost,
  avgPerMonth,
}: {
  totalSummaries: number;
  totalWorkOrders: number;
  totalCost: number;
  avgPerMonth: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Records</p>
        <p className="text-2xl font-bold text-foreground">{totalSummaries.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Work Orders</p>
        <p className="text-2xl font-bold text-blue-500">{totalWorkOrders.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Cost</p>
        <p className="text-2xl font-bold text-green-500">
          ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Avg WO/Month</p>
        <p className="text-2xl font-bold text-foreground">
          {avgPerMonth > 0 ? avgPerMonth.toFixed(1) : '-'}
        </p>
      </motion.div>
    </div>
  );
}

// Quick Entry Form Modal
function QuickEntryModal({
  onClose,
  onSubmit,
  isSubmitting,
  editData,
}: {
  onClose: () => void;
  onSubmit: (data: CreateWorkOrderSummaryDto) => void;
  isSubmitting: boolean;
  editData?: WorkOrderSummary | null;
}) {
  const periodOptions = useMemo(() => getPeriodOptions(), []);
  const [formData, setFormData] = useState<CreateWorkOrderSummaryDto>({
    aircraftId: editData?.aircraftId || '',
    period: editData?.period || format(new Date(), 'yyyy-MM'),
    workOrderCount: editData?.workOrderCount || 0,
    totalCost: editData?.totalCost || 0,
    currency: editData?.currency || 'USD',
    notes: editData?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="border border-border rounded-xl shadow-2xl max-w-md w-full mx-4"
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-border rounded-t-xl" style={{ backgroundColor: 'hsl(var(--muted))' }}>
          <h2 className="text-lg font-semibold text-foreground">
            {editData ? 'Edit Work Order Summary' : 'Add Work Order Summary'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 rounded-b-xl" style={{ backgroundColor: 'hsl(var(--card))' }}>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Aircraft *</label>
            <AircraftSelect
              value={formData.aircraftId}
              onChange={(value) => setFormData((prev) => ({ ...prev, aircraftId: value }))}
              disabled={!!editData}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Period *</label>
            <select
              value={formData.period}
              onChange={(e) => setFormData((prev) => ({ ...prev, period: e.target.value }))}
              disabled={!!editData}
              className="w-full px-3 py-2.5 border-2 rounded-lg bg-background text-foreground shadow-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60
                hover:border-primary/40 transition-all duration-200 ease-out cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed border-input"
            >
              {periodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Work Order Count *</label>
            <Input
              type="number"
              min={0}
              value={formData.workOrderCount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, workOrderCount: parseInt(e.target.value) || 0 }))
              }
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Total Cost (USD)</label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={formData.totalCost || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  totalCost: e.target.value ? parseFloat(e.target.value) : undefined,
                }))
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Notes</label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.aircraftId}>
              {isSubmitting ? 'Saving...' : editData ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}


// Trend Chart Component
function TrendChart({ data }: { data: { period: string; workOrderCount: number; totalCost: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No trend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          tickFormatter={(value) => {
            const [year, month] = value.split('-');
            return `${month}/${year.slice(2)}`;
          }}
        />
        <YAxis yAxisId="left" tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          labelFormatter={(value) => {
            const [year, month] = String(value).split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return format(date, 'MMMM yyyy');
          }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="workOrderCount"
          name="Work Orders"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', strokeWidth: 2 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="totalCost"
          name="Total Cost ($)"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: '#10b981', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function WorkOrderSummaryPage() {
  const { canWrite, canDelete } = usePermissions();
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [editingSummary, setEditingSummary] = useState<WorkOrderSummary | null>(null);
  const [showTrends, setShowTrends] = useState(true);

  // Filters
  const [aircraftFilter, setAircraftFilter] = useState<string>('');
  const [fleetGroupFilter, setFleetGroupFilter] = useState<string>('');
  const [startPeriod, setStartPeriod] = useState<string>(
    format(subMonths(new Date(), 11), 'yyyy-MM')
  );
  const [endPeriod, setEndPeriod] = useState<string>(format(new Date(), 'yyyy-MM'));

  // Set document title
  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  // Data fetching
  const { data: aircraftData } = useAircraft();
  const { data: summariesData, isLoading: summariesLoading } = useWorkOrderSummaries({
    aircraftId: aircraftFilter || undefined,
    fleetGroup: fleetGroupFilter || undefined,
    startPeriod,
    endPeriod,
  });
  const { data: trendsData } = useWorkOrderSummaryTrends({
    aircraftId: aircraftFilter || undefined,
    fleetGroup: fleetGroupFilter || undefined,
    startPeriod,
    endPeriod,
  });

  // Mutations
  const createMutation = useCreateWorkOrderSummary();
  const updateMutation = useUpdateWorkOrderSummary();
  const deleteMutation = useDeleteWorkOrderSummary();
  const exportMutation = useExportData();

  const aircraft = aircraftData?.data || [];
  const summaries = summariesData || [];

  // Get unique fleet groups
  const fleetGroups = useMemo(() => {
    const groups = new Set(aircraft.map((a) => a.fleetGroup));
    return Array.from(groups).sort();
  }, [aircraft]);

  // Create aircraft map for lookups
  const aircraftMap = useMemo(() => {
    const map = new Map<string, Aircraft>();
    aircraft.forEach((a) => {
      const aircraftId = a._id || a.id;
      if (aircraftId) map.set(aircraftId, a);
    });
    return map;
  }, [aircraft]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalSummaries = summaries.length;
    const totalWorkOrders = summaries.reduce((sum, s) => sum + s.workOrderCount, 0);
    const totalCost = summaries.reduce((sum, s) => sum + (s.totalCost || 0), 0);
    const uniquePeriods = new Set(summaries.map((s) => s.period)).size;
    const avgPerMonth = uniquePeriods > 0 ? totalWorkOrders / uniquePeriods : 0;
    return { totalSummaries, totalWorkOrders, totalCost, avgPerMonth };
  }, [summaries]);

  // Table columns
  const columns: ColumnDef<WorkOrderSummary, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'period',
        header: 'Period',
        cell: ({ row }) => {
          const [year, month] = row.original.period.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return format(date, 'MMMM yyyy');
        },
      },
      {
        accessorKey: 'aircraftId',
        header: 'Aircraft',
        cell: ({ row }) => {
          const ac = aircraftMap.get(String(row.original.aircraftId));
          return ac ? `${ac.registration} (${ac.fleetGroup})` : 'Unknown';
        },
      },
      {
        accessorKey: 'workOrderCount',
        header: 'WO Count',
        cell: ({ row }) => (
          <span className="font-medium text-blue-500">{row.original.workOrderCount}</span>
        ),
      },
      {
        accessorKey: 'totalCost',
        header: 'Total Cost',
        cell: ({ row }) =>
          row.original.totalCost
            ? `$${row.original.totalCost.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`
            : '-',
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => (
          <span className="truncate max-w-[200px] block" title={row.original.notes || ''}>
            {row.original.notes || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last Updated',
        cell: ({ row }) =>
          row.original.updatedAt
            ? format(new Date(row.original.updatedAt), 'MMM dd, yyyy')
            : format(new Date(row.original.createdAt), 'MMM dd, yyyy'),
      },
      ...(canWrite
        ? [
            {
              id: 'actions',
              header: 'Actions',
              cell: ({ row }: { row: { original: WorkOrderSummary } }) => (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSummary(row.original);
                      setShowQuickEntry(true);
                    }}
                  >
                    Edit
                  </Button>
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this summary?')) {
                          deleteMutation.mutate(row.original._id);
                        }
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              ),
            },
          ]
        : []),
    ],
    [aircraftMap, canWrite, canDelete, deleteMutation]
  );

  const handleSubmit = (data: CreateWorkOrderSummaryDto) => {
    if (editingSummary) {
      updateMutation.mutate(
        { id: editingSummary._id, ...data },
        {
          onSuccess: () => {
            setShowQuickEntry(false);
            setEditingSummary(null);
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setShowQuickEntry(false);
        },
      });
    }
  };

  const handleExport = () => {
    exportMutation.mutate(
      {
        type: 'work-orders',
        filters: {
          aircraftId: aircraftFilter || undefined,
          startPeriod,
          endPeriod,
        },
      },
      {
        onSuccess: ({ blob }) => {
          downloadBlob(blob, `work-order-summaries-${startPeriod}-to-${endPeriod}.xlsx`);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          Work Order Summaries
        </motion.h1>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowTrends(!showTrends)}
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {showTrends ? 'Hide Trends' : 'Show Trends'}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/import'}
            className="flex items-center gap-2"
          >
            <FileUp className="w-4 h-4" />
            Import
          </Button>
          {canWrite && (
            <Button
              onClick={() => {
                setEditingSummary(null);
                setShowQuickEntry(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Summary
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        totalSummaries={summaryStats.totalSummaries}
        totalWorkOrders={summaryStats.totalWorkOrders}
        totalCost={summaryStats.totalCost}
        avgPerMonth={summaryStats.avgPerMonth}
      />

      {/* Trend Chart */}
      {showTrends && trendsData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Work Order Trends</h3>
          <TrendChart data={trendsData.trends} />
        </motion.div>
      )}

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4 space-y-4"
      >
        <div className="flex flex-wrap items-end gap-4">
          {/* Period Range */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Period Range</label>
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={startPeriod}
                onChange={(e) => setStartPeriod(e.target.value)}
                className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="month"
                value={endPeriod}
                onChange={(e) => setEndPeriod(e.target.value)}
                className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
              />
            </div>
          </div>

          {/* Fleet Group Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Fleet Group</label>
            <select
              value={fleetGroupFilter}
              onChange={(e) => {
                setFleetGroupFilter(e.target.value);
                setAircraftFilter(''); // Reset aircraft filter when fleet group changes
              }}
              className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground min-w-[140px]"
            >
              <option value="">All Fleet Groups</option>
              {fleetGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          {/* Aircraft Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Aircraft</label>
            <AircraftSelect
              value={aircraftFilter}
              onChange={setAircraftFilter}
              includeAll
              allLabel="All Aircraft"
            />
          </div>
        </div>
      </motion.div>

      {/* Summaries List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg"
      >
        {summariesLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading summaries...</div>
        ) : summaries.length > 0 ? (
          <DataTable columns={columns} data={summaries} />
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No work order summaries found for the selected filters.
            {canWrite && (
              <div className="mt-4">
                <Button
                  onClick={() => {
                    setEditingSummary(null);
                    setShowQuickEntry(true);
                  }}
                >
                  Add First Summary
                </Button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Quick Entry Modal */}
      {showQuickEntry && (
        <QuickEntryModal
          onClose={() => {
            setShowQuickEntry(false);
            setEditingSummary(null);
          }}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          editData={editingSummary}
        />
      )}
    </div>
  );
}
