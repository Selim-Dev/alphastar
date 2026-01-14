import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WorkOrderSummary,
  WorkOrderSummaryDocument,
} from '../schemas/work-order-summary.schema';

export interface WorkOrderSummaryFilter {
  aircraftId?: string;
  aircraftIds?: string[];
  startPeriod?: string;
  endPeriod?: string;
}

export interface TrendResult {
  period: string;
  totalWorkOrderCount: number;
  totalCost: number;
  aircraftCount: number;
}

/**
 * Repository for WorkOrderSummary database operations
 * Requirements: 11.1, 11.3, 11.4
 */
@Injectable()
export class WorkOrderSummaryRepository {
  constructor(
    @InjectModel(WorkOrderSummary.name)
    private readonly workOrderSummaryModel: Model<WorkOrderSummaryDocument>,
  ) {}

  /**
   * Creates a new work order summary
   */
  async create(data: Partial<WorkOrderSummary>): Promise<WorkOrderSummaryDocument> {
    const summary = new this.workOrderSummaryModel(data);
    return summary.save();
  }

  /**
   * Finds a work order summary by ID
   */
  async findById(id: string): Promise<WorkOrderSummaryDocument | null> {
    return this.workOrderSummaryModel.findById(id).exec();
  }

  /**
   * Finds a work order summary by aircraft and period
   * Requirements: 11.3
   */
  async findByAircraftAndPeriod(
    aircraftId: string,
    period: string,
  ): Promise<WorkOrderSummaryDocument | null> {
    return this.workOrderSummaryModel
      .findOne({
        aircraftId: new Types.ObjectId(aircraftId),
        period,
      })
      .exec();
  }

  /**
   * Finds all work order summaries with optional filtering
   * Requirements: 11.4
   */
  async findAll(filter?: WorkOrderSummaryFilter): Promise<WorkOrderSummaryDocument[]> {
    const query: Record<string, unknown> = {};

    if (filter?.aircraftId) {
      query.aircraftId = new Types.ObjectId(filter.aircraftId);
    }

    if (filter?.aircraftIds && filter.aircraftIds.length > 0) {
      query.aircraftId = {
        $in: filter.aircraftIds.map((id) => new Types.ObjectId(id)),
      };
    }

    if (filter?.startPeriod || filter?.endPeriod) {
      query.period = {};
      if (filter.startPeriod) {
        (query.period as Record<string, string>).$gte = filter.startPeriod;
      }
      if (filter.endPeriod) {
        (query.period as Record<string, string>).$lte = filter.endPeriod;
      }
    }

    return this.workOrderSummaryModel
      .find(query)
      .sort({ period: -1, aircraftId: 1 })
      .exec();
  }

  /**
   * Updates a work order summary by ID
   */
  async update(
    id: string,
    updateData: Partial<WorkOrderSummary>,
  ): Promise<WorkOrderSummaryDocument | null> {
    return this.workOrderSummaryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  /**
   * Upserts a work order summary by (aircraftId, period)
   * Requirements: 11.3, 13.2
   */
  async upsert(
    aircraftId: string,
    period: string,
    data: Partial<WorkOrderSummary>,
  ): Promise<WorkOrderSummaryDocument> {
    const filter = {
      aircraftId: new Types.ObjectId(aircraftId),
      period,
    };

    const update = {
      $set: {
        ...data,
        aircraftId: new Types.ObjectId(aircraftId),
        period,
      },
    };

    const result = await this.workOrderSummaryModel
      .findOneAndUpdate(filter, update, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      })
      .exec();

    return result!;
  }

  /**
   * Deletes a work order summary by ID
   */
  async delete(id: string): Promise<WorkOrderSummaryDocument | null> {
    return this.workOrderSummaryModel.findByIdAndDelete(id).exec();
  }

  /**
   * Gets trend data aggregated by period
   * Requirements: 14.2
   */
  async getTrends(filter?: WorkOrderSummaryFilter): Promise<TrendResult[]> {
    const matchStage: Record<string, unknown> = {};

    if (filter?.aircraftId) {
      matchStage.aircraftId = new Types.ObjectId(filter.aircraftId);
    }

    if (filter?.aircraftIds && filter.aircraftIds.length > 0) {
      matchStage.aircraftId = {
        $in: filter.aircraftIds.map((id) => new Types.ObjectId(id)),
      };
    }

    if (filter?.startPeriod || filter?.endPeriod) {
      matchStage.period = {};
      if (filter.startPeriod) {
        (matchStage.period as Record<string, string>).$gte = filter.startPeriod;
      }
      if (filter.endPeriod) {
        (matchStage.period as Record<string, string>).$lte = filter.endPeriod;
      }
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$period',
          totalWorkOrderCount: { $sum: '$workOrderCount' },
          totalCost: { $sum: { $ifNull: ['$totalCost', 0] } },
          aircraftCount: { $addToSet: '$aircraftId' },
        },
      },
      {
        $project: {
          _id: 0,
          period: '$_id',
          totalWorkOrderCount: 1,
          totalCost: { $round: ['$totalCost', 2] },
          aircraftCount: { $size: '$aircraftCount' },
        },
      },
      { $sort: { period: 1 as const } },
    ];

    return this.workOrderSummaryModel.aggregate(pipeline).exec();
  }

  /**
   * Gets total work order count for a period range
   */
  async getTotalCount(filter?: WorkOrderSummaryFilter): Promise<number> {
    const matchStage: Record<string, unknown> = {};

    if (filter?.aircraftId) {
      matchStage.aircraftId = new Types.ObjectId(filter.aircraftId);
    }

    if (filter?.aircraftIds && filter.aircraftIds.length > 0) {
      matchStage.aircraftId = {
        $in: filter.aircraftIds.map((id) => new Types.ObjectId(id)),
      };
    }

    if (filter?.startPeriod || filter?.endPeriod) {
      matchStage.period = {};
      if (filter.startPeriod) {
        (matchStage.period as Record<string, string>).$gte = filter.startPeriod;
      }
      if (filter.endPeriod) {
        (matchStage.period as Record<string, string>).$lte = filter.endPeriod;
      }
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: null,
          total: { $sum: '$workOrderCount' },
        },
      },
    ];

    const result = await this.workOrderSummaryModel.aggregate(pipeline).exec();
    return result.length > 0 ? result[0].total : 0;
  }
}
