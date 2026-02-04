import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { ExportButton } from '@/components/ui/ExportButton';
import { Card } from '@/components/ui/Card';
import { AircraftSelect } from '@/components/ui/AircraftSelect';
import { GlossaryTerm } from '@/components/ui/GlossaryTooltip';
import { Button } from '@/components/ui/Form';
import {
  useDiscrepancies,
  useDiscrepancyAnalytics,
} from '@/hooks/useDiscrepancies';
import { useAircraft } from '@/hooks/useAircraft';
import { usePermissions } from '@/hooks/usePermissions';
import type { Discrepancy, Aircraft } from '@/types';

// Set document title for this page
const PAGE_TITLE = 'Discrepancies | Alpha Star Aviation';

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

const RESPONSIBILITY_COLORS: Record<string, string> = {
  Internal: '#3b82f6',
  OEM: '#ef4444',
  Customs: '#f59e0b',
  Finance: '#10b981',
  AOG: '#ec4899',
  Other: '#8b5cf6',
};

import { getATAChapterOptions, getATAChapterDescription } from '../../lib/ataChapters';

// ATA chapters for filter dropdown (includes "All" option)
const ATA_FILTER_OPTIONS = [
  { value: '', label: 'All ATA Chapters' },
  ...getATAChapterOptions(),
];

