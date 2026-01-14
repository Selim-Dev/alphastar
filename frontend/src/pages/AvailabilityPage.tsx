import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { ExportButton } from '@/components/ui/ExportButton';
import { GlossaryTerm } from '@/components/ui/GlossaryTooltip';
import { useFleetAvailability } from '@/hooks/useDailyStatus';
import { useAircraft } from '@/hooks/useAircraft';
import type { FleetAvailabilityItem, Aircraft } from '@/types';

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

// Progress bar component for availability percentage
function AvailabilityBar({ percentage }: { percentage: number }) {
  const getColor = (pct: number) => {
    if (pct >= 95) return 'bg-green-500';
    if (pct >= 90) return 'bg-green-400';
    if (pct >= 80) return 'bg-yellow-500';
    if (pct >= 70) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(percentage)} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className={`text-sm font-medium ${percentage < 80 ? 'text-red-500' : ''}`}>
        {percentage.toFixed(1)}%
      </span>
    </div>
  );
}

// Extended type for table display
interface AvailabilityTableRow extends FleetAvailabilityItem {
  registration?: string;
  fleetGroup?: string;
  aircraftType?: string;
}

export function AvailabilityPage() {
  const navigate = useNavigate();
  const [datePreset, setDatePreset] = useState<DatePreset>('last30days');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [fleetGroupFilter, setFleetGroupFilter] = useState<string>('');

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return customRange;
    }
    return getDateRangeFromPreset(datePreset);
  }, [datePreset, customRange]);

  const { data: fleetAvailability, isLoading, error } = useFleetAvailability(dateRange);
  const { data: aircraftData } = useAircraft();

  // Create a map of aircraft by ID for quick lookup
  // Backend returns 'id' instead of '_id', so we use both for compatibility
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

  // Get unique fleet groups for filter dropdown
  const fleetGroups = useMemo(() => {
    if (!aircraftData?.data) return [];
    const groups = new Set(aircraftData.data.map((a) => a.fleetGroup));
    return Array.from(groups).sort();
  }, [aircraftData]);

  // Combine availability data with aircraft info and apply filters
  const tableData: AvailabilityTableRow[] = useMemo(() => {
    if (!fleetAvailability) return [];

    return fleetAvailability
      .map((item) => {
        const aircraft = aircraftMap.get(String(item.aircraftId));
        return {
          ...item,
          registration: aircraft?.registration || 'Unknown',
          fleetGroup: aircraft?.fleetGroup || 'Unknown',
          aircraftType: aircraft?.aircraftType || 'Unknown',
        };
      })
      .filter((item) => {
        if (fleetGroupFilter && item.fleetGroup !== fleetGroupFilter) {
          return false;
        }
        return true;
      });
  }, [fleetAvailability, aircraftMap, fleetGroupFilter]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!tableData.length) return null;

    const totalPosHours = tableData.reduce((sum, item) => sum + item.totalPosHours, 0);
    const totalFmcHours = tableData.reduce((sum, item) => sum + item.totalFmcHours, 0);
    const avgAvailability = totalPosHours > 0 ? (totalFmcHours / totalPosHours) * 100 : 0;
    const aircraftCount = tableData.length;
    const lowAvailabilityCount = tableData.filter((item) => item.availabilityPercentage < 90).length;

    return {
      avgAvailability,
      aircraftCount,
      lowAvailabilityCount,
      totalPosHours,
      totalFmcHours,
    };
  }, [tableData]);

  const columns: ColumnDef<AvailabilityTableRow, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'registration',
        header: 'Registration',
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
        accessorKey: 'fleetGroup',
        header: 'Fleet Group',
      },
      {
        accessorKey: 'aircraftType',
        header: 'Aircraft Type',
      },
      {
        accessorKey: 'availabilityPercentage',
        header: 'Availability',
        cell: ({ row }) => <AvailabilityBar percentage={row.original.availabilityPercentage} />,
      },
      {
        accessorKey: 'totalFmcHours',
        header: () => <><GlossaryTerm term="FMC" /> Hours</>,
        cell: ({ row }) => row.original.totalFmcHours.toFixed(1),
      },
      {
        accessorKey: 'totalPosHours',
        header: () => <><GlossaryTerm term="POS Hours" display="POS" /> Hours</>,
        cell: ({ row }) => row.original.totalPosHours.toFixed(1),
      },
      {
        accessorKey: 'recordCount',
        header: 'Days Recorded',
      },
    ],
    [navigate]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          Fleet Availability
        </motion.h1>
        <ExportButton
          exportType="daily-status"
          filters={{ ...dateRange, fleetGroup: fleetGroupFilter || undefined }}
          filename={`daily-status-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`}
          label="Export to Excel"
        />
      </div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4 space-y-4"
      >
        <div className="flex flex-wrap items-center gap-4">
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

          {/* Fleet Group Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Fleet Group</label>
            <select
              value={fleetGroupFilter}
              onChange={(e) => setFleetGroupFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground min-w-[150px]"
            >
              <option value="">All Fleet Groups</option>
              {fleetGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      {summaryStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Fleet Availability</p>
            <p className="text-2xl font-bold text-foreground">
              {summaryStats.avgAvailability.toFixed(1)}%
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Aircraft Count</p>
            <p className="text-2xl font-bold text-foreground">{summaryStats.aircraftCount}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total <GlossaryTerm term="FMC" /> Hours</p>
            <p className="text-2xl font-bold text-foreground">
              {summaryStats.totalFmcHours.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div
            className={`bg-card border rounded-lg p-4 ${
              summaryStats.lowAvailabilityCount > 0 ? 'border-yellow-500/50' : 'border-border'
            }`}
          >
            <p className="text-sm text-muted-foreground">Below 90% Availability</p>
            <p
              className={`text-2xl font-bold ${
                summaryStats.lowAvailabilityCount > 0 ? 'text-yellow-500' : 'text-foreground'
              }`}
            >
              {summaryStats.lowAvailabilityCount}
            </p>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive"
        >
          Failed to load availability data. Please try again later.
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground"
        >
          Loading availability data...
        </motion.div>
      )}

      {/* Data Table */}
      {!isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <DataTable
            data={tableData}
            columns={columns}
            searchPlaceholder="Search by registration..."
            searchColumn="registration"
            pageSize={15}
          />
        </motion.div>
      )}
    </div>
  );
}
