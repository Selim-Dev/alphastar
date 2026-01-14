import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

export type DailyStatusDocument = DailyStatus & Document;

@Schema(baseSchemaOptions)
export class DailyStatus {
  @Prop({ type: Types.ObjectId, ref: 'Aircraft', required: true, index: true })
  aircraftId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: Date;

  @Prop({ required: true, min: 0, max: 24, default: 24 })
  posHours: number;

  @Prop({ required: true, min: 0, max: 24, default: 24 })
  fmcHours: number;

  @Prop({ required: true, min: 0, max: 24, default: 0 })
  nmcmSHours: number;

  @Prop({ required: true, min: 0, max: 24, default: 0 })
  nmcmUHours: number;

  @Prop({ min: 0, max: 24 })
  nmcsHours?: number;

  @Prop()
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: Boolean })
  isDemo?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DailyStatusSchema = SchemaFactory.createForClass(DailyStatus);

// Compound index on aircraftId + date for efficient queries and uniqueness
DailyStatusSchema.index({ aircraftId: 1, date: -1 }, { unique: true });

// Index for date-based queries
DailyStatusSchema.index({ date: -1 });
