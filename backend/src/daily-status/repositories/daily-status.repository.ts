import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DailyStatus, DailyStatusDocument } from '../schemas/daily-status.schema';

export interface DailyStatusFilter {
  aircraftId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}

export interface AvailabilityAggregationParams {
  period: 'day' | 'month' | 'year';
  aircraftId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AvailabilityResult {
  period: string;
  aircraftId?: string;
  totalPosHours: number;
  totalFmcHours: number;
  availabilityPercentage: number;
  recordCount: number;
}

@Injectable()
export class DailyStatusRepository {
  constructor(
    @InjectModel(DailyStatus.name)
    private readonly dailyStatusModel: Model<DailyStatusDocument>,
  ) {}

  async create(data: Partial<DailyStatus>): Promise<DailyStatusDocument> {
    const status = new this.dailyStatusModel(data);
    return status.save();
  }

  async findById(id: string): Promise<DailyStatusDocument | null> {
    return this.dailyStatusModel.findById(id).exec();
  }

  async findByAircraftAndDate(
    aircraftId: string,
    date: Date,
  ): Promise<DailyStatusDocument | null> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.dailyStatusModel
      .findOne({
        aircraftId: new Types.ObjectId(aircraftId),
        date: { $gte: startOfDay, $lte: endOfDay },
      })
      .exec();
  }


  async findAll(filter?: DailyStatusFilter): Promise<DailyStatusDocument[]> {
    const query: Record<string, unknown> = {};

    if (filter?.aircraftId) {
      query.aircraftId = new Types.ObjectId(filter.aircraftId);
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

    // Build query with optional pagination for performance optimization
    // Requirements: 9.5, 9.6 - Optimize large dataset handling
    let queryBuilder = this.dailyStatusModel.find(query).sort({ date: -1 });
    
    if (filter?.skip !== undefined && filter.skip > 0) {
      queryBuilder = queryBuilder.skip(filter.skip);
    }
    
    if (filter?.limit !== undefined && filter.limit > 0) {
      queryBuilder = queryBuilder.limit(filter.limit);
    }

    return queryBuilder.exec();
  }

  async update(
    id: string,
    updateData: Partial<DailyStatus>,
  ): Promise<DailyStatusDocument | null> {
    return this.dailyStatusModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<DailyStatusDocument | null> {
    return this.dailyStatusModel.findByIdAndDelete(id).exec();
  }

  /**
   * Computes availability percentage for a date range
   * Availability = (sum of fmc_hours / sum of pos_hours) * 100
   * Requirements: 3.2, 3.5
   */
  async computeAvailability(
    aircraftId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ totalPosHours: number; totalFmcHours: number; availabilityPercentage: number }> {
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

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: null,
          totalPosHours: { $sum: '$posHours' },
          totalFmcHours: { $sum: '$fmcHours' },
        },
      },
      {
        $project: {
          _id: 0,
          totalPosHours: 1,
          totalFmcHours: 1,
          availabilityPercentage: {
            $cond: {
              if: { $eq: ['$totalPosHours', 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: ['$totalFmcHours', '$totalPosHours'] },
                  100,
                ],
              },
            },
          },
        },
      },
    ];

    const result = await this.dailyStatusModel.aggregate(pipeline).exec();
    
    if (result.length === 0) {
      return { totalPosHours: 0, totalFmcHours: 0, availabilityPercentage: 0 };
    }

    return result[0];
  }


  /**
   * Aggregates availability by day/month/year per aircraft
   * Requirements: 3.3, 3.5
   */
  async aggregateAvailabilityByPeriod(
    params: AvailabilityAggregationParams,
  ): Promise<AvailabilityResult[]> {
    const matchStage: Record<string, unknown> = {};

    if (params.aircraftId) {
      matchStage.aircraftId = new Types.ObjectId(params.aircraftId);
    }
    if (params.startDate || params.endDate) {
      matchStage.date = {};
      if (params.startDate) {
        (matchStage.date as Record<string, Date>).$gte = params.startDate;
      }
      if (params.endDate) {
        (matchStage.date as Record<string, Date>).$lte = params.endDate;
      }
    }

    let dateFormat: string;
    switch (params.period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'year':
        dateFormat = '%Y';
        break;
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: {
            period: { $dateToString: { format: dateFormat, date: '$date' } },
            aircraftId: '$aircraftId',
          },
          totalPosHours: { $sum: '$posHours' },
          totalFmcHours: { $sum: '$fmcHours' },
          recordCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          period: '$_id.period',
          aircraftId: '$_id.aircraftId',
          totalPosHours: 1,
          totalFmcHours: 1,
          recordCount: 1,
          availabilityPercentage: {
            $cond: {
              if: { $eq: ['$totalPosHours', 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: ['$totalFmcHours', '$totalPosHours'] },
                  100,
                ],
              },
            },
          },
        },
      },
      { $sort: { period: -1 as const } },
    ];

    return this.dailyStatusModel.aggregate(pipeline).exec();
  }

  /**
   * Gets fleet-wide availability for a date range
   * Requirements: 3.5
   */
  async getFleetAvailability(
    startDate?: Date,
    endDate?: Date,
  ): Promise<AvailabilityResult[]> {
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
          totalPosHours: { $sum: '$posHours' },
          totalFmcHours: { $sum: '$fmcHours' },
          recordCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          aircraftId: '$_id',
          totalPosHours: 1,
          totalFmcHours: 1,
          recordCount: 1,
          availabilityPercentage: {
            $cond: {
              if: { $eq: ['$totalPosHours', 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: ['$totalFmcHours', '$totalPosHours'] },
                  100,
                ],
              },
            },
          },
        },
      },
      { $sort: { availabilityPercentage: -1 as const } },
    ];

    return this.dailyStatusModel.aggregate(pipeline).exec();
  }
}
