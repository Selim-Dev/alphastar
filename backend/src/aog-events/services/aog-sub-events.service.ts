import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AOGSubEventRepository } from '../repositories/aog-sub-event.repository';
import { AOGEventRepository } from '../repositories/aog-event.repository';
import {
  AOGSubEvent,
  AOGSubEventDocument,
  DepartmentHandoff,
} from '../schemas/aog-sub-event.schema';
import { CreateSubEventDto } from '../dto/create-sub-event.dto';
import { UpdateSubEventDto } from '../dto/update-sub-event.dto';
import { CreateHandoffDto } from '../dto/create-handoff.dto';
import { UpdateHandoffDto } from '../dto/update-handoff.dto';

export interface TimeBucketResult {
  technicalTimeHours: number;
  departmentTimeHours: number;
  departmentTimeTotals: Record<string, number>;
  totalDowntimeHours: number;
}

@Injectable()
export class AOGSubEventsService {
  constructor(
    private readonly subEventRepository: AOGSubEventRepository,
    private readonly eventRepository: AOGEventRepository,
  ) {}

  /**
   * Compute time buckets for a sub-event based on its timeline and department handoffs.
   *
   * - totalDowntimeHours = (clearedAt or now) - detectedAt in hours
   * - departmentTimeHours = sum of all handoff durations
   * - departmentTimeTotals = handoff durations grouped by department
   * - technicalTimeHours = max(0, totalDowntimeHours - departmentTimeHours)
   */
  computeTimeBuckets(subEvent: Partial<AOGSubEvent>): TimeBucketResult {
    const detectedAt = subEvent.detectedAt
      ? new Date(subEvent.detectedAt)
      : new Date();
    const endTime = subEvent.clearedAt
      ? new Date(subEvent.clearedAt)
      : new Date();
    const totalDurationMs = endTime.getTime() - detectedAt.getTime();
    const totalDowntimeHours = Math.max(0, totalDurationMs / (1000 * 60 * 60));

    const departmentTimeTotals: Record<string, number> = {};
    let totalDepartmentTimeMs = 0;

    const handoffs = subEvent.departmentHandoffs || [];
    for (const handoff of handoffs) {
      const handoffStart = new Date(handoff.sentAt);
      const handoffEnd = handoff.returnedAt
        ? new Date(handoff.returnedAt)
        : new Date();
      const durationMs = Math.max(
        0,
        handoffEnd.getTime() - handoffStart.getTime(),
      );
      totalDepartmentTimeMs += durationMs;

      const dept = handoff.department;
      const durationHours = durationMs / (1000 * 60 * 60);
      departmentTimeTotals[dept] =
        (departmentTimeTotals[dept] || 0) + durationHours;
    }

    const departmentTimeHours = totalDepartmentTimeMs / (1000 * 60 * 60);
    const technicalTimeHours = Math.max(
      0,
      totalDowntimeHours - departmentTimeHours,
    );

    return {
      technicalTimeHours,
      departmentTimeHours,
      departmentTimeTotals,
      totalDowntimeHours,
    };
  }

  /**
   * Create a new sub-event under a parent event.
   * Validates parent exists, converts DTO dates, computes time buckets, and saves.
   */
  async create(
    parentId: string,
    dto: CreateSubEventDto,
    userId: string,
  ): Promise<AOGSubEventDocument> {
    const parentEvent = await this.eventRepository.findById(parentId);
    if (!parentEvent) {
      throw new BadRequestException(
        `Parent event with ID ${parentId} not found`,
      );
    }

    const handoffs: DepartmentHandoff[] = (dto.departmentHandoffs || []).map(
      (h) => ({
        _id: new Types.ObjectId(),
        department: h.department,
        sentAt: new Date(h.sentAt),
        returnedAt: h.returnedAt ? new Date(h.returnedAt) : undefined,
        notes: h.notes,
      }),
    );

    const subEventData: Partial<AOGSubEvent> = {
      parentEventId: new Types.ObjectId(parentId),
      category: dto.category,
      reasonCode: dto.reasonCode,
      actionTaken: dto.actionTaken,
      detectedAt: new Date(dto.detectedAt),
      clearedAt: dto.clearedAt ? new Date(dto.clearedAt) : undefined,
      manpowerCount: dto.manpowerCount,
      manHours: dto.manHours,
      departmentHandoffs: handoffs,
      notes: dto.notes,
      updatedBy: new Types.ObjectId(userId),
    };

    const buckets = this.computeTimeBuckets(subEventData);
    subEventData.technicalTimeHours = buckets.technicalTimeHours;
    subEventData.departmentTimeHours = buckets.departmentTimeHours;
    subEventData.departmentTimeTotals = buckets.departmentTimeTotals;
    subEventData.totalDowntimeHours = buckets.totalDowntimeHours;

    return this.subEventRepository.create(subEventData);
  }

