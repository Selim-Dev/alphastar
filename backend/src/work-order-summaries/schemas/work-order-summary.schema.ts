import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

export type WorkOrderSummaryDocument = WorkOrderSummary & Document;

/**
 * WorkOrderSummary Schema
 * Monthly aggregated work order count per aircraft
 * Requirements: 11.1
 */
@Schema(baseSchemaOptions)
export class WorkOrderSummary {
  @Prop({ type: Types.ObjectId, ref: 'Aircraft', required: true, index: true })
  aircraftId: Types.ObjectId;

  @Prop({ required: true, index: true })
  period: string; // YYYY-MM format

  @Prop({ required: true, min: 0 })
  workOrderCount: number;

  @Prop({ min: 0 })
  totalCost?: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop()
  notes?: string;

  @Prop()
  sourceRef?: string; // Reference to external system

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: Boolean })
  isDemo?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const WorkOrderSummarySchema = SchemaFactory.createForClass(WorkOrderSummary);

// Unique compound index on (aircraftId, period) for upsert behavior
// Requirements: 11.1, 11.3
WorkOrderSummarySchema.index({ aircraftId: 1, period: 1 }, { unique: true });

// Index on period for date-range queries
WorkOrderSummarySchema.index({ period: -1 });
