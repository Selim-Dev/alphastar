/**
 * DTOs for Demo API responses
 */

export interface CollectionCounts {
  aircraft: number;
  dailyStatus: number;
  dailyCounters: number;
  aogEvents: number;
  maintenanceTasks: number;
  workOrders: number;
  discrepancies: number;
  budgetPlans: number;
  actualSpend: number;
}

export class DemoSeedResponseDto {
  success: boolean;
  message: string;
  counts: CollectionCounts;
  duration: number; // milliseconds
}

export class DemoResetResponseDto {
  success: boolean;
  message: string;
  deletedCounts: CollectionCounts;
}

export class DemoStatusResponseDto {
  hasDemoData: boolean;
  counts: CollectionCounts;
}
