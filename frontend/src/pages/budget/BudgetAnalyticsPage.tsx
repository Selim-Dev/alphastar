import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBudgetProjects } from '@/hooks/useBudgetProjects';
import { useBudgetAnalytics } from '@/hooks/useBudgetAnalytics';
import { Button } from '@/components/ui/Form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Form';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { AnalyticsFilters } from '@/types/budget-projects';

// Chart components (to be created)
import { MonthlySpendByTermChart } from '@/components/budget/charts/MonthlySpendByTermChart';
import { CumulativeSpendChart } from '@/components/budget/charts/CumulativeSpendChart';
import { SpendDistributionChart } from '@/components/budget/charts/SpendDistributionChart';
import { BudgetedVsSpentChart } from '@/components/budget/charts/BudgetedVsSpentChart';
import { Top5OverspendList } from '@/components/budget/charts/Top5OverspendList';
import { SpendingHeatmap } from '@/components/budget/charts/SpendingHeatmap';
import { BudgetPDFExport } from '@/components/budget/BudgetPDFExport';

export function BudgetAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useProject } = useBudgetProjects();
  const { data: project, isLoading: projectLoading } = useProject(id!);

  // Filter state
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: '',
    endDate: '',
    aircraftType: '',
    termSearch: '',
  });

  // Debounce term search to avoid excessive API calls
  const debouncedTermSearch = useDebounce(filters.termSearch, 300);

  // Create debounced filters object
  const debouncedFilters = useMemo(
    () => ({
      ...filters,
      termSearch: debouncedTermSearch,
    }),
    [filters.startDate, filters.endDate, filters.aircraftType, debouncedTermSearch]
  );

  // Analytics hooks
  const analytics = useBudgetAnalytics(id!);
  const { data: kpis, isLoading: kpisLoading } = analytics.useKPIs(debouncedFilters);
  const { data: monthlySpend, isLoading: monthlySpendLoading } =
    analytics.useMonthlySpend(debouncedFilters);
  const { data: cumulativeSpend, isLoading: cumulativeSpendLoading } =
    analytics.useCumulativeSpend();
  const { data: spendDistribution, isLoading: spendDistributionLoading } =
    analytics.useSpendDistribution(debouncedFilters);
  const { data: budgetedVsSpent, isLoading: budgetedVsSpentLoading } =
    analytics.useBudgetedVsSpent();
  const { data: top5Overspend, isLoading: top5OverspendLoading } =
    analytics.useTop5Overspend();
  const { data: heatmap, isLoading: heatmapLoading } = analytics.useHeatmap();

  // Extract aircraft types from project scope
  const aircraftTypes = useMemo(() => {
    if (!project) return [];
    if (project.aircraftScope.type === 'type' && project.aircraftScope.aircraftTypes) {
      return project.aircraftScope.aircraftTypes;
    }
    return [];
  }, [project]);

  // Handle filter changes
  const handleFilterChange = (key: keyof AnalyticsFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // PDF export is handled by BudgetPDFExport component

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button onClick={() => navigate('/budget-projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/budget-projects/${id}`)}
            className="self-start sm:self-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">{project.name} - Analytics</h1>
            <p className="text-sm text-muted-foreground truncate">
              {new Date(project.dateRange.start).toLocaleDateString()} -{' '}
              {new Date(project.dateRange.end).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <BudgetPDFExport
            project={project}
            kpis={kpis}
            top5Overspend={top5Overspend}
            filters={debouncedFilters}
            variant="outline"
            size="md"
          />
        </div>
      </div>

      {/* Filter Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                min={project.dateRange.start.split('T')[0]}
                max={project.dateRange.end.split('T')[0]}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={project.dateRange.start.split('T')[0]}
                max={project.dateRange.end.split('T')[0]}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aircraftType" className="text-sm">Aircraft Type</Label>
              <Select
                value={filters.aircraftType}
                onValueChange={(value) => handleFilterChange('aircraftType', value)}
              >
                <SelectTrigger id="aircraftType" className="w-full">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {aircraftTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="termSearch" className="text-sm">Search Terms</Label>
              <Input
                id="termSearch"
                type="text"
                placeholder="Search spending terms..."
                value={filters.termSearch}
                onChange={(e) => handleFilterChange('termSearch', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards - Priority 1: Load first */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Budgeted
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold truncate">
                {project.currency} {kpis?.totalBudgeted.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold truncate">
                {project.currency} {kpis?.totalSpent.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Remaining Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold truncate">
                {project.currency} {kpis?.remainingBudget.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Budget Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold">
                {kpis?.budgetUtilization.toFixed(1) ?? 0}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Burn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <div>
                <div className="text-xl sm:text-2xl font-bold truncate">
                  {project.currency} {kpis?.burnRate.toLocaleString() ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">per month</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <div>
                <div className="text-xl sm:text-2xl font-bold">
                  {kpis?.forecastMonthsRemaining.toFixed(1) ?? 0} <span className="text-base sm:text-lg">months</span>
                </div>
                {kpis?.forecastDepletionDate && (
                  <p className="text-xs text-muted-foreground truncate">
                    Until {new Date(kpis.forecastDepletionDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts - Priority 2: Load after KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card data-chart="monthly-spend" className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg truncate">Monthly Spend by Term</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            {monthlySpendLoading ? (
              <div className="h-64 sm:h-80 bg-muted animate-pulse rounded" />
            ) : (
              <div className="w-full overflow-x-auto">
                <MonthlySpendByTermChart data={monthlySpend ?? []} currency={project.currency} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-chart="cumulative-spend" className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg truncate">Cumulative Spend vs Budget</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            {cumulativeSpendLoading ? (
              <div className="h-64 sm:h-80 bg-muted animate-pulse rounded" />
            ) : (
              <div className="w-full overflow-x-auto">
                <CumulativeSpendChart data={cumulativeSpend ?? []} currency={project.currency} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-chart="spend-distribution" className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg truncate">Spend Distribution by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            {spendDistributionLoading ? (
              <div className="h-64 sm:h-80 bg-muted animate-pulse rounded" />
            ) : (
              <div className="w-full overflow-x-auto">
                <SpendDistributionChart
                  data={spendDistribution ?? []}
                  currency={project.currency}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-chart="budgeted-vs-spent" className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg truncate">Budgeted vs Spent by Aircraft Type</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            {budgetedVsSpentLoading ? (
              <div className="h-64 sm:h-80 bg-muted animate-pulse rounded" />
            ) : (
              <div className="w-full overflow-x-auto">
                <BudgetedVsSpentChart data={budgetedVsSpent ?? []} currency={project.currency} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Overspend - Priority 2 */}
      <Card data-chart="top5-overspend" className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Top 5 Overspend Terms</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          {top5OverspendLoading ? (
            <div className="h-48 sm:h-64 bg-muted animate-pulse rounded" />
          ) : (
            <div className="w-full overflow-x-auto">
              <Top5OverspendList data={top5Overspend ?? []} currency={project.currency} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Heatmap - Priority 3: Optional, load last */}
      <Card data-chart="heatmap" className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Spending Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          {heatmapLoading ? (
            <div className="h-80 sm:h-96 bg-muted animate-pulse rounded" />
          ) : (
            <div className="w-full overflow-x-auto">
              <SpendingHeatmap data={heatmap} currency={project.currency} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
