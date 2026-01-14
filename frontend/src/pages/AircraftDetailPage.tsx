import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import { KPICard } from '@/components/ui/KPICard';
import { ChartContainer, AreaTrendChart, BarChartWrapper } from '@/components/ui/Charts';
import { DataTable } from '@/components/ui/DataTable';
import { GlossaryTerm } from '@/components/ui/GlossaryTooltip';
import { useAircraftById } from '@/hooks/useAircraft';
import { useUtilization } from '@/hooks/useUtilization';
import { useDailyStatus, useAvailability } from '@/hooks/useDailyStatus';
import { useAOGEvents } from '@/hooks/useAOGEvents';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { useDiscrepancies } from '@/hooks/useDiscrepancies';
import { useMaintenanceTasks, useMaintenanceSummary } from '@/hooks/useMaintenance';
import { useExportData, downloadBlob } from '@/hooks/useImportExport';
import type { AOGEvent, WorkOrder, Discrepancy, MaintenanceTask } from '@/types';

// Icons
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);

const PlaneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const CycleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

type DatePreset = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'last3months' | 'custom';

interface DateRange {
  startDate: string;
  endDate: string;
}

function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const today = new Date();
  switch (preset) {
    case 'last7days':
      return { startDate: format(subDays(today, 7), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
    case 'last30days':
      return { startDate: format(subDays(today, 30), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
    case 'thisMonth':
      return { startDate: format(startOfMonth(today), 'yyyy-MM-dd'), endDate: format(endOfMonth(today), 'yyyy-MM-dd') };
    case 'lastMonth':
      const lastMonth = subMonths(today, 1);
      return { startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'), endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd') };
    case 'last3months':
      return { startDate: format(subMonths(today, 3), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
    default:
      return { startDate: format(subDays(today, 30), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
  }
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    parked: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    leased: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    Open: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    InProgress: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    Closed: 'bg-green-500/10 text-green-600 border-green-500/20',
    Deferred: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colors[status] || 'bg-gray-500/10 text-gray-600'}`}>
      {status}
    </span>
  );
}

export function AircraftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [datePreset, setDatePreset] = useState<DatePreset>('last30days');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [activeTab, setActiveTab] = useState<'events' | 'workorders' | 'discrepancies' | 'maintenance'>('events');

  const exportMutation = useExportData();

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') return customRange;
    return getDateRangeFromPreset(datePreset);
  }, [datePreset, customRange]);

  // Fetch aircraft data
  const { data: aircraft, isLoading: aircraftLoading, error: aircraftError } = useAircraftById(id || '');

  // Fetch latest utilization counters
  const { data: utilizationData } = useUtilization({ aircraftId: id, limit: 1 });
  const latestCounter = utilizationData?.[0];

  // Fetch daily status for availability
  const { data: dailyStatusData } = useDailyStatus({ aircraftId: id, ...dateRange });

  // Fetch availability metrics
  const { data: availabilityData } = useAvailability({ aircraftId: id, ...dateRange, groupBy: 'day' });

  // Fetch AOG events
  const { data: aogEvents } = useAOGEvents({ aircraftId: id, ...dateRange, limit: 10 });

  // Fetch work orders
  const { data: workOrders } = useWorkOrders({ aircraftId: id, limit: 10 });

  // Fetch discrepancies
  const { data: discrepancies } = useDiscrepancies({ aircraftId: id, ...dateRange, limit: 10 });

  // Fetch maintenance tasks
  const { data: maintenanceTasks } = useMaintenanceTasks({ aircraftId: id, ...dateRange, limit: 10 });

  // Fetch maintenance summary by month
  const { data: maintenanceSummary } = useMaintenanceSummary({ ...dateRange, groupBy: 'month' });

  // Calculate current availability
  const currentAvailability = useMemo(() => {
    if (!dailyStatusData?.length) return null;
    const totalPos = dailyStatusData.reduce((sum, s) => sum + s.posHours, 0);
    const totalFmc = dailyStatusData.reduce((sum, s) => sum + s.fmcHours, 0);
    return totalPos > 0 ? (totalFmc / totalPos) * 100 : 0;
  }, [dailyStatusData]);

  // Transform availability data for chart
  const availabilityChartData = useMemo(() => {
    if (!availabilityData) return [];
    return (availabilityData as { period: string; availabilityPercentage: number; totalFmcHours: number; totalPosHours: number }[]).map((item) => ({
      name: item.period,
      availability: item.availabilityPercentage,
      fmcHours: item.totalFmcHours,
      downtimeHours: item.totalPosHours - item.totalFmcHours,
    }));
  }, [availabilityData]);

  // Transform maintenance summary for chart
  const maintenanceChartData = useMemo(() => {
    if (!maintenanceSummary) return [];
    return maintenanceSummary.map((item) => ({
      name: typeof item._id === 'string' ? item._id : Object.values(item._id).join(' - '),
      manHours: item.totalManHours,
      cost: item.totalCost || 0,
      tasks: item.totalTasks,
    }));
  }, [maintenanceSummary]);

  // Handle export
  const handleExport = async () => {
    try {
      const result = await exportMutation.mutateAsync({
        type: 'aircraft-detail',
        filters: { aircraftId: id, ...dateRange },
      });
      downloadBlob(result.blob, `aircraft-${aircraft?.registration || id}-detail.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Table columns for AOG events
  const aogColumns: ColumnDef<AOGEvent, unknown>[] = useMemo(() => [
    { accessorKey: 'detectedAt', header: 'Detected', cell: ({ row }) => format(new Date(row.original.detectedAt), 'MMM dd, yyyy HH:mm') },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => <StatusBadge status={row.original.category} /> },
    { accessorKey: 'responsibleParty', header: 'Responsible' },
    { accessorKey: 'reasonCode', header: 'Reason' },
    { accessorKey: 'manHours', header: 'Man Hours' },
    { accessorKey: 'clearedAt', header: 'Cleared', cell: ({ row }) => row.original.clearedAt ? format(new Date(row.original.clearedAt), 'MMM dd, yyyy HH:mm') : 'Active' },
  ], []);

  // Table columns for work orders
  const workOrderColumns: ColumnDef<WorkOrder, unknown>[] = useMemo(() => [
    { accessorKey: 'woNumber', header: 'WO Number' },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => <span className="truncate max-w-[200px] block">{row.original.description}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'dateIn', header: 'Date In', cell: ({ row }) => format(new Date(row.original.dateIn), 'MMM dd, yyyy') },
    { accessorKey: 'dueDate', header: 'Due Date', cell: ({ row }) => row.original.dueDate ? format(new Date(row.original.dueDate), 'MMM dd, yyyy') : '-' },
    { accessorKey: 'isOverdue', header: 'Overdue', cell: ({ row }) => row.original.isOverdue ? <span className="text-red-500 font-medium">Yes</span> : 'No' },
  ], []);

  // Table columns for discrepancies
  const discrepancyColumns: ColumnDef<Discrepancy, unknown>[] = useMemo(() => [
    { accessorKey: 'dateDetected', header: 'Detected', cell: ({ row }) => format(new Date(row.original.dateDetected), 'MMM dd, yyyy') },
    { accessorKey: 'ataChapter', header: () => <><GlossaryTerm term="ATA" /> Chapter</> },
    { accessorKey: 'discrepancyText', header: 'Description', cell: ({ row }) => <span className="truncate max-w-[250px] block">{row.original.discrepancyText}</span> },
    { accessorKey: 'responsibility', header: 'Responsibility' },
    { accessorKey: 'dateCorrected', header: 'Corrected', cell: ({ row }) => row.original.dateCorrected ? format(new Date(row.original.dateCorrected), 'MMM dd, yyyy') : 'Open' },
  ], []);

  // Table columns for maintenance tasks
  const maintenanceColumns: ColumnDef<MaintenanceTask, unknown>[] = useMemo(() => [
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => format(new Date(row.original.date), 'MMM dd, yyyy') },
    { accessorKey: 'shift', header: 'Shift' },
    { accessorKey: 'taskType', header: 'Type' },
    { accessorKey: 'taskDescription', header: 'Description', cell: ({ row }) => <span className="truncate max-w-[200px] block">{row.original.taskDescription}</span> },
    { accessorKey: 'manHours', header: 'Man Hours' },
    { accessorKey: 'cost', header: 'Cost', cell: ({ row }) => row.original.cost ? `$${row.original.cost.toLocaleString()}` : '-' },
  ], []);

  if (aircraftLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading aircraft details...</div>
      </div>
    );
  }

  if (aircraftError || !aircraft) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <BackIcon /> Back
        </button>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          Aircraft not found or failed to load.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <BackIcon />
          </button>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-2xl font-bold text-foreground">{aircraft.registration}</h1>
            <p className="text-sm text-muted-foreground">{aircraft.aircraftType} • {aircraft.fleetGroup} • <StatusBadge status={aircraft.status} /></p>
          </motion.div>
        </div>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleExport}
          disabled={exportMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <DownloadIcon />
          {exportMutation.isPending ? 'Exporting...' : 'Export to Excel'}
        </motion.button>
      </div>

      {/* Date Filter */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-4">
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(['last7days', 'last30days', 'thisMonth', 'last3months'] as DatePreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => setDatePreset(preset)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                datePreset === preset ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {preset === 'last7days' && '7 Days'}
              {preset === 'last30days' && '30 Days'}
              {preset === 'thisMonth' && 'This Month'}
              {preset === 'last3months' && '3 Months'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={datePreset === 'custom' ? customRange.startDate : dateRange.startDate}
            onChange={(e) => { setDatePreset('custom'); setCustomRange((prev) => ({ ...prev, startDate: e.target.value })); }}
            className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={datePreset === 'custom' ? customRange.endDate : dateRange.endDate}
            onChange={(e) => { setDatePreset('custom'); setCustomRange((prev) => ({ ...prev, endDate: e.target.value })); }}
            className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
          />
        </div>
      </motion.div>

      {/* KPI Cards - Current Counters and Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Availability"
          value={currentAvailability !== null ? `${currentAvailability.toFixed(1)}%` : 'N/A'}
          subtitle="For selected period"
          icon={<CheckIcon />}
          className={currentAvailability !== null && currentAvailability < 90 ? 'border-yellow-500/50' : ''}
        />
        <KPICard
          title={<>Airframe Hours (<GlossaryTerm term="TTSN" />)</>}
          value={latestCounter?.airframeHoursTtsn?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? 'N/A'}
          subtitle={latestCounter ? `As of ${format(new Date(latestCounter.date), 'MMM dd, yyyy')}` : 'No data'}
          icon={<ClockIcon />}
        />
        <KPICard
          title={<>Airframe Cycles (<GlossaryTerm term="TCSN" />)</>}
          value={latestCounter?.airframeCyclesTcsn?.toLocaleString() ?? 'N/A'}
          subtitle={latestCounter ? `As of ${format(new Date(latestCounter.date), 'MMM dd, yyyy')}` : 'No data'}
          icon={<CycleIcon />}
        />
        <KPICard
          title={<><GlossaryTerm term="APU" /> Hours</>}
          value={latestCounter?.apuHours?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? 'N/A'}
          subtitle="Total APU time"
          icon={<PlaneIcon />}
        />
      </div>

      {/* Aircraft Info Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Aircraft Information</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><p className="text-sm text-muted-foreground">MSN</p><p className="font-medium">{aircraft.msn}</p></div>
          <div><p className="text-sm text-muted-foreground">Owner</p><p className="font-medium">{aircraft.owner}</p></div>
          <div><p className="text-sm text-muted-foreground">Manufacture Date</p><p className="font-medium">{format(new Date(aircraft.manufactureDate), 'MMM dd, yyyy')}</p></div>
          <div><p className="text-sm text-muted-foreground">Engines</p><p className="font-medium">{aircraft.enginesCount}</p></div>
        </div>
        {latestCounter && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3">Engine Counters</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><p className="text-muted-foreground">Engine 1 Hours</p><p className="font-medium">{latestCounter.engine1Hours?.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">Engine 1 Cycles</p><p className="font-medium">{latestCounter.engine1Cycles?.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">Engine 2 Hours</p><p className="font-medium">{latestCounter.engine2Hours?.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">Engine 2 Cycles</p><p className="font-medium">{latestCounter.engine2Cycles?.toLocaleString()}</p></div>
              {latestCounter.engine3Hours !== undefined && (
                <>
                  <div><p className="text-muted-foreground">Engine 3 Hours</p><p className="font-medium">{latestCounter.engine3Hours?.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Engine 3 Cycles</p><p className="font-medium">{latestCounter.engine3Cycles?.toLocaleString()}</p></div>
                </>
              )}
              {latestCounter.engine4Hours !== undefined && (
                <>
                  <div><p className="text-muted-foreground">Engine 4 Hours</p><p className="font-medium">{latestCounter.engine4Hours?.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Engine 4 Cycles</p><p className="font-medium">{latestCounter.engine4Cycles?.toLocaleString()}</p></div>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Availability Timeline" subtitle="FMC hours vs downtime over selected period" height={300} delay={0.2}>
          {availabilityChartData.length > 0 ? (
            <AreaTrendChart
              data={availabilityChartData}
              areas={[
                { dataKey: 'availability', color: '#22c55e', name: 'Availability %' },
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">No availability data for selected period</div>
          )}
        </ChartContainer>

        <ChartContainer title="Maintenance History" subtitle="Man-hours and costs by month" height={300} delay={0.3}>
          {maintenanceChartData.length > 0 ? (
            <BarChartWrapper
              data={maintenanceChartData}
              bars={[
                { dataKey: 'manHours', color: '#3b82f6', name: 'Man Hours' },
                { dataKey: 'tasks', color: '#8b5cf6', name: 'Tasks' },
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">No maintenance data for selected period</div>
          )}
        </ChartContainer>
      </div>

      {/* Tabs for Events, Work Orders, Discrepancies, Maintenance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-lg">
        <div className="border-b border-border">
          <div className="flex">
            {[
              { key: 'events', label: 'AOG Events', count: aogEvents?.length },
              { key: 'workorders', label: 'Work Orders', count: workOrders?.length },
              { key: 'discrepancies', label: 'Discrepancies', count: discrepancies?.length },
              { key: 'maintenance', label: 'Maintenance Tasks', count: maintenanceTasks?.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label} {tab.count !== undefined && <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4">
          {activeTab === 'events' && (
            <DataTable data={aogEvents || []} columns={aogColumns} searchPlaceholder="Search events..." searchColumn="reasonCode" pageSize={5} />
          )}
          {activeTab === 'workorders' && (
            <DataTable data={workOrders || []} columns={workOrderColumns} searchPlaceholder="Search work orders..." searchColumn="woNumber" pageSize={5} />
          )}
          {activeTab === 'discrepancies' && (
            <DataTable data={discrepancies || []} columns={discrepancyColumns} searchPlaceholder="Search discrepancies..." searchColumn="ataChapter" pageSize={5} />
          )}
          {activeTab === 'maintenance' && (
            <DataTable data={maintenanceTasks || []} columns={maintenanceColumns} searchPlaceholder="Search tasks..." searchColumn="taskType" pageSize={5} />
          )}
        </div>
      </motion.div>
    </div>
  );
}
