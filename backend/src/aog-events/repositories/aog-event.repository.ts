import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AOGEvent, AOGEventDocument } from '../schemas/aog-event.schema';
import {
  Aircraft,
  AircraftDocument,
} from '../../aircraft/schemas/aircraft.schema';

export interface AOGEventFilter {
  aircraftId?: string;
  fleetGroup?: string;
  status?: 'active' | 'completed';
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class AOGEventRepository {
  constructor(
    @InjectModel(AOGEvent.name)
    private readonly aogEventModel: Model<AOGEventDocument>,
    @InjectModel(Aircraft.name)
    private readonly aircraftModel: Model<AircraftDocument>,
  ) {}

  async create(data: Partial<AOGEvent>): Promise<AOGEventDocument> {
    const event = new this.aogEventModel(data);
    return event.save();
  }

  async findById(id: string): Promise<AOGEventDocument | null> {
    return this.aogEventModel
      .findById(id)
      .populate('aircraftId', 'registration fleetGroup aircraftType')
      .exec() as Promise<AOGEventDocument | null>;
  }

  async findAll(filter?: AOGEventFilter): Promise<AOGEventDocument[]> {
    const query: Record<string, unknown> = {};

    if (filter?.aircraftId) {
      query.aircraftId = new Types.ObjectId(filter.aircraftId);
    }

    if (filter?.fleetGroup) {
      const aircraftIds = await this.getAircraftIdsByFleetGroup(
        filter.fleetGroup,
      );
      if (aircraftIds.length === 0) {
        return [];
      }
      // If aircraftId filter is also set, intersect with fleetGroup results
      if (query.aircraftId) {
        const existingId = query.aircraftId as Types.ObjectId;
        if (!aircraftIds.some((id) => id.equals(existingId))) {
          return [];
        }
      } else {
        query.aircraftId = { $in: aircraftIds };
      }
    }

    if (filter?.status === 'active') {
      query.clearedAt = null;
    } else if (filter?.status === 'completed') {
      query.clearedAt = { $ne: null };
    }

    if (filter?.startDate || filter?.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (filter.startDate) {
        dateFilter.$gte = filter.startDate;
      }
      if (filter.endDate) {
        dateFilter.$lte = filter.endDate;
      }
      query.detectedAt = dateFilter;
    }

    return this.aogEventModel
      .find(query)
      .populate('aircraftId', 'registration fleetGroup aircraftType')
      .sort({ detectedAt: -1 })
      .exec() as Promise<AOGEventDocument[]>;
  }

  async update(
    id: string,
    updateData: Partial<AOGEvent>,
  ): Promise<AOGEventDocument | null> {
    return this.aogEventModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('aircraftId', 'registration fleetGroup aircraftType')
      .exec() as Promise<AOGEventDocument | null>;
  }

  async delete(id: string): Promise<AOGEventDocument | null> {
    return this.aogEventModel.findByIdAndDelete(id).exec();
  }

  async countActive(): Promise<number> {
    return this.aogEventModel.countDocuments({ clearedAt: null }).exec();
  }

  async findActive(): Promise<AOGEventDocument[]> {
    return this.aogEventModel
      .find({ clearedAt: null })
      .populate('aircraftId', 'registration fleetGroup aircraftType')
      .sort({ detectedAt: -1 })
      .exec() as Promise<AOGEventDocument[]>;
  }

  private async getAircraftIdsByFleetGroup(
    fleetGroup: string,
  ): Promise<Types.ObjectId[]> {
    const aircraft = await this.aircraftModel
      .find({ fleetGroup }, { _id: 1 })
      .lean()
      .exec();
    return aircraft.map((a) => a._id);
  }
}
