import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

export type AOGCostEntryDocument = AOGCostEntry & Document;

export const COST_DEPARTMENTS = [
  'QC',
  'Engineering',
  'Project Management',
  'Procurement',
  'Technical',
  'Others',
] as const;

export type CostDepartment = (typeof COST_DEPARTMENTS)[number];

@Schema({ ...baseSchemaOptions, collection: 'aogcostentries' })
export class AOGCostEntry {
  @Prop({ type: Types.ObjectId, ref: 'AOGEvent', required: true, index: true })
  parentEventId: Types.ObjectId;

  @Prop({ required: true, enum: COST_DEPARTMENTS })
  department: CostDepartment;

  @Prop({ required: true, min: 0 })
  internalCost: number;

  @Prop({ required: true, min: 0 })
  externalCost: number;

  @Prop()
  note?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AOGCostEntrySchema = SchemaFactory.createForClass(AOGCostEntry);

// Indexes
AOGCostEntrySchema.index({ parentEventId: 1, createdAt: -1 });
AOGCostEntrySchema.index({ parentEventId: 1 });
