import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

export type AOGEventDocument = AOGEvent & Document;

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
}

// NEW: AOG Workflow Status - 18 states for tracking AOG event progression
export enum AOGWorkflowStatus {
  REPORTED = 'REPORTED',
  TROUBLESHOOTING = 'TROUBLESHOOTING',
  ISSUE_IDENTIFIED = 'ISSUE_IDENTIFIED',
  RESOLVED_NO_PARTS = 'RESOLVED_NO_PARTS',
  PART_REQUIRED = 'PART_REQUIRED',
  PROCUREMENT_REQUESTED = 'PROCUREMENT_REQUESTED',
  FINANCE_APPROVAL_PENDING = 'FINANCE_APPROVAL_PENDING',
  ORDER_PLACED = 'ORDER_PLACED',
  IN_TRANSIT = 'IN_TRANSIT',
  AT_PORT = 'AT_PORT',
  CUSTOMS_CLEARANCE = 'CUSTOMS_CLEARANCE',
  RECEIVED_IN_STORES = 'RECEIVED_IN_STORES',
  ISSUED_TO_MAINTENANCE = 'ISSUED_TO_MAINTENANCE',
  INSTALLED_AND_TESTED = 'INSTALLED_AND_TESTED',
  ENGINE_RUN_REQUESTED = 'ENGINE_RUN_REQUESTED',
  ENGINE_RUN_COMPLETED = 'ENGINE_RUN_COMPLETED',
  BACK_IN_SERVICE = 'BACK_IN_SERVICE',
  CLOSED = 'CLOSED',
}

// NEW: Blocking Reason - reasons why an AOG is waiting
export enum BlockingReason {
  Finance = 'Finance',
  Port = 'Port',
  Customs = 'Customs',
  Vendor = 'Vendor',
  Ops = 'Ops',
  Other = 'Other',
}

// NEW: Part Request Status - tracking procurement lifecycle
export enum PartRequestStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  ORDERED = 'ORDERED',
  SHIPPED = 'SHIPPED',
  RECEIVED = 'RECEIVED',
  ISSUED = 'ISSUED',
}

// Sub-document: Milestone History Entry - tracking milestone timestamp changes
@Schema({ _id: false })
export class MilestoneHistoryEntry {
  @Prop({ required: true })
  milestone: string; // 'reportedAt', 'procurementRequestedAt', etc.

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  recordedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recordedBy: Types.ObjectId;
}

export const MilestoneHistoryEntrySchema =
  SchemaFactory.createForClass(MilestoneHistoryEntry);

// Sub-document: Status History Entry - append-only timeline of workflow transitions
@Schema({ _id: false })
export class StatusHistoryEntry {
  @Prop({ required: true, enum: AOGWorkflowStatus })
  fromStatus: AOGWorkflowStatus;

  @Prop({ required: true, enum: AOGWorkflowStatus })
  toStatus: AOGWorkflowStatus;

  @Prop({ required: true, default: () => new Date() })
  timestamp: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  actorId: Types.ObjectId;

  @Prop({ required: true })
  actorRole: string;

  @Prop()
  notes?: string;

  // Optional metadata
  @Prop({ type: Types.ObjectId })
  partRequestId?: Types.ObjectId;

  @Prop()
  financeRef?: string;

  @Prop()
  shippingRef?: string;

  @Prop()
  opsRunRef?: string;
}

export const StatusHistoryEntrySchema =
  SchemaFactory.createForClass(StatusHistoryEntry);

// Sub-document: Part Request - tracking parts within an AOG event
@Schema()
export class PartRequest {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  partNumber: string;

  @Prop({ required: true })
  partDescription: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ min: 0 })
  estimatedCost?: number;

  @Prop({ min: 0 })
  actualCost?: number;

  @Prop()
  vendor?: string;

  @Prop({ required: true })
  requestedDate: Date;

  @Prop({ enum: PartRequestStatus, default: PartRequestStatus.REQUESTED })
  status: PartRequestStatus;

  @Prop()
  invoiceRef?: string;

  @Prop()
  trackingNumber?: string;

  @Prop()
  eta?: Date;

  @Prop()
  receivedDate?: Date;

  @Prop()
  issuedDate?: Date;
}

export const PartRequestSchema = SchemaFactory.createForClass(PartRequest);

// Sub-document: Cost Audit Entry - tracking cost field changes
@Schema({ _id: false })
export class CostAuditEntry {
  @Prop({ required: true })
  field: string; // 'costLabor', 'costParts', 'costExternal'

  @Prop({ required: true })
  previousValue: number;

  @Prop({ required: true })
  newValue: number;

  @Prop({ required: true })
  changedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  changedBy: Types.ObjectId;

  @Prop()
  reason?: string;
}

export const CostAuditEntrySchema =
  SchemaFactory.createForClass(CostAuditEntry);

// Sub-document: Attachment Metadata - enhanced attachment tracking
@Schema({ _id: false })
export class AttachmentMeta {
  @Prop({ required: true })
  s3Key: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  attachmentType: string; // 'purchase_order', 'invoice', 'shipping_doc', 'photo'

  @Prop({ required: true })
  uploadedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop()
  fileSize?: number;

  @Prop()
  mimeType?: string;
}

