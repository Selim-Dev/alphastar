import {
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  DailyCounterRepository,
  DailyCounterFilter,
  AggregationPeriod,
} from '../repositories/daily-counter.repository';
import { DailyCounter, DailyCounterDocument } from '../schemas/daily-counter.schema';

export interface CreateDailyCounterData {
  aircraftId: string;
  date: Date;
  airframeHoursTtsn: number;
  airframeCyclesTcsn: number;
  engine1Hours: number;
  engine1Cycles: number;
  engine2Hours: number;
  engine2Cycles: number;
  engine3Hours?: number;
  engine3Cycles?: number;
  engine4Hours?: number;
  engine4Cycles?: number;
  apuHours: number;
  apuCycles?: number;
  lastFlightDate?: Date;
  updatedBy: string;
}

export interface DailyDelta {
  date: Date;
  aircraftId: string;
  flightHours: number;
  cycles: number;
  engine1Hours: number;
  engine1Cycles: number;
  engine2Hours: number;
  engine2Cycles: number;
  engine3Hours?: number;
  engine3Cycles?: number;
  engine4Hours?: number;
  engine4Cycles?: number;
  apuHours: number;
  apuCycles?: number;
}

@Injectable()
export class UtilizationService {
  constructor(private readonly dailyCounterRepository: DailyCounterRepository) {}

  /**
   * Validates that counter values are monotonically increasing
   * Requirements: 2.2
   */
  validateMonotonicCounters(
    previous: DailyCounterDocument,
    current: CreateDailyCounterData,
  ): void {
    const errors: string[] = [];

    if (current.airframeHoursTtsn < previous.airframeHoursTtsn) {
      errors.push(
        `Airframe hours (${current.airframeHoursTtsn}) cannot be less than previous value (${previous.airframeHoursTtsn})`,
      );
    }
    if (current.airframeCyclesTcsn < previous.airframeCyclesTcsn) {
      errors.push(
        `Airframe cycles (${current.airframeCyclesTcsn}) cannot be less than previous value (${previous.airframeCyclesTcsn})`,
      );
    }
    if (current.engine1Hours < previous.engine1Hours) {
      errors.push(
        `Engine 1 hours (${current.engine1Hours}) cannot be less than previous value (${previous.engine1Hours})`,
      );
    }
    if (current.engine1Cycles < previous.engine1Cycles) {
      errors.push(
        `Engine 1 cycles (${current.engine1Cycles}) cannot be less than previous value (${previous.engine1Cycles})`,
      );
    }
    if (current.engine2Hours < previous.engine2Hours) {
      errors.push(
        `Engine 2 hours (${current.engine2Hours}) cannot be less than previous value (${previous.engine2Hours})`,
      );
    }
    if (current.engine2Cycles < previous.engine2Cycles) {
      errors.push(
        `Engine 2 cycles (${current.engine2Cycles}) cannot be less than previous value (${previous.engine2Cycles})`,
      );
    }
    if (
      current.engine3Hours !== undefined &&
      previous.engine3Hours !== undefined &&
      current.engine3Hours < previous.engine3Hours
    ) {
      errors.push(
        `Engine 3 hours (${current.engine3Hours}) cannot be less than previous value (${previous.engine3Hours})`,
      );
    }
    if (
      current.engine3Cycles !== undefined &&
      previous.engine3Cycles !== undefined &&
      current.engine3Cycles < previous.engine3Cycles
    ) {
      errors.push(
        `Engine 3 cycles (${current.engine3Cycles}) cannot be less than previous value (${previous.engine3Cycles})`,
      );
    }
    if (
      current.engine4Hours !== undefined &&
      previous.engine4Hours !== undefined &&
      current.engine4Hours < previous.engine4Hours
    ) {
      errors.push(
        `Engine 4 hours (${current.engine4Hours}) cannot be less than previous value (${previous.engine4Hours})`,
      );
    }
    if (
      current.engine4Cycles !== undefined &&
      previous.engine4Cycles !== undefined &&
      current.engine4Cycles < previous.engine4Cycles
    ) {
      errors.push(
        `Engine 4 cycles (${current.engine4Cycles}) cannot be less than previous value (${previous.engine4Cycles})`,
      );
    }
    if (current.apuHours < previous.apuHours) {
      errors.push(
        `APU hours (${current.apuHours}) cannot be less than previous value (${previous.apuHours})`,
      );
    }
    if (
      current.apuCycles !== undefined &&
      previous.apuCycles !== undefined &&
      current.apuCycles < previous.apuCycles
    ) {
      errors.push(
        `APU cycles (${current.apuCycles}) cannot be less than previous value (${previous.apuCycles})`,
      );
    }

    if (errors.length > 0) {
      throw new UnprocessableEntityException({
        message: 'Monotonic validation error',
        errors,
      });
    }
  }

