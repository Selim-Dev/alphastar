import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AOGCostEntryRepository } from '../repositories/aog-cost-entry.repository';
import { AOGEventRepository } from '../repositories/aog-event.repository';
import {
  AOGCostEntry,
  AOGCostEntryDocument,
} from '../schemas/aog-cost-entry.schema';
import { CreateCostEntryDto } from '../dto/create-cost-entry.dto';
import { UpdateCostEntryDto } from '../dto/update-cost-entry.dto';

@Injectable()
export class AOGCostEntriesService {
  constructor(
    private readonly costEntryRepository: AOGCostEntryRepository,
    private readonly eventRepository: AOGEventRepository,
  ) {}

  async create(
    parentId: string,
    dto: CreateCostEntryDto,
    userId: string,
  ): Promise<AOGCostEntryDocument> {
    const parentEvent = await this.eventRepository.findById(parentId);
    if (!parentEvent) {
      throw new BadRequestException(`AOG event with ID ${parentId} not found`);
    }

    return this.costEntryRepository.create({
      parentEventId: new Types.ObjectId(parentId),
      department: dto.department,
      internalCost: dto.internalCost,
      externalCost: dto.externalCost,
      note: dto.note,
      updatedBy: new Types.ObjectId(userId),
    });
  }

  async findByParentId(parentId: string): Promise<AOGCostEntryDocument[]> {
    return this.costEntryRepository.findByParentId(parentId);
  }

  async findById(
    parentId: string,
    entryId: string,
  ): Promise<AOGCostEntryDocument> {
    const entry = await this.costEntryRepository.findById(entryId);
    if (!entry) {
      throw new NotFoundException(`Cost entry with ID ${entryId} not found`);
    }
    if (entry.parentEventId.toString() !== parentId) {
      throw new NotFoundException(
        `Cost entry with ID ${entryId} not found under parent ${parentId}`,
      );
    }
    return entry;
  }

  async update(
    parentId: string,
    entryId: string,
    dto: UpdateCostEntryDto,
    userId: string,
  ): Promise<AOGCostEntryDocument> {
    await this.findById(parentId, entryId);

    const updateData: Partial<AOGCostEntry> = {
      updatedBy: new Types.ObjectId(userId),
    };
    if (dto.department !== undefined) updateData.department = dto.department;
    if (dto.internalCost !== undefined)
      updateData.internalCost = dto.internalCost;
    if (dto.externalCost !== undefined)
      updateData.externalCost = dto.externalCost;
    if (dto.note !== undefined) updateData.note = dto.note;

    const updated = await this.costEntryRepository.update(entryId, updateData);
    if (!updated) {
      throw new NotFoundException(`Cost entry with ID ${entryId} not found`);
    }
    return updated;
  }

  async delete(parentId: string, entryId: string): Promise<void> {
    await this.findById(parentId, entryId);
    await this.costEntryRepository.delete(entryId);
  }
}
