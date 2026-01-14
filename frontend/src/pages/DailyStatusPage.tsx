import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import { Plane, Clock, AlertTriangle, TrendingUp, Plus, Edit2, X, CheckCircle2, ChevronDown, BarChart3, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { KPICard } from '@/components/ui/KPICard';
import { ChartContainer, TrendChart, BarChartWrapper } from '@/components/ui/Charts';
import { FilterBar, FilterSelect, FilterInput, FilterButton, FilterGroup } from '@/components/ui/FilterBar';
import { ExportButton } from '@/components/ui/ExportButton';
import { GlossaryTerm } from '@/components/ui/GlossaryTooltip';
import { PageTransition, FadeIn } from '@/components/ui/PageTransition';
import { SkeletonKPICards, SkeletonTable, SkeletonChart } from '@/components/ui/Skeleton';
import { DailyStatusForm, DailyStatusFormData, DowntimeAnalysis } from '@/components/daily-status';
import type { DailyStatusWithCalculations } from '@/components/daily-status';
import { useDailyStatus, useCreateDailyStatus, useUpdateDailyStatus } from '@/hooks/useDailyStatus';
import { useAircraft } from '@/hooks/useAircraft';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  calculateAvailability, 
  calculateFmcHours,
  calculateTotalDowntime,
  calculateFleetAvailability 
} from '@/lib/availability';
import type { DailyStatus, Aircraft } from '@/types';

// ============================================
// Types
// ============================================

type DatePreset = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DailyStatusTableRow extends DailyStatus {
  registration?: string;
  fleetGroup?: string;
  availabilityPercentage: number;
  totalDowntime: number;
}

interface SummaryStats {
  averageAvailability: number;
  totalAircraftTracked: number;
  recordsWithDowntime: number;
  belowThreshold85: number;
  belowThreshold70: number;
  totalScheduledDowntime: number;
  totalUnscheduledDowntime: number;
}

// ============================================
// Helper Functions
// ============================================

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

// Note: calculateAvailability is now imported from @/lib/availability
// to ensure consistency with backend calculations (Requirements: 8.3)

