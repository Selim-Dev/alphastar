import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  DailyStatusRepository,
  DailyStatusFilter,
  AvailabilityAggregationParams,
  AvailabilityResult,
} from '../repositories/daily-status.repository';
import { DailyStatus, DailyStatusDocument } from '../schemas/daily-status.schema';

export interface CreateDailyStatusData {
  aircraftId: string;
  date: Date;
  posHours?: number;
  fmcHours?: number;
  nmcmSHours?: number;
  nmcmUHours?: number;
  nmcsHours?: number;
  notes?: string;
  updatedBy: string;
}

export interface AvailabilityMetrics {
  totalPosHours: number;
  totalFmcHours: number;
  availabilityPercentage: number;
}

@Injectable()
export class DailyStatusService {
  constructor(private readonly dailyStatusRepository: DailyStatusRepository) {}

  /**
   * Creates a new daily status with default values (pos=24, fmc=24)
   * Requirements: 3.1, 3.4
   */
  async create(data: CreateDailyStatusData): Promise<DailyStatusDocument> {
    // Check if a status already exists for this aircraft and date
    const existing = await this.dailyStatusRepository.findByAircraftAndDate(
      data.aircraftId,
      data.date,
    );
    if (existing) {
      throw new ConflictException(
        `Daily status already exists for aircraft ${data.aircraftId} on ${data.date.toISOString().split('T')[0]}`,
      );
    }

    // Apply default values as per Requirements 3.4
    const statusData: Partial<DailyStatus> = {
      aircraftId: new Types.ObjectId(data.aircraftId),
      date: data.date,
      posHours: data.posHours ?? 24,
      fmcHours: data.fmcHours ?? 24,
      nmcmSHours: data.nmcmSHours ?? 0,
      nmcmUHours: data.nmcmUHours ?? 0,
      nmcsHours: data.nmcsHours,
      notes: data.notes,
      updatedBy: new Types.ObjectId(data.updatedBy),
    };

    return this.dailyStatusRepository.create(statusData);
  }


  async findById(id: string): Promise<DailyStatusDocument> {
    const status = await this.dailyStatusRepository.findById(id);
    if (!status) {
      throw new NotFoundException(`Daily status with ID ${id} not found`);
    }
    return status;
  }

  async findAll(filter?: DailyStatusFilter & { limit?: number; skip?: number }): Promise<DailyStatusDocument[]> {
    return this.dailyStatusRepository.findAll(filter);
  }

  async findByAircraftAndDate(
    aircraftId: string,
    date: Date,
  ): Promise<DailyStatusDocument | null> {
    return this.dailyStatusRepository.findByAircraftAndDate(aircraftId, date);
  }

  /**
   * Computes availability percentage for a date range
   * Availability = (sum of fmc_hours / sum of pos_hours) * 100
   * Requirements: 3.2, 3.5
   */
  async computeAvailability(
    aircraftId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AvailabilityMetrics> {
    return this.dailyStatusRepository.computeAvailability(
      aircraftId,
      startDate,
      endDate,
    );
  }

  /**
   * Aggregates availability by day/month/year per aircraft
   * Requirements: 3.3, 3.5
   */
  async getAggregatedAvailability(
    params: AvailabilityAggregationParams,
  ): Promise<AvailabilityResult[]> {
    return this.dailyStatusRepository.aggregateAvailabilityByPeriod(params);
  }

  /**
   * Gets fleet-wide availability for a date range
   * Requirements: 3.5
   */
  async getFleetAvailability(
    startDate?: Date,
    endDate?: Date,
  ): Promise<AvailabilityResult[]> {
    return this.dailyStatusRepository.getFleetAvailability(startDate, endDate);
  }

  async update(
    id: string,
    updateData: Partial<CreateDailyStatusData>,
  ): Promise<DailyStatusDocument> {
    const status = await this.dailyStatusRepository.findById(id);
    if (!status) {
      throw new NotFoundException(`Daily status with ID ${id} not found`);
    }

    const result = await this.dailyStatusRepository.update(id, {
      ...updateData,
      updatedBy: updateData.updatedBy
        ? new Types.ObjectId(updateData.updatedBy)
        : undefined,
    } as Partial<DailyStatus>);

    return result as DailyStatusDocument;
  }

  async delete(id: string): Promise<DailyStatusDocument> {
    const status = await this.dailyStatusRepository.delete(id);
    if (!status) {
      throw new NotFoundException(`Daily status with ID ${id} not found`);
    }
    return status;
  }
}
