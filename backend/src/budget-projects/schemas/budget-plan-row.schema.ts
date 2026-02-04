import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from '../../database/base.schema';

export type BudgetPlanRowDocument = BudgetPlanRow & Document;

@Schema({ timestamps: true, collection: 'budgetplanrows' })
export class BudgetPlanRow extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'BudgetProject', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  termId: string; // e.g., "off-base-maint-intl"

  @Prop({ required: true })
  termName: string; // Display name

  @Prop({ required: true })
  termCategory: string; // Category grouping

  @Prop({ type: Types.ObjectId, ref: 'Aircraft' })
  aircraftId?: Types.ObjectId;

  @Prop()
  aircraftType?: string;

  @Prop({ required: true, default: 0, min: 0 })
  plannedAmount: number;
}

export const BudgetPlanRowSchema = SchemaFactory.createForClass(BudgetPlanRow);

// Indexes
BudgetPlanRowSchema.index({ projectId: 1, termId: 1, aircraftId: 1 }, { unique: true });
BudgetPlanRowSchema.index({ projectId: 1 });
BudgetPlanRowSchema.index({ termId: 1 });
