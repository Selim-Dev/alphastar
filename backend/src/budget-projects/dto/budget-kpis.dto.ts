export class BudgetKPIsDto {
  totalBudgeted: number;
  totalSpent: number;
  remainingBudget: number;
  budgetUtilization: number; // Percentage
  burnRate: number; // Average monthly spend
  averageMonthlySpend: number;
  forecastMonthsRemaining: number;
  forecastDepletionDate: Date | null;
}

export class MonthlySpendByTermDto {
  period: string; // YYYY-MM
  termId: string;
  termName: string;
  termCategory: string;
  amount: number;
}

export class CumulativeSpendDataDto {
  period: string; // YYYY-MM
  cumulativeSpent: number;
  cumulativeBudgeted: number;
}

export class SpendDistributionDto {
  category: string;
  amount: number;
  percentage: number;
}

export class BudgetedVsSpentByAircraftDto {
  aircraftType: string;
  budgeted: number;
  spent: number;
  variance: number;
}

export class OverspendTermDto {
  termId: string;
  termName: string;
  termCategory: string;
  budgeted: number;
  spent: number;
  variance: number;
  variancePercent: number;
}

export class HeatmapDataDto {
  termId: string;
  termName: string;
  monthlyData: Array<{
    period: string;
    amount: number;
  }>;
}
