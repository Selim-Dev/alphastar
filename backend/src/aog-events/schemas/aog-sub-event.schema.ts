import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

// --- DepartmentHandoff embedded sub-document ---

@Schema({ _id: true })
export class DepartmentHandoff {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['QC', 'Engineering', 'Project Management', 'Procurement', 'Others'],
  })
  department: string;

  @Prop({ required: true })
  sentAt: Date;

  @Prop()
  returnedAt?: Date;

  @Prop()
  notes?: string;
}

export const DepartmentHandoffSchema =
  SchemaFactory.createForClass(DepartmentHandoff);

// --- AOGSubEvent schema ---

export type AOGSubEventDocument = AOGSubEvent & Document;

@Schema({ ...baseSchemaOptions, collection: 'aogsubevents' })
export class AOGSubEvent {
  @Prop({ type: Types.ObjectId, ref: 'AOGEvent', required: true, index: true })
  parentEventId: Types.ObjectId;

  @Prop({ required: true, enum: ['aog', 'scheduled', 'unscheduled'] })
  category: string;

  @Prop({ required: true })
  reasonCode: string;

  @Prop({ required: true })
  actionTaken: string;

  @Prop({ required: true })
  detectedAt: Date;

  @Prop()
  clearedAt?: Date;

  @Prop({ required: true, min: 0 })
  manpowerCount: number;

  @Prop({ required: true, min: 0 })
  manHours: number;

  @Prop({ type: [DepartmentHandoffSchema], default: [] })
  departmentHandoffs: DepartmentHandoff[];

  @Prop()
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  // Computed metrics (stored for query performance)
  @Prop({ min: 0, default: 0 })
  technicalTimeHours: number;

  @Prop({ min: 0, default: 0 })
  departmentTimeHours: number;

  @Prop({ type: Object, default: {} })
  departmentTimeTotals: Record<string, number>;

  @Prop({ min: 0, default: 0 })
  totalDowntimeHours: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AOGSubEventSchema = SchemaFactory.createForClass(AOGSubEvent);

// Indexes
AOGSubEventSchema.index({ parentEventId: 1, detectedAt: -1 });
AOGSubEventSchema.index({ parentEventId: 1 });
AOGSubEventSchema.index({ category: 1, detectedAt: -1 });
AOGSubEventSchema.index({ detectedAt: -1 });
