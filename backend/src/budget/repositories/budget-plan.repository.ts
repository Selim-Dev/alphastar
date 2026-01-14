import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BudgetPlan, BudgetPlanDocument } from '../schemas/budget-plan.schema';

export interface BudgetPlanFilter {
  fiscalYear?: number;
  clauseId?: number;
  aircraftGroup?: string;
}

@Injectable()
export class BudgetPlanRepository {
  constructor(
    @InjectModel(BudgetPlan.name)
    private readonly budgetPlanModel: Model<BudgetPlanDocument>,
  ) {}

  async create(data: Partial<BudgetPlan>): Promise<BudgetPlanDocument> {
    const plan = new this.budgetPlanModel(data);
    return plan.save();
  }

  async createMany(data: Partial<BudgetPlan>[]): Promise<BudgetPlanDocument[]> {
    return this.budgetPlanModel.insertMany(data) as Promise<BudgetPlanDocument[]>;
  }

  async findById(id: string): Promise<BudgetPlanDocument | null> {
    return this.budgetPlanModel.findById(id).exec();
  }

  async findAll(filter?: BudgetPlanFilter): Promise<BudgetPlanDocument[]> {
    const query: Record<string, unknown> = {};

    if (filter?.fiscalYear) {
      query.fiscalYear = filter.fiscalYear;
    }
    if (filter?.clauseId) {
      query.clauseId = filter.clauseId;
    }
    if (filter?.aircraftGroup) {
      query.aircraftGroup = filter.aircraftGroup;
    }

    return this.budgetPlanModel.find(query).sort({ clauseId: 1 }).exec();
  }

  async findByFiscalYearAndClause(
    fiscalYear: number,
    clauseId: number,
    aircraftGroup?: string,
  ): Promise<BudgetPlanDocument | null> {
    const query: Record<string, unknown> = { fiscalYear, clauseId };
    if (aircraftGroup) {
      query.aircraftGroup = aircraftGroup;
    }
    return this.budgetPlanModel.findOne(query).exec();
  }

  async update(
    id: string,
    updateData: Partial<BudgetPlan>,
  ): Promise<BudgetPlanDocument | null> {
    return this.budgetPlanModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async upsert(
    fiscalYear: number,
    clauseId: number,
    aircraftGroup: string,
    data: Partial<BudgetPlan>,
  ): Promise<BudgetPlanDocument> {
    return this.budgetPlanModel
      .findOneAndUpdate(
        { fiscalYear, clauseId, aircraftGroup },
        { $set: data },
        { new: true, upsert: true },
      )
      .exec() as Promise<BudgetPlanDocument>;
  }

  async delete(id: string): Promise<BudgetPlanDocument | null> {
    return this.budgetPlanModel.findByIdAndDelete(id).exec();
  }

  async deleteByFiscalYear(fiscalYear: number): Promise<number> {
    const result = await this.budgetPlanModel.deleteMany({ fiscalYear }).exec();
    return result.deletedCount;
  }

  async getTotalPlannedByFiscalYear(
    fiscalYear: number,
    aircraftGroup?: string,
  ): Promise<number> {
    const matchStage: Record<string, unknown> = { fiscalYear };
    if (aircraftGroup) {
      matchStage.aircraftGroup = aircraftGroup;
    }

    const result = await this.budgetPlanModel.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$plannedAmount' } } },
    ]).exec();

    return result.length > 0 ? result[0].total : 0;
  }

  async getDistinctClauses(fiscalYear?: number): Promise<{ clauseId: number; clauseDescription: string }[]> {
    const matchStage: Record<string, unknown> = {};
    if (fiscalYear) {
      matchStage.fiscalYear = fiscalYear;
    }

    return this.budgetPlanModel.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      { $group: { _id: { clauseId: '$clauseId', clauseDescription: '$clauseDescription' } } },
      { $project: { _id: 0, clauseId: '$_id.clauseId', clauseDescription: '$_id.clauseDescription' } },
      { $sort: { clauseId: 1 } },
    ]).exec();
  }

  async getDistinctAircraftGroups(fiscalYear?: number): Promise<string[]> {
    const matchStage: Record<string, unknown> = {};
    if (fiscalYear) {
      matchStage.fiscalYear = fiscalYear;
    }

    if (Object.keys(matchStage).length > 0) {
      return this.budgetPlanModel.distinct('aircraftGroup', matchStage).exec();
    }
    return this.budgetPlanModel.distinct('aircraftGroup').exec();
  }

  /**
   * Clone budget plans from one fiscal year to another
   * @param sourceYear - The fiscal year to clone from
   * @param targetYear - The fiscal year to clone to
   * @param adjustmentPercentage - Optional percentage adjustment (e.g., 5 for 5% increase)
   * @returns Object with cloned and skipped counts
   */
  async cloneFromYear(
    sourceYear: number,
    targetYear: number,
    adjustmentPercentage: number = 0,
  ): Promise<{ clonedCount: number; skippedCount: number }> {
    // Get all plans from source year
    const sourcePlans = await this.budgetPlanModel.find({ fiscalYear: sourceYear }).exec();
    
    let clonedCount = 0;
    let skippedCount = 0;

    for (const plan of sourcePlans) {
      // Check if plan already exists in target year
      const existingPlan = await this.budgetPlanModel.findOne({
        fiscalYear: targetYear,
        clauseId: plan.clauseId,
        aircraftGroup: plan.aircraftGroup,
      }).exec();

      if (existingPlan) {
        skippedCount++;
        continue;
      }

      // Calculate adjusted amount
      const adjustedAmount = adjustmentPercentage !== 0
        ? Math.round(plan.plannedAmount * (1 + adjustmentPercentage / 100) * 100) / 100
        : plan.plannedAmount;

      // Create new plan for target year
      const newPlan = new this.budgetPlanModel({
        fiscalYear: targetYear,
        clauseId: plan.clauseId,
        clauseDescription: plan.clauseDescription,
        aircraftGroup: plan.aircraftGroup,
        plannedAmount: adjustedAmount,
        currency: plan.currency,
        isDemo: plan.isDemo,
      });

      await newPlan.save();
      clonedCount++;
    }

    return { clonedCount, skippedCount };
  }

  /**
   * Check if budget plans exist for a fiscal year
   */
  async hasPlansForYear(fiscalYear: number): Promise<boolean> {
    const count = await this.budgetPlanModel.countDocuments({ fiscalYear }).exec();
    return count > 0;
  }

  /**
   * Get count of plans for a fiscal year
   */
  async getCountForYear(fiscalYear: number): Promise<number> {
    return this.budgetPlanModel.countDocuments({ fiscalYear }).exec();
  }
}
