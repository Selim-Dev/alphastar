// Budget Projects Types

export interface BudgetProject {
  _id: string;
  name: string;
  templateType: string;
  dateRange: {
    start: string;
    end: string;
  };
  currency: string;
  aircraftScope: {
    type: 'individual' | 'type' | 'group';
    aircraftIds?: string[];
    aircraftTypes?: string[];
    fleetGroups?: string[];
  };
  status: 'draft' | 'active' | 'closed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetPlanRow {
  _id: string;
  projectId: string;
  termId: string;
  termName: string;
  termCategory: string;
  aircraftId?: string;
  aircraftType?: string;
  plannedAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetActual {
  _id: string;
  projectId: string;
  termId: string;
  period: string;
  aircraftId?: string;
  aircraftType?: string;
  amount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetTableRow {
  termId: string;
  termName: string;
  termCategory: string;
  aircraftId?: string;
  aircraftType?: string;
  plannedAmount: number;
  actuals: Record<string, number>; // { "2025-01": 5000, "2025-02": 4500, ... }
  totalSpent: number;
  remaining: number;
  variance: number;
  variancePercent: number;
}

export interface BudgetTableData {
  projectId: string;
  periods: string[];
  rows: BudgetTableRow[];
  columnTotals: Record<string, number>;
  grandTotal: {
    budgeted: number;
    spent: number;
    remaining: number;
  };
}

export interface BudgetKPIs {
  totalBudgeted: number;
  totalSpent: number;
  remainingBudget: number;
  budgetUtilization: number;
  burnRate: number;
  averageMonthlySpend: number;
  forecastMonthsRemaining: number;
  forecastDepletionDate: string | null;
}

export interface MonthlySpendData {
  period: string;
  termId: string;
  termName: string;
  amount: number;
}

export interface CumulativeData {
  period: string;
  cumulativeSpent: number;
  cumulativeBudget: number;
}

export interface DistributionData {
  category: string;
  amount: number;
  percentage: number;
}

export interface AircraftTypeData {
  aircraftType: string;
  budgeted: number;
  spent: number;
  variance: number;
}

export interface OverspendTerm {
  termId: string;
  termName: string;
  budgeted: number;
  spent: number;
  variance: number;
  variancePercent: number;
}

export interface HeatmapData {
  terms: string[];
  periods: string[];
  values: number[][];
}

export interface BudgetAuditEntry {
  _id: string;
  projectId: string;
  entityType: 'project' | 'planRow' | 'actual';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  fieldChanged?: string;
  oldValue?: any;
  newValue?: any;
  userId: string;
  timestamp: string;
}

export interface BudgetAuditSummary {
  totalChanges: number;
  changesByUser: Array<{
    userId: string;
    userName: string;
    count: number;
  }>;
  changesByType: Array<{
    entityType: string;
    count: number;
  }>;
}

// Request DTOs
export interface CreateBudgetProjectDto {
  name: string;
  templateType: string;
  dateRange: {
    start: string;
    end: string;
  };
  currency: string;
  aircraftScope: {
    type: 'individual' | 'type' | 'group';
    aircraftIds?: string[];
    aircraftTypes?: string[];
    fleetGroups?: string[];
  };
  status?: 'draft' | 'active' | 'closed';
}

export interface UpdateBudgetProjectDto {
  name?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  currency?: string;
  aircraftScope?: {
    type: 'individual' | 'type' | 'group';
    aircraftIds?: string[];
    aircraftTypes?: string[];
    fleetGroups?: string[];
  };
  status?: 'draft' | 'active' | 'closed';
}

export interface UpdatePlanRowDto {
  plannedAmount: number;
}

export interface UpdateActualDto {
  termId: string;
  amount: number;
  aircraftId?: string;
  aircraftType?: string;
  notes?: string;
}

export interface BudgetProjectFilters {
  year?: number;
  status?: 'draft' | 'active' | 'closed';
  templateType?: string;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  aircraftType?: string;
  termSearch?: string;
}

export interface AuditLogFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: 'create' | 'update' | 'delete';
  entityType?: 'project' | 'planRow' | 'actual';
}
