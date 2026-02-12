import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BudgetActual, BudgetActualDocument } from '../schemas/budget-actual.schema';

@Injectable()
export class BudgetActualRepository {
  constructor(
    @InjectModel(BudgetActual.name)
    private readonly budgetActualModel: Model<BudgetActualDocument>,
  ) {}

  async create(actualData: Partial<BudgetActual>): Promise<BudgetActualDocument> {
    const actual = new this.budgetActualModel(actualData);
    return actual.save();
  }

  async findById(id: string): Promise<BudgetActualDocument | null> {
    return this.budgetActualModel.findById(id).exec();
  }

  async findByProjectId(projectId: string): Promise<BudgetActualDocument[]> {
    return this.budgetActualModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ period: 1 })
      .exec();
  }

  async findByProjectAndPeriod(
    projectId: string,
    period: string,
  ): Promise<BudgetActualDocument[]> {
    return this.budgetActualModel
      .find({
        projectId: new Types.ObjectId(projectId),
        period,
      })
      .exec();
  }

  async findByProjectTermAndPeriod(
    projectId: string,
    termId: string,
    period: string,
    aircraftId?: string,
  ): Promise<BudgetActualDocument | null> {
    const query: any = {
      projectId: new Types.ObjectId(projectId),
      termId,
      period,
    };

    if (aircraftId) {
      query.aircraftId = new Types.ObjectId(aircraftId);
    } else {
      query.aircraftId = { $exists: false };
    }

    return this.budgetActualModel.findOne(query).exec();
  }

  async update(
    id: string,
    updateData: Partial<BudgetActual>,
  ): Promise<BudgetActualDocument | null> {
    return this.budgetActualModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async upsert(
    projectId: string,
    termId: string,
    period: string,
    amount: number,
    userId: string,
    aircraftId?: string,
    aircraftType?: string,
    notes?: string,
  ): Promise<BudgetActualDocument> {
    const query: any = {
      projectId: new Types.ObjectId(projectId),
      termId,
      period,
    };

    if (aircraftId) {
      query.aircraftId = new Types.ObjectId(aircraftId);
    } else {
      query.aircraftId = { $exists: false };
    }

    const updateData: any = {
      amount,
      createdBy: new Types.ObjectId(userId),
    };

    if (aircraftType) {
      updateData.aircraftType = aircraftType;
    }

    if (notes) {
      updateData.notes = notes;
    }

    return this.budgetActualModel
      .findOneAndUpdate(query, updateData, { upsert: true, new: true })
      .exec() as Promise<BudgetActualDocument>;
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await this.budgetActualModel
      .deleteMany({ projectId: new Types.ObjectId(projectId) })
      .exec();
  }

  async getTotalSpentByProject(projectId: string): Promise<number> {
    const result = await this.budgetActualModel
      .aggregate([
        { $match: { projectId: new Types.ObjectId(projectId) } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .exec();

    return result.length > 0 ? result[0].total : 0;
  }

  async getDistinctPeriodsByProject(projectId: string): Promise<string[]> {
    return this.budgetActualModel
      .distinct('period', { projectId: new Types.ObjectId(projectId) })
      .exec();
  }

  async getActualsByTermAndPeriod(
    projectId: string,
  ): Promise<Map<string, Map<string, number>>> {
    const actuals = await this.findByProjectId(projectId);
    const map = new Map<string, Map<string, number>>();

    for (const actual of actuals) {
      const termKey = actual.aircraftId
        ? `${actual.termId}_${actual.aircraftId}`
        : actual.termId;

      if (!map.has(termKey)) {
        map.set(termKey, new Map<string, number>());
      }

      const periodMap = map.get(termKey)!;
      const currentAmount = periodMap.get(actual.period) || 0;
      periodMap.set(actual.period, currentAmount + actual.amount);
    }

    return map;
  }
}
