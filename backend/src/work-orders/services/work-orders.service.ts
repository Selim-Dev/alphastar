import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { Types } from 'mongoose';
import { 
  WorkOrderRepository, 
  WorkOrderFilter, 
  StatusDistributionResult,
  TurnaroundResult 
} from '../repositories/work-order.repository';
import { WorkOrder, WorkOrderDocument, WorkOrderStatus } from '../schemas/work-order.schema';
import { CreateWorkOrderDto } from '../dto/create-work-order.dto';
import { UpdateWorkOrderDto } from '../dto/update-work-order.dto';

export interface WorkOrderWithMetrics extends WorkOrder {
  turnaroundDays?: number;
  isOverdue?: boolean;
}

@Injectable()
export class WorkOrdersService {
  constructor(private readonly workOrderRepository: WorkOrderRepository) {}

  /**
   * Creates a new work order with status management
   * Requirements: 6.1
   */
  async create(dto: CreateWorkOrderDto, userId: string): Promise<WorkOrderDocument> {
    // Check for duplicate woNumber
    const existing = await this.workOrderRepository.findByWoNumber(dto.woNumber);
    if (existing) {
      throw new ConflictException(`Work order with number ${dto.woNumber} already exists`);
    }

    const workOrderData: Partial<WorkOrder> = {
      woNumber: dto.woNumber,
      aircraftId: new Types.ObjectId(dto.aircraftId),
      description: dto.description,
      status: dto.status || WorkOrderStatus.Open,
      dateIn: new Date(dto.dateIn),
      dateOut: dto.dateOut ? new Date(dto.dateOut) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      crsNumber: dto.crsNumber,
      mrNumber: dto.mrNumber,
      updatedBy: new Types.ObjectId(userId),
    };

    return this.workOrderRepository.create(workOrderData);
  }


  /**
   * Computes turnaround time in days for closed work orders
   * Requirements: 6.2
   */
  computeTurnaroundTime(dateIn: Date, dateOut: Date): number {
    const durationMs = dateOut.getTime() - dateIn.getTime();
    const durationDays = durationMs / (1000 * 60 * 60 * 24);
    return Math.round(durationDays * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Checks if a work order is overdue
   * Requirements: 6.6
   */
  isOverdue(workOrder: WorkOrder): boolean {
    if (!workOrder.dueDate) return false;
    if (workOrder.status === WorkOrderStatus.Closed) return false;
    return new Date(workOrder.dueDate) < new Date();
  }

  async findById(id: string): Promise<WorkOrderWithMetrics | null> {
    const workOrder = await this.workOrderRepository.findById(id);
    if (!workOrder) return null;
    return this.addMetrics(workOrder);
  }

  async findByWoNumber(woNumber: string): Promise<WorkOrderWithMetrics | null> {
    const workOrder = await this.workOrderRepository.findByWoNumber(woNumber);
    if (!workOrder) return null;
    return this.addMetrics(workOrder);
  }

  async findAll(filter?: WorkOrderFilter): Promise<WorkOrderWithMetrics[]> {
    const workOrders = await this.workOrderRepository.findAll(filter);
    return workOrders.map((wo) => this.addMetrics(wo));
  }

  private addMetrics(workOrder: WorkOrderDocument): WorkOrderWithMetrics {
    const woObj = workOrder.toObject() as WorkOrderWithMetrics;
    
    // Add turnaround time for closed orders
    if (workOrder.status === WorkOrderStatus.Closed && workOrder.dateOut) {
      woObj.turnaroundDays = this.computeTurnaroundTime(
        workOrder.dateIn,
        workOrder.dateOut,
      );
    }
    
    // Add overdue flag
    woObj.isOverdue = this.isOverdue(workOrder);
    
    return woObj;
  }

  async update(
    id: string,
    dto: UpdateWorkOrderDto,
    userId: string,
  ): Promise<WorkOrderDocument | null> {
    const existingWorkOrder = await this.workOrderRepository.findById(id);
    if (!existingWorkOrder) {
      throw new NotFoundException(`Work order with ID ${id} not found`);
    }

    // Check for duplicate woNumber if updating
    if (dto.woNumber && dto.woNumber !== existingWorkOrder.woNumber) {
      const duplicate = await this.workOrderRepository.findByWoNumber(dto.woNumber);
      if (duplicate) {
        throw new ConflictException(`Work order with number ${dto.woNumber} already exists`);
      }
    }

    const updateData: Partial<WorkOrder> = {
      updatedBy: new Types.ObjectId(userId),
    };

    if (dto.woNumber) {
      updateData.woNumber = dto.woNumber;
    }
    if (dto.aircraftId) {
      updateData.aircraftId = new Types.ObjectId(dto.aircraftId);
    }
    if (dto.description) {
      updateData.description = dto.description;
    }
    if (dto.status) {
      updateData.status = dto.status;
    }
    if (dto.dateIn) {
      updateData.dateIn = new Date(dto.dateIn);
    }
    if (dto.dateOut) {
      updateData.dateOut = new Date(dto.dateOut);
    }
    if (dto.dueDate) {
      updateData.dueDate = new Date(dto.dueDate);
    }
    if (dto.crsNumber !== undefined) {
      updateData.crsNumber = dto.crsNumber;
    }
    if (dto.mrNumber !== undefined) {
      updateData.mrNumber = dto.mrNumber;
    }

    return this.workOrderRepository.update(id, updateData);
  }

  async delete(id: string): Promise<WorkOrderDocument | null> {
    return this.workOrderRepository.delete(id);
  }

  /**
   * Gets overdue work orders
   * Requirements: 6.6
   */
  async getOverdueWorkOrders(aircraftId?: string): Promise<WorkOrderWithMetrics[]> {
    const workOrders = await this.workOrderRepository.findOverdueWorkOrders(aircraftId);
    return workOrders.map((wo) => this.addMetrics(wo));
  }

  /**
   * Gets status distribution
   * Requirements: 6.5
   */
  async getStatusDistribution(
    aircraftId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StatusDistributionResult[]> {
    return this.workOrderRepository.getStatusDistribution(aircraftId, startDate, endDate);
  }

  /**
   * Gets turnaround time statistics
   * Requirements: 6.2
   */
  async getTurnaroundStats(
    aircraftId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TurnaroundResult | null> {
    return this.workOrderRepository.getTurnaroundStats(aircraftId, startDate, endDate);
  }

  /**
   * Counts overdue work orders
   */
  async countOverdueWorkOrders(aircraftId?: string): Promise<number> {
    return this.workOrderRepository.countOverdueWorkOrders(aircraftId);
  }

  /**
   * Validates that a work order exists (for linking from maintenance tasks)
   * Requirements: 5.3
   */
  async validateWorkOrderExists(woNumber: string): Promise<boolean> {
    const workOrder = await this.workOrderRepository.findByWoNumber(woNumber);
    return workOrder !== null;
  }
}
