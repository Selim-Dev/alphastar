import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

export enum ResponsibleParty {
  Internal = 'Internal',
  OEM = 'OEM',
  Customs = 'Customs',
  Finance = 'Finance',
  Other = 'Other',
}

export enum AOGCategory {
  Scheduled = 'scheduled',
  Unscheduled = 'unscheduled',
  AOG = 'aog',
  MRO = 'mro',
  Cleaning = 'cleaning',
}

export type AOGEventDocument = AOGEvent & Document;

@Schema({ ...baseSchemaOptions, collection: 'aogevents' })
export class AOGEvent {
  @Prop({ type: Types.ObjectId, ref: 'Aircraft', required: true, index: true })
  aircraftId: Types.ObjectId;

  @Prop({ required: true })
  detectedAt: Date;

  @Prop()
  clearedAt?: Date;

  @Prop({ enum: AOGCategory })
  category?: string;

  @Prop()
  reasonCode?: string;

  @Prop({ enum: ResponsibleParty })
  responsibleParty?: string;

  @Prop()
  actionTaken?: string;

  @Prop({ min: 0 })
  manpowerCount?: number;

  @Prop({ min: 0 })
  manHours?: number;

  @Prop()
  location?: string; // ICAO airport code

  @Prop()
  notes?: string;

  // Milestone timestamps
  @Prop()
  reportedAt?: Date;

  @Prop()
  procurementRequestedAt?: Date;

  @Prop()
  availableAtStoreAt?: Date;

  @Prop()
  issuedBackAt?: Date;

  @Prop()
  installationCompleteAt?: Date;

  @Prop()
  testStartAt?: Date;

  @Prop()
  upAndRunningAt?: Date;

  // Computed downtime buckets (stored for query performance)
  @Prop({ min: 0, default: 0 })
  technicalTimeHours: number;

  @Prop({ min: 0, default: 0 })
  procurementTimeHours: number;

  @Prop({ min: 0, default: 0 })
  opsTimeHours: number;

  @Prop({ min: 0, default: 0 })
  totalDowntimeHours: number;

  // Cost fields (simplified model)
  @Prop({ min: 0 })
  internalCost?: number;

  @Prop({ min: 0 })
  externalCost?: number;

  // Legacy cost fields (preserved for compatibility)
  @Prop({ min: 0 })
  costLabor?: number;

  @Prop({ min: 0 })
  costParts?: number;

  @Prop({ min: 0 })
  costExternal?: number;

  @Prop({ type: [String], default: [] })
  attachments: string[]; // S3 keys

  @Prop({ default: false })
  isLegacy?: boolean;

  @Prop({ default: false })
  isImported?: boolean;

  @Prop({ default: false })
  isDemo?: boolean;

  @Prop({ type: Array, default: [] })
  milestoneHistory: Record<string, unknown>[];

  @Prop()
  currentStatus?: string;

  @Prop()
  blockingReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AOGEventSchema = SchemaFactory.createForClass(AOGEvent);

// Virtual: status — 'active' if clearedAt is null, 'completed' otherwise
AOGEventSchema.virtual('status').get(function (this: AOGEventDocument) {
  return this.clearedAt ? 'completed' : 'active';
});

// Indexes
AOGEventSchema.index({ aircraftId: 1, detectedAt: -1 });
AOGEventSchema.index({ detectedAt: -1 });
AOGEventSchema.index({ clearedAt: 1 });
AOGEventSchema.index({ responsibleParty: 1, detectedAt: -1 });
AOGEventSchema.index({ reportedAt: 1 });
