import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BudgetPlanRow, BudgetPlanRowDocument } from '../schemas/budget-plan-row.schema';

@Injectable()
export class BudgetPlanRowRepository {
  constructor(
    @InjectModel(BudgetPlanRow.name)
    private readonly budgetPlanRowModel: Model<BudgetPlanRowDocument>,
  ) {}

  async create(rowData: Partial<BudgetPlanRow>): Promise<BudgetPlanRowDocument> {
    const row = new this.budgetPlanRowModel(rowData);
    return row.save();
  }

  async createMany(rowsData: Partial<BudgetPlanRow>[]): Promise<BudgetPlanRowDocument[]> {
    const result = await this.budgetPlanRowModel.insertMany(rowsData);
    return result as BudgetPlanRowDocument[];
  }

  async findById(id: string): Promise<BudgetPlanRowDocument | null> {
    return this.budgetPlanRowModel.findById(id).exec();
  }

  async findByProjectId(projectId: string): Promise<BudgetPlanRowDocument[]> {
    return this.budgetPlanRowModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ termCategory: 1, sortOrder: 1 })
      .exec();
  }

  async findByProjectAndTerm(
    projectId: string,
    termId: string,
    aircraftId?: string,
  ): Promise<BudgetPlanRowDocument | null> {
    const query: any = {
      projectId: new Types.ObjectId(projectId),
      termId,
    };

    if (aircraftId) {
      query.aircraftId = new Types.ObjectId(aircraftId);
    } else {
      query.aircraftId = { $exists: false };
    }

    return this.budgetPlanRowModel.findOne(query).exec();
  }

  async update(
    id: string,
    updateData: Partial<BudgetPlanRow>,
  ): Promise<BudgetPlanRowDocument | null> {
    return this.budgetPlanRowModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await this.budgetPlanRowModel
      .deleteMany({ projectId: new Types.ObjectId(projectId) })
      .exec();
  }

  async getTotalPlannedByProject(projectId: string): Promise<number> {
    const result = await this.budgetPlanRowModel
      .aggregate([
        { $match: { projectId: new Types.ObjectId(projectId) } },
        { $group: { _id: null, total: { $sum: '$plannedAmount' } } },
      ])
      .exec();

    return result.length > 0 ? result[0].total : 0;
  }
}
