import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MaintenanceTask, MaintenanceTaskDocument, Shift } from '../schemas/maintenance-task.schema';

export interface MaintenanceTaskFilter {
  aircraftId?: string;
  startDate?: Date;
  endDate?: Date;
  shift?: Shift;
  taskType?: string;
}

export interface MaintenanceSummaryResult {
  _id: {
    date?: string;
    shift?: Shift;
    aircraftId?: string;
    taskType?: string;
  };
  totalTasks: number;
  totalManHours: number;
  totalCost: number;
}

export interface AircraftCostRankingResult {
  aircraftId: string;
  totalCost: number;
  totalManHours: number;
  taskCount: number;
}

@Injectable()
export class MaintenanceTaskRepository {
  constructor(
    @InjectModel(MaintenanceTask.name)
    private readonly maintenanceTaskModel: Model<MaintenanceTaskDocument>,
  ) {}

  async create(data: Partial<MaintenanceTask>): Promise<MaintenanceTaskDocument> {
    const task = new this.maintenanceTaskModel(data);
    return task.save();
  }

  async findById(id: string): Promise<MaintenanceTaskDocument | null> {
    return this.maintenanceTaskModel.findById(id).exec();
  }


  async findAll(filter?: MaintenanceTaskFilter): Promise<MaintenanceTaskDocument[]> {
    const query: Record<string, unknown> = {};

    if (filter?.aircraftId) {
      query.aircraftId = new Types.ObjectId(filter.aircraftId);
    }
    if (filter?.shift) {
      query.shift = filter.shift;
    }
    if (filter?.taskType) {
      query.taskType = filter.taskType;
    }
    if (filter?.startDate || filter?.endDate) {
      query.date = {};
      if (filter.startDate) {
        (query.date as Record<string, Date>).$gte = filter.startDate;
      }
      if (filter.endDate) {
        (query.date as Record<string, Date>).$lte = filter.endDate;
      }
    }

    return this.maintenanceTaskModel.find(query).sort({ date: -1 }).exec();
  }

  async update(
    id: string,
    updateData: Partial<MaintenanceTask>,
  ): Promise<MaintenanceTaskDocument | null> {
    return this.maintenanceTaskModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<MaintenanceTaskDocument | null> {
    return this.maintenanceTaskModel.findByIdAndDelete(id).exec();
  }

  /**
   * Aggregates maintenance tasks by date, shift, aircraft, and/or taskType
   * Requirements: 5.2
   */
  async aggregateSummary(
    groupBy: ('date' | 'shift' | 'aircraftId' | 'taskType')[],
    startDate?: Date,
    endDate?: Date,
    aircraftId?: string,
  ): Promise<MaintenanceSummaryResult[]> {
    const matchStage: Record<string, unknown> = {};

    if (aircraftId) {
      matchStage.aircraftId = new Types.ObjectId(aircraftId);
    }
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) {
        (matchStage.date as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (matchStage.date as Record<string, Date>).$lte = endDate;
      }
    }

    // Build group _id based on groupBy fields
    const groupId: Record<string, unknown> = {};
    if (groupBy.includes('date')) {
      groupId.date = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
    }
    if (groupBy.includes('shift')) {
      groupId.shift = '$shift';
    }
    if (groupBy.includes('aircraftId')) {
      groupId.aircraftId = '$aircraftId';
    }
    if (groupBy.includes('taskType')) {
      groupId.taskType = '$taskType';
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: Object.keys(groupId).length > 0 ? groupId : null,
          totalTasks: { $sum: 1 },
          totalManHours: { $sum: '$manHours' },
          totalCost: { $sum: { $ifNull: ['$cost', 0] } },
        },
      },
      {
        $project: {
          _id: 1,
          totalTasks: 1,
          totalManHours: { $round: ['$totalManHours', 2] },
          totalCost: { $round: ['$totalCost', 2] },
        },
      },
      { $sort: { '_id.date': -1 as const, totalCost: -1 as const } },
    ];

    return this.maintenanceTaskModel.aggregate(pipeline).exec();
  }

  /**
   * Ranks aircraft by total maintenance cost
   * Requirements: 5.5
   */
  async rankAircraftByCost(
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<AircraftCostRankingResult[]> {
    const matchStage: Record<string, unknown> = {};

    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) {
        (matchStage.date as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (matchStage.date as Record<string, Date>).$lte = endDate;
      }
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$aircraftId',
          totalCost: { $sum: { $ifNull: ['$cost', 0] } },
          totalManHours: { $sum: '$manHours' },
          taskCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          aircraftId: { $toString: '$_id' },
          totalCost: { $round: ['$totalCost', 2] },
          totalManHours: { $round: ['$totalManHours', 2] },
          taskCount: 1,
        },
      },
      { $sort: { totalCost: -1 as const } },
      ...(limit ? [{ $limit: limit }] : []),
    ];

    return this.maintenanceTaskModel.aggregate(pipeline).exec();
  }

  /**
   * Gets tasks by work order reference
   * Requirements: 5.3
   */
  async findByWorkOrder(workOrderId: string): Promise<MaintenanceTaskDocument[]> {
    return this.maintenanceTaskModel
      .find({ workOrderRef: new Types.ObjectId(workOrderId) })
      .sort({ date: -1 })
      .exec();
  }

  /**
   * Gets distinct task types
   */
  async getDistinctTaskTypes(): Promise<string[]> {
    return this.maintenanceTaskModel.distinct('taskType').exec();
  }
}
