import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import { Plane } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Form';
import { ExportButton } from '@/components/ui/ExportButton';
import { AircraftSelect } from '@/components/ui/AircraftSelect';
import { GlossaryTerm } from '@/components/ui/GlossaryTooltip';
import {
  CategoryBadge,
  StatusBadge,
  LocationDisplay,
  AOGQuickStats,
} from '@/components/aog';
import { useAOGEvents } from '@/hooks/useAOGEvents';
import { useAircraft } from '@/hooks/useAircraft';
import { formatDuration } from '@/lib/formatDuration';
import type { AOGEvent, Aircraft } from '@/types';

type DatePreset = 'allTime' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';
type StatusFilter = 'all' | 'active' | 'resolved';

interface DateRange {
  startDate?: string;
  endDate?: string;
}

function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const today = new Date();
  switch (preset) {
    case 'allTime':
      return { startDate: undefined, endDate: undefined };
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

const CATEGORY_OPTIONS = [
  { value: 'aog', label: 'AOG' },
  { value: 'unscheduled', label: 'U-MX' },
  { value: 'scheduled', label: 'S-MX' },
  { value: 'mro', label: 'MRO' },
  { value: 'cleaning', label: 'CLEANING' },
];

export function AOGListPageEnhanced() {
  const navigate = useNavigate();
  
  const [datePreset, setDatePreset] = useState<DatePreset>('allTime');
  const [customRange, setCustomRange] = useState<DateRange>({});
  const [aircraftFilter, setAircraftFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return customRange;
    }
    return getDateRangeFromPreset(datePreset);
  }, [datePreset, customRange]);

  // Data fetching
  const { data: aircraftData } = useAircraft();
  const { data: eventsData, isLoading: eventsLoading } = useAOGEvents({
    ...(datePreset !== 'allTime' ? dateRange : {}),
    aircraftId: aircraftFilter || undefined,
  });
  
  const aircraft = aircraftData?.data || [];
  const events = (eventsData || []) as (AOGEvent & { downtimeHours?: number })[];

  // Create aircraft map for lookups
  const aircraftMap = useMemo(() => {
    const map = new Map<string, Aircraft>();
    aircraft.forEach((a) => {
      const aircraftId = a._id || a.id;
      if (aircraftId) {
        map.set(aircraftId, a);
      }
    });
    return map;
  }, [aircraft]);

  // Get unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();
    events.forEach((e) => {
      if (e.location) {
        locations.add(e.location);
      }
    });
    return Array.from(locations).sort();
  }, [events]);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((e) => !e.clearedAt);
    } else if (statusFilter === 'resolved') {
      filtered = filtered.filter((e) => e.clearedAt);
    }

    // Category filter (multi-select)
    if (categoryFilter.length > 0) {
      filtered = filtered.filter((e) => categoryFilter.includes(e.category));
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter((e) => e.location === locationFilter);
    }

    // Search filter (defect description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((e) =>
        e.reasonCode?.toLowerCase().includes(query)
      );
    }

    // Sort: Active events first, then by start date descending
    filtered.sort((a, b) => {
      const aActive = !a.clearedAt;
      const bActive = !b.clearedAt;
      
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      
      return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
    });

    return filtered;
  }, [events, statusFilter, categoryFilter, locationFilter, searchQuery]);

  // Handle row click - navigate to detail page
  const handleRowClick = (row: AOGEvent & { downtimeHours?: number }) => {
    const eventId = row._id || (row as unknown as { id?: string }).id;
    if (!eventId) {
      console.error('No event ID found for row:', row);
      return;
    }
    navigate(`/aog/${eventId}`);
  };

  // Handle category filter toggle
  const toggleCategoryFilter = (category: string) => {
    setCategoryFilter((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Table columns
  const columns: ColumnDef<AOGEvent & { downtimeHours?: number }, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge isActive={!row.original.clearedAt} size="sm" />,
      },
      {
        accessorKey: 'aircraftId',
        header: 'Aircraft',
        cell: ({ row }) => {
          const aircraft = aircraftMap.get(String(row.original.aircraftId));
          return (
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{aircraft?.registration || 'Unknown'}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => <CategoryBadge category={row.original.category} />,
      },
      {
        accessorKey: 'reasonCode',
        header: 'Defect Summary',
        cell: ({ row }) => (
          <div className="max-w-md truncate" title={row.original.reasonCode}>
            {row.original.reasonCode}
          </div>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => <LocationDisplay location={row.original.location} />,
      },
      {
        accessorKey: 'detectedAt',
        header: 'Start Date',
        cell: ({ row }) => format(new Date(row.original.detectedAt), 'MMM dd, yyyy HH:mm'),
      },
      {
        accessorKey: 'downtimeHours',
        header: 'Duration',
        cell: ({ row }) =>
          row.original.downtimeHours !== undefined
            ? formatDuration(row.original.downtimeHours)
            : '-',
      },
    ],
    [aircraftMap]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-foreground"
          >
            <GlossaryTerm term="AOG" /> Events List
          </motion.h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage aircraft grounding events
          </p>
        </div>

        <ExportButton
          exportType="aog-events"
          filters={{
            ...(datePreset !== 'allTime' ? dateRange : {}),
            aircraftId: aircraftFilter || undefined,
          }}
          filename={`aog-events-${datePreset === 'allTime' ? 'all-time' : `${dateRange.startDate}-to-${dateRange.endDate}`}.xlsx`}
          label="Export"
        />
      </div>

      {/* Quick Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <AOGQuickStats events={filteredEvents} />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4 space-y-4"
      >
        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              Date Range
            </label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(['allTime', 'last7days', 'last30days', 'thisMonth', 'lastMonth'] as DatePreset[]).map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => setDatePreset(preset)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      datePreset === preset
                        ? 'bg-teal-600 text-white dark:bg-teal-500'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {preset === 'allTime' && 'All Time'}
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
          {datePreset !== 'allTime' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Custom Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={datePreset === 'custom' ? (customRange.startDate || '') : (dateRange.startDate || '')}
                  onChange={(e) => {
                    setDatePreset('custom');
                    setCustomRange((prev) => ({ ...prev, startDate: e.target.value }));
                  }}
                  className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={datePreset === 'custom' ? (customRange.endDate || '') : (dateRange.endDate || '')}
                  onChange={(e) => {
                    setDatePreset('custom');
                    setCustomRange((prev) => ({ ...prev, endDate: e.target.value }));
                  }}
                  className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
                />
              </div>
            </div>
          )}
        </div>

        {/* Other Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground min-w-[140px]"
            >
              <option value="all">All</option>
              <option value="active">Active Only</option>
              <option value="resolved">Resolved Only</option>
            </select>
          </div>

          {/* Category Filter (Multi-select) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleCategoryFilter(opt.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                    categoryFilter.includes(opt.value)
                      ? 'bg-teal-600 text-white border-teal-600 dark:bg-teal-500 dark:border-teal-500'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
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

          {/* Location Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground min-w-[140px]"
            >
              <option value="">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Box */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">Search Defect Description</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type to search..."
            className="px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground"
          />
        </div>

        {/* Clear Filters */}
        {(statusFilter !== 'all' || categoryFilter.length > 0 || locationFilter || searchQuery) && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('all');
                setCategoryFilter([]);
                setLocationFilter('');
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </motion.div>

      {/* Data Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {eventsLoading ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            Loading AOG events...
          </div>
        ) : (
          <DataTable
            data={filteredEvents}
            columns={columns}
            pageSize={25}
            onRowClick={handleRowClick}
            getRowClassName={(row) => (!row.clearedAt ? 'bg-red-500/5' : '')}
          />
        )}
      </motion.div>
    </div>
  );
}
