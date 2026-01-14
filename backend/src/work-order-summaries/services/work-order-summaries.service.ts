import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  WorkOrderSummaryRepository,
  WorkOrderSummaryFilter,
  TrendResult,
} from '../repositories/work-order-summary.repository';
import {
  WorkOrderSummary,
  WorkOrderSummaryDocument,
} from '../schemas/work-order-summary.schema';
import { CreateWorkOrderSummaryDto } from '../dto/create-work-order-summary.dto';
import { UpdateWorkOrderSummaryDto } from '../dto/update-work-order-summary.dto';

/**
 * Service for WorkOrderSummary business logic
 * Requirements: 11.1, 11.2, 11.3, 11.4, 14.2
 */
@Injectable()
export class WorkOrderSummariesService {
  constructor(
    private readonly workOrderSummaryRepository: WorkOrderSummaryRepository,
  ) {}

  /**
   * Creates or updates a work order summary (upsert by aircraftId + period)
   * Requirements: 11.2, 11.3
   */
  async create(
    dto: CreateWorkOrderSummaryDto,
    userId: string,
  ): Promise<WorkOrderSummaryDocument> {
    // Validate workOrderCount >= 0
    if (dto.workOrderCount < 0) {
      throw new BadRequestException('Work order count must be >= 0');
    }

    // Validate totalCost >= 0 if provided
    if (dto.totalCost !== undefined && dto.totalCost < 0) {
      throw new BadRequestException('Total cost must be >= 0');
    }

    const summaryData: Partial<WorkOrderSummary> = {
      workOrderCount: dto.workOrderCount,
      totalCost: dto.totalCost,
      currency: dto.currency || 'USD',
      notes: dto.notes,
      sourceRef: dto.sourceRef,
      updatedBy: new Types.ObjectId(userId),
    };

    // Upsert by (aircraftId, period)
    return this.workOrderSummaryRepository.upsert(
      dto.aircraftId,
      dto.period,
      summaryData,
    );
  }

  /**
   * Finds a work order summary by ID
   */
  async findById(id: string): Promise<WorkOrderSummaryDocument | null> {
    return this.workOrderSummaryRepository.findById(id);
  }

  /**
   * Finds a work order summary by aircraft and period
   */
  async findByAircraftAndPeriod(
    aircraftId: string,
    period: string,
  ): Promise<WorkOrderSummaryDocument | null> {
    return this.workOrderSummaryRepository.findByAircraftAndPeriod(
      aircraftId,
      period,
    );
  }

  /**
   * Finds all work order summaries with optional filtering
   * Requirements: 11.4
   */
  async findAll(filter?: WorkOrderSummaryFilter): Promise<WorkOrderSummaryDocument[]> {
    return this.workOrderSummaryRepository.findAll(filter);
  }

  /**
   * Updates a work order summary by ID
   * Requirements: 11.2
   */
  async update(
    id: string,
    dto: UpdateWorkOrderSummaryDto,
    userId: string,
  ): Promise<WorkOrderSummaryDocument | null> {
    const existing = await this.workOrderSummaryRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Work order summary with ID ${id} not found`);
    }

    // Validate workOrderCount >= 0 if provided
    if (dto.workOrderCount !== undefined && dto.workOrderCount < 0) {
      throw new BadRequestException('Work order count must be >= 0');
    }

    // Validate totalCost >= 0 if provided
    if (dto.totalCost !== undefined && dto.totalCost < 0) {
      throw new BadRequestException('Total cost must be >= 0');
    }

    const updateData: Partial<WorkOrderSummary> = {
      updatedBy: new Types.ObjectId(userId),
    };

    if (dto.aircraftId) {
      updateData.aircraftId = new Types.ObjectId(dto.aircraftId);
    }
    if (dto.period) {
      updateData.period = dto.period;
    }
    if (dto.workOrderCount !== undefined) {
      updateData.workOrderCount = dto.workOrderCount;
    }
    if (dto.totalCost !== undefined) {
      updateData.totalCost = dto.totalCost;
    }
    if (dto.currency !== undefined) {
      updateData.currency = dto.currency;
    }
    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }
    if (dto.sourceRef !== undefined) {
      updateData.sourceRef = dto.sourceRef;
    }

    return this.workOrderSummaryRepository.update(id, updateData);
  }

  /**
   * Deletes a work order summary by ID
   */
  async delete(id: string): Promise<WorkOrderSummaryDocument | null> {
    const existing = await this.workOrderSummaryRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Work order summary with ID ${id} not found`);
    }
    return this.workOrderSummaryRepository.delete(id);
  }

  /**
   * Gets trend data aggregated by period
   * Requirements: 14.2
   */
  async getTrends(filter?: WorkOrderSummaryFilter): Promise<TrendResult[]> {
    return this.workOrderSummaryRepository.getTrends(filter);
  }

  /**
   * Gets total work order count for a period range
   */
  async getTotalCount(filter?: WorkOrderSummaryFilter): Promise<number> {
    return this.workOrderSummaryRepository.getTotalCount(filter);
  }

  /**
   * Bulk upsert work order summaries (for import)
   * Requirements: 13.2
   */
  async bulkUpsert(
    summaries: CreateWorkOrderSummaryDto[],
    userId: string,
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const dto of summaries) {
      try {
        // Validate
        if (dto.workOrderCount < 0) {
          errors.push(
            `Invalid count for ${dto.aircraftId}/${dto.period}: count must be >= 0`,
          );
          continue;
        }
        if (dto.totalCost !== undefined && dto.totalCost < 0) {
          errors.push(
            `Invalid cost for ${dto.aircraftId}/${dto.period}: cost must be >= 0`,
          );
          continue;
        }

        // Check if exists
        const existing = await this.findByAircraftAndPeriod(
          dto.aircraftId,
          dto.period,
        );

        await this.create(dto, userId);

        if (existing) {
          updated++;
        } else {
          created++;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error for ${dto.aircraftId}/${dto.period}: ${message}`);
      }
    }

    return { created, updated, errors };
  }
}
