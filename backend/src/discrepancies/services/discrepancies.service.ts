import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  DiscrepancyRepository,
  DiscrepancyFilter,
  ATAChapterAnalyticsResult,
} from '../repositories/discrepancy.repository';
import { Discrepancy, DiscrepancyDocument, ResponsibleParty } from '../schemas/discrepancy.schema';
import { CreateDiscrepancyDto } from '../dto/create-discrepancy.dto';
import { UpdateDiscrepancyDto } from '../dto/update-discrepancy.dto';

@Injectable()
export class DiscrepanciesService {
  constructor(private readonly discrepancyRepository: DiscrepancyRepository) {}

  /**
   * Creates a new discrepancy with ATA chapter
   * Requirements: 6.3
   */
  async create(dto: CreateDiscrepancyDto, userId: string): Promise<DiscrepancyDocument> {
    const discrepancyData: Partial<Discrepancy> = {
      aircraftId: new Types.ObjectId(dto.aircraftId),
      dateDetected: new Date(dto.dateDetected),
      ataChapter: dto.ataChapter,
      discrepancyText: dto.discrepancyText,
      dateCorrected: dto.dateCorrected ? new Date(dto.dateCorrected) : undefined,
      correctiveAction: dto.correctiveAction,
      responsibility: dto.responsibility as ResponsibleParty,
      type: dto.type,
      downtimeHours: dto.downtimeHours,
      updatedBy: new Types.ObjectId(userId),
    };

    return this.discrepancyRepository.create(discrepancyData);
  }

  async findById(id: string): Promise<DiscrepancyDocument | null> {
    return this.discrepancyRepository.findById(id);
  }

  async findAll(filter?: DiscrepancyFilter): Promise<DiscrepancyDocument[]> {
    return this.discrepancyRepository.findAll(filter);
  }


  async update(
    id: string,
    dto: UpdateDiscrepancyDto,
    userId: string,
  ): Promise<DiscrepancyDocument | null> {
    const existingDiscrepancy = await this.discrepancyRepository.findById(id);
    if (!existingDiscrepancy) {
      throw new NotFoundException(`Discrepancy with ID ${id} not found`);
    }

    const updateData: Partial<Discrepancy> = {
      updatedBy: new Types.ObjectId(userId),
    };

    if (dto.aircraftId) {
      updateData.aircraftId = new Types.ObjectId(dto.aircraftId);
    }
    if (dto.dateDetected) {
      updateData.dateDetected = new Date(dto.dateDetected);
    }
    if (dto.ataChapter) {
      updateData.ataChapter = dto.ataChapter;
    }
    if (dto.discrepancyText) {
      updateData.discrepancyText = dto.discrepancyText;
    }
    if (dto.dateCorrected) {
      updateData.dateCorrected = new Date(dto.dateCorrected);
    }
    if (dto.correctiveAction !== undefined) {
      updateData.correctiveAction = dto.correctiveAction;
    }
    if (dto.responsibility !== undefined) {
      updateData.responsibility = dto.responsibility as ResponsibleParty;
    }
    if (dto.type !== undefined) {
      updateData.type = dto.type;
    }
    if (dto.downtimeHours !== undefined) {
      updateData.downtimeHours = dto.downtimeHours;
    }

    return this.discrepancyRepository.update(id, updateData);
  }

  async delete(id: string): Promise<DiscrepancyDocument | null> {
    return this.discrepancyRepository.delete(id);
  }

  /**
   * Aggregates discrepancies by ATA chapter
   * Requirements: 6.4
   */
  async getATAChapterAnalytics(
    aircraftId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ATAChapterAnalyticsResult[]> {
    return this.discrepancyRepository.getATAChapterAnalytics(aircraftId, startDate, endDate);
  }

  /**
   * Gets top N ATA chapters by discrepancy count
   * Requirements: 6.4
   */
  async getTopATAChapters(
    limit: number = 10,
    aircraftId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ATAChapterAnalyticsResult[]> {
    return this.discrepancyRepository.getTopATAChapters(limit, aircraftId, startDate, endDate);
  }

  /**
   * Counts discrepancies by aircraft
   */
  async countByAircraft(aircraftId: string): Promise<number> {
    return this.discrepancyRepository.countByAircraft(aircraftId);
  }

  /**
   * Counts uncorrected discrepancies
   */
  async countUncorrected(aircraftId?: string): Promise<number> {
    return this.discrepancyRepository.countUncorrected(aircraftId);
  }
}
