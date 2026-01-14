import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  MaintenanceTaskRepository,
  MaintenanceTaskFilter,
  MaintenanceSummaryResult,
  AircraftCostRankingResult,
} from '../repositories/maintenance-task.repository';
import { MaintenanceTask, MaintenanceTaskDocument, Shift } from '../schemas/maintenance-task.schema';
import { CreateMaintenanceTaskDto } from '../dto/create-maintenance-task.dto';
import { UpdateMaintenanceTaskDto } from '../dto/update-maintenance-task.dto';

@Injectable()
export class MaintenanceTasksService {
  constructor(private readonly maintenanceTaskRepository: MaintenanceTaskRepository) {}

  /**
   * Creates a new maintenance task
   * Requirements: 5.1
   */
  async create(dto: CreateMaintenanceTaskDto, userId: string): Promise<MaintenanceTaskDocument> {
    const taskData: Partial<MaintenanceTask> = {
      aircraftId: new Types.ObjectId(dto.aircraftId),
      date: new Date(dto.date),
      shift: dto.shift as Shift,
      taskType: dto.taskType,
      taskDescription: dto.taskDescription,
      manpowerCount: dto.manpowerCount,
      manHours: dto.manHours,
      cost: dto.cost,
      workOrderRef: dto.workOrderRef ? new Types.ObjectId(dto.workOrderRef) : undefined,
      updatedBy: new Types.ObjectId(userId),
    };

    return this.maintenanceTaskRepository.create(taskData);
  }

  async findById(id: string): Promise<MaintenanceTaskDocument | null> {
    return this.maintenanceTaskRepository.findById(id);
  }

  async findAll(filter?: MaintenanceTaskFilter): Promise<MaintenanceTaskDocument[]> {
    return this.maintenanceTaskRepository.findAll(filter);
  }


  async update(
    id: string,
    dto: UpdateMaintenanceTaskDto,
    userId: string,
  ): Promise<MaintenanceTaskDocument | null> {
    const existingTask = await this.maintenanceTaskRepository.findById(id);
    if (!existingTask) {
      throw new NotFoundException(`Maintenance task with ID ${id} not found`);
    }

    const updateData: Partial<MaintenanceTask> = {
      updatedBy: new Types.ObjectId(userId),
    };

    if (dto.aircraftId) {
      updateData.aircraftId = new Types.ObjectId(dto.aircraftId);
    }
    if (dto.date) {
      updateData.date = new Date(dto.date);
    }
    if (dto.shift) {
      updateData.shift = dto.shift;
    }
    if (dto.taskType) {
      updateData.taskType = dto.taskType;
    }
    if (dto.taskDescription) {
      updateData.taskDescription = dto.taskDescription;
    }
    if (dto.manpowerCount !== undefined) {
      updateData.manpowerCount = dto.manpowerCount;
    }
    if (dto.manHours !== undefined) {
      updateData.manHours = dto.manHours;
    }
    if (dto.cost !== undefined) {
      updateData.cost = dto.cost;
    }
    if (dto.workOrderRef !== undefined) {
      updateData.workOrderRef = dto.workOrderRef
        ? new Types.ObjectId(dto.workOrderRef)
        : undefined;
    }

    return this.maintenanceTaskRepository.update(id, updateData);
  }

  async delete(id: string): Promise<MaintenanceTaskDocument | null> {
    return this.maintenanceTaskRepository.delete(id);
  }

  /**
   * Gets maintenance summary aggregated by specified dimensions
   * Requirements: 5.2
   */
  async getSummary(
    groupBy: ('date' | 'shift' | 'aircraftId' | 'taskType')[],
    startDate?: Date,
    endDate?: Date,
    aircraftId?: string,
  ): Promise<MaintenanceSummaryResult[]> {
    return this.maintenanceTaskRepository.aggregateSummary(
      groupBy,
      startDate,
      endDate,
      aircraftId,
    );
  }

  /**
   * Ranks aircraft by total maintenance cost
   * Requirements: 5.5
   */
  async getTopCostDrivers(
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<AircraftCostRankingResult[]> {
    return this.maintenanceTaskRepository.rankAircraftByCost(startDate, endDate, limit);
  }

  /**
   * Gets tasks linked to a specific work order
   * Requirements: 5.3
   */
  async findByWorkOrder(workOrderId: string): Promise<MaintenanceTaskDocument[]> {
    return this.maintenanceTaskRepository.findByWorkOrder(workOrderId);
  }

  /**
   * Gets all distinct task types
   */
  async getDistinctTaskTypes(): Promise<string[]> {
    return this.maintenanceTaskRepository.getDistinctTaskTypes();
  }
}
