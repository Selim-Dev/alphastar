import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Aircraft, AircraftDocument, AircraftStatus } from '../schemas/aircraft.schema';

export interface AircraftFilter {
  fleetGroup?: string;
  aircraftType?: string;
  status?: AircraftStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedAircraftResult {
  data: AircraftDocument[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class AircraftRepository {
  constructor(
    @InjectModel(Aircraft.name) private readonly aircraftModel: Model<AircraftDocument>,
  ) {}

  async create(aircraftData: Partial<Aircraft>): Promise<AircraftDocument> {
    const aircraft = new this.aircraftModel(aircraftData);
    return aircraft.save();
  }

  async findById(id: string): Promise<AircraftDocument | null> {
    return this.aircraftModel.findById(id).exec();
  }

  async findByRegistration(registration: string): Promise<AircraftDocument | null> {
    return this.aircraftModel.findOne({ registration: registration.toUpperCase() }).exec();
  }

  async findAll(filter?: AircraftFilter): Promise<PaginatedAircraftResult> {
    const query: Record<string, unknown> = {};
    
    if (filter?.fleetGroup) {
      query.fleetGroup = filter.fleetGroup;
    }
    if (filter?.aircraftType) {
      query.aircraftType = filter.aircraftType;
    }
    if (filter?.status) {
      query.status = filter.status;
    }

    const page = filter?.page || 1;
    const limit = filter?.limit || 100;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.aircraftModel.find(query).sort({ registration: 1 }).skip(skip).limit(limit).exec(),
      this.aircraftModel.countDocuments(query).exec(),
    ]);

    return { data, total, page, limit };
  }

  async update(id: string, updateData: Partial<Aircraft>): Promise<AircraftDocument | null> {
    return this.aircraftModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<AircraftDocument | null> {
    return this.aircraftModel.findByIdAndDelete(id).exec();
  }

  async existsByRegistration(registration: string): Promise<boolean> {
    const count = await this.aircraftModel
      .countDocuments({ registration: registration.toUpperCase() })
      .exec();
    return count > 0;
  }

  async existsByRegistrationExcludingId(registration: string, excludeId: string): Promise<boolean> {
    const count = await this.aircraftModel
      .countDocuments({ 
        registration: registration.toUpperCase(),
        _id: { $ne: excludeId }
      })
      .exec();
    return count > 0;
  }
}
