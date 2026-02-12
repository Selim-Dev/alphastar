import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BudgetAuditLogDocument = BudgetAuditLog & Document;

@Schema({ timestamps: true, collection: 'budgetauditlog' })
export class BudgetAuditLog {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: ['project', 'planRow', 'actual'],
  })
  entityType: string;

  @Prop({ type: Types.ObjectId, required: true })
  entityId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: ['create', 'update', 'delete'],
  })
  action: string;

  @Prop({ type: String })
  fieldChanged?: string;

  @Prop({ type: Object })
  oldValue?: any;

  @Prop({ type: Object })
  newValue?: any;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now, index: true })
  timestamp: Date;
}

export const BudgetAuditLogSchema = SchemaFactory.createForClass(BudgetAuditLog);

// Compound indexes for efficient querying
BudgetAuditLogSchema.index({ projectId: 1, timestamp: -1 });
BudgetAuditLogSchema.index({ userId: 1, timestamp: -1 });
BudgetAuditLogSchema.index({ entityType: 1, entityId: 1 });