  /**
   * Creates a new daily counter with monotonic validation
   * Requirements: 2.1, 2.2
   */
  async create(data: CreateDailyCounterData): Promise<DailyCounterDocument> {
    // Check if a counter already exists for this aircraft and date
    const existing = await this.dailyCounterRepository.findByAircraftAndDate(
      data.aircraftId,
      data.date,
    );
    if (existing) {
      throw new ConflictException(
        `Daily counter already exists for aircraft ${data.aircraftId} on ${data.date.toISOString().split('T')[0]}`,
      );
    }

    // Get previous counter for monotonic validation
    const previousCounter = await this.dailyCounterRepository.findPreviousCounter(
      data.aircraftId,
      data.date,
    );

    if (previousCounter) {
      this.validateMonotonicCounters(previousCounter, data);
    }

    return this.dailyCounterRepository.create({
      ...data,
      aircraftId: new Types.ObjectId(data.aircraftId),
      updatedBy: new Types.ObjectId(data.updatedBy),
    });
  }

  async findById(id: string): Promise<DailyCounterDocument> {
    const counter = await this.dailyCounterRepository.findById(id);
    if (!counter) {
      throw new NotFoundException(`Daily counter with ID ${id} not found`);
    }
    return counter;
  }

  async findAll(filter?: DailyCounterFilter): Promise<DailyCounterDocument[]> {
    return this.dailyCounterRepository.findAll(filter);
  }

  /**
   * Computes daily delta between consecutive counter readings
   * Requirements: 2.3
   */
  computeDelta(
    current: DailyCounterDocument,
    previous: DailyCounterDocument,
  ): DailyDelta {
    return {
      date: current.date,
      aircraftId: current.aircraftId.toString(),
      flightHours: current.airframeHoursTtsn - previous.airframeHoursTtsn,
      cycles: current.airframeCyclesTcsn - previous.airframeCyclesTcsn,
      engine1Hours: current.engine1Hours - previous.engine1Hours,
      engine1Cycles: current.engine1Cycles - previous.engine1Cycles,
      engine2Hours: current.engine2Hours - previous.engine2Hours,
      engine2Cycles: current.engine2Cycles - previous.engine2Cycles,
      engine3Hours:
        current.engine3Hours !== undefined && previous.engine3Hours !== undefined
          ? current.engine3Hours - previous.engine3Hours
          : undefined,
      engine3Cycles:
        current.engine3Cycles !== undefined && previous.engine3Cycles !== undefined
          ? current.engine3Cycles - previous.engine3Cycles
          : undefined,
      engine4Hours:
        current.engine4Hours !== undefined && previous.engine4Hours !== undefined
          ? current.engine4Hours - previous.engine4Hours
          : undefined,
      engine4Cycles:
        current.engine4Cycles !== undefined && previous.engine4Cycles !== undefined
          ? current.engine4Cycles - previous.engine4Cycles
          : undefined,
      apuHours: current.apuHours - previous.apuHours,
      apuCycles:
        current.apuCycles !== undefined && previous.apuCycles !== undefined
          ? current.apuCycles - previous.apuCycles
          : undefined,
    };
  }

