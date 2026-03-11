import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button, Input, Select } from '@/components/ui/Form';
import { SkeletonKPICards, SkeletonChart } from '@/components/ui/Skeleton';
import { useAircraft } from '@/hooks/useAircraft';
import {
  useAOGAnalyticsSummary,
  useAOGCategoryBreakdown,
  useAOGTimeBreakdown,
  useAOGCostBreakdown,
} from '@/hooks/useAOGAnalytics';
import { AnalyticsPDFExport } from '@/components/ui/AnalyticsPDFExport';

// --- Constants ---

const FLEET_GROUPS = [
  'AIRBUS 330', 'AIRBUS 340', 'AIRBUS A320 FAMILY',
  'GULFSTREAM', 'HAWKER 900XP', 'CESSNA',
  'ATR', 'CITATION LATITUDE', 'KING AIR',
];

const CATEGORY_COLORS: Record<string, string> = {
  aog: '#ef4444',
  scheduled: '#3b82f6',
  unscheduled: '#f59e0b',
};

const CATEGORY_LABELS: Record<string, string> = {
  aog: 'AOG',
  scheduled: 'Scheduled',
  unscheduled: 'Unscheduled',
};

const DEPARTMENT_COLORS: Record<string, string> = {
  Technical: '#64748b',
  QC: '#f59e0b',
  Engineering: '#3b82f6',
  'Project Management': '#8b5cf6',
  Others: '#22c55e',
};

// --- Filter State ---

interface Filters {
  aircraftId: string;
  fleetGroup: string;
  category: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FILTERS: Filters = {
  aircraftId: '',
  fleetGroup: '',
  category: '',
  startDate: '',
  endDate: '',
};

// --- Helper ---

function buildFilterParams(filters: Filters) {
  const params: Record<string, string> = {};
  if (filters.aircraftId) params.aircraftId = filters.aircraftId;
  if (filters.fleetGroup) params.fleetGroup = filters.fleetGroup;
  if (filters.category) params.category = filters.category;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  return Object.keys(params).length > 0 ? params : undefined;
}

function hasActiveFilters(filters: Filters) {
  return Object.values(filters).some((v) => v !== '');
}

// --- Summary Cards ---

function SummaryCards({ filter }: { filter?: Record<string, string> }) {
  const { data, isLoading } = useAOGAnalyticsSummary(filter);

  if (isLoading) return <SkeletonKPICards count={4} />;

  if (!data || data.totalParentEvents === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No AOG events found for the selected filters.</p>
      </div>
    );
  }

