import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

export type AircraftDocument = Aircraft & Document;

export enum AircraftStatus {
  Active = 'active',
  Parked = 'parked',
  Leased = 'leased',
}

@Schema(baseSchemaOptions)
export class Aircraft {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  registration: string;

  @Prop({ required: true, trim: true })
  fleetGroup: string;

  @Prop({ required: true, trim: true })
  aircraftType: string;

  @Prop({ required: true, trim: true })
  msn: string;

  @Prop({ required: true, trim: true })
  owner: string;

  @Prop({ required: true })
  manufactureDate: Date;

  @Prop({ required: true, min: 1, max: 4 })
  enginesCount: number;

  @Prop({ required: true, enum: AircraftStatus, default: AircraftStatus.Active })
  status: AircraftStatus;

  @Prop({ type: Boolean })
  isDemo?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AircraftSchema = SchemaFactory.createForClass(Aircraft);

// Create compound index for filtering
AircraftSchema.index({ fleetGroup: 1, status: 1 });