  /**
   * Gets daily deltas for an aircraft over a date range
   * Requirements: 2.3
   */
  async getDailyDeltas(
    aircraftId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<DailyDelta[]> {
    const counters = await this.dailyCounterRepository.findAll({
      aircraftId,
      startDate,
      endDate,
    });

    if (counters.length < 2) {
      return [];
    }

    // Sort by date ascending for delta calculation
    const sortedCounters = [...counters].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    const deltas: DailyDelta[] = [];
    for (let i = 1; i < sortedCounters.length; i++) {
      deltas.push(this.computeDelta(sortedCounters[i], sortedCounters[i - 1]));
    }

    return deltas;
  }

  /**
   * Aggregates utilization by day/month/year
   * Requirements: 2.5
   */
  async getAggregatedUtilization(params: AggregationPeriod): Promise<unknown[]> {
    return this.dailyCounterRepository.aggregateByPeriod(params);
  }

  async update(
    id: string,
    updateData: Partial<CreateDailyCounterData>,
  ): Promise<DailyCounterDocument> {
    const counter = await this.dailyCounterRepository.findById(id);
    if (!counter) {
      throw new NotFoundException(`Daily counter with ID ${id} not found`);
    }

    // If updating counter values, validate monotonicity
    if (
      updateData.airframeHoursTtsn !== undefined ||
      updateData.airframeCyclesTcsn !== undefined ||
      updateData.engine1Hours !== undefined ||
      updateData.engine1Cycles !== undefined ||
      updateData.engine2Hours !== undefined ||
      updateData.engine2Cycles !== undefined ||
      updateData.apuHours !== undefined
    ) {
      const previousCounter = await this.dailyCounterRepository.findPreviousCounter(
        counter.aircraftId.toString(),
        counter.date,
      );

      if (previousCounter) {
        const mergedData: CreateDailyCounterData = {
          aircraftId: counter.aircraftId.toString(),
          date: counter.date,
          airframeHoursTtsn: updateData.airframeHoursTtsn ?? counter.airframeHoursTtsn,
          airframeCyclesTcsn: updateData.airframeCyclesTcsn ?? counter.airframeCyclesTcsn,
          engine1Hours: updateData.engine1Hours ?? counter.engine1Hours,
          engine1Cycles: updateData.engine1Cycles ?? counter.engine1Cycles,
          engine2Hours: updateData.engine2Hours ?? counter.engine2Hours,
          engine2Cycles: updateData.engine2Cycles ?? counter.engine2Cycles,
          engine3Hours: updateData.engine3Hours ?? counter.engine3Hours,
          engine3Cycles: updateData.engine3Cycles ?? counter.engine3Cycles,
          engine4Hours: updateData.engine4Hours ?? counter.engine4Hours,
          engine4Cycles: updateData.engine4Cycles ?? counter.engine4Cycles,
          apuHours: updateData.apuHours ?? counter.apuHours,
          apuCycles: updateData.apuCycles ?? counter.apuCycles,
          updatedBy: updateData.updatedBy ?? counter.updatedBy.toString(),
        };
        this.validateMonotonicCounters(previousCounter, mergedData);
      }
    }

    const result = await this.dailyCounterRepository.update(id, {
      ...updateData,
      updatedBy: updateData.updatedBy
        ? new Types.ObjectId(updateData.updatedBy)
        : undefined,
    } as Partial<DailyCounter>);

    return result as DailyCounterDocument;
  }

  async delete(id: string): Promise<DailyCounterDocument> {
    const counter = await this.dailyCounterRepository.delete(id);
    if (!counter) {
      throw new NotFoundException(`Daily counter with ID ${id} not found`);
    }
    return counter;
  }
}