function getAvailabilityColor(percentage: number): string {
  if (percentage >= 90) return 'text-green-600 dark:text-green-400';
  if (percentage >= 85) return 'text-green-500 dark:text-green-500';
  if (percentage >= 70) return 'text-amber-500 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

function getAvailabilityBgColor(percentage: number): string {
  if (percentage >= 90) return 'bg-green-100 dark:bg-green-900/30';
  if (percentage >= 85) return 'bg-green-50 dark:bg-green-900/20';
  if (percentage >= 70) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

// ============================================
// Availability Badge Component
// ============================================

function AvailabilityBadge({ percentage }: { percentage: number }) {
  const colorClass = getAvailabilityColor(percentage);
  const bgClass = getAvailabilityBgColor(percentage);
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${colorClass} ${bgClass}`}>
      {percentage.toFixed(1)}%
    </span>
  );
}

// ============================================
// Availability Progress Bar Component
// ============================================

function AvailabilityBar({ percentage }: { percentage: number }) {
  const getBarColor = (pct: number) => {
    if (pct >= 90) return 'bg-green-500';
    if (pct >= 85) return 'bg-green-400';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor(percentage)} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <AvailabilityBadge percentage={percentage} />
    </div>
  );
}

// ============================================
// Main Component
// ============================================

// ============================================
// Toast Notification Component
// ============================================

function Toast({ 
  message, 
  type, 
  onClose 
}: { 
  message: string; 
  type: 'success' | 'error'; 
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -20, x: '-50%' }}
      className={`fixed top-4 left-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
        type === 'success' 
          ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
          : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5" />
      ) : (
        <AlertTriangle className="w-5 h-5" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function DailyStatusPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canWrite, isViewer, role } = usePermissions();
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DailyStatus | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Initialize state from URL params for persistence
  const [datePreset, setDatePreset] = useState<DatePreset>(
    (searchParams.get('preset') as DatePreset) || 'last30days'
  );
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: searchParams.get('startDate') || format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: searchParams.get('endDate') || format(new Date(), 'yyyy-MM-dd'),
  });
  const [fleetGroupFilter, setFleetGroupFilter] = useState<string>(
    searchParams.get('fleetGroup') || ''
  );
  const [aircraftFilter, setAircraftFilter] = useState<string>(
    searchParams.get('aircraft') || ''
  );
  const [availabilityThreshold, setAvailabilityThreshold] = useState<string>(
    searchParams.get('threshold') || ''
  );
  
  // UI state for detailed analytics section (Requirements: 5.5, 9.8)
  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false);
  
  // Mutations
  const createMutation = useCreateDailyStatus();
  const updateMutation = useUpdateDailyStatus();

  // Calculate date range based on preset or custom
  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return customRange;
    }
    return getDateRangeFromPreset(datePreset);
  }, [datePreset, customRange]);

  // Update URL params when filters change
  const updateUrlParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams, { replace: true });
  };

  // Fetch data
  const { data: dailyStatusData, isLoading, error } = useDailyStatus({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    aircraftId: aircraftFilter || undefined,
  });
  const { data: aircraftData } = useAircraft();

  // Create aircraft lookup map
  const aircraftMap = useMemo(() => {
    const map = new Map<string, Aircraft>();
    if (aircraftData?.data) {
      aircraftData.data.forEach((aircraft) => {
        const aircraftId = aircraft.id || aircraft._id;
        map.set(aircraftId, aircraft);
      });
    }
    return map;
  }, [aircraftData]);

  // Get unique fleet groups for filter
  const fleetGroups = useMemo(() => {
    if (!aircraftData?.data) return [];
    const groups = new Set(aircraftData.data.map((a) => a.fleetGroup));
    return Array.from(groups).sort();
  }, [aircraftData]);

  // Process table data with calculations and filters
  // Uses centralized calculation functions for consistency with backend (Requirements: 8.3)
  const tableData: DailyStatusTableRow[] = useMemo(() => {
    if (!dailyStatusData) return [];

    return dailyStatusData
      .map((status) => {
        const aircraft = aircraftMap.get(status.aircraftId);
        // Use centralized functions for consistent calculations
        const totalDowntime = calculateTotalDowntime(
          status.nmcmSHours, 
          status.nmcmUHours, 
          status.nmcsHours || 0
        );
        const availabilityPercentage = calculateAvailability(status.posHours, status.fmcHours);
        
        return {
          ...status,
          registration: aircraft?.registration || 'Unknown',
          fleetGroup: aircraft?.fleetGroup || 'Unknown',
          availabilityPercentage,
          totalDowntime,
        };
      })
      .filter((item) => {
        // Fleet group filter
        if (fleetGroupFilter && item.fleetGroup !== fleetGroupFilter) {
          return false;
        }
        // Availability threshold filter
        if (availabilityThreshold) {
          const threshold = parseFloat(availabilityThreshold);
          if (!isNaN(threshold) && item.availabilityPercentage >= threshold) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dailyStatusData, aircraftMap, fleetGroupFilter, availabilityThreshold]);

  // Calculate summary statistics
  // Uses centralized calculateFleetAvailability for consistency with backend (Requirements: 8.3)
  const summaryStats: SummaryStats | null = useMemo(() => {
    if (!tableData.length) return null;

    const uniqueAircraft = new Set(tableData.map((item) => item.aircraftId));
    
    // Use centralized fleet availability calculation for consistency
    const averageAvailability = calculateFleetAvailability(tableData);
    
    const recordsWithDowntime = tableData.filter(
      (item) => item.nmcmSHours > 0 || item.nmcmUHours > 0 || (item.nmcsHours || 0) > 0
    ).length;
    
    const belowThreshold85 = tableData.filter((item) => item.availabilityPercentage < 85).length;
    const belowThreshold70 = tableData.filter((item) => item.availabilityPercentage < 70).length;
    
    const totalScheduledDowntime = tableData.reduce((sum, item) => sum + item.nmcmSHours, 0);
    const totalUnscheduledDowntime = tableData.reduce(
      (sum, item) => sum + item.nmcmUHours + (item.nmcsHours || 0),
      0
    );

    return {
      averageAvailability,
      totalAircraftTracked: uniqueAircraft.size,
      recordsWithDowntime,
      belowThreshold85,
      belowThreshold70,
      totalScheduledDowntime,
      totalUnscheduledDowntime,
    };
  }, [tableData]);

  // Prepare trend chart data (group by date)
  const trendChartData = useMemo(() => {
    if (!tableData.length) return [];

    const byDate = new Map<string, { posHours: number; fmcHours: number }>();
    
    tableData.forEach((item) => {
      const dateKey = format(new Date(item.date), 'MMM dd');
      const existing = byDate.get(dateKey) || { posHours: 0, fmcHours: 0 };
      byDate.set(dateKey, {
        posHours: existing.posHours + item.posHours,
        fmcHours: existing.fmcHours + item.fmcHours,
      });
    });

    return Array.from(byDate.entries())
      .map(([date, data]) => ({
        name: date,
        availability: data.posHours > 0 ? (data.fmcHours / data.posHours) * 100 : 0,
      }))
      .reverse()
      .slice(-14); // Last 14 data points
  }, [tableData]);

  // Prepare downtime breakdown chart data
  const downtimeChartData = useMemo(() => {
    if (!summaryStats) return [];
    
    return [
      { name: 'Scheduled (NMCM-S)', value: summaryStats.totalScheduledDowntime },
      { name: 'Unscheduled (NMCM-U/NMCS)', value: summaryStats.totalUnscheduledDowntime },
    ];
  }, [summaryStats]);

  // Form handlers with role-based access control (Requirements: 6.1, 6.2, 6.5)
  const handleOpenCreateForm = () => {
    // Guard: Only users with write permission can create records
    if (!canWrite) {
      showToast('You do not have permission to create records. Contact an administrator.', 'error');
      return;
    }
    setEditingRecord(null);
    setShowForm(true);
  };

  const handleOpenEditForm = (record: DailyStatus) => {
    // Guard: Only users with write permission can edit records
    if (!canWrite) {
      showToast('You do not have permission to edit records. Contact an administrator.', 'error');
      return;
    }
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleFormSubmit = async (data: DailyStatusFormData) => {
    // Calculate FMC hours using centralized function for consistency (Requirements: 8.3, 8.7)
    const fmcHours = calculateFmcHours(
      data.posHours, 
      data.nmcmSHours, 
      data.nmcmUHours, 
      data.nmcsHours || 0
    );

    try {
      if (editingRecord) {
        // Update existing record
        await updateMutation.mutateAsync({
          id: editingRecord._id,
          posHours: data.posHours,
          fmcHours,
          nmcmSHours: data.nmcmSHours,
          nmcmUHours: data.nmcmUHours,
          nmcsHours: data.nmcsHours,
          notes: data.notes,
        });
        showToast('Daily status updated successfully!', 'success');
      } else {
        // Create new record
        await createMutation.mutateAsync({
          aircraftId: data.aircraftId,
          date: data.date,
          posHours: data.posHours,
          fmcHours,
          nmcmSHours: data.nmcmSHours,
          nmcmUHours: data.nmcmUHours,
          nmcsHours: data.nmcsHours,
          notes: data.notes,
        } as Omit<DailyStatus, '_id' | 'createdAt'>);
        showToast('Daily status created successfully!', 'success');
      }
      handleCloseForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      // Check for duplicate error
      if (errorMessage.includes('already exists') || errorMessage.includes('409')) {
        showToast('A record already exists for this aircraft and date combination.', 'error');
      } else {
        showToast(errorMessage, 'error');
      }
      throw error; // Re-throw to let the form handle it
    }
  };

  // Table columns definition
  const columns: ColumnDef<DailyStatusTableRow, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'registration',
        header: 'Aircraft',
        cell: ({ row }) => (
          <button
            onClick={() => navigate(`/aircraft/${row.original.aircraftId}`)}
            className="font-medium text-primary hover:underline"
          >
            {row.original.registration}
          </button>
        ),
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => format(new Date(row.original.date), 'MMM dd, yyyy'),
      },
      {
        accessorKey: 'fleetGroup',
        header: 'Fleet Group',
      },
      {
        accessorKey: 'posHours',
        header: () => <GlossaryTerm term="POS Hours" display="POS Hrs" />,
        cell: ({ row }) => row.original.posHours.toFixed(1),
      },
      {
        accessorKey: 'fmcHours',
        header: () => <GlossaryTerm term="FMC" display="FMC Hrs" />,
        cell: ({ row }) => row.original.fmcHours.toFixed(1),
      },
      {
        accessorKey: 'nmcmSHours',
        header: () => <GlossaryTerm term="NMCM-S" display="NMCM-S" />,
        cell: ({ row }) => (
          <span className={row.original.nmcmSHours > 0 ? 'text-amber-600 dark:text-amber-400' : ''}>
            {row.original.nmcmSHours.toFixed(1)}
          </span>
        ),
      },
      {
        accessorKey: 'nmcmUHours',
        header: () => <GlossaryTerm term="NMCM-U" display="NMCM-U" />,
        cell: ({ row }) => (
          <span className={row.original.nmcmUHours > 0 ? 'text-red-600 dark:text-red-400' : ''}>
            {row.original.nmcmUHours.toFixed(1)}
          </span>
        ),
      },
      {
        accessorKey: 'availabilityPercentage',
        header: 'Availability',
        cell: ({ row }) => <AvailabilityBar percentage={row.original.availabilityPercentage} />,
      },
      // Edit action column - only visible to Editor and Admin roles (Requirements: 6.2, 6.3, 6.5)
      ...(canWrite ? [{
        id: 'actions',
        header: '',
        cell: ({ row }: { row: { original: DailyStatusTableRow } }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEditForm(row.original);
            }}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Edit record"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        ),
        size: 50,
      }] : []),
    ],
    [navigate, canWrite]
  );

  // Row styling based on availability
  const getRowClassName = (row: DailyStatusTableRow): string => {
    if (row.availabilityPercentage < 70) {
      return 'bg-red-50/50 dark:bg-red-900/10';
    }
    if (row.availabilityPercentage < 85) {
      return 'bg-amber-50/50 dark:bg-amber-900/10';
    }
    return '';
  };

  // Handle date preset change
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    updateUrlParams({ preset, startDate: '', endDate: '' });
  };

  // Handle custom date change
  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDatePreset('custom');
    setCustomRange((prev) => ({ ...prev, [field]: value }));
    updateUrlParams({ preset: 'custom', [field]: value });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </AnimatePresence>

        {/* Read-Only Banner for Viewers (Requirements: 6.1, 6.5) */}
        {isViewer && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 flex items-center gap-3"
        >
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-medium">View-only mode:</span> You have read-only access to daily status records. Contact an administrator if you need to make changes.
            </p>
          </div>
        </motion.div>
      )}

      {/* Form Modal - Responsive for desktop and tablet (Requirements: 9.9) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-start justify-center pt-4 sm:pt-10 px-2 sm:px-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseForm();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-3xl mb-4 sm:mb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <DailyStatusForm
                initialData={editingRecord || undefined}
                onSubmit={handleFormSubmit}
                onCancel={handleCloseForm}
                isLoading={createMutation.isPending || updateMutation.isPending}
                error={
                  createMutation.error?.message || 
                  updateMutation.error?.message || 
                  null
                }
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Daily Status</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track aircraft availability and downtime records
            {/* Role indicator for context (Requirements: 6.5) */}
            {role && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                {role}
              </span>
            )}
          </p>
        </motion.div>
        <div className="flex items-center gap-2">
          {/* Export is available to all authenticated users (Requirements: 6.1, 6.2, 6.3) */}
          <ExportButton
            exportType="daily-status"
            filters={{ ...dateRange, fleetGroup: fleetGroupFilter || undefined }}
            filename={`daily-status-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`}
            label="Export"
          />
          {/* Add Record button only visible to Editor and Admin roles (Requirements: 6.2, 6.3, 6.5) */}
          {canWrite && (
            <FilterButton 
              variant="primary" 
              onClick={handleOpenCreateForm}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Record
            </FilterButton>
          )}
        </div>
      </div>

      {/* Filters */}
      <FadeIn delay={0.05}>
        <FilterBar wrap>
          {/* Date Preset */}
          <FilterGroup label="Period">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(['last7days', 'last30days', 'thisMonth', 'lastMonth'] as DatePreset[]).map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetChange(preset)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      datePreset === preset
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {preset === 'last7days' && '7D'}
                    {preset === 'last30days' && '30D'}
                    {preset === 'thisMonth' && 'MTD'}
                    {preset === 'lastMonth' && 'Last Mo'}
                  </button>
                )
              )}
            </div>
          </FilterGroup>

          {/* Custom Date Range */}
          <FilterGroup label="Custom">
            <FilterInput
              type="date"
              value={datePreset === 'custom' ? customRange.startDate : dateRange.startDate}
              onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
              className="w-36"
            />
            <span className="text-muted-foreground">to</span>
            <FilterInput
              type="date"
              value={datePreset === 'custom' ? customRange.endDate : dateRange.endDate}
              onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
              className="w-36"
            />
          </FilterGroup>

          {/* Fleet Group Filter */}
          <FilterGroup label="Fleet">
            <FilterSelect
              value={fleetGroupFilter}
              onChange={(e) => {
                setFleetGroupFilter(e.target.value);
                updateUrlParams({ fleetGroup: e.target.value });
              }}
              className="min-w-[140px]"
            >
              <option value="">All Fleets</option>
              {fleetGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>

          {/* Aircraft Filter */}
          <FilterGroup label="Aircraft">
            <FilterSelect
              value={aircraftFilter}
              onChange={(e) => {
                setAircraftFilter(e.target.value);
                updateUrlParams({ aircraft: e.target.value });
              }}
              className="min-w-[140px]"
            >
              <option value="">All Aircraft</option>
              {aircraftData?.data?.map((aircraft) => (
                <option key={aircraft._id || aircraft.id} value={aircraft._id || aircraft.id}>
                  {aircraft.registration}
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>

          {/* Availability Threshold Filter */}
          <FilterGroup label="Show Below">
            <FilterSelect
              value={availabilityThreshold}
              onChange={(e) => {
                setAvailabilityThreshold(e.target.value);
                updateUrlParams({ threshold: e.target.value });
              }}
              className="min-w-[120px]"
            >
              <option value="">All Records</option>
              <option value="100">Below 100%</option>
              <option value="90">Below 90%</option>
              <option value="85">Below 85%</option>
              <option value="70">Below 70%</option>
            </FilterSelect>
          </FilterGroup>
        </FilterBar>
      </FadeIn>

      {/* Summary KPI Cards */}
      {isLoading ? (
        <SkeletonKPICards count={4} />
      ) : summaryStats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Average Availability"
            value={summaryStats.averageAvailability.toFixed(1)}
            unit="%"
            icon={<TrendingUp />}
            subtitle={`${tableData.length} records`}
            delay={0.1}
          />
          <KPICard
            title="Aircraft Tracked"
            value={summaryStats.totalAircraftTracked}
            icon={<Plane />}
            subtitle="Unique aircraft"
            delay={0.15}
          />
          <KPICard
            title="Records with Downtime"
            value={summaryStats.recordsWithDowntime}
            icon={<Clock />}
            subtitle={`${((summaryStats.recordsWithDowntime / tableData.length) * 100).toFixed(0)}% of records`}
            delay={0.2}
          />
          <KPICard
            title="Below 85% Availability"
            value={summaryStats.belowThreshold85}
            icon={<AlertTriangle />}
            subtitle={summaryStats.belowThreshold70 > 0 ? `${summaryStats.belowThreshold70} critical (<70%)` : 'No critical records'}
            delay={0.25}
            className={summaryStats.belowThreshold70 > 0 ? 'border-red-500/50' : summaryStats.belowThreshold85 > 0 ? 'border-amber-500/50' : ''}
          />
        </div>
      ) : null}

      {/* Charts Section */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart height={250} />
          <SkeletonChart height={250} />
        </div>
      ) : trendChartData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            title="Availability Trend"
            subtitle="Fleet availability over time"
            height={250}
            delay={0.3}
          >
            <TrendChart
              data={trendChartData}
              lines={[{ dataKey: 'availability', color: '#22c55e', name: 'Availability %' }]}
              target={{ value: 92, label: 'Target', color: '#6b7280' }}
              yAxisDomain={[0, 100]}
            />
          </ChartContainer>
          
          <ChartContainer
            title="Downtime Breakdown"
            subtitle="Scheduled vs Unscheduled maintenance"
            height={250}
            delay={0.35}
          >
            <BarChartWrapper
              data={downtimeChartData}
              bars={[{ dataKey: 'value', color: '#f59e0b', name: 'Hours' }]}
              layout="horizontal"
            />
          </ChartContainer>
        </div>
      ) : null}

      {/* Detailed Analytics Section (Requirements: 5.3, 5.5, 9.8) */}
      {!isLoading && tableData.length > 0 && (
        <FadeIn delay={0.4}>
          <button
            onClick={() => setShowDetailedAnalytics(!showDetailedAnalytics)}
            className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-foreground">Detailed Downtime Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  View comprehensive breakdown of maintenance patterns and trends
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: showDetailedAnalytics ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </button>
          
          <AnimatePresence>
            {showDetailedAnalytics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  <DowntimeAnalysis 
                    data={tableData as DailyStatusWithCalculations[]} 
                    isLoading={isLoading} 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </FadeIn>
      )}

      {/* Error State with retry option (Requirements: 9.10) */}
      {error && (
        <FadeIn>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2 bg-destructive/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-destructive mb-1">Unable to Load Data</h3>
                <p className="text-sm text-destructive/80 mb-3">
                  Failed to load daily status data. This could be due to a network issue or server problem.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm font-medium text-destructive hover:text-destructive/80 underline underline-offset-2"
                >
                  Try refreshing the page
                </button>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Data Table */}
      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : (
        <FadeIn delay={0.4}>
          <DataTable
            data={tableData}
            columns={columns}
            searchPlaceholder="Search by registration..."
            searchColumn="registration"
            pageSize={15}
            getRowClassName={getRowClassName}
            striped
          />
        </FadeIn>
      )}
      </div>
    </PageTransition>
  );
}
