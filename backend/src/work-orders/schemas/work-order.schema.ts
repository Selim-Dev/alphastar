import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

export type WorkOrderDocument = WorkOrder & Document;

export enum WorkOrderStatus {
  Open = 'Open',
  InProgress = 'InProgress',
  Closed = 'Closed',
  Deferred = 'Deferred',
}

@Schema(baseSchemaOptions)
export class WorkOrder {
  @Prop({ required: true, unique: true })
  woNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Aircraft', required: true, index: true })
  aircraftId: Types.ObjectId;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: WorkOrderStatus, default: WorkOrderStatus.Open })
  status: WorkOrderStatus;

  @Prop({ required: true })
  dateIn: Date;

  @Prop()
  dateOut?: Date;

  @Prop()
  dueDate?: Date;

  @Prop()
  crsNumber?: string;

  @Prop()
  mrNumber?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: Boolean })
  isDemo?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const WorkOrderSchema = SchemaFactory.createForClass(WorkOrder);

// Unique index on woNumber
WorkOrderSchema.index({ woNumber: 1 }, { unique: true });

// Index on aircraftId and status for efficient queries
WorkOrderSchema.index({ aircraftId: 1, status: 1 });

// Index on dueDate and status for overdue detection
WorkOrderSchema.index({ dueDate: 1, status: 1 });
