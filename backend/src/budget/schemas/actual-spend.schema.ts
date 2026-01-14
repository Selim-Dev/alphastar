import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

export type ActualSpendDocument = ActualSpend & Document;

@Schema(baseSchemaOptions)
export class ActualSpend {
  @Prop({ required: true, index: true })
  period: string; // YYYY-MM format

  @Prop({ index: true })
  aircraftGroup?: string;

  @Prop({ type: Types.ObjectId, ref: 'Aircraft', index: true })
  aircraftId?: Types.ObjectId;

  @Prop({ required: true, index: true })
  clauseId: number;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop()
  vendor?: string;

  @Prop()
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: Boolean })
  isDemo?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ActualSpendSchema = SchemaFactory.createForClass(ActualSpend);

// Index for period and clause queries
ActualSpendSchema.index({ period: 1, clauseId: 1 });

// Index for aircraft group queries
ActualSpendSchema.index({ aircraftGroup: 1, period: 1 });

// Index for aircraft-specific queries
ActualSpendSchema.index({ aircraftId: 1, period: 1 });
