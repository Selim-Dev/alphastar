import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import {
  AOGSubEvent,
  AOGSubEventDocument,
} from '../schemas/aog-sub-event.schema';

@Injectable()
export class AOGSubEventRepository {
  constructor(
    @InjectModel(AOGSubEvent.name)
    private readonly aogSubEventModel: Model<AOGSubEventDocument>,
  ) {}

  async create(data: Partial<AOGSubEvent>): Promise<AOGSubEventDocument> {
    const subEvent = new this.aogSubEventModel(data);
    return subEvent.save();
  }

  async findById(id: string): Promise<AOGSubEventDocument | null> {
    return this.aogSubEventModel.findById(id).exec();
  }

  async findByParentId(parentId: string): Promise<AOGSubEventDocument[]> {
    return this.aogSubEventModel
      .find({ parentEventId: new Types.ObjectId(parentId) })
      .sort({ detectedAt: -1 })
      .exec();
  }

  async update(
    id: string,
    data: Partial<AOGSubEvent>,
  ): Promise<AOGSubEventDocument | null> {
    return this.aogSubEventModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async delete(id: string): Promise<AOGSubEventDocument | null> {
    return this.aogSubEventModel.findByIdAndDelete(id).exec();
  }

  async deleteByParentId(parentId: string): Promise<number> {
    const result = await this.aogSubEventModel.deleteMany({
      parentEventId: new Types.ObjectId(parentId),
    });
    return result.deletedCount;
  }

  async aggregate(pipeline: PipelineStage[]): Promise<unknown[]> {
    return this.aogSubEventModel.aggregate(pipeline).exec();
  }
}
