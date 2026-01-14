import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

export type VacationPlanDocument = VacationPlan & Document;

/**
 * VacationTeam enum
 * Represents the two teams that have vacation plans
 * Requirements: 15.1
 */
export enum VacationTeam {
  Engineering = 'Engineering',
  TPL = 'TPL',
}

/**
 * VacationEmployee sub-document schema
 * Represents an employee's vacation schedule with 48 weekly cells
 * Requirements: 15.1, 15.3
 */
@Schema({ _id: false })
export class VacationEmployee {
  @Prop({ required: true })
  name: string;

  @Prop({
    type: [Number],
    default: () => new Array(48).fill(0),
    validate: {
      validator: (cells: number[]) => cells.length === 48,
      message: 'Cells array must have exactly 48 elements (4 weeks × 12 months)',
    },
  })
  cells: number[]; // 48 weeks of values (4 weeks per month × 12 months)

  @Prop({ default: 0 })
  total: number; // Computed sum of cells
}

export const VacationEmployeeSchema = SchemaFactory.createForClass(VacationEmployee);

/**
 * VacationPlan Schema
 * Annual vacation schedule for a team with 48 weekly columns
 * Requirements: 15.1, 15.3
 */
@Schema(baseSchemaOptions)
export class VacationPlan {
  @Prop({ required: true, index: true })
  year: number;

  @Prop({ required: true, enum: VacationTeam, index: true })
  team: VacationTeam;

  @Prop({ type: [VacationEmployeeSchema], default: [] })
  employees: VacationEmployee[];

  @Prop({
    type: [String],
    default: () => new Array(48).fill('Ok'),
    validate: {
      validator: (overlaps: string[]) => overlaps.length === 48,
      message: 'Overlaps array must have exactly 48 elements',
    },
  })
  overlaps: string[]; // 'Ok' or 'Check' per week

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: Boolean })
  isDemo?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const VacationPlanSchema = SchemaFactory.createForClass(VacationPlan);

// Unique compound index on (year, team) for upsert behavior
// Requirements: 15.1
VacationPlanSchema.index({ year: 1, team: 1 }, { unique: true });

// Index on year for filtering
VacationPlanSchema.index({ year: -1 });
