import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type BudgetAuditLogDocument = BudgetAuditLog & Document;

@Schema({ timestamps: false, collection: 'budgetauditlog' })
export class BudgetAuditLog {
  @Prop({ type: Types.ObjectId, ref: 'BudgetProject', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true, enum: ['project', 'planRow', 'actual'] })
  entityType: string;

  @Prop({ type: Types.ObjectId, required: true })
  entityId: Types.ObjectId;

  @Prop({ required: true, enum: ['create', 'update', 'delete'] })
  action: string;

  @Prop()
  fieldChanged?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  oldValue?: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  newValue?: any;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;
}

export const BudgetAuditLogSchema = SchemaFactory.createForClass(BudgetAuditLog);

// Indexes
BudgetAuditLogSchema.index({ projectId: 1, timestamp: -1 });
BudgetAuditLogSchema.index({ userId: 1, timestamp: -1 });
BudgetAuditLogSchema.index({ entityType: 1, entityId: 1 });
