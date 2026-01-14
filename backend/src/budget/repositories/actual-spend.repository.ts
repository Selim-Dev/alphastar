import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActualSpend, ActualSpendDocument } from '../schemas/actual-spend.schema';

export interface ActualSpendFilter {
  period?: string;
  startPeriod?: string;
  endPeriod?: string;
  clauseId?: number;
  aircraftGroup?: string;
  aircraftId?: string;
}

export interface SpendByClauseResult {
  clauseId: number;
  totalAmount: number;
}

export interface SpendByPeriodResult {
  period: string;
  totalAmount: number;
}

export interface SpendByGroupResult {
  aircraftGroup: string;
  totalAmount: number;
}

@Injectable()
export class ActualSpendRepository {
  constructor(
    @InjectModel(ActualSpend.name)
    private readonly actualSpendModel: Model<ActualSpendDocument>,
  ) {}

  async create(data: Partial<ActualSpend>): Promise<ActualSpendDocument> {
    const spend = new this.actualSpendModel(data);
    return spend.save();
  }

  async createMany(data: Partial<ActualSpend>[]): Promise<ActualSpendDocument[]> {
    return this.actualSpendModel.insertMany(data) as Promise<ActualSpendDocument[]>;
  }

  async findById(id: string): Promise<ActualSpendDocument | null> {
    return this.actualSpendModel.findById(id).exec();
  }

  async findAll(filter?: ActualSpendFilter): Promise<ActualSpendDocument[]> {
    const query: Record<string, unknown> = {};

    if (filter?.period) {
      query.period = filter.period;
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
    if (filter?.clauseId) {
      query.clauseId = filter.clauseId;
    }
    if (filter?.aircraftGroup) {
      query.aircraftGroup = filter.aircraftGroup;
    }
    if (filter?.aircraftId) {
      query.aircraftId = new Types.ObjectId(filter.aircraftId);
    }

    return this.actualSpendModel.find(query).sort({ period: -1 }).exec();
  }

  async update(
    id: string,
    updateData: Partial<ActualSpend>,
  ): Promise<ActualSpendDocument | null> {
    return this.actualSpendModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<ActualSpendDocument | null> {
    return this.actualSpendModel.findByIdAndDelete(id).exec();
  }

  /**
   * Gets total actual spend by clause for a fiscal year
   */
  async getTotalByClause(
    fiscalYear: number,
    aircraftGroup?: string,
  ): Promise<SpendByClauseResult[]> {
    const startPeriod = `${fiscalYear}-01`;
    const endPeriod = `${fiscalYear}-12`;

    const matchStage: Record<string, unknown> = {
      period: { $gte: startPeriod, $lte: endPeriod },
    };
    if (aircraftGroup) {
      matchStage.aircraftGroup = aircraftGroup;
    }

    return this.actualSpendModel.aggregate([
      { $match: matchStage },
      { $group: { _id: '$clauseId', totalAmount: { $sum: '$amount' } } },
      { $project: { _id: 0, clauseId: '$_id', totalAmount: { $round: ['$totalAmount', 2] } } },
      { $sort: { clauseId: 1 } },
    ]).exec();
  }

  /**
   * Gets total actual spend by period
   */
  async getTotalByPeriod(
    startPeriod?: string,
    endPeriod?: string,
    aircraftGroup?: string,
  ): Promise<SpendByPeriodResult[]> {
    const matchStage: Record<string, unknown> = {};

    if (startPeriod || endPeriod) {
      matchStage.period = {};
      if (startPeriod) {
        (matchStage.period as Record<string, string>).$gte = startPeriod;
      }
      if (endPeriod) {
        (matchStage.period as Record<string, string>).$lte = endPeriod;
      }
    }
    if (aircraftGroup) {
      matchStage.aircraftGroup = aircraftGroup;
    }

    return this.actualSpendModel.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      { $group: { _id: '$period', totalAmount: { $sum: '$amount' } } },
      { $project: { _id: 0, period: '$_id', totalAmount: { $round: ['$totalAmount', 2] } } },
      { $sort: { period: 1 } },
    ]).exec();
  }

  /**
   * Gets total actual spend by aircraft group
   */
  async getTotalByAircraftGroup(
    fiscalYear?: number,
    startPeriod?: string,
    endPeriod?: string,
  ): Promise<SpendByGroupResult[]> {
    const matchStage: Record<string, unknown> = {};

    if (fiscalYear) {
      matchStage.period = {
        $gte: `${fiscalYear}-01`,
        $lte: `${fiscalYear}-12`,
      };
    } else if (startPeriod || endPeriod) {
      matchStage.period = {};
      if (startPeriod) {
        (matchStage.period as Record<string, string>).$gte = startPeriod;
      }
      if (endPeriod) {
        (matchStage.period as Record<string, string>).$lte = endPeriod;
      }
    }

    return this.actualSpendModel.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      { $match: { aircraftGroup: { $exists: true, $ne: null } } },
      { $group: { _id: '$aircraftGroup', totalAmount: { $sum: '$amount' } } },
      { $project: { _id: 0, aircraftGroup: '$_id', totalAmount: { $round: ['$totalAmount', 2] } } },
      { $sort: { totalAmount: -1 } },
    ]).exec();
  }

  /**
   * Gets total spend for a fiscal year
   */
  async getTotalSpendForFiscalYear(
    fiscalYear: number,
    aircraftGroup?: string,
  ): Promise<number> {
    const startPeriod = `${fiscalYear}-01`;
    const endPeriod = `${fiscalYear}-12`;

    const matchStage: Record<string, unknown> = {
      period: { $gte: startPeriod, $lte: endPeriod },
    };
    if (aircraftGroup) {
      matchStage.aircraftGroup = aircraftGroup;
    }

    const result = await this.actualSpendModel.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).exec();

    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Gets count of distinct periods with spend data
   */
  async getDistinctPeriodCount(
    fiscalYear: number,
    aircraftGroup?: string,
  ): Promise<number> {
    const startPeriod = `${fiscalYear}-01`;
    const endPeriod = `${fiscalYear}-12`;

    const matchStage: Record<string, unknown> = {
      period: { $gte: startPeriod, $lte: endPeriod },
    };
    if (aircraftGroup) {
      matchStage.aircraftGroup = aircraftGroup;
    }

    const result = await this.actualSpendModel.aggregate([
      { $match: matchStage },
      { $group: { _id: '$period' } },
      { $count: 'count' },
    ]).exec();

    return result.length > 0 ? result[0].count : 0;
  }
}
