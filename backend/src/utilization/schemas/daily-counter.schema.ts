import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

export type DailyCounterDocument = DailyCounter & Document;

@Schema(baseSchemaOptions)
export class DailyCounter {
  @Prop({ type: Types.ObjectId, ref: 'Aircraft', required: true, index: true })
  aircraftId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: Date;

  @Prop({ required: true, min: 0 })
  airframeHoursTtsn: number;

  @Prop({ required: true, min: 0 })
  airframeCyclesTcsn: number;

  @Prop({ required: true, min: 0 })
  engine1Hours: number;

  @Prop({ required: true, min: 0 })
  engine1Cycles: number;

  @Prop({ required: true, min: 0 })
  engine2Hours: number;

  @Prop({ required: true, min: 0 })
  engine2Cycles: number;

  @Prop({ min: 0 })
  engine3Hours?: number;

  @Prop({ min: 0 })
  engine3Cycles?: number;

  @Prop({ min: 0 })
  engine4Hours?: number;

  @Prop({ min: 0 })
  engine4Cycles?: number;

  @Prop({ required: true, min: 0 })
  apuHours: number;

  @Prop({ min: 0 })
  apuCycles?: number;

  @Prop()
  lastFlightDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: Boolean })
  isDemo?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DailyCounterSchema = SchemaFactory.createForClass(DailyCounter);

// Compound index on aircraftId + date for efficient queries and uniqueness
DailyCounterSchema.index({ aircraftId: 1, date: -1 }, { unique: true });

// Index for date-based queries
DailyCounterSchema.index({ date: -1 });