// Summary Statistics Cards
function SummaryCards({
  totalDiscrepancies,
  uncorrectedCount,
  totalDowntimeHours,
  topATAChapter,
}: {
  totalDiscrepancies: number;
  uncorrectedCount: number;
  totalDowntimeHours: number;
  topATAChapter: string;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Discrepancies</p>
        <p className="text-2xl font-bold text-foreground">{totalDiscrepancies.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Uncorrected</p>
        <p className="text-2xl font-bold text-destructive">{uncorrectedCount.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Downtime</p>
        <p className="text-2xl font-bold text-foreground">{totalDowntimeHours.toFixed(1)} hrs</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Top ATA Chapter</p>
        <p className="text-2xl font-bold text-foreground">{topATAChapter || '-'}</p>
      </motion.div>
    </div>
  );
}

export function DiscrepanciesListPage() {
  const { canWrite } = usePermissions();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Set document title
  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);
  
  // Get URL parameters for deep linking from alerts
  const urlUncorrected = searchParams.get('uncorrected');
  
  const [datePreset, setDatePreset] = useState<DatePreset>('last30days');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [aircraftFilter, setAircraftFilter] = useState<string>('');
  const [ataChapterFilter, setAtaChapterFilter] = useState<string>('');
  const [showUncorrectedOnly, setShowUncorrectedOnly] = useState(urlUncorrected === 'true');

  // Handle URL parameter changes
  useEffect(() => {
    if (urlUncorrected === 'true') {
      setShowUncorrectedOnly(true);
      setSearchParams({}, { replace: true });
    }
  }, [urlUncorrected, setSearchParams]);

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return customRange;
    }
    return getDateRangeFromPreset(datePreset);
  }, [datePreset, customRange]);

  // Data fetching
  const { data: aircraftData } = useAircraft();
  const { data: discrepanciesData, isLoading: discrepanciesLoading } = useDiscrepancies({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
    ataChapter: ataChapterFilter || undefined,
  });
  const { data: analyticsData } = useDiscrepancyAnalytics({
    ...dateRange,
  });

  const aircraft = aircraftData?.data || [];
  const discrepancies = discrepanciesData || [];

  // Create aircraft map for lookups (handle both _id and id fields)
  const aircraftMap = useMemo(() => {
    const map = new Map<string, Aircraft>();
    aircraft.forEach((a) => {
      const aircraftId = a._id || a.id;
      if (aircraftId) map.set(aircraftId, a);
    });
    return map;
  }, [aircraft]);

  // Filter discrepancies based on uncorrected filter
  const filteredDiscrepancies = useMemo(() => {
    if (showUncorrectedOnly) {
      return discrepancies.filter((d) => !d.dateCorrected);
    }
    return discrepancies;
  }, [discrepancies, showUncorrectedOnly]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalDiscrepancies = filteredDiscrepancies.length;
    const uncorrectedCount = filteredDiscrepancies.filter((d) => !d.dateCorrected).length;
    const totalDowntimeHours = filteredDiscrepancies.reduce(
      (sum, d) => sum + (d.downtimeHours || 0),
      0
    );
    
    // Get top ATA chapter from analytics
    const topATAChapter = analyticsData && analyticsData.length > 0
      ? (analyticsData as { _id: string }[]).find(item => item._id && item._id !== 'undefined')?._id || ''
      : '';
    
    return { totalDiscrepancies, uncorrectedCount, totalDowntimeHours, topATAChapter };
  }, [filteredDiscrepancies, analyticsData]);

  // Table columns for discrepancy list
  const columns: ColumnDef<Discrepancy, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'dateDetected',
        header: 'Date Detected',
        cell: ({ row }) => format(new Date(row.original.dateDetected), 'MMM dd, yyyy'),
      },
      {
        accessorKey: 'aircraftId',
        header: 'Aircraft',
        cell: ({ row }) =>
          aircraftMap.get(String(row.original.aircraftId))?.registration || 'Unknown',
      },
      {
        accessorKey: 'ataChapter',
        header: () => <><GlossaryTerm term="ATA" /> Chapter</>,
        cell: ({ row }) => (
          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-600">
            {getATAChapterDescription(row.original.ataChapter)}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) =>
          row.original.type ? (
            <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/10 text-purple-600">
              {row.original.type}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: 'discrepancyText',
        header: 'Description',
        cell: ({ row }) => (
          <span className="truncate max-w-[200px] block" title={row.original.discrepancyText}>
            {row.original.discrepancyText.length > 50
              ? `${row.original.discrepancyText.substring(0, 50)}...`
              : row.original.discrepancyText}
          </span>
        ),
      },
      {
        accessorKey: 'responsibility',
        header: 'Responsibility',
        cell: ({ row }) =>
          row.original.responsibility ? (
            <span
              className="px-2 py-0.5 text-xs rounded-full"
              style={{
                backgroundColor: `${RESPONSIBILITY_COLORS[row.original.responsibility]}20`,
                color: RESPONSIBILITY_COLORS[row.original.responsibility],
              }}
            >
              {row.original.responsibility}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: 'downtimeHours',
        header: 'Downtime',
        cell: ({ row }) =>
          row.original.downtimeHours !== undefined && row.original.downtimeHours > 0
            ? `${row.original.downtimeHours.toFixed(1)} hrs`
            : '-',
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.dateCorrected ? (
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-600">
              Corrected
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
              Open
            </span>
          ),
      },
      {
        accessorKey: 'dateCorrected',
        header: 'Date Corrected',
        cell: ({ row }) =>
          row.original.dateCorrected
            ? format(new Date(row.original.dateCorrected), 'MMM dd, yyyy')
            : '-',
      },
      ...(canWrite ? [{
        id: 'actions',
        header: 'Actions',
        cell: ({ row }: { row: { original: Discrepancy } }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/discrepancies/${row.original._id}/edit`);
            }}
          >
            Edit
          </Button>
        ),
      }] : []),
    ],
    [aircraftMap, canWrite, navigate]
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
          Discrepancies
        </motion.h1>

        <div className="flex items-center gap-3">
          {/* Export Button */}
          <ExportButton
            exportType="discrepancies"
            filters={{ ...dateRange, aircraftId: aircraftFilter || undefined, ataChapter: ataChapterFilter || undefined }}
            filename={`discrepancies-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`}
            label="Export"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        totalDiscrepancies={summaryStats.totalDiscrepancies}
        uncorrectedCount={summaryStats.uncorrectedCount}
        totalDowntimeHours={summaryStats.totalDowntimeHours}
        topATAChapter={summaryStats.topATAChapter}
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

          {/* ATA Chapter Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">ATA Chapter</label>
            <select
              value={ataChapterFilter}
              onChange={(e) => setAtaChapterFilter(e.target.value)}
              className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground min-w-[180px]"
            >
              <option value="">All ATA Chapters</option>
              {ATA_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Uncorrected Only Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="uncorrectedOnly"
              checked={showUncorrectedOnly}
              onChange={(e) => setShowUncorrectedOnly(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="uncorrectedOnly" className="text-sm font-medium text-muted-foreground">
              Uncorrected Only
            </label>
          </div>
        </div>
      </motion.div>

      {/* Discrepancies List */}
      <Card padding="none">
        {discrepanciesLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading discrepancies...</div>
        ) : filteredDiscrepancies.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredDiscrepancies}
            striped
            stickyHeader
            getRowClassName={(row) =>
              !row.dateCorrected ? 'bg-destructive/5 dark:bg-destructive/10' : ''
            }
          />
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No discrepancies found for the selected filters.
          </div>
        )}
      </Card>
    </div>
  );
}