export const AttachmentMetaSchema =
  SchemaFactory.createForClass(AttachmentMeta);

@Schema(baseSchemaOptions)
export class AOGEvent {
  // Existing fields preserved
  @Prop({ type: Types.ObjectId, ref: 'Aircraft', required: true, index: true })
  aircraftId: Types.ObjectId;

  @Prop({ required: true })
  detectedAt: Date;

  @Prop()
  clearedAt?: Date;

  @Prop({ required: true, enum: AOGCategory })
  category: AOGCategory;

  @Prop({ required: true })
  reasonCode: string;

  @Prop({ required: true, enum: ResponsibleParty, index: true })
  responsibleParty: ResponsibleParty;

  @Prop({ required: true })
  actionTaken: string;

  @Prop({ required: true, min: 0 })
  manpowerCount: number;

  @Prop({ required: true, min: 0 })
  manHours: number;

  // NEW: Workflow status
  @Prop({
    enum: AOGWorkflowStatus,
    default: AOGWorkflowStatus.REPORTED,
    index: true,
  })
  currentStatus: AOGWorkflowStatus;

  // NEW: Blocking reason for waiting states
  @Prop({ enum: BlockingReason })
  blockingReason?: BlockingReason;

  // NEW: Status history (append-only)
  @Prop({ type: [StatusHistoryEntrySchema], default: [] })
  statusHistory: StatusHistoryEntry[];

  // NEW: Part requests
  @Prop({ type: [PartRequestSchema], default: [] })
  partRequests: PartRequest[];

  // Existing cost fields
  @Prop({ min: 0 })
  costLabor?: number;

  @Prop({ min: 0 })
  costParts?: number;

  @Prop({ min: 0 })
  costExternal?: number;

  // NEW: Estimated costs
  @Prop({ min: 0 })
  estimatedCostLabor?: number;

  @Prop({ min: 0 })
  estimatedCostParts?: number;

  @Prop({ min: 0 })
  estimatedCostExternal?: number;

  // NEW: Budget integration
  @Prop()
  budgetClauseId?: number;

  @Prop()
  budgetPeriod?: string; // YYYY-MM

  @Prop({ default: false })
  isBudgetAffecting: boolean;

  @Prop({ type: Types.ObjectId, ref: 'ActualSpend' })
  linkedActualSpendId?: Types.ObjectId;

  // NEW: Cost audit trail
  @Prop({ type: [CostAuditEntrySchema], default: [] })
  costAuditTrail: CostAuditEntry[];

  // NEW: Enhanced attachments metadata
  @Prop({ type: [AttachmentMetaSchema], default: [] })
  attachmentsMeta: AttachmentMeta[];

  // Existing fields
  @Prop({ type: [String], default: [] })
  attachments: string[]; // S3 keys (preserved for backward compatibility)

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: Boolean })
  isDemo?: boolean;

  // NEW: Legacy indicator
  @Prop({ type: Boolean })
  isLegacy?: boolean;

  // NEW: Milestone timestamps for simplified workflow
  @Prop()
  reportedAt?: Date; // Defaults to detectedAt

  @Prop()
  procurementRequestedAt?: Date; // Optional - when parts were requested

  @Prop()
  availableAtStoreAt?: Date; // Optional - when parts arrived

  @Prop()
  issuedBackAt?: Date; // Optional - when parts issued to maintenance

  @Prop()
  installationCompleteAt?: Date; // Required for closed events

  @Prop()
  testStartAt?: Date; // Optional - when ops testing started

  @Prop()
  upAndRunningAt?: Date; // Required for closed events - same as clearedAt

  // NEW: Computed downtime metrics (stored for performance)
  @Prop({ min: 0, default: 0 })
  technicalTimeHours: number;

  @Prop({ min: 0, default: 0 })
  procurementTimeHours: number;

  @Prop({ min: 0, default: 0 })
  opsTimeHours: number;

  @Prop({ min: 0, default: 0 })
  totalDowntimeHours: number;

  // NEW: Simplified cost fields
  @Prop({ min: 0, default: 0 })
  internalCost: number; // Labor and man-hours

  @Prop({ min: 0, default: 0 })
  externalCost: number; // Vendor and third-party

  // NEW: Milestone history tracking
  @Prop({ type: [MilestoneHistoryEntrySchema], default: [] })
  milestoneHistory: MilestoneHistoryEntry[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const AOGEventSchema = SchemaFactory.createForClass(AOGEvent);

// Index on aircraftId for efficient queries
AOGEventSchema.index({ aircraftId: 1, detectedAt: -1 });

// Index on responsibleParty for analytics queries
AOGEventSchema.index({ responsibleParty: 1, detectedAt: -1 });

// Index for date-based queries
AOGEventSchema.index({ detectedAt: -1 });

// NEW: Index on currentStatus for workflow queries
AOGEventSchema.index({ currentStatus: 1, detectedAt: -1 });

// NEW: Index on blockingReason for analytics
AOGEventSchema.index({ blockingReason: 1, currentStatus: 1 });

// NEW: Index on reportedAt for date-based queries (simplified workflow)
AOGEventSchema.index({ reportedAt: -1 });

// NEW: Compound index on aircraftId + reportedAt for filtered date queries
AOGEventSchema.index({ aircraftId: 1, reportedAt: -1 });
