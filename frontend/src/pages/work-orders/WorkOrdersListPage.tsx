import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import { X } from 'lucide-react';

// Set document title for this page
const PAGE_TITLE = 'Work Orders | Alpha Star Aviation';
import { DataTable } from '@/components/ui/DataTable';
import { ExportButton } from '@/components/ui/ExportButton';
import { AircraftSelect } from '@/components/ui/AircraftSelect';
import { Button } from '@/components/ui/Form';
import {
  useWorkOrders,
  useWorkOrderById,
  useTurnaroundStats,
  useOverdueCount,
} from '@/hooks/useWorkOrders';
import { useAircraft } from '@/hooks/useAircraft';
import { usePermissions } from '@/hooks/usePermissions';
import type { WorkOrder, Aircraft } from '@/types';

type DatePreset = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

interface DateRange {
  startDate: string;
  endDate: string;
}

function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const today = new Date();
  switch (preset) {
    case 'last7days':
      return {
        startDate: format(subDays(today, 7), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
    case 'last30days':
      return {
        startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
    case 'thisMonth':
      return {
        startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
      };
    case 'lastMonth':
      const lastMonth = subMonths(today, 1);
      return {
        startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
      };
    default:
      return {
        startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
  }
}


const STATUS_OPTIONS = [
  { value: 'Open', label: 'Open' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Deferred', label: 'Deferred' },
];

const STATUS_COLORS: Record<string, string> = {
  Open: '#3b82f6',
  InProgress: '#f59e0b',
  Closed: '#10b981',
  Deferred: '#8b5cf6',
};

// Summary Statistics Cards
function SummaryCards({
  totalWorkOrders,
  openCount,
  overdueCount,
  avgTurnaround,
}: {
  totalWorkOrders: number;
  openCount: number;
  overdueCount: number;
  avgTurnaround: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Work Orders</p>
        <p className="text-2xl font-bold text-foreground">{totalWorkOrders.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Open</p>
        <p className="text-2xl font-bold text-blue-500">{openCount.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Overdue</p>
        <p className="text-2xl font-bold text-destructive">{overdueCount.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Avg Turnaround</p>
        <p className="text-2xl font-bold text-foreground">
          {avgTurnaround > 0 ? `${avgTurnaround.toFixed(1)} days` : '-'}
        </p>
      </motion.div>
    </div>
  );
}

// Work Order Detail Modal Component
function WorkOrderDetailModal({
  workOrder,
  aircraft,
  onClose,
  onEdit,
  canEdit,
}: {
  workOrder: WorkOrder;
  aircraft?: Aircraft;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
}) {
  const statusColors: Record<string, string> = {
    Open: 'bg-blue-500/10 text-blue-600',
    InProgress: 'bg-amber-500/10 text-amber-600',
    Closed: 'bg-green-500/10 text-green-600',
    Deferred: 'bg-gray-500/10 text-gray-600',
  };

  const turnaroundDays = workOrder.dateOut && workOrder.dateIn
    ? Math.ceil((new Date(workOrder.dateOut).getTime() - new Date(workOrder.dateIn).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Work Order Details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header with WO Number and Status */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-foreground">{workOrder.woNumber}</span>
              {workOrder.isOverdue && (
                <span className="ml-3 px-2 py-0.5 text-xs font-medium rounded-full bg-destructive text-destructive-foreground">
                  OVERDUE
                </span>
              )}
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[workOrder.status]}`}>
              {workOrder.status}
            </span>
          </div>

          {/* Aircraft Info */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Aircraft:</span>
            <span className="font-medium text-foreground">
              {aircraft?.registration || 'Unknown'} - {aircraft?.fleetGroup || ''}
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <p className="text-foreground mt-1">{workOrder.description}</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <label className="text-xs font-medium text-muted-foreground">Date In</label>
              <p className="text-sm font-medium text-foreground">
                {format(new Date(workOrder.dateIn), 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <label className="text-xs font-medium text-muted-foreground">Due Date</label>
              <p className={`text-sm font-medium ${workOrder.isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                {workOrder.dueDate ? format(new Date(workOrder.dueDate), 'MMM dd, yyyy') : 'Not set'}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <label className="text-xs font-medium text-muted-foreground">Date Out</label>
              <p className="text-sm font-medium text-foreground">
                {workOrder.dateOut ? format(new Date(workOrder.dateOut), 'MMM dd, yyyy') : 'Not closed'}
              </p>
            </div>
          </div>

          {/* Turnaround Time */}
          {turnaroundDays !== null && (
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <label className="text-xs font-medium text-primary">Turnaround Time</label>
              <p className="text-2xl font-bold text-primary">{turnaroundDays} days</p>
            </div>
          )}

          {/* Reference Numbers */}
          <div className="grid grid-cols-2 gap-4">
            {workOrder.crsNumber && (
              <div>
                <label className="text-xs text-muted-foreground">CRS Number</label>
                <p className="text-sm font-medium text-foreground">{workOrder.crsNumber}</p>
              </div>
            )}
            {workOrder.mrNumber && (
              <div>
                <label className="text-xs text-muted-foreground">MR Number</label>
                <p className="text-sm font-medium text-foreground">{workOrder.mrNumber}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          {canEdit && (
            <Button variant="outline" onClick={onEdit}>
              Edit
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}


export function WorkOrdersListPage() {
  const { canWrite } = usePermissions();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Set document title
  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);
  
  // Get URL parameters for deep linking from alerts
  const urlWoId = searchParams.get('woId');
  const urlOverdue = searchParams.get('overdue');
  
  const [selectedWoId, setSelectedWoId] = useState<string | null>(urlWoId);
  const [datePreset, setDatePreset] = useState<DatePreset>('last30days');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [aircraftFilter, setAircraftFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(urlOverdue === 'true');

  // Handle URL parameter changes
  useEffect(() => {
    if (urlWoId) {
      setSelectedWoId(urlWoId);
      // Clear the URL params after reading them
      setSearchParams({}, { replace: true });
    }
    if (urlOverdue === 'true') {
      setShowOverdueOnly(true);
      setSearchParams({}, { replace: true });
    }
  }, [urlWoId, urlOverdue, setSearchParams]);

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return customRange;
    }
    return getDateRangeFromPreset(datePreset);
  }, [datePreset, customRange]);

  // Data fetching
  const { data: aircraftData } = useAircraft();
  const { data: workOrdersData, isLoading: workOrdersLoading } = useWorkOrders({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
    status: statusFilter || undefined,
    overdue: showOverdueOnly || undefined,
  });
  const { data: turnaroundStats } = useTurnaroundStats({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
  });
  const { data: overdueCount } = useOverdueCount(aircraftFilter || undefined);
  
  // Fetch single work order by ID for deep linking (when WO not in current list)
  const { data: singleWoData } = useWorkOrderById(selectedWoId || '');

  const aircraft = aircraftData?.data || [];
  const workOrders = workOrdersData || [];

  // Create aircraft map for lookups (handle both _id and id fields)
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
    const totalWorkOrders = workOrders.length;
    const openCount = workOrders.filter((wo) => wo.status === 'Open' || wo.status === 'InProgress').length;
    const avgTurnaround = turnaroundStats?.averageTurnaroundDays || 0;
    return { totalWorkOrders, openCount, overdueCount: overdueCount || 0, avgTurnaround };
  }, [workOrders, turnaroundStats, overdueCount]);

  // Table columns for work order list
  const columns: ColumnDef<WorkOrder, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'woNumber',
        header: 'WO Number',
        cell: ({ row }) => (
          <span className={`font-medium ${row.original.isOverdue ? 'text-destructive' : 'text-foreground'}`}>
            {row.original.woNumber}
          </span>
        ),
      },
      {
        accessorKey: 'aircraftId',
        header: 'Aircraft',
        cell: ({ row }) =>
          aircraftMap.get(String(row.original.aircraftId))?.registration || 'Unknown',
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className="truncate max-w-[200px] block" title={row.original.description}>
            {row.original.description.length > 50
              ? `${row.original.description.substring(0, 50)}...`
              : row.original.description}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span
            className="px-2 py-0.5 text-xs rounded-full"
            style={{
              backgroundColor: `${STATUS_COLORS[row.original.status]}20`,
              color: STATUS_COLORS[row.original.status],
            }}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: 'dateIn',
        header: 'Date In',
        cell: ({ row }) => format(new Date(row.original.dateIn), 'MMM dd, yyyy'),
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ row }) => {
          const isOverdue = row.original.isOverdue;
          const dueDate = row.original.dueDate;
          if (!dueDate) return '-';
          return (
            <span className={isOverdue ? 'text-destructive font-medium' : ''}>
              {format(new Date(dueDate), 'MMM dd, yyyy')}
            </span>
          );
        },
      },
      {
        id: 'overdue',
        header: 'Status Flag',
        cell: ({ row }) =>
          row.original.isOverdue ? (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-destructive text-destructive-foreground animate-pulse">
              ⚠ OVERDUE
            </span>
          ) : row.original.status === 'Closed' ? (
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              ✓ Complete
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        id: 'turnaround',
        header: 'Turnaround',
        cell: ({ row }) => {
          const wo = row.original as WorkOrder & { turnaroundDays?: number };
          return wo.turnaroundDays !== undefined
            ? `${wo.turnaroundDays.toFixed(1)} days`
            : '-';
        },
      },
      ...(canWrite ? [{
        id: 'actions',
        header: 'Actions',
        cell: ({ row }: { row: { original: WorkOrder } }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/work-orders/${row.original._id}/edit`);
            }}
          >
            Edit
          </Button>
        ),
      }] : []),
    ],
    [aircraftMap, canWrite, navigate]
  );

  const handleEditFromModal = () => {
    if (selectedWoId) {
      navigate(`/work-orders/${selectedWoId}/edit`);
    }
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
          Work Orders
        </motion.h1>

        <div className="flex items-center gap-3">
          {/* Export Button */}
          <ExportButton
            exportType="work-orders"
            filters={{ ...dateRange, aircraftId: aircraftFilter || undefined, status: statusFilter || undefined }}
            filename={`work-orders-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`}
            label="Export"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        totalWorkOrders={summaryStats.totalWorkOrders}
        openCount={summaryStats.openCount}
        overdueCount={summaryStats.overdueCount}
        avgTurnaround={summaryStats.avgTurnaround}
      />

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4 space-y-4"
      >
        <div className="flex flex-wrap items-end gap-4">
          {/* Date Preset Buttons */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Date Range</label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(['last7days', 'last30days', 'thisMonth', 'lastMonth'] as DatePreset[]).map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => setDatePreset(preset)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      datePreset === preset
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {preset === 'last7days' && '7 Days'}
                    {preset === 'last30days' && '30 Days'}
                    {preset === 'thisMonth' && 'This Month'}
                    {preset === 'lastMonth' && 'Last Month'}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Custom Range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={datePreset === 'custom' ? customRange.startDate : dateRange.startDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setCustomRange((prev) => ({ ...prev, startDate: e.target.value }));
                }}
                className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="date"
                value={datePreset === 'custom' ? customRange.endDate : dateRange.endDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setCustomRange((prev) => ({ ...prev, endDate: e.target.value }));
                }}
                className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
              />
            </div>
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

          {/* Status Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground min-w-[120px]"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Overdue Only Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="overdueOnly"
              checked={showOverdueOnly}
              onChange={(e) => setShowOverdueOnly(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="overdueOnly" className="text-sm font-medium text-muted-foreground">
              Overdue Only
            </label>
          </div>
        </div>
      </motion.div>

      {/* Work Orders List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg"
      >
        {workOrdersLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading work orders...</div>
        ) : workOrders.length > 0 ? (
          <DataTable 
            columns={columns} 
            data={workOrders}
            getRowClassName={(row) => 
              row.isOverdue ? 'bg-destructive/10 dark:bg-destructive/20' : ''
            }
            onRowClick={(row) => setSelectedWoId(row._id)}
          />
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No work orders found for the selected filters.
          </div>
        )}
      </motion.div>

      {/* Work Order Detail Modal */}
      {selectedWoId && (() => {
        // Try to find WO in current list first, fallback to single WO fetch
        const selectedWo = workOrders.find((wo) => wo._id === selectedWoId) || singleWoData;
        if (!selectedWo) return null;
        const woAircraft = aircraftMap.get(String(selectedWo.aircraftId));
        return (
          <WorkOrderDetailModal
            workOrder={selectedWo}
            aircraft={woAircraft}
            onClose={() => setSelectedWoId(null)}
            onEdit={handleEditFromModal}
            canEdit={canWrite}
          />
        );
      })()}
    </div>
  );
}
