import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

export type MaintenanceTaskDocument = MaintenanceTask & Document;

export enum Shift {
  Morning = 'Morning',
  Evening = 'Evening',
  Night = 'Night',
  Other = 'Other',
}

@Schema(baseSchemaOptions)
export class MaintenanceTask {
  @Prop({ type: Types.ObjectId, ref: 'Aircraft', required: true, index: true })
  aircraftId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: Date;

  @Prop({ required: true, enum: Shift })
  shift: Shift;

  @Prop({ required: true })
  taskType: string;

  @Prop({ required: true })
  taskDescription: string;

  @Prop({ required: true, min: 0 })
  manpowerCount: number;

  @Prop({ required: true, min: 0 })
  manHours: number;

  @Prop({ min: 0 })
  cost?: number;

  @Prop({ type: Types.ObjectId, ref: 'WorkOrder' })
  workOrderRef?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: Boolean })
  isDemo?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MaintenanceTaskSchema = SchemaFactory.createForClass(MaintenanceTask);

// Index on aircraftId for efficient queries
MaintenanceTaskSchema.index({ aircraftId: 1, date: -1 });

// Index on date for date-based queries
MaintenanceTaskSchema.index({ date: -1 });

// Index for shift-based queries
MaintenanceTaskSchema.index({ date: -1, shift: 1 });

// Index for task type aggregations
MaintenanceTaskSchema.index({ taskType: 1, date: -1 });
