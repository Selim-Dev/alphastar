import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

export type ImportLogDocument = ImportLog & Document;

export interface ImportError {
  row: number;
  message: string;
}

export enum ImportType {
  Utilization = 'utilization',
  MaintenanceTasks = 'maintenance_tasks',
  AOGEvents = 'aog_events',
  Budget = 'budget',
  Aircraft = 'aircraft',
  DailyStatus = 'daily_status',
  WorkOrderSummary = 'work_order_summary',
  VacationPlan = 'vacation_plan',
}

@Schema(baseSchemaOptions)
export class ImportLog {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  s3Key: string;

  @Prop({ required: true, enum: ImportType, index: true })
  importType: ImportType;

  @Prop({ required: true, min: 0 })
  rowCount: number;

  @Prop({ required: true, min: 0 })
  successCount: number;

  @Prop({ required: true, min: 0 })
  errorCount: number;

  @Prop({ type: [{ row: Number, message: String }], default: [] })
  errors: ImportError[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  importedBy: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ImportLogSchema = SchemaFactory.createForClass(ImportLog);

// Index for user-based queries
ImportLogSchema.index({ importedBy: 1, createdAt: -1 });

// Index for type-based queries
ImportLogSchema.index({ importType: 1, createdAt: -1 });

// Index for date-based queries
ImportLogSchema.index({ createdAt: -1 });
