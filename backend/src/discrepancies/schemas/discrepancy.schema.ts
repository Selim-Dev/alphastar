import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

export type DiscrepancyDocument = Discrepancy & Document;

export enum ResponsibleParty {
  Internal = 'Internal',
  OEM = 'OEM',
  Customs = 'Customs',
  Finance = 'Finance',
  Other = 'Other',
}

@Schema(baseSchemaOptions)
export class Discrepancy {
  @Prop({ type: Types.ObjectId, ref: 'Aircraft', required: true, index: true })
  aircraftId: Types.ObjectId;

  @Prop({ required: true })
  dateDetected: Date;

  @Prop({ required: true, index: true })
  ataChapter: string;

  @Prop({ required: true })
  discrepancyText: string;

  @Prop()
  dateCorrected?: Date;

  @Prop()
  correctiveAction?: string;

  @Prop({ enum: ResponsibleParty })
  responsibility?: ResponsibleParty;

  @Prop()
  downtimeHours?: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: Boolean })
  isDemo?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DiscrepancySchema = SchemaFactory.createForClass(Discrepancy);

// Index on ataChapter for analytics queries (Requirements: 6.4)
DiscrepancySchema.index({ ataChapter: 1 });

// Index on aircraftId and dateDetected for efficient queries
DiscrepancySchema.index({ aircraftId: 1, dateDetected: -1 });