  const cards = [
    { label: 'Total Events', value: data.totalParentEvents, accent: 'border-l-slate-500' },
    { label: 'Active Events', value: data.activeParentEvents, accent: 'border-l-red-500' },
    { label: 'Completed Events', value: data.completedParentEvents, accent: 'border-l-green-500' },
    {
      label: 'Total Downtime',
      value: `${data.totalDowntimeHours.toFixed(1)} hrs`,
      accent: 'border-l-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-card border border-border rounded-lg p-4 border-l-4 ${card.accent}`}
        >
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="text-2xl font-bold mt-1">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

// --- Category Breakdown Chart ---

function CategoryBreakdownSection({ filter }: { filter?: Record<string, string> }) {
  const { data, isLoading } = useAOGCategoryBreakdown(filter);

  if (isLoading) return <SkeletonChart height={300} />;

  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
        <p className="text-muted-foreground text-center py-8">No category data available.</p>
      </div>
    );
  }

  const barData = data.map((item) => ({
    name: CATEGORY_LABELS[item.category] || item.category,
    'Sub-Events': item.subEventCount,
    'Downtime (hrs)': Number(item.totalDowntimeHours.toFixed(1)),
    fill: CATEGORY_COLORS[item.category] || '#94a3b8',
  }));

  const pieData = data.map((item) => ({
    name: CATEGORY_LABELS[item.category] || item.category,
    value: item.subEventCount,
    color: CATEGORY_COLORS[item.category] || '#94a3b8',
    percentage: item.percentage,
  }));

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart — count + downtime */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Sub-Events &amp; Downtime by Category</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="Sub-Events" radius={[4, 4, 0, 0]}>
                {barData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
              <Bar yAxisId="right" dataKey="Downtime (hrs)" radius={[4, 4, 0, 0]} fillOpacity={0.6}>
                {barData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — distribution */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Distribution</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={(props: { name?: string; percent?: number }) =>
                  `${props.name ?? ''} ${((props.percent || 0) * 100).toFixed(0)}%`
                }
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// --- Time Breakdown Chart ---

function TimeBreakdownSection({ filter }: { filter?: Record<string, string> }) {
  const { data, isLoading } = useAOGTimeBreakdown(filter);

  if (isLoading) return <SkeletonChart height={300} />;

  if (!data || data.grandTotalHours === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Time Breakdown</h3>
        <p className="text-muted-foreground text-center py-8">No time breakdown data available.</p>
      </div>
    );
  }

  // Build horizontal bar data: one bar per category (Technical + each department)
  const chartData = [
    {
      name: 'Technical',
      hours: Number(data.technicalTimeHours.toFixed(1)),
      percentage: Number(data.technicalTimePercentage.toFixed(1)),
      fill: DEPARTMENT_COLORS.Technical,
    },
    ...data.departmentTotals.map((d) => ({
      name: d.department,
      hours: Number(d.totalHours.toFixed(1)),
      percentage: Number(d.percentage.toFixed(1)),
      fill: DEPARTMENT_COLORS[d.department] || '#94a3b8',
    })),
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Time Breakdown</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Technical Time vs Department Time — Total: {data.grandTotalHours.toFixed(1)} hrs
      </p>

      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 60 + 40)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: unknown) => [`${value ?? 0} hrs`, 'Time']}
          />
          <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={28}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-sm inline-block"
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-muted-foreground">
              {entry.name}: {entry.hours} hrs ({entry.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Cost Breakdown Chart ---

// Hex colors only — no oklch — for html2canvas PDF compatibility
const COST_DEPT_COLORS: Record<string, string> = {
  QC: '#f59e0b',
  Engineering: '#3b82f6',
  'Project Management': '#8b5cf6',
  Procurement: '#14b8a6',
  Technical: '#64748b',
  Others: '#22c55e',
};
const COST_DEPT_COLOR_DEFAULT = '#94a3b8';

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function CostBreakdownSection({ filter }: { filter?: Record<string, string> }) {
  const { data, isLoading } = useAOGCostBreakdown(filter);

  if (isLoading) return <SkeletonChart height={300} />;

  const isEmpty = !data || data.departments.length === 0;

  if (isEmpty) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
        <p className="text-muted-foreground text-center py-8">
          No cost data available for the selected filters.
        </p>
      </div>
    );
  }

  const { departments, totals } = data;

  // Bar chart data — grouped internal vs external per department
  const barData = departments.map((d) => ({
    name: d.department,
    Internal: d.internalCost,
    External: d.externalCost,
    fill: COST_DEPT_COLORS[d.department] || COST_DEPT_COLOR_DEFAULT,
  }));

  // Pie chart data — total cost per department
  const pieData = departments.map((d) => ({
    name: d.department,
    value: d.totalCost,
    color: COST_DEPT_COLORS[d.department] || COST_DEPT_COLOR_DEFAULT,
  }));

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Internal Cost', value: totals.internalCost, accent: 'border-l-blue-500' },
          { label: 'Total External Cost', value: totals.externalCost, accent: 'border-l-amber-500' },
          { label: 'Grand Total', value: totals.totalCost, accent: 'border-l-green-500' },
        ].map((card) => (
          <div
            key={card.label}
            className={`bg-muted/40 border border-border rounded-lg p-4 border-l-4 ${card.accent}`}
          >
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-xl font-bold mt-1">{formatUSD(card.value)}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grouped bar chart — internal vs external per department */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Internal vs External Cost by Department</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={((value: number | undefined) => formatUSD(value ?? 0)) as never}
              />
              <Legend />
              <Bar dataKey="Internal" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="External" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut pie chart — cost distribution by department */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Cost Distribution by Department</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={(props: { name?: string; percent?: number }) =>
                  `${props.name ?? ''} ${((props.percent || 0) * 100).toFixed(0)}%`
                }
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={((value: number | undefined) => formatUSD(value ?? 0)) as never}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 text-muted-foreground font-medium">Department</th>
              <th className="pb-2 text-muted-foreground font-medium text-right">Internal</th>
              <th className="pb-2 text-muted-foreground font-medium text-right">External</th>
              <th className="pb-2 text-muted-foreground font-medium text-right">Total</th>
              <th className="pb-2 text-muted-foreground font-medium text-right">Entries</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.department} className="border-b border-border/50 last:border-0">
                <td className="py-2">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block"
                      style={{ backgroundColor: COST_DEPT_COLORS[d.department] || COST_DEPT_COLOR_DEFAULT }}
                    />
                    {d.department}
                  </span>
                </td>
                <td className="py-2 text-right">{formatUSD(d.internalCost)}</td>
                <td className="py-2 text-right">{formatUSD(d.externalCost)}</td>
                <td className="py-2 text-right font-semibold">{formatUSD(d.totalCost)}</td>
                <td className="py-2 text-right text-muted-foreground">{d.entryCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Filter Bar ---

function FilterBar({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters;
  onChange: (key: keyof Filters, value: string) => void;
  onClear: () => void;
}) {
  const { data: aircraftData } = useAircraft();
  const aircraftList = aircraftData?.data || [];

  const aircraftOptions = useMemo(
    () => aircraftList.map((a) => ({ value: a.id || a._id, label: a.registration })),
    [aircraftList],
  );

  const fleetGroupOptions = FLEET_GROUPS.map((g) => ({ value: g, label: g }));

  const categoryOptions = [
    { value: 'aog', label: 'AOG' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'unscheduled', label: 'Unscheduled' },
  ];

  const active = hasActiveFilters(filters);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Aircraft</label>
          <Select
            value={filters.aircraftId}
            onChange={(e) => onChange('aircraftId', e.target.value)}
            options={aircraftOptions}
          />
        </div>

        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Fleet Group</label>
          <Select
            value={filters.fleetGroup}
            onChange={(e) => onChange('fleetGroup', e.target.value)}
            options={fleetGroupOptions}
          />
        </div>

        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
          <Select
            value={filters.category}
            onChange={(e) => onChange('category', e.target.value)}
            options={categoryOptions}
          />
        </div>

        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date</label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
          />
        </div>

        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">End Date</label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => onChange('endDate', e.target.value)}
          />
        </div>

        {active && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Main Page ---

export function AOGAnalyticsPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const filterParams = useMemo(() => buildFilterParams(filters), [filters]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => setFilters(EMPTY_FILTERS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AOG Analytics</h1>
        <AnalyticsPDFExport
          containerId="aog-analytics-content"
          filename={`aog-analytics-${new Date().toISOString().split('T')[0]}.pdf`}
          label="Export PDF"
          variant="outline"
          size="sm"
        />
      </div>

      <div id="aog-analytics-content" className="space-y-6">
        {/* 14.4 — Filter Bar */}
        <FilterBar filters={filters} onChange={handleFilterChange} onClear={handleClearFilters} />

        {/* 14.1 — Summary Cards */}
        <SummaryCards filter={filterParams} />

        {/* 14.2 — Category Breakdown */}
        <CategoryBreakdownSection filter={filterParams} />

        {/* 14.3 — Time Breakdown */}
        <TimeBreakdownSection filter={filterParams} />

        {/* Cost Breakdown */}
        <CostBreakdownSection filter={filterParams} />
      </div>
    </div>
  );
}
