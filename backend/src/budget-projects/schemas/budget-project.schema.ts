import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type BudgetProjectDocument = BudgetProject & Document;

@Schema({ timestamps: true, collection: 'budgetprojects' })
export class BudgetProject {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  templateType: string; // e.g., "RSAF"

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: true,
  })
  dateRange: {
    start: Date;
    end: Date;
  };

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: true,
  })
  aircraftScope: {
    type: 'individual' | 'type' | 'group';
    aircraftIds?: Types.ObjectId[];
    aircraftTypes?: string[];
    fleetGroups?: string[];
  };

  @Prop({ required: true, enum: ['draft', 'active', 'closed'], default: 'draft' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const BudgetProjectSchema = SchemaFactory.createForClass(BudgetProject);

// Indexes
BudgetProjectSchema.index({ name: 1 }, { unique: true });
BudgetProjectSchema.index({ templateType: 1, status: 1 });
BudgetProjectSchema.index({ 'dateRange.start': 1, 'dateRange.end': 1 });
