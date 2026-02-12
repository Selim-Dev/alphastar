import { Progress } from '@/components/ui/progress';
import type { OverspendTerm } from '@/types/budget-projects';

interface Top5OverspendListProps {
  data: OverspendTerm[];
  currency: string;
}

export function Top5OverspendList({ data, currency }: Top5OverspendListProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No overspend terms found
      </div>
    );
  }

  // Sort by variance (most negative first = highest overspend)
  const sortedData = [...data].sort((a, b) => a.variance - b.variance).slice(0, 5);

  return (
    <div className="space-y-6">
      {sortedData.map((term, index) => {
        const overspendAmount = Math.abs(term.variance);
        const overspendPercent = Math.abs(term.variancePercent);
        const progressValue = Math.min((term.spent / term.budgeted) * 100, 100);

        return (
          <div key={term.termId} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{term.termName}</p>
                  <p className="text-xs text-muted-foreground">
                    Budgeted: {currency} {term.budgeted.toLocaleString()} | Spent: {currency}{' '}
                    {term.spent.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600 dark:text-red-400">
                  +{currency} {overspendAmount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {overspendPercent.toFixed(1)}% over
                </p>
              </div>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        );
      })}
    </div>
  );
}
