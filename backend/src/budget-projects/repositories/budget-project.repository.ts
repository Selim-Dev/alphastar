import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BudgetProject, BudgetProjectDocument } from '../schemas/budget-project.schema';

export interface BudgetProjectFilter {
  year?: number;
  status?: string;
  templateType?: string;
}

@Injectable()
export class BudgetProjectRepository {
  constructor(
    @InjectModel(BudgetProject.name)
    private readonly budgetProjectModel: Model<BudgetProjectDocument>,
  ) {}

  async create(projectData: Partial<BudgetProject>): Promise<BudgetProjectDocument> {
    const project = new this.budgetProjectModel(projectData);
    return project.save();
  }

  async findById(id: string): Promise<BudgetProjectDocument | null> {
    return this.budgetProjectModel.findById(id).exec();
  }

  async findByName(name: string): Promise<BudgetProjectDocument | null> {
    return this.budgetProjectModel.findOne({ name }).exec();
  }

  async findAll(filter?: BudgetProjectFilter): Promise<BudgetProjectDocument[]> {
    const query: Record<string, unknown> = {};

    if (filter?.status) {
      query.status = filter.status;
    }

    if (filter?.templateType) {
      query.templateType = filter.templateType;
    }

    if (filter?.year) {
      // Find projects where date range overlaps with the specified year
      const yearStart = new Date(`${filter.year}-01-01`);
      const yearEnd = new Date(`${filter.year}-12-31`);
      query.$or = [
        {
          'dateRange.start': { $lte: yearEnd },
          'dateRange.end': { $gte: yearStart },
        },
      ];
    }

    return this.budgetProjectModel
      .find(query)
      .sort({ 'dateRange.start': -1 })
      .exec();
  }

  async update(
    id: string,
    updateData: Partial<BudgetProject>,
  ): Promise<BudgetProjectDocument | null> {
    return this.budgetProjectModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<BudgetProjectDocument | null> {
    return this.budgetProjectModel.findByIdAndDelete(id).exec();
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.budgetProjectModel.countDocuments({ name }).exec();
    return count > 0;
  }

  async existsByNameExcludingId(name: string, excludeId: string): Promise<boolean> {
    const count = await this.budgetProjectModel
      .countDocuments({
        name,
        _id: { $ne: excludeId },
      })
      .exec();
    return count > 0;
  }
}
