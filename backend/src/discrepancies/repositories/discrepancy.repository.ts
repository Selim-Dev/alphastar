import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Discrepancy, DiscrepancyDocument, ResponsibleParty } from '../schemas/discrepancy.schema';

export interface DiscrepancyFilter {
  aircraftId?: string;
  ataChapter?: string;
  responsibility?: ResponsibleParty;
  startDate?: Date;
  endDate?: Date;
  corrected?: boolean;
}

export interface ATAChapterAnalyticsResult {
  ataChapter: string;
  count: number;
}

@Injectable()
export class DiscrepancyRepository {
  constructor(
    @InjectModel(Discrepancy.name)
    private readonly discrepancyModel: Model<DiscrepancyDocument>,
  ) {}

  async create(data: Partial<Discrepancy>): Promise<DiscrepancyDocument> {
    const discrepancy = new this.discrepancyModel(data);
    return discrepancy.save();
  }

  async findById(id: string): Promise<DiscrepancyDocument | null> {
    return this.discrepancyModel.findById(id).exec();
  }

  async findAll(filter?: DiscrepancyFilter): Promise<DiscrepancyDocument[]> {
    const query: Record<string, unknown> = {};

    if (filter?.aircraftId) {
      query.aircraftId = new Types.ObjectId(filter.aircraftId);
    }
    if (filter?.ataChapter) {
      query.ataChapter = filter.ataChapter;
    }
    if (filter?.responsibility) {
      query.responsibility = filter.responsibility;
    }
    if (filter?.startDate || filter?.endDate) {
      query.dateDetected = {};
      if (filter.startDate) {
        (query.dateDetected as Record<string, Date>).$gte = filter.startDate;
      }
      if (filter.endDate) {
        (query.dateDetected as Record<string, Date>).$lte = filter.endDate;
      }
    }
    if (filter?.corrected !== undefined) {
      if (filter.corrected) {
        query.dateCorrected = { $exists: true, $ne: null };
      } else {
        query.dateCorrected = { $exists: false };
      }
    }

    return this.discrepancyModel.find(query).sort({ dateDetected: -1 }).exec();
  }

  async update(
    id: string,
    updateData: Partial<Discrepancy>,
  ): Promise<DiscrepancyDocument | null> {
    return this.discrepancyModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<DiscrepancyDocument | null> {
    return this.discrepancyModel.findByIdAndDelete(id).exec();
  }

  /**
   * Aggregates discrepancies by ATA chapter
   * Requirements: 6.4
   */
  async getATAChapterAnalytics(
    aircraftId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ATAChapterAnalyticsResult[]> {
    const matchStage: Record<string, unknown> = {};

    if (aircraftId) {
      matchStage.aircraftId = new Types.ObjectId(aircraftId);
    }
    if (startDate || endDate) {
      matchStage.dateDetected = {};
      if (startDate) {
        (matchStage.dateDetected as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (matchStage.dateDetected as Record<string, Date>).$lte = endDate;
      }
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$ataChapter',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          ataChapter: '$_id',
          count: 1,
        },
      },
      { $sort: { count: -1 as const } },
    ];

    return this.discrepancyModel.aggregate(pipeline).exec();
  }

  /**
   * Gets top N ATA chapters by discrepancy count
   * Requirements: 6.4
   */
  async getTopATAChapters(
    limit: number = 10,
    aircraftId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ATAChapterAnalyticsResult[]> {
    const results = await this.getATAChapterAnalytics(aircraftId, startDate, endDate);
    return results.slice(0, limit);
  }

  /**
   * Counts discrepancies by aircraft
   */
  async countByAircraft(aircraftId: string): Promise<number> {
    return this.discrepancyModel
      .countDocuments({ aircraftId: new Types.ObjectId(aircraftId) })
      .exec();
  }

  /**
   * Counts uncorrected discrepancies
   */
  async countUncorrected(aircraftId?: string): Promise<number> {
    const query: Record<string, unknown> = {
      dateCorrected: { $exists: false },
    };

    if (aircraftId) {
      query.aircraftId = new Types.ObjectId(aircraftId);
    }

    return this.discrepancyModel.countDocuments(query).exec();
  }
}
