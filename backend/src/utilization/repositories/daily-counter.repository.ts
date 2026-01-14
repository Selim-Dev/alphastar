import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DailyCounter, DailyCounterDocument } from '../schemas/daily-counter.schema';

export interface DailyCounterFilter {
  aircraftId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AggregationPeriod {
  period: 'day' | 'month' | 'year';
  aircraftId?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class DailyCounterRepository {
  constructor(
    @InjectModel(DailyCounter.name)
    private readonly dailyCounterModel: Model<DailyCounterDocument>,
  ) {}

  async create(data: Partial<DailyCounter>): Promise<DailyCounterDocument> {
    const counter = new this.dailyCounterModel(data);
    return counter.save();
  }

  async findById(id: string): Promise<DailyCounterDocument | null> {
    return this.dailyCounterModel.findById(id).exec();
  }

  async findByAircraftAndDate(
    aircraftId: string,
    date: Date,
  ): Promise<DailyCounterDocument | null> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.dailyCounterModel
      .findOne({
        aircraftId: new Types.ObjectId(aircraftId),
        date: { $gte: startOfDay, $lte: endOfDay },
      })
      .exec();
  }

  async findPreviousCounter(
    aircraftId: string,
    date: Date,
  ): Promise<DailyCounterDocument | null> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    return this.dailyCounterModel
      .findOne({
        aircraftId: new Types.ObjectId(aircraftId),
        date: { $lt: startOfDay },
      })
      .sort({ date: -1 })
      .exec();
  }

  async findAll(filter?: DailyCounterFilter): Promise<DailyCounterDocument[]> {
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

    return this.dailyCounterModel.find(query).sort({ date: -1 }).exec();
  }

  async update(
    id: string,
    updateData: Partial<DailyCounter>,
  ): Promise<DailyCounterDocument | null> {
    return this.dailyCounterModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<DailyCounterDocument | null> {
    return this.dailyCounterModel.findByIdAndDelete(id).exec();
  }

  async aggregateByPeriod(params: AggregationPeriod): Promise<unknown[]> {
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

    // For daily aggregation, we need to calculate deltas between consecutive days
    // Use $setWindowFields to get previous day's values and calculate delta
    // IMPORTANT: Ensure deltas are never negative (use $max with 0)
    const pipeline: unknown[] = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      { $sort: { aircraftId: 1, date: 1 } },
      {
        $setWindowFields: {
          partitionBy: '$aircraftId',
          sortBy: { date: 1 },
          output: {
            prevAirframeHours: {
              $shift: { output: '$airframeHoursTtsn', by: -1, default: null },
            },
            prevAirframeCycles: {
              $shift: { output: '$airframeCyclesTcsn', by: -1, default: null },
            },
          },
        },
      },
      {
        $addFields: {
          dailyFlightHours: {
            $cond: {
              if: { $eq: ['$prevAirframeHours', null] },
              then: 0,
              else: {
                // Ensure non-negative: max(0, current - previous)
                $max: [0, { $subtract: ['$airframeHoursTtsn', '$prevAirframeHours'] }],
              },
            },
          },
          dailyCycles: {
            $cond: {
              if: { $eq: ['$prevAirframeCycles', null] },
              then: 0,
              else: {
                // Ensure non-negative: max(0, current - previous)
                $max: [0, { $subtract: ['$airframeCyclesTcsn', '$prevAirframeCycles'] }],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: {
            period: { $dateToString: { format: dateFormat, date: '$date' } },
            aircraftId: '$aircraftId',
          },
          flightHours: { $sum: '$dailyFlightHours' },
          cycles: { $sum: '$dailyCycles' },
          recordCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          period: '$_id.period',
          aircraftId: '$_id.aircraftId',
          flightHours: { $round: ['$flightHours', 1] },
          cycles: 1,
          recordCount: 1,
        },
      },
      { $sort: { period: -1 } },
    ];

    return this.dailyCounterModel.aggregate(pipeline as Parameters<typeof this.dailyCounterModel.aggregate>[0]).exec();
  }
}
