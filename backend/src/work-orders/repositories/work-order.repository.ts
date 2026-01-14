import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkOrder, WorkOrderDocument, WorkOrderStatus } from '../schemas/work-order.schema';

export interface WorkOrderFilter {
  aircraftId?: string;
  status?: WorkOrderStatus;
  startDate?: Date;
  endDate?: Date;
  overdue?: boolean;
}

export interface StatusDistributionResult {
  status: WorkOrderStatus;
  count: number;
}

export interface TurnaroundResult {
  averageTurnaroundDays: number;
  minTurnaroundDays: number;
  maxTurnaroundDays: number;
  totalClosed: number;
}

@Injectable()
export class WorkOrderRepository {
  constructor(
    @InjectModel(WorkOrder.name)
    private readonly workOrderModel: Model<WorkOrderDocument>,
  ) {}

  async create(data: Partial<WorkOrder>): Promise<WorkOrderDocument> {
    const workOrder = new this.workOrderModel(data);
    return workOrder.save();
  }

  async findById(id: string): Promise<WorkOrderDocument | null> {
    return this.workOrderModel.findById(id).exec();
  }

  async findByWoNumber(woNumber: string): Promise<WorkOrderDocument | null> {
    return this.workOrderModel.findOne({ woNumber }).exec();
  }

  async findAll(filter?: WorkOrderFilter): Promise<WorkOrderDocument[]> {
    const query: Record<string, unknown> = {};

    if (filter?.aircraftId) {
      query.aircraftId = new Types.ObjectId(filter.aircraftId);
    }
    if (filter?.status) {
      query.status = filter.status;
    }
    if (filter?.startDate || filter?.endDate) {
      query.dateIn = {};
      if (filter.startDate) {
        (query.dateIn as Record<string, Date>).$gte = filter.startDate;
      }
      if (filter.endDate) {
        (query.dateIn as Record<string, Date>).$lte = filter.endDate;
      }
    }
    if (filter?.overdue) {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: WorkOrderStatus.Closed };
    }

    return this.workOrderModel.find(query).sort({ dateIn: -1 }).exec();
  }


  async update(
    id: string,
    updateData: Partial<WorkOrder>,
  ): Promise<WorkOrderDocument | null> {
    return this.workOrderModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<WorkOrderDocument | null> {
    return this.workOrderModel.findByIdAndDelete(id).exec();
  }

  /**
   * Gets work orders that are overdue (due_date passed and status not Closed)
   * Requirements: 6.6
   */
  async findOverdueWorkOrders(aircraftId?: string): Promise<WorkOrderDocument[]> {
    const query: Record<string, unknown> = {
      dueDate: { $lt: new Date() },
      status: { $ne: WorkOrderStatus.Closed },
    };

    if (aircraftId) {
      query.aircraftId = new Types.ObjectId(aircraftId);
    }

    return this.workOrderModel.find(query).sort({ dueDate: 1 }).exec();
  }

  /**
   * Gets status distribution counts
   * Requirements: 6.5
   */
  async getStatusDistribution(
    aircraftId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StatusDistributionResult[]> {
    const matchStage: Record<string, unknown> = {};

    if (aircraftId) {
      matchStage.aircraftId = new Types.ObjectId(aircraftId);
    }
    if (startDate || endDate) {
      matchStage.dateIn = {};
      if (startDate) {
        (matchStage.dateIn as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (matchStage.dateIn as Record<string, Date>).$lte = endDate;
      }
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },
      { $sort: { status: 1 as const } },
    ];

    return this.workOrderModel.aggregate(pipeline).exec();
  }

  /**
   * Computes turnaround time statistics for closed work orders
   * Requirements: 6.2
   */
  async getTurnaroundStats(
    aircraftId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TurnaroundResult | null> {
    const matchStage: Record<string, unknown> = {
      status: WorkOrderStatus.Closed,
      dateOut: { $exists: true, $ne: null },
    };

    if (aircraftId) {
      matchStage.aircraftId = new Types.ObjectId(aircraftId);
    }
    if (startDate || endDate) {
      matchStage.dateIn = {};
      if (startDate) {
        (matchStage.dateIn as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (matchStage.dateIn as Record<string, Date>).$lte = endDate;
      }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $project: {
          turnaroundDays: {
            $divide: [
              { $subtract: ['$dateOut', '$dateIn'] },
              1000 * 60 * 60 * 24, // Convert ms to days
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          averageTurnaroundDays: { $avg: '$turnaroundDays' },
          minTurnaroundDays: { $min: '$turnaroundDays' },
          maxTurnaroundDays: { $max: '$turnaroundDays' },
          totalClosed: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          averageTurnaroundDays: { $round: ['$averageTurnaroundDays', 2] },
          minTurnaroundDays: { $round: ['$minTurnaroundDays', 2] },
          maxTurnaroundDays: { $round: ['$maxTurnaroundDays', 2] },
          totalClosed: 1,
        },
      },
    ];

    const results = await this.workOrderModel.aggregate(pipeline).exec();
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Counts overdue work orders
   */
  async countOverdueWorkOrders(aircraftId?: string): Promise<number> {
    const query: Record<string, unknown> = {
      dueDate: { $lt: new Date() },
      status: { $ne: WorkOrderStatus.Closed },
    };

    if (aircraftId) {
      query.aircraftId = new Types.ObjectId(aircraftId);
    }

    return this.workOrderModel.countDocuments(query).exec();
  }
}
