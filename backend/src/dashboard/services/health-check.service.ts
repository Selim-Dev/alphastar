import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Aircraft } from '../../aircraft/schemas/aircraft.schema';
import { DailyStatus } from '../../daily-status/schemas/daily-status.schema';
import { DailyCounter } from '../../utilization/schemas/daily-counter.schema';
import { AOGEvent } from '../../aog-events/schemas/aog-event.schema';
import { MaintenanceTask } from '../../maintenance-tasks/schemas/maintenance-task.schema';
import { WorkOrder } from '../../work-orders/schemas/work-order.schema';
import { Discrepancy } from '../../discrepancies/schemas/discrepancy.schema';
import { BudgetPlan } from '../../budget/schemas/budget-plan.schema';
import { ActualSpend } from '../../budget/schemas/actual-spend.schema';
import { HealthCheckResponseDto, CollectionCountDto } from '../dto/health-check.dto';

@Injectable()
export class HealthCheckService {
  constructor(
    @InjectModel(Aircraft.name) private readonly aircraftModel: Model<Aircraft>,
    @InjectModel(DailyStatus.name) private readonly dailyStatusModel: Model<DailyStatus>,
    @InjectModel(DailyCounter.name) private readonly dailyCounterModel: Model<DailyCounter>,
    @InjectModel(AOGEvent.name) private readonly aogEventModel: Model<AOGEvent>,
    @InjectModel(MaintenanceTask.name) private readonly maintenanceTaskModel: Model<MaintenanceTask>,
    @InjectModel(WorkOrder.name) private readonly workOrderModel: Model<WorkOrder>,
    @InjectModel(Discrepancy.name) private readonly discrepancyModel: Model<Discrepancy>,
    @InjectModel(BudgetPlan.name) private readonly budgetPlanModel: Model<BudgetPlan>,
    @InjectModel(ActualSpend.name) private readonly actualSpendModel: Model<ActualSpend>,
  ) {}

  /**
   * Get counts for all collections
   * Requirements: 4.1, 4.2
   */
  async getHealthCheck(): Promise<HealthCheckResponseDto> {
    try {
      const [
        aircraftCount,
        dailyStatusCount,
        utilizationCount,
        aogEventsCount,
        maintenanceTasksCount,
        workOrdersCount,
        discrepanciesCount,
        budgetPlansCount,
        actualSpendCount,
      ] = await Promise.all([
        this.aircraftModel.countDocuments().exec(),
        this.dailyStatusModel.countDocuments().exec(),
        this.dailyCounterModel.countDocuments().exec(),
        this.aogEventModel.countDocuments().exec(),
        this.maintenanceTaskModel.countDocuments().exec(),
        this.workOrderModel.countDocuments().exec(),
        this.discrepancyModel.countDocuments().exec(),
        this.budgetPlanModel.countDocuments().exec(),
        this.actualSpendModel.countDocuments().exec(),
      ]);

      const collections: CollectionCountDto[] = [
        this.createCollectionCount('Aircraft', aircraftCount),
        this.createCollectionCount('Daily Status', dailyStatusCount),
        this.createCollectionCount('Utilization', utilizationCount),
        this.createCollectionCount('AOG Events', aogEventsCount),
        this.createCollectionCount('Maintenance Tasks', maintenanceTasksCount),
        this.createCollectionCount('Work Orders', workOrdersCount),
        this.createCollectionCount('Discrepancies', discrepanciesCount),
        this.createCollectionCount('Budget Plans', budgetPlansCount),
        this.createCollectionCount('Actual Spend', actualSpendCount),
      ];

      return {
        collections,
        lastFetch: new Date(),
        apiStatus: 'connected',
      };
    } catch {
      return {
        collections: [],
        lastFetch: new Date(),
        apiStatus: 'error',
      };
    }
  }

  private createCollectionCount(name: string, count: number): CollectionCountDto {
    let status: 'ok' | 'warning' | 'empty';
    if (count === 0) {
      status = 'empty';
    } else if (count < 10) {
      status = 'warning';
    } else {
      status = 'ok';
    }

    return { name, count, status };
  }
}
