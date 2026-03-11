import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  AOGEventRepository,
  AOGEventFilter,
} from '../repositories/aog-event.repository';
import { AOGSubEventRepository } from '../repositories/aog-sub-event.repository';
import { CreateAOGEventDto } from '../dto/create-aog-event.dto';
import { UpdateAOGEventDto } from '../dto/update-aog-event.dto';
import { FilterAOGEventDto } from '../dto/filter-aog-event.dto';
import { AOGEventDocument } from '../schemas/aog-event.schema';
import { AOGSubEventDocument } from '../schemas/aog-sub-event.schema';

interface PopulatedAircraft {
  _id: string;
  registration: string;
  fleetGroup: string;
  aircraftType?: string;
}

export interface ParentEventListItem {
  _id: string;
  aircraftId: unknown;
  aircraft?: { _id: string; registration: string; fleetGroup: string };
  detectedAt: Date;
  clearedAt?: Date;
  location?: string;
  notes?: string;
  totalDowntimeHours: number;
  subEventCount: number;
  categories: string[];
  status: 'active' | 'completed';
  totalTechnicalTime: number;
  totalDepartmentTime: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ParentEventDetailResponse extends ParentEventListItem {
  subEvents: AOGSubEventDocument[];
}

export interface AnalyticsSummary {
  totalParentEvents: number;
  activeParentEvents: number;
  completedParentEvents: number;
  totalSubEvents: number;
  totalDowntimeHours: number;
}

export interface CategoryBreakdownItem {
  category: string;
  subEventCount: number;
  totalDowntimeHours: number;
  percentage: number;
}

export interface TimeBreakdown {
  technicalTimeHours: number;
  technicalTimePercentage: number;
  departmentTotals: {
    department: string;
    totalHours: number;
    percentage: number;
  }[];
  grandTotalHours: number;
}

function extractAircraft(
  event: AOGEventDocument,
): { _id: string; registration: string; fleetGroup: string } | undefined {
  const populated = event.aircraftId as unknown as PopulatedAircraft | undefined;
  if (populated && typeof populated === 'object' && 'registration' in populated) {
    return {
      _id: String(populated._id),
      registration: populated.registration,
      fleetGroup: populated.fleetGroup,
    };
  }
  return undefined;
}

function toListItem(
  event: AOGEventDocument,
  subEventCount: number,
  categories: string[],
  totalTechnicalTime: number,
  totalDepartmentTime: number,
): ParentEventListItem {
  const status: 'active' | 'completed' = event.clearedAt ? 'completed' : 'active';
  return {
    _id: event._id.toString(),
    aircraftId: event.aircraftId,
    aircraft: extractAircraft(event),
    detectedAt: event.detectedAt,
    clearedAt: event.clearedAt,
    location: event.location,
    notes: event.notes,
    totalDowntimeHours: event.totalDowntimeHours || 0,
    subEventCount,
    categories,
    status,
    totalTechnicalTime,
    totalDepartmentTime,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

function buildFilter(filter?: FilterAOGEventDto): AOGEventFilter {
  const converted: AOGEventFilter = {};
  if (filter?.aircraftId) converted.aircraftId = filter.aircraftId;
  if (filter?.fleetGroup) converted.fleetGroup = filter.fleetGroup;
  if (filter?.status === 'active') converted.status = 'active';
  else if (filter?.status === 'completed') converted.status = 'completed';
  if (filter?.startDate) converted.startDate = new Date(filter.startDate);
  if (filter?.endDate) converted.endDate = new Date(filter.endDate);
  return converted;
}

@Injectable()
export class AOGEventsService {
  constructor(
    private readonly aogEventRepository: AOGEventRepository,
    private readonly subEventRepository: AOGSubEventRepository,
  ) {}

  async create(
    dto: CreateAOGEventDto,
    userId: string,
  ): Promise<AOGEventDocument> {
    const detectedAt = new Date(dto.detectedAt);
    const clearedAt = dto.clearedAt ? new Date(dto.clearedAt) : undefined;

    if (clearedAt && clearedAt < detectedAt) {
      throw new BadRequestException(
        'clearedAt must be greater than or equal to detectedAt',
      );
    }

    const endTime = clearedAt || new Date();
    const totalDowntimeHours = Math.max(
      0,
      (endTime.getTime() - detectedAt.getTime()) / (1000 * 60 * 60),
    );

    return this.aogEventRepository.create({
      aircraftId: new Types.ObjectId(dto.aircraftId),
      detectedAt,
      clearedAt,
      location: dto.location,
      notes: dto.notes,
      updatedBy: new Types.ObjectId(userId),
      totalDowntimeHours,
    });
  }

  async findById(id: string): Promise<ParentEventDetailResponse | null> {
    const event = await this.aogEventRepository.findById(id);
    if (!event) return null;

    const subEvents = await this.subEventRepository.findByParentId(id);
    const categories = [...new Set(subEvents.map((se) => se.category))];
    const totalTechnicalTime = subEvents.reduce(
      (sum, se) => sum + (se.technicalTimeHours || 0),
      0,
    );
    const totalDepartmentTime = subEvents.reduce(
      (sum, se) => sum + (se.departmentTimeHours || 0),
      0,
    );

    return {
      ...toListItem(event, subEvents.length, categories, totalTechnicalTime, totalDepartmentTime),
      subEvents,
    };
  }

  async findAll(filter?: FilterAOGEventDto): Promise<ParentEventListItem[]> {
    const events = await this.aogEventRepository.findAll(buildFilter(filter));

    const results: ParentEventListItem[] = [];
    for (const event of events) {
      const subEvents = await this.subEventRepository.findByParentId(
        event._id.toString(),
      );
      const categories = [...new Set(subEvents.map((se) => se.category))];
      const totalTechnicalTime = subEvents.reduce(
        (sum, se) => sum + (se.technicalTimeHours || 0),
        0,
      );
      const totalDepartmentTime = subEvents.reduce(
        (sum, se) => sum + (se.departmentTimeHours || 0),
        0,
      );

      results.push(
        toListItem(event, subEvents.length, categories, totalTechnicalTime, totalDepartmentTime),
      );
    }

    return results;
  }


  async update(
    id: string,
    dto: UpdateAOGEventDto,
    userId: string,
  ): Promise<AOGEventDocument> {
    const existing = await this.aogEventRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`AOG event with ID ${id} not found`);
    }

    const updateData: Record<string, unknown> = {
      updatedBy: new Types.ObjectId(userId),
    };

    if (dto.clearedAt !== undefined) {
      const clearedAt = dto.clearedAt ? new Date(dto.clearedAt) : null;
      if (clearedAt && clearedAt < existing.detectedAt) {
        throw new BadRequestException(
          'clearedAt must be greater than or equal to detectedAt',
        );
      }
      updateData.clearedAt = clearedAt;

      const endTime = clearedAt || new Date();
      updateData.totalDowntimeHours = Math.max(
        0,
        (endTime.getTime() - existing.detectedAt.getTime()) / (1000 * 60 * 60),
      );
    }

    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await this.aogEventRepository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`AOG event with ID ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.aogEventRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`AOG event with ID ${id} not found`);
    }

    await this.subEventRepository.deleteByParentId(id);
    await this.aogEventRepository.delete(id);
  }

  async getActiveAOGEvents(): Promise<ParentEventListItem[]> {
    return this.findAll({ status: 'active' } as FilterAOGEventDto);
  }

  async countActiveAOGEvents(): Promise<number> {
    return this.aogEventRepository.countActive();
  }

  private async getFilteredSubEvents(
    filter: FilterAOGEventDto,
  ): Promise<{
    parents: AOGEventDocument[];
    subEvents: AOGSubEventDocument[];
  }> {
    const parents = await this.aogEventRepository.findAll(buildFilter(filter));

    const subEvents: AOGSubEventDocument[] = [];
    for (const parent of parents) {
      const subs = await this.subEventRepository.findByParentId(
        parent._id.toString(),
      );
      subEvents.push(...subs);
    }

    return { parents, subEvents };
  }

  async getAnalyticsSummary(
    filter: FilterAOGEventDto,
  ): Promise<AnalyticsSummary> {
    const { parents, subEvents } = await this.getFilteredSubEvents(filter);

    return {
      totalParentEvents: parents.length,
      activeParentEvents: parents.filter((p) => !p.clearedAt).length,
      completedParentEvents: parents.filter((p) => !!p.clearedAt).length,
      totalSubEvents: subEvents.length,
      totalDowntimeHours: parents.reduce(
        (sum, p) => sum + (p.totalDowntimeHours || 0),
        0,
      ),
    };
  }

  async getCategoryBreakdown(
    filter: FilterAOGEventDto,
  ): Promise<CategoryBreakdownItem[]> {
    const { subEvents } = await this.getFilteredSubEvents(filter);

    const filtered = filter.category
      ? subEvents.filter((se) => se.category === String(filter.category))
      : subEvents;

    const categoryMap = new Map<string, { count: number; downtime: number }>();
    for (const se of filtered) {
      const existing = categoryMap.get(se.category) || { count: 0, downtime: 0 };
      existing.count += 1;
      existing.downtime += se.totalDowntimeHours || 0;
      categoryMap.set(se.category, existing);
    }

    const totalDowntime = Array.from(categoryMap.values()).reduce(
      (sum, v) => sum + v.downtime,
      0,
    );

    const result: CategoryBreakdownItem[] = [];
    for (const [category, data] of categoryMap.entries()) {
      result.push({
        category,
        subEventCount: data.count,
        totalDowntimeHours: data.downtime,
        percentage:
          totalDowntime > 0 ? (data.downtime / totalDowntime) * 100 : 0,
      });
    }

    return result;
  }

  async getTimeBreakdown(filter: FilterAOGEventDto): Promise<TimeBreakdown> {
    const { subEvents } = await this.getFilteredSubEvents(filter);

    let technicalTimeHours = 0;
    const departmentMap = new Map<string, number>();

    for (const se of subEvents) {
      technicalTimeHours += se.technicalTimeHours || 0;

      if (se.departmentTimeTotals) {
        for (const [dept, hours] of Object.entries(se.departmentTimeTotals)) {
          departmentMap.set(dept, (departmentMap.get(dept) || 0) + hours);
        }
      }
    }

    const totalDepartmentHours = Array.from(departmentMap.values()).reduce(
      (sum, h) => sum + h,
      0,
    );
    const grandTotalHours = technicalTimeHours + totalDepartmentHours;

    const departmentTotals = Array.from(departmentMap.entries()).map(
      ([department, totalHours]) => ({
        department,
        totalHours,
        percentage:
          grandTotalHours > 0 ? (totalHours / grandTotalHours) * 100 : 0,
      }),
    );

    return {
      technicalTimeHours,
      technicalTimePercentage:
        grandTotalHours > 0
          ? (technicalTimeHours / grandTotalHours) * 100
          : 0,
      departmentTotals,
      grandTotalHours,
    };
  }
}