  /**
   * Find all sub-events for a given parent event.
   */
  async findByParentId(parentId: string): Promise<AOGSubEventDocument[]> {
    return this.subEventRepository.findByParentId(parentId);
  }

  /**
   * Find a single sub-event by ID, validating it belongs to the specified parent.
   */
  async findById(
    parentId: string,
    subId: string,
  ): Promise<AOGSubEventDocument> {
    const subEvent = await this.subEventRepository.findById(subId);
    if (!subEvent) {
      throw new NotFoundException(`Sub-event with ID ${subId} not found`);
    }

    if (subEvent.parentEventId.toString() !== parentId) {
      throw new NotFoundException(
        `Sub-event with ID ${subId} not found under parent ${parentId}`,
      );
    }

    return subEvent;
  }

  /**
   * Update a sub-event. Validates parent match, merges updates, recomputes time buckets.
   */
  async update(
    parentId: string,
    subId: string,
    dto: UpdateSubEventDto,
    userId: string,
  ): Promise<AOGSubEventDocument> {
    const existing = await this.findById(parentId, subId);

    const updateData: Partial<AOGSubEvent> = {
      updatedBy: new Types.ObjectId(userId),
    };

    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.reasonCode !== undefined) updateData.reasonCode = dto.reasonCode;
    if (dto.actionTaken !== undefined) updateData.actionTaken = dto.actionTaken;
    if (dto.detectedAt !== undefined)
      updateData.detectedAt = new Date(dto.detectedAt);
    if (dto.clearedAt !== undefined)
      updateData.clearedAt = new Date(dto.clearedAt);
    if (dto.manpowerCount !== undefined)
      updateData.manpowerCount = dto.manpowerCount;
    if (dto.manHours !== undefined) updateData.manHours = dto.manHours;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    if (dto.departmentHandoffs !== undefined) {
      updateData.departmentHandoffs = dto.departmentHandoffs.map((h) => ({
        _id: new Types.ObjectId(),
        department: h.department,
        sentAt: new Date(h.sentAt),
        returnedAt: h.returnedAt ? new Date(h.returnedAt) : undefined,
        notes: h.notes,
      }));
    }

    // Build merged state for recomputation
    const merged: Partial<AOGSubEvent> = {
      detectedAt: updateData.detectedAt ?? existing.detectedAt,
      clearedAt: updateData.clearedAt ?? existing.clearedAt,
      departmentHandoffs:
        updateData.departmentHandoffs ?? existing.departmentHandoffs,
    };

    const buckets = this.computeTimeBuckets(merged);
    updateData.technicalTimeHours = buckets.technicalTimeHours;
    updateData.departmentTimeHours = buckets.departmentTimeHours;
    updateData.departmentTimeTotals = buckets.departmentTimeTotals;
    updateData.totalDowntimeHours = buckets.totalDowntimeHours;

    const updated = await this.subEventRepository.update(subId, updateData);
    if (!updated) {
      throw new NotFoundException(`Sub-event with ID ${subId} not found`);
    }

