import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from '../../database/base.schema';

export type BudgetActualDocument = BudgetActual & Document;

@Schema({ timestamps: true, collection: 'budgetactuals' })
export class BudgetActual extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'BudgetProject', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  termId: string;

  @Prop({ required: true })
  period: string; // YYYY-MM format

  @Prop({ type: Types.ObjectId, ref: 'Aircraft' })
  aircraftId?: Types.ObjectId;

  @Prop()
  aircraftType?: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop()
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const BudgetActualSchema = SchemaFactory.createForClass(BudgetActual);

// Indexes
BudgetActualSchema.index({ projectId: 1, termId: 1, period: 1 });
BudgetActualSchema.index({ projectId: 1, period: 1 });
BudgetActualSchema.index({ period: 1 });
