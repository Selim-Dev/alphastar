import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AircraftRepository, AircraftFilter, PaginatedAircraftResult } from '../repositories/aircraft.repository';
import { Aircraft, AircraftDocument, AircraftStatus } from '../schemas/aircraft.schema';

export interface CreateAircraftData {
  registration: string;
  fleetGroup: string;
  aircraftType: string;
  msn: string;
  owner: string;
  manufactureDate: Date;
  enginesCount: number;
  status?: AircraftStatus;
}

export interface UpdateAircraftData {
  fleetGroup?: string;
  aircraftType?: string;
  msn?: string;
  owner?: string;
  manufactureDate?: Date;
  enginesCount?: number;
  status?: AircraftStatus;
}

@Injectable()
export class AircraftService {
  constructor(private readonly aircraftRepository: AircraftRepository) {}

  async create(data: CreateAircraftData): Promise<AircraftDocument> {
    const exists = await this.aircraftRepository.existsByRegistration(data.registration);
    if (exists) {
      throw new ConflictException(
        `Aircraft with registration ${data.registration.toUpperCase()} already exists`,
      );
    }

    return this.aircraftRepository.create({
      ...data,
      registration: data.registration.toUpperCase(),
    });
  }

  async findById(id: string): Promise<AircraftDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid aircraft ID format: ${id}`);
    }
    const aircraft = await this.aircraftRepository.findById(id);
    if (!aircraft) {
      throw new NotFoundException(`Aircraft with ID ${id} not found`);
    }
    return aircraft;
  }


  async findByRegistration(registration: string): Promise<AircraftDocument> {
    const aircraft = await this.aircraftRepository.findByRegistration(registration);
    if (!aircraft) {
      throw new NotFoundException(`Aircraft with registration ${registration} not found`);
    }
    return aircraft;
  }

  async findAll(filter?: AircraftFilter): Promise<PaginatedAircraftResult> {
    return this.aircraftRepository.findAll(filter);
  }

  async update(id: string, data: UpdateAircraftData): Promise<AircraftDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid aircraft ID format: ${id}`);
    }
    const aircraft = await this.aircraftRepository.findById(id);
    if (!aircraft) {
      throw new NotFoundException(`Aircraft with ID ${id} not found`);
    }

    return this.aircraftRepository.update(id, data) as Promise<AircraftDocument>;
  }

  async updateRegistration(
    id: string,
    newRegistration: string,
  ): Promise<AircraftDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid aircraft ID format: ${id}`);
    }
    const aircraft = await this.aircraftRepository.findById(id);
    if (!aircraft) {
      throw new NotFoundException(`Aircraft with ID ${id} not found`);
    }

    const exists = await this.aircraftRepository.existsByRegistrationExcludingId(
      newRegistration,
      id,
    );
    if (exists) {
      throw new ConflictException(
        `Aircraft with registration ${newRegistration.toUpperCase()} already exists`,
      );
    }

    return this.aircraftRepository.update(id, {
      registration: newRegistration.toUpperCase(),
    } as Partial<Aircraft>) as Promise<AircraftDocument>;
  }

  async delete(id: string): Promise<AircraftDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid aircraft ID format: ${id}`);
    }
    const aircraft = await this.aircraftRepository.delete(id);
    if (!aircraft) {
      throw new NotFoundException(`Aircraft with ID ${id} not found`);
    }
    return aircraft;
  }
}
