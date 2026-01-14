import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VacationPlan,
  VacationPlanDocument,
  VacationTeam,
} from '../schemas/vacation-plan.schema';

export interface VacationPlanFilter {
  year?: number;
  team?: VacationTeam;
}

/**
 * Repository for VacationPlan database operations
 * Requirements: 15.1
 */
@Injectable()
export class VacationPlanRepository {
  constructor(
    @InjectModel(VacationPlan.name)
    private readonly vacationPlanModel: Model<VacationPlanDocument>,
  ) {}

  /**
   * Creates a new vacation plan
   */
  async create(data: Partial<VacationPlan>): Promise<VacationPlanDocument> {
    const plan = new this.vacationPlanModel(data);
    return plan.save();
  }

  /**
   * Finds a vacation plan by ID
   */
  async findById(id: string): Promise<VacationPlanDocument | null> {
    return this.vacationPlanModel.findById(id).exec();
  }

  /**
   * Finds a vacation plan by year and team
   */
  async findByYearAndTeam(
    year: number,
    team: VacationTeam,
  ): Promise<VacationPlanDocument | null> {
    return this.vacationPlanModel.findOne({ year, team }).exec();
  }

  /**
   * Finds all vacation plans with optional filtering
   */
  async findAll(filter?: VacationPlanFilter): Promise<VacationPlanDocument[]> {
    const query: Record<string, unknown> = {};

    if (filter?.year !== undefined) {
      query.year = filter.year;
    }

    if (filter?.team) {
      query.team = filter.team;
    }

    return this.vacationPlanModel
      .find(query)
      .sort({ year: -1, team: 1 })
      .exec();
  }

  /**
   * Updates a vacation plan by ID
   */
  async update(
    id: string,
    updateData: Partial<VacationPlan>,
  ): Promise<VacationPlanDocument | null> {
    return this.vacationPlanModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  /**
   * Upserts a vacation plan by (year, team)
   */
  async upsert(
    year: number,
    team: VacationTeam,
    data: Partial<VacationPlan>,
  ): Promise<VacationPlanDocument> {
    const filter = { year, team };

    const update = {
      $set: {
        ...data,
        year,
        team,
      },
    };

    const result = await this.vacationPlanModel
      .findOneAndUpdate(filter, update, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      })
      .exec();

    return result!;
  }

  /**
   * Deletes a vacation plan by ID
   */
  async delete(id: string): Promise<VacationPlanDocument | null> {
    return this.vacationPlanModel.findByIdAndDelete(id).exec();
  }
}
