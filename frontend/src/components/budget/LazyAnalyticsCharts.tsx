import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load chart components for better initial page load
const MonthlySpendByTermChart = lazy(() =>
  import('./charts/MonthlySpendByTermChart').then((module) => ({
    default: module.MonthlySpendByTermChart,
  }))
);

const CumulativeSpendChart = lazy(() =>
  import('./charts/CumulativeSpendChart').then((module) => ({
    default: module.CumulativeSpendChart,
  }))
);

const SpendDistributionChart = lazy(() =>
  import('./charts/SpendDistributionChart').then((module) => ({
    default: module.SpendDistributionChart,
  }))
);

const BudgetedVsSpentChart = lazy(() =>
  import('./charts/BudgetedVsSpentChart').then((module) => ({
    default: module.BudgetedVsSpentChart,
  }))
);

const Top5OverspendList = lazy(() =>
  import('./charts/Top5OverspendList').then((module) => ({
    default: module.Top5OverspendList,
  }))
);

const SpendingHeatmap = lazy(() =>
  import('./charts/SpendingHeatmap').then((module) => ({
    default: module.SpendingHeatmap,
  }))
);

// Chart loading fallback
function ChartLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// Exported lazy-loaded chart components with Suspense boundaries
export {
  MonthlySpendByTermChart,
  CumulativeSpendChart,
  SpendDistributionChart,
  BudgetedVsSpentChart,
  Top5OverspendList,
  SpendingHeatmap,
  ChartLoader,
  Suspense,
};
