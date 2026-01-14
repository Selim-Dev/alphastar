import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

export type BudgetPlanDocument = BudgetPlan & Document;

@Schema(baseSchemaOptions)
export class BudgetPlan {
  @Prop({ required: true, index: true })
  fiscalYear: number;

  @Prop({ required: true })
  clauseId: number;

  @Prop({ required: true })
  clauseDescription: string;

  @Prop({ required: true, index: true })
  aircraftGroup: string;

  @Prop({ required: true, min: 0 })
  plannedAmount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ type: Boolean })
  isDemo?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BudgetPlanSchema = SchemaFactory.createForClass(BudgetPlan);

// Compound index for unique budget plan per fiscal year, clause, and aircraft group
BudgetPlanSchema.index(
  { fiscalYear: 1, clauseId: 1, aircraftGroup: 1 },
  { unique: true },
);

// Index for fiscal year queries
BudgetPlanSchema.index({ fiscalYear: 1 });

// Index for clause-based queries
BudgetPlanSchema.index({ clauseId: 1 });
