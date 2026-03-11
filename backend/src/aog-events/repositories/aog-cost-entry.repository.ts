import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import {
  AOGCostEntry,
  AOGCostEntryDocument,
} from '../schemas/aog-cost-entry.schema';

@Injectable()
export class AOGCostEntryRepository {
  constructor(
    @InjectModel(AOGCostEntry.name)
    private readonly aogCostEntryModel: Model<AOGCostEntryDocument>,
  ) {}

  async create(data: Partial<AOGCostEntry>): Promise<AOGCostEntryDocument> {
    const entry = new this.aogCostEntryModel(data);
    return entry.save();
  }

  async findById(id: string): Promise<AOGCostEntryDocument | null> {
    return this.aogCostEntryModel.findById(id).exec();
  }

  async findByParentId(parentId: string): Promise<AOGCostEntryDocument[]> {
    return this.aogCostEntryModel
      .find({ parentEventId: new Types.ObjectId(parentId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    id: string,
    data: Partial<AOGCostEntry>,
  ): Promise<AOGCostEntryDocument | null> {
    return this.aogCostEntryModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async delete(id: string): Promise<AOGCostEntryDocument | null> {
    return this.aogCostEntryModel.findByIdAndDelete(id).exec();
  }

  async deleteByParentId(parentId: string): Promise<number> {
    const result = await this.aogCostEntryModel.deleteMany({
      parentEventId: new Types.ObjectId(parentId),
    });
    return result.deletedCount;
  }

  async aggregate(pipeline: PipelineStage[]): Promise<unknown[]> {
    return this.aogCostEntryModel.aggregate(pipeline).exec();
  }
}