    return updated;
  }

  /**
   * Delete a sub-event. Validates it belongs to the specified parent before deleting.
   */
  async delete(parentId: string, subId: string): Promise<void> {
    await this.findById(parentId, subId);
    await this.subEventRepository.delete(subId);
  }

  /**
   * Add a Department Handoff to a sub-event.
   * Validates returnedAt >= sentAt, pushes to array, recomputes time buckets, saves atomically.
   */
  async addHandoff(
    parentId: string,
    subId: string,
    dto: CreateHandoffDto,
    userId: string,
  ): Promise<AOGSubEventDocument> {
    const subEvent = await this.findById(parentId, subId);

    if (dto.returnedAt) {
      const sentAt = new Date(dto.sentAt);
      const returnedAt = new Date(dto.returnedAt);
      if (returnedAt < sentAt) {
        throw new BadRequestException(
          'returnedAt must be greater than or equal to sentAt',
        );
      }
    }

    const newHandoff: DepartmentHandoff = {
      _id: new Types.ObjectId(),
      department: dto.department,
      sentAt: new Date(dto.sentAt),
      returnedAt: dto.returnedAt ? new Date(dto.returnedAt) : undefined,
      notes: dto.notes,
    };

    subEvent.departmentHandoffs.push(newHandoff);

    const buckets = this.computeTimeBuckets({
      detectedAt: subEvent.detectedAt,
      clearedAt: subEvent.clearedAt,
      departmentHandoffs: subEvent.departmentHandoffs,
    });

    const updated = await this.subEventRepository.update(subId, {
      departmentHandoffs: subEvent.departmentHandoffs,
      technicalTimeHours: buckets.technicalTimeHours,
      departmentTimeHours: buckets.departmentTimeHours,
      departmentTimeTotals: buckets.departmentTimeTotals,
      totalDowntimeHours: buckets.totalDowntimeHours,
      updatedBy: new Types.ObjectId(userId),
    });

    if (!updated) {
      throw new NotFoundException(`Sub-event with ID ${subId} not found`);
    }

    return updated;
  }

  /**
   * Update a Department Handoff within a sub-event.
   * Finds by handoffId, validates returnedAt >= sentAt on merged values, recomputes time buckets.
   */
  async updateHandoff(
    parentId: string,
    subId: string,
    handoffId: string,
    dto: UpdateHandoffDto,
    userId: string,
  ): Promise<AOGSubEventDocument> {
    const subEvent = await this.findById(parentId, subId);

    const handoffIndex = subEvent.departmentHandoffs.findIndex(
      (h) => h._id.toString() === handoffId,
    );

    if (handoffIndex === -1) {
      throw new NotFoundException(`Handoff with ID ${handoffId} not found`);
    }

    const existing = subEvent.departmentHandoffs[handoffIndex];

    // Merge existing values with updates
    const mergedSentAt = dto.sentAt ? new Date(dto.sentAt) : existing.sentAt;
    const mergedReturnedAt =
      dto.returnedAt !== undefined
        ? new Date(dto.returnedAt)
        : existing.returnedAt;

    if (mergedReturnedAt && mergedReturnedAt < mergedSentAt) {
      throw new BadRequestException(
        'returnedAt must be greater than or equal to sentAt',
      );
    }

    // Update handoff fields in place
    if (dto.department !== undefined) existing.department = dto.department;
    if (dto.sentAt !== undefined) existing.sentAt = new Date(dto.sentAt);
    if (dto.returnedAt !== undefined)
      existing.returnedAt = new Date(dto.returnedAt);
    if (dto.notes !== undefined) existing.notes = dto.notes;

    const buckets = this.computeTimeBuckets({
      detectedAt: subEvent.detectedAt,
      clearedAt: subEvent.clearedAt,
      departmentHandoffs: subEvent.departmentHandoffs,
    });

    const updated = await this.subEventRepository.update(subId, {
      departmentHandoffs: subEvent.departmentHandoffs,
      technicalTimeHours: buckets.technicalTimeHours,
      departmentTimeHours: buckets.departmentTimeHours,
      departmentTimeTotals: buckets.departmentTimeTotals,
      totalDowntimeHours: buckets.totalDowntimeHours,
      updatedBy: new Types.ObjectId(userId),
    });

    if (!updated) {
      throw new NotFoundException(`Sub-event with ID ${subId} not found`);
    }

    return updated;
  }

  /**
   * Remove a Department Handoff from a sub-event.
   * Finds by handoffId, removes from array, recomputes time buckets, saves atomically.
   */
  async removeHandoff(
    parentId: string,
    subId: string,
    handoffId: string,
    userId: string,
  ): Promise<AOGSubEventDocument> {
    const subEvent = await this.findById(parentId, subId);

    const handoffIndex = subEvent.departmentHandoffs.findIndex(
      (h) => h._id.toString() === handoffId,
    );

    if (handoffIndex === -1) {
      throw new NotFoundException(`Handoff with ID ${handoffId} not found`);
    }

    subEvent.departmentHandoffs.splice(handoffIndex, 1);

    const buckets = this.computeTimeBuckets({
      detectedAt: subEvent.detectedAt,
      clearedAt: subEvent.clearedAt,
      departmentHandoffs: subEvent.departmentHandoffs,
    });

    const updated = await this.subEventRepository.update(subId, {
      departmentHandoffs: subEvent.departmentHandoffs,
      technicalTimeHours: buckets.technicalTimeHours,
      departmentTimeHours: buckets.departmentTimeHours,
      departmentTimeTotals: buckets.departmentTimeTotals,
      totalDowntimeHours: buckets.totalDowntimeHours,
      updatedBy: new Types.ObjectId(userId),
    });

    if (!updated) {
      throw new NotFoundException(`Sub-event with ID ${subId} not found`);
    }

    return updated;
  }
}
