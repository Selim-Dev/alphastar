import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  AOGEventRepository,
  AOGEventFilter,
  DowntimeByResponsibilityResult,
  StageBreakdownResult,
  BottleneckAnalyticsResult,
} from '../repositories/aog-event.repository';
import {
  AOGEvent,
  AOGEventDocument,
  ResponsibleParty,
  AOGCategory,
  AOGWorkflowStatus,
  BlockingReason,
  PartRequestStatus,
  StatusHistoryEntry,
  PartRequest,
  CostAuditEntry,
  MilestoneHistoryEntry,
} from '../schemas/aog-event.schema';
import { CreateAOGEventDto } from '../dto/create-aog-event.dto';
import { UpdateAOGEventDto } from '../dto/update-aog-event.dto';

export interface AOGEventWithDuration extends AOGEvent {
  downtimeHours?: number;
}

/**
 * Interface for computed downtime metrics using the three-bucket model
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */
export interface AOGComputedMetrics {
  technicalTimeHours: number;    // (Reported → Procurement Requested) + (Available at Store → Installation Complete)
  procurementTimeHours: number;  // (Procurement Requested → Available at Store)
  opsTimeHours: number;          // (Test Start → Up & Running)
  totalDowntimeHours: number;    // (Reported → Up & Running)
}

/**
 * Interface for three-bucket analytics filter
 * Requirements: 5.1, 5.2, 5.3
 */
export interface ThreeBucketAnalyticsFilter {
  aircraftId?: string;
  fleetGroup?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Interface for three-bucket analytics response
 * Requirements: 5.2, 5.3, 5.4, FR-1.1, FR-1.3
 */
export interface ThreeBucketAnalytics {
  summary: {
    totalEvents: number;
    activeEvents: number;
    totalDowntimeHours: number;
    averageDowntimeHours: number;
  };
  buckets: {
    technical: {
      totalHours: number;
      averageHours: number;
      percentage: number;
    };
    procurement: {
      totalHours: number;
      averageHours: number;
      percentage: number;
    };
    ops: {
      totalHours: number;
      averageHours: number;
      percentage: number;
    };
  };
  byAircraft: Array<{
    aircraftId: string;
    registration: string;
    technicalHours: number;
    procurementHours: number;
    opsHours: number;
    totalHours: number;
  }>;
  // Legacy data handling (FR-1.1, FR-1.3)
  legacyEventCount?: number;
  legacyDowntimeHours?: number;
}

/**
 * Transition parameters for status changes
 */
export interface TransitionParams {
  toStatus: AOGWorkflowStatus;
  notes?: string;
  blockingReason?: BlockingReason;
  actorRole: string;
  metadata?: {
    partRequestId?: string;
    financeRef?: string;
    shippingRef?: string;
    opsRunRef?: string;
  };
}

/**
 * Allowed status transitions map
 * Defines which statuses can transition to which other statuses
 * Requirements: 1.3
 */
export const ALLOWED_TRANSITIONS: Record<AOGWorkflowStatus, AOGWorkflowStatus[]> = {
  [AOGWorkflowStatus.REPORTED]: [AOGWorkflowStatus.TROUBLESHOOTING],
  [AOGWorkflowStatus.TROUBLESHOOTING]: [AOGWorkflowStatus.ISSUE_IDENTIFIED],
  [AOGWorkflowStatus.ISSUE_IDENTIFIED]: [
    AOGWorkflowStatus.RESOLVED_NO_PARTS,
    AOGWorkflowStatus.PART_REQUIRED,
  ],
  [AOGWorkflowStatus.RESOLVED_NO_PARTS]: [AOGWorkflowStatus.BACK_IN_SERVICE],
  [AOGWorkflowStatus.PART_REQUIRED]: [AOGWorkflowStatus.PROCUREMENT_REQUESTED],
  [AOGWorkflowStatus.PROCUREMENT_REQUESTED]: [AOGWorkflowStatus.FINANCE_APPROVAL_PENDING],
  [AOGWorkflowStatus.FINANCE_APPROVAL_PENDING]: [AOGWorkflowStatus.ORDER_PLACED],
  [AOGWorkflowStatus.ORDER_PLACED]: [AOGWorkflowStatus.IN_TRANSIT],
  [AOGWorkflowStatus.IN_TRANSIT]: [
    AOGWorkflowStatus.AT_PORT,
    AOGWorkflowStatus.RECEIVED_IN_STORES,
  ],
  [AOGWorkflowStatus.AT_PORT]: [AOGWorkflowStatus.CUSTOMS_CLEARANCE],
  [AOGWorkflowStatus.CUSTOMS_CLEARANCE]: [AOGWorkflowStatus.RECEIVED_IN_STORES],
  [AOGWorkflowStatus.RECEIVED_IN_STORES]: [AOGWorkflowStatus.ISSUED_TO_MAINTENANCE],
  [AOGWorkflowStatus.ISSUED_TO_MAINTENANCE]: [AOGWorkflowStatus.INSTALLED_AND_TESTED],
  [AOGWorkflowStatus.INSTALLED_AND_TESTED]: [
    AOGWorkflowStatus.ENGINE_RUN_REQUESTED,
    AOGWorkflowStatus.BACK_IN_SERVICE,
  ],
  [AOGWorkflowStatus.ENGINE_RUN_REQUESTED]: [AOGWorkflowStatus.ENGINE_RUN_COMPLETED],
  [AOGWorkflowStatus.ENGINE_RUN_COMPLETED]: [AOGWorkflowStatus.BACK_IN_SERVICE],
  [AOGWorkflowStatus.BACK_IN_SERVICE]: [AOGWorkflowStatus.CLOSED],
  [AOGWorkflowStatus.CLOSED]: [],
};

/**
 * Statuses that require a blocking reason
 * Requirements: 3.2
 */
export const BLOCKING_STATUSES: AOGWorkflowStatus[] = [
  AOGWorkflowStatus.FINANCE_APPROVAL_PENDING,
  AOGWorkflowStatus.AT_PORT,
  AOGWorkflowStatus.CUSTOMS_CLEARANCE,
  AOGWorkflowStatus.IN_TRANSIT,
];

/**
 * Terminal statuses that should auto-set clearedAt
 * Requirements: 1.4
 */
export const TERMINAL_STATUSES: AOGWorkflowStatus[] = [
  AOGWorkflowStatus.BACK_IN_SERVICE,
  AOGWorkflowStatus.CLOSED,
];

/**
 * Milestone timestamps in chronological order for validation
 * Requirements: 3.2, 3.3
 */
export const MILESTONE_ORDER = [
  'reportedAt',
  'procurementRequestedAt',
  'availableAtStoreAt',
  'issuedBackAt',
  'installationCompleteAt',
  'testStartAt',
  'upAndRunningAt',
] as const;

export type MilestoneName = (typeof MILESTONE_ORDER)[number];

/**
 * Interface for milestone timestamps used in validation
 */
export interface MilestoneTimestamps {
  reportedAt?: Date | null;
  procurementRequestedAt?: Date | null;
  availableAtStoreAt?: Date | null;
  issuedBackAt?: Date | null;
  installationCompleteAt?: Date | null;
  testStartAt?: Date | null;
  upAndRunningAt?: Date | null;
}


@Injectable()
export class AOGEventsService {
  constructor(private readonly aogEventRepository: AOGEventRepository) {}

  /**
   * Validates that a status transition is allowed
   * Requirements: 1.3, 3.2
   */
  validateTransition(
    fromStatus: AOGWorkflowStatus,
    toStatus: AOGWorkflowStatus,
    blockingReason?: BlockingReason,
  ): void {
    // Check if transition is allowed
    const allowedTargets = ALLOWED_TRANSITIONS[fromStatus];
    if (!allowedTargets || !allowedTargets.includes(toStatus)) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${fromStatus} to ${toStatus}`,
      });
    }

    // Check if blocking reason is required for the target status
    if (BLOCKING_STATUSES.includes(toStatus) && !blockingReason) {
      throw new BadRequestException({
        code: 'BLOCKING_REASON_REQUIRED',
        message: `Blocking reason required for status ${toStatus}`,
      });
    }
  }

  /**
   * Gets allowed transitions for a given status
   */
  getAllowedTransitions(currentStatus: AOGWorkflowStatus): AOGWorkflowStatus[] {
    return ALLOWED_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Checks if a status requires a blocking reason
   */
  requiresBlockingReason(status: AOGWorkflowStatus): boolean {
    return BLOCKING_STATUSES.includes(status);
  }

  /**
   * Validates that milestone timestamps are in chronological order
   * 
   * Validates: reportedAt ≤ procurementRequestedAt ≤ availableAtStoreAt ≤ issuedBackAt 
   *            ≤ installationCompleteAt ≤ testStartAt ≤ upAndRunningAt
   * 
   * Null values are allowed for optional milestones and are skipped during validation.
   * Only non-null timestamps are compared to ensure chronological order.
   * 
   * Requirements: 3.2, 3.3
   * 
   * @param milestones - Object containing milestone timestamps
   * @throws BadRequestException if timestamps are out of chronological order
   */
  validateMilestoneOrder(milestones: MilestoneTimestamps): void {
    // Collect non-null milestones with their names and values
    const nonNullMilestones: Array<{ name: MilestoneName; date: Date }> = [];

    for (const milestoneName of MILESTONE_ORDER) {
      const value = milestones[milestoneName];
      if (value != null) {
        // Convert to Date if it's a string
        const dateValue = value instanceof Date ? value : new Date(value);
        nonNullMilestones.push({ name: milestoneName, date: dateValue });
      }
    }

    // Validate chronological order of non-null milestones
    for (let i = 1; i < nonNullMilestones.length; i++) {
      const previous = nonNullMilestones[i - 1];
      const current = nonNullMilestones[i];

      if (current.date < previous.date) {
        throw new BadRequestException({
          code: 'INVALID_TIMESTAMP_ORDER',
          message: `Timestamp ${current.name} cannot be before ${previous.name}`,
          details: {
            field: current.name,
            constraint: `${current.name} must be >= ${previous.name}`,
            previousMilestone: previous.name,
            previousValue: previous.date.toISOString(),
            currentMilestone: current.name,
            currentValue: current.date.toISOString(),
          },
        });
      }
    }
  }

  /**
   * Transitions an AOG event to a new status
   * Requirements: 1.3, 1.4, 2.1, 2.2
   */
  async transitionStatus(
    id: string,
    params: TransitionParams,
    userId: string,
  ): Promise<AOGEventDocument> {
    const event = await this.aogEventRepository.findById(id);
    if (!event) {
      throw new NotFoundException({
        code: 'AOG_NOT_FOUND',
        message: `AOG event with ID ${id} not found`,
      });
    }

    // Get current status (infer for legacy events)
    const currentStatus = event.currentStatus || this.inferStatusFromEvent(event);

    // Validate the transition
    this.validateTransition(currentStatus, params.toStatus, params.blockingReason);

    // Create status history entry
    const historyEntry: StatusHistoryEntry = {
      fromStatus: currentStatus,
      toStatus: params.toStatus,
      timestamp: new Date(),
      actorId: new Types.ObjectId(userId),
      actorRole: params.actorRole,
      notes: params.notes,
      partRequestId: params.metadata?.partRequestId
        ? new Types.ObjectId(params.metadata.partRequestId)
        : undefined,
      financeRef: params.metadata?.financeRef,
      shippingRef: params.metadata?.shippingRef,
      opsRunRef: params.metadata?.opsRunRef,
    };

    // Build update data
    const updateData: Partial<AOGEvent> = {
      currentStatus: params.toStatus,
      statusHistory: [...(event.statusHistory || []), historyEntry],
      updatedBy: new Types.ObjectId(userId),
    };

    // Set or clear blocking reason based on target status
    if (BLOCKING_STATUSES.includes(params.toStatus)) {
      updateData.blockingReason = params.blockingReason;
    } else {
      updateData.blockingReason = undefined;
    }

    // Auto-set clearedAt for terminal statuses if not already set
    if (TERMINAL_STATUSES.includes(params.toStatus) && !event.clearedAt) {
      updateData.clearedAt = new Date();
    }

    const updatedEvent = await this.aogEventRepository.update(id, updateData);
    if (!updatedEvent) {
      throw new NotFoundException({
        code: 'AOG_NOT_FOUND',
        message: `AOG event with ID ${id} not found`,
      });
    }

    return updatedEvent;
  }

  /**
   * Gets the status history for an AOG event
   * Requirements: 2.4
   */
  async getStatusHistory(id: string): Promise<StatusHistoryEntry[]> {
    const event = await this.aogEventRepository.findById(id);
    if (!event) {
      throw new NotFoundException({
        code: 'AOG_NOT_FOUND',
        message: `AOG event with ID ${id} not found`,
      });
    }
    return event.statusHistory || [];
  }

  /**
   * Infers status from legacy event data
   * Used for events without currentStatus field
   * Requirements: 10.1
   */
  private inferStatusFromEvent(event: AOGEventDocument): AOGWorkflowStatus {
    if (event.clearedAt) {
      return AOGWorkflowStatus.BACK_IN_SERVICE;
    }
    return AOGWorkflowStatus.REPORTED;
  }


  /**
   * Creates a new AOG event with timestamp validation, milestone tracking, and computed metrics
   * 
   * This method:
   * 1. Sets reportedAt from detectedAt if not provided
   * 2. Validates milestone timestamp ordering
   * 3. Computes downtime metrics using the three-bucket model
   * 4. Computes totalCost from internalCost + externalCost
   * 5. Records milestone history entries for any provided milestones
   * 
   * Requirements: 1.2, 2.8, 3.5, 4.1, 4.3, 4.6
   */
  async create(dto: CreateAOGEventDto, userId: string): Promise<AOGEventDocument> {
    // Validate timestamps: clearedAt must be after detectedAt
    if (dto.clearedAt) {
      this.validateTimestamps(new Date(dto.detectedAt), new Date(dto.clearedAt));
    }

    // Set reportedAt from detectedAt if not provided (Requirement 1.2)
    const reportedAt = dto.reportedAt ? new Date(dto.reportedAt) : new Date(dto.detectedAt);
    
    // Set upAndRunningAt from clearedAt if not provided
    const upAndRunningAt = dto.upAndRunningAt 
      ? new Date(dto.upAndRunningAt) 
      : (dto.clearedAt ? new Date(dto.clearedAt) : undefined);

    // Parse milestone timestamps
    const milestoneTimestamps: MilestoneTimestamps = {
      reportedAt,
      procurementRequestedAt: dto.procurementRequestedAt ? new Date(dto.procurementRequestedAt) : undefined,
      availableAtStoreAt: dto.availableAtStoreAt ? new Date(dto.availableAtStoreAt) : undefined,
      issuedBackAt: dto.issuedBackAt ? new Date(dto.issuedBackAt) : undefined,
      installationCompleteAt: dto.installationCompleteAt ? new Date(dto.installationCompleteAt) : undefined,
      testStartAt: dto.testStartAt ? new Date(dto.testStartAt) : undefined,
      upAndRunningAt,
    };

    // Validate milestone timestamp ordering (Requirement 3.2, 3.3)
    this.validateMilestoneOrder(milestoneTimestamps);

    // Build event data with milestone timestamps
    const eventData: Partial<AOGEvent> = {
      aircraftId: new Types.ObjectId(dto.aircraftId),
      detectedAt: new Date(dto.detectedAt),
      clearedAt: dto.clearedAt ? new Date(dto.clearedAt) : undefined,
      category: dto.category as AOGCategory,
      reasonCode: dto.reasonCode,
      responsibleParty: dto.responsibleParty as ResponsibleParty,
      actionTaken: dto.actionTaken,
      manpowerCount: dto.manpowerCount,
      manHours: dto.manHours,
      costLabor: dto.costLabor,
      costParts: dto.costParts,
      costExternal: dto.costExternal,
      attachments: dto.attachments || [],
      updatedBy: new Types.ObjectId(userId),
      // New events start with REPORTED status
      currentStatus: AOGWorkflowStatus.REPORTED,
      // Milestone timestamps
      reportedAt,
      procurementRequestedAt: milestoneTimestamps.procurementRequestedAt || undefined,
      availableAtStoreAt: milestoneTimestamps.availableAtStoreAt || undefined,
      issuedBackAt: milestoneTimestamps.issuedBackAt || undefined,
      installationCompleteAt: milestoneTimestamps.installationCompleteAt || undefined,
      testStartAt: milestoneTimestamps.testStartAt || undefined,
      upAndRunningAt: milestoneTimestamps.upAndRunningAt || undefined,
      // Simplified cost fields (Requirement 4.1, 4.2)
      internalCost: dto.internalCost || 0,
      externalCost: dto.externalCost || 0,
    };

    // Compute downtime metrics using the three-bucket model (Requirement 2.8)
    const computedMetrics = this.computeDowntimeMetrics(eventData as AOGEvent);
    eventData.technicalTimeHours = computedMetrics.technicalTimeHours;
    eventData.procurementTimeHours = computedMetrics.procurementTimeHours;
    eventData.opsTimeHours = computedMetrics.opsTimeHours;
    eventData.totalDowntimeHours = computedMetrics.totalDowntimeHours;

    // Record milestone history entries for any provided milestones (Requirement 3.5)
    const milestoneHistory = this.createMilestoneHistoryEntries(milestoneTimestamps, userId);
    eventData.milestoneHistory = milestoneHistory;

    return this.aogEventRepository.create(eventData);
  }

  /**
   * Creates milestone history entries for provided milestone timestamps
   * Records who set each milestone and when
   * 
   * Requirements: 3.5
   * 
   * @param milestones - Object containing milestone timestamps
   * @param userId - ID of the user creating the entries
   * @returns Array of MilestoneHistoryEntry objects
   */
  private createMilestoneHistoryEntries(
    milestones: MilestoneTimestamps,
    userId: string,
  ): MilestoneHistoryEntry[] {
    const entries: MilestoneHistoryEntry[] = [];
    const now = new Date();
    const userObjectId = new Types.ObjectId(userId);

    for (const milestoneName of MILESTONE_ORDER) {
      const value = milestones[milestoneName];
      if (value != null) {
        entries.push({
          milestone: milestoneName,
          timestamp: value instanceof Date ? value : new Date(value),
          recordedAt: now,
          recordedBy: userObjectId,
        });
      }
    }

    return entries;
  }

  /**
   * Validates that clearedAt is not earlier than detectedAt
   * Requirements: 4.6
   */
  validateTimestamps(detectedAt: Date, clearedAt: Date): void {
    if (clearedAt < detectedAt) {
      throw new BadRequestException(
        'Timestamp validation error: cleared_at cannot be earlier than detected_at',
      );
    }
  }

  /**
   * Computes downtime duration in hours
   * Requirements: 4.3
   */
  computeDowntimeDuration(detectedAt: Date, clearedAt: Date): number {
    const durationMs = clearedAt.getTime() - detectedAt.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    return Math.round(durationHours * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Computes the time difference between two dates in hours
   * Returns 0 if either date is null/undefined
   * @private
   */
  private computeHoursBetween(startDate?: Date | null, endDate?: Date | null): number {
    if (!startDate || !endDate) {
      return 0;
    }
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    // Round to 2 decimal places, ensure non-negative
    return Math.max(0, Math.round(durationHours * 100) / 100);
  }

  /**
   * Computes downtime metrics using the three-bucket model
   * 
   * Three-Bucket Downtime Model:
   * - Technical Time = (Reported → Procurement Requested) + (Available at Store → Installation Complete)
   * - Procurement Time = (Procurement Requested → Available at Store)
   * - Ops Time = (Test Start → Up & Running)
   * - Total Downtime = (Reported → Up & Running)
   * 
   * Special Cases:
   * - No part needed: Procurement Time = 0 (procurement milestones are null)
   * - Part in store: Procurement Time = 0 or near-zero (Available at Store ≈ Procurement Requested)
   * - No ops test: Ops Time = 0 (testStartAt is null)
   * 
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
   */
  computeDowntimeMetrics(event: AOGEvent | AOGEventDocument): AOGComputedMetrics {
    // Use reportedAt if available, otherwise fall back to detectedAt
    const reportedAt = event.reportedAt || event.detectedAt;
    const procurementRequestedAt = event.procurementRequestedAt;
    const availableAtStoreAt = event.availableAtStoreAt;
    const installationCompleteAt = event.installationCompleteAt;
    const testStartAt = event.testStartAt;
    // Use upAndRunningAt if available, otherwise fall back to clearedAt
    const upAndRunningAt = event.upAndRunningAt || event.clearedAt;

    // Technical Time = (Reported → Procurement Requested) + (Available at Store → Installation Complete)
    // Requirements: 2.1
    // If no procurement was requested, the first segment is 0
    // If no installation complete, the second segment is 0
    const technicalSegment1 = this.computeHoursBetween(reportedAt, procurementRequestedAt);
    const technicalSegment2 = this.computeHoursBetween(availableAtStoreAt, installationCompleteAt);
    const technicalTimeHours = technicalSegment1 + technicalSegment2;

    // Procurement Time = (Procurement Requested → Available at Store)
    // Requirements: 2.2, 2.4, 2.5
    // If no part needed or part already in store, this will be 0
    const procurementTimeHours = this.computeHoursBetween(procurementRequestedAt, availableAtStoreAt);

    // Ops Time = (Test Start → Up & Running)
    // Requirements: 2.3, 2.6
    // If no ops test required, this will be 0
    const opsTimeHours = this.computeHoursBetween(testStartAt, upAndRunningAt);

    // Total Downtime = (Reported → Up & Running)
    // Requirements: 2.7
    const totalDowntimeHours = this.computeHoursBetween(reportedAt, upAndRunningAt);

    return {
      technicalTimeHours,
      procurementTimeHours,
      opsTimeHours,
      totalDowntimeHours,
    };
  }

  /**
   * Finds an AOG event by ID with legacy event handling and computed metrics
   * 
   * For legacy events (without new milestone fields):
   * - Sets isLegacy flag to true
   * - Computes metrics using detectedAt/clearedAt
   * 
   * Requirements: 10.1, 10.2, 10.3, 10.4
   */
  async findById(id: string): Promise<AOGEventWithDuration | null> {
    const event = await this.aogEventRepository.findById(id);
    if (!event) return null;
    return this.processEventForOutput(event);
  }

  /**
   * Finds all AOG events with legacy event handling and computed metrics
   * 
   * For legacy events (without new milestone fields):
   * - Sets isLegacy flag to true
   * - Computes metrics using detectedAt/clearedAt
   * 
   * Requirements: 10.1, 10.2, 10.3, 10.4
   */
  async findAll(filter?: AOGEventFilter): Promise<AOGEventWithDuration[]> {
    const events = await this.aogEventRepository.findAll(filter);
    return events.map((event) => this.processEventForOutput(event));
  }

  /**
   * Processes an event for output, handling legacy events and computing metrics
   * 
   * This method:
   * 1. Detects legacy events (without new milestone fields)
   * 2. Sets isLegacy flag for legacy events
   * 3. Computes metrics using detectedAt/clearedAt for legacy events
   * 4. Infers status for legacy events
   * 5. Adds downtime duration
   * 
   * Requirements: 10.1, 10.2, 10.3, 10.4
   */
  private processEventForOutput(event: AOGEventDocument): AOGEventWithDuration {
    // Detect if this is a legacy event (without new milestone fields)
    const isLegacyEvent = this.isLegacyEvent(event);
    
    // Infer status for legacy events
    this.inferLegacyStatus(event);
    
    // Convert to plain object
    const eventObj = event.toObject() as AOGEventWithDuration;
    
    // Handle legacy events: compute metrics using detectedAt/clearedAt
    if (isLegacyEvent) {
      eventObj.isLegacy = true;
      
      // For legacy events, set reportedAt from detectedAt and upAndRunningAt from clearedAt
      // Then compute metrics based on these values
      const legacyMetrics = this.computeMetricsForLegacyEvent(event);
      eventObj.technicalTimeHours = legacyMetrics.technicalTimeHours;
      eventObj.procurementTimeHours = legacyMetrics.procurementTimeHours;
      eventObj.opsTimeHours = legacyMetrics.opsTimeHours;
      eventObj.totalDowntimeHours = legacyMetrics.totalDowntimeHours;
    }
    
    // Add downtime duration (for backward compatibility)
    if (event.clearedAt) {
      eventObj.downtimeHours = this.computeDowntimeDuration(
        event.detectedAt,
        event.clearedAt,
      );
    }
    
    return eventObj;
  }

  /**
   * Detects if an event is a legacy event (without new milestone fields)
   * 
   * A legacy event is one that:
   * - Has no reportedAt field set (or it's undefined)
   * - Has no computed metrics stored (technicalTimeHours, etc. are 0 or undefined)
   * - Was created before the simplified workflow was implemented
   * 
   * Requirements: 10.1
   */
  private isLegacyEvent(event: AOGEventDocument): boolean {
    // Check if the event has the new milestone fields
    // If reportedAt is not set and there are no computed metrics, it's a legacy event
    const hasReportedAt = event.reportedAt != null;
    const hasComputedMetrics = (
      (event.technicalTimeHours != null && event.technicalTimeHours > 0) ||
      (event.procurementTimeHours != null && event.procurementTimeHours > 0) ||
      (event.opsTimeHours != null && event.opsTimeHours > 0) ||
      (event.totalDowntimeHours != null && event.totalDowntimeHours > 0)
    );
    
    // If the event has milestone history, it's not a legacy event
    const hasMilestoneHistory = event.milestoneHistory && event.milestoneHistory.length > 0;
    
    // It's a legacy event if it doesn't have reportedAt, computed metrics, or milestone history
    return !hasReportedAt && !hasComputedMetrics && !hasMilestoneHistory;
  }

  /**
   * Computes metrics for legacy events using detectedAt/clearedAt
   * 
   * For legacy events, we treat:
   * - detectedAt as reportedAt
   * - clearedAt as upAndRunningAt
   * - All time is attributed to technical time (since we don't know the breakdown)
   * 
   * Requirements: 10.2, 10.3
   */
  private computeMetricsForLegacyEvent(event: AOGEventDocument): AOGComputedMetrics {
    // For legacy events, use detectedAt as reportedAt and clearedAt as upAndRunningAt
    const reportedAt = event.detectedAt;
    const upAndRunningAt = event.clearedAt;
    
    // Total downtime is the only metric we can compute for legacy events
    const totalDowntimeHours = this.computeHoursBetween(reportedAt, upAndRunningAt);
    
    // For legacy events, we attribute all time to technical time
    // since we don't have the breakdown information
    return {
      technicalTimeHours: totalDowntimeHours,
      procurementTimeHours: 0,
      opsTimeHours: 0,
      totalDowntimeHours,
    };
  }

  /**
   * Infers legacy status for events without currentStatus
   * Requirements: 10.1, 10.2
   */
  private inferLegacyStatus(event: AOGEventDocument): AOGEventDocument {
    if (!event.currentStatus) {
      event.currentStatus = event.clearedAt
        ? AOGWorkflowStatus.BACK_IN_SERVICE
        : AOGWorkflowStatus.REPORTED;
      event.isLegacy = true;
    }
    return event;
  }

  private addDowntimeDuration(event: AOGEventDocument): AOGEventWithDuration {
    const eventObj = event.toObject() as AOGEventWithDuration;
    if (event.clearedAt) {
      eventObj.downtimeHours = this.computeDowntimeDuration(
        event.detectedAt,
        event.clearedAt,
      );
    }
    return eventObj;
  }


  /**
   * Updates an AOG event with milestone tracking and metric recomputation
   * 
   * This method:
   * 1. Validates timestamp ordering (detectedAt/clearedAt and milestone timestamps)
   * 2. Detects milestone timestamp changes
   * 3. Recomputes downtime metrics when milestones change
   * 4. Updates milestone history with new entries
   * 5. Tracks cost changes for audit trail
   * 
   * Requirements: 2.8, 3.5
   */
  async update(
    id: string,
    dto: UpdateAOGEventDto,
    userId: string,
  ): Promise<AOGEventDocument | null> {
    const existingEvent = await this.aogEventRepository.findById(id);
    if (!existingEvent) {
      throw new NotFoundException(`AOG Event with ID ${id} not found`);
    }

    // Validate timestamps if both are present
    const detectedAt = dto.detectedAt
      ? new Date(dto.detectedAt)
      : existingEvent.detectedAt;
    const clearedAt = dto.clearedAt
      ? new Date(dto.clearedAt)
      : existingEvent.clearedAt;

    if (clearedAt) {
      this.validateTimestamps(detectedAt, clearedAt);
    }

    // Build milestone timestamps for validation (merge existing with updates)
    const milestoneTimestamps: MilestoneTimestamps = {
      reportedAt: dto.reportedAt 
        ? new Date(dto.reportedAt) 
        : existingEvent.reportedAt || existingEvent.detectedAt,
      procurementRequestedAt: dto.procurementRequestedAt !== undefined
        ? (dto.procurementRequestedAt ? new Date(dto.procurementRequestedAt) : null)
        : existingEvent.procurementRequestedAt,
      availableAtStoreAt: dto.availableAtStoreAt !== undefined
        ? (dto.availableAtStoreAt ? new Date(dto.availableAtStoreAt) : null)
        : existingEvent.availableAtStoreAt,
      issuedBackAt: dto.issuedBackAt !== undefined
        ? (dto.issuedBackAt ? new Date(dto.issuedBackAt) : null)
        : existingEvent.issuedBackAt,
      installationCompleteAt: dto.installationCompleteAt !== undefined
        ? (dto.installationCompleteAt ? new Date(dto.installationCompleteAt) : null)
        : existingEvent.installationCompleteAt,
      testStartAt: dto.testStartAt !== undefined
        ? (dto.testStartAt ? new Date(dto.testStartAt) : null)
        : existingEvent.testStartAt,
      upAndRunningAt: dto.upAndRunningAt !== undefined
        ? (dto.upAndRunningAt ? new Date(dto.upAndRunningAt) : null)
        : existingEvent.upAndRunningAt || existingEvent.clearedAt,
    };

    // Validate milestone timestamp ordering (Requirement 3.2, 3.3)
    this.validateMilestoneOrder(milestoneTimestamps);

    // Track cost changes for audit trail
    const costAuditEntries = this.trackCostChanges(existingEvent, dto, userId);

    const updateData: Partial<AOGEvent> = {
      updatedBy: new Types.ObjectId(userId),
    };

    // Add cost audit entries if there are any
    if (costAuditEntries.length > 0) {
      updateData.costAuditTrail = [
        ...(existingEvent.costAuditTrail || []),
        ...costAuditEntries,
      ];
    }

    if (dto.aircraftId) {
      updateData.aircraftId = new Types.ObjectId(dto.aircraftId);
    }
    if (dto.detectedAt) {
      updateData.detectedAt = new Date(dto.detectedAt);
    }
    if (dto.clearedAt) {
      updateData.clearedAt = new Date(dto.clearedAt);
    }
    if (dto.category) {
      updateData.category = dto.category;
    }
    if (dto.reasonCode) {
      updateData.reasonCode = dto.reasonCode;
    }
    if (dto.location !== undefined) {
      updateData.location = dto.location || undefined;
    }
    if (dto.responsibleParty) {
      updateData.responsibleParty = dto.responsibleParty;
    }
    if (dto.actionTaken) {
      updateData.actionTaken = dto.actionTaken;
    }
    if (dto.manpowerCount !== undefined) {
      updateData.manpowerCount = dto.manpowerCount;
    }
    if (dto.manHours !== undefined) {
      updateData.manHours = dto.manHours;
    }
    if (dto.costLabor !== undefined) {
      updateData.costLabor = dto.costLabor;
    }
    if (dto.costParts !== undefined) {
      updateData.costParts = dto.costParts;
    }
    if (dto.costExternal !== undefined) {
      updateData.costExternal = dto.costExternal;
    }
    if (dto.attachments) {
      updateData.attachments = dto.attachments;
    }

    // Handle simplified cost fields (Requirement 4.1, 4.2)
    if (dto.internalCost !== undefined) {
      updateData.internalCost = dto.internalCost;
    }
    if (dto.externalCost !== undefined) {
      updateData.externalCost = dto.externalCost;
    }

    // Detect and handle milestone timestamp changes (Requirement 3.5)
    const milestoneChanges = this.detectMilestoneChanges(existingEvent, dto);
    const hasMilestoneChanges = milestoneChanges.length > 0;

    // Update milestone timestamps if provided
    if (dto.reportedAt !== undefined) {
      updateData.reportedAt = dto.reportedAt ? new Date(dto.reportedAt) : undefined;
    }
    if (dto.procurementRequestedAt !== undefined) {
      updateData.procurementRequestedAt = dto.procurementRequestedAt 
        ? new Date(dto.procurementRequestedAt) 
        : undefined;
    }
    if (dto.availableAtStoreAt !== undefined) {
      updateData.availableAtStoreAt = dto.availableAtStoreAt 
        ? new Date(dto.availableAtStoreAt) 
        : undefined;
    }
    if (dto.issuedBackAt !== undefined) {
      updateData.issuedBackAt = dto.issuedBackAt 
        ? new Date(dto.issuedBackAt) 
        : undefined;
    }
    if (dto.installationCompleteAt !== undefined) {
      updateData.installationCompleteAt = dto.installationCompleteAt 
        ? new Date(dto.installationCompleteAt) 
        : undefined;
    }
    if (dto.testStartAt !== undefined) {
      updateData.testStartAt = dto.testStartAt 
        ? new Date(dto.testStartAt) 
        : undefined;
    }
    if (dto.upAndRunningAt !== undefined) {
      updateData.upAndRunningAt = dto.upAndRunningAt 
        ? new Date(dto.upAndRunningAt) 
        : undefined;
    }

    // Recompute downtime metrics if milestones changed (Requirement 2.8)
    if (hasMilestoneChanges || dto.detectedAt || dto.clearedAt) {
      // Build the merged event data for metric computation
      const mergedEventData: Partial<AOGEvent> = {
        detectedAt: updateData.detectedAt || existingEvent.detectedAt,
        clearedAt: updateData.clearedAt || existingEvent.clearedAt,
        reportedAt: updateData.reportedAt !== undefined 
          ? updateData.reportedAt 
          : existingEvent.reportedAt || existingEvent.detectedAt,
        procurementRequestedAt: updateData.procurementRequestedAt !== undefined
          ? updateData.procurementRequestedAt
          : existingEvent.procurementRequestedAt,
        availableAtStoreAt: updateData.availableAtStoreAt !== undefined
          ? updateData.availableAtStoreAt
          : existingEvent.availableAtStoreAt,
        issuedBackAt: updateData.issuedBackAt !== undefined
          ? updateData.issuedBackAt
          : existingEvent.issuedBackAt,
        installationCompleteAt: updateData.installationCompleteAt !== undefined
          ? updateData.installationCompleteAt
          : existingEvent.installationCompleteAt,
        testStartAt: updateData.testStartAt !== undefined
          ? updateData.testStartAt
          : existingEvent.testStartAt,
        upAndRunningAt: updateData.upAndRunningAt !== undefined
          ? updateData.upAndRunningAt
          : existingEvent.upAndRunningAt || existingEvent.clearedAt,
      };

      const computedMetrics = this.computeDowntimeMetrics(mergedEventData as AOGEvent);
      updateData.technicalTimeHours = computedMetrics.technicalTimeHours;
      updateData.procurementTimeHours = computedMetrics.procurementTimeHours;
      updateData.opsTimeHours = computedMetrics.opsTimeHours;
      updateData.totalDowntimeHours = computedMetrics.totalDowntimeHours;
    }

    // Update milestone history with new entries (Requirement 3.5)
    if (milestoneChanges.length > 0) {
      const newHistoryEntries = this.createMilestoneHistoryEntriesFromChanges(
        milestoneChanges,
        userId,
      );
      updateData.milestoneHistory = [
        ...(existingEvent.milestoneHistory || []),
        ...newHistoryEntries,
      ];
    }

    return this.aogEventRepository.update(id, updateData);
  }

  /**
   * Detects which milestone timestamps have changed between existing event and update DTO
   * 
   * Requirements: 3.5
   * 
   * @param existingEvent - The existing AOG event document
   * @param dto - The update DTO with potential changes
   * @returns Array of milestone names that have changed with their new values
   */
  private detectMilestoneChanges(
    existingEvent: AOGEventDocument,
    dto: UpdateAOGEventDto,
  ): Array<{ milestone: MilestoneName; newValue: Date | null }> {
    const changes: Array<{ milestone: MilestoneName; newValue: Date | null }> = [];

    const milestoneFields: MilestoneName[] = [
      'reportedAt',
      'procurementRequestedAt',
      'availableAtStoreAt',
      'issuedBackAt',
      'installationCompleteAt',
      'testStartAt',
      'upAndRunningAt',
    ];

    for (const field of milestoneFields) {
      const dtoValue = dto[field];
      if (dtoValue !== undefined) {
        const existingValue = existingEvent[field];
        const newDate = dtoValue ? new Date(dtoValue) : null;
        
        // Check if the value has actually changed
        const existingTime = existingValue ? new Date(existingValue).getTime() : null;
        const newTime = newDate ? newDate.getTime() : null;
        
        if (existingTime !== newTime) {
          changes.push({ milestone: field, newValue: newDate });
        }
      }
    }

    return changes;
  }

  /**
   * Creates milestone history entries from detected changes
   * 
   * Requirements: 3.5
   * 
   * @param changes - Array of milestone changes
   * @param userId - ID of the user making the changes
   * @returns Array of MilestoneHistoryEntry objects
   */
  private createMilestoneHistoryEntriesFromChanges(
    changes: Array<{ milestone: MilestoneName; newValue: Date | null }>,
    userId: string,
  ): MilestoneHistoryEntry[] {
    const entries: MilestoneHistoryEntry[] = [];
    const now = new Date();
    const userObjectId = new Types.ObjectId(userId);

    for (const change of changes) {
      if (change.newValue != null) {
        entries.push({
          milestone: change.milestone,
          timestamp: change.newValue,
          recordedAt: now,
          recordedBy: userObjectId,
        });
      }
    }

    return entries;
  }

  /**
   * Tracks cost field changes for audit trail
   * Requirements: 5.5
   */
  private trackCostChanges(
    existingEvent: AOGEventDocument,
    dto: UpdateAOGEventDto,
    userId: string,
  ): CostAuditEntry[] {
    const entries: CostAuditEntry[] = [];
    const costFields = ['costLabor', 'costParts', 'costExternal'] as const;

    for (const field of costFields) {
      if (dto[field] !== undefined && dto[field] !== existingEvent[field]) {
        entries.push({
          field,
          previousValue: existingEvent[field] || 0,
          newValue: dto[field] as number,
          changedAt: new Date(),
          changedBy: new Types.ObjectId(userId),
        });
      }
    }

    return entries;
  }

  async delete(id: string): Promise<AOGEventDocument | null> {
    return this.aogEventRepository.delete(id);
  }


  /**
   * Aggregates downtime by responsible party
   * Requirements: 4.4
   */
  async getDowntimeByResponsibility(
    startDate?: Date,
    endDate?: Date,
    aircraftId?: string,
  ): Promise<DowntimeByResponsibilityResult[]> {
    return this.aogEventRepository.aggregateDowntimeByResponsibility(
      startDate,
      endDate,
      aircraftId,
    );
  }

  /**
   * Gets active AOG events (not yet cleared) with legacy event handling
   * 
   * Requirements: 10.1, 10.2, 10.3, 10.4
   */
  async getActiveAOGEvents(aircraftId?: string): Promise<AOGEventWithDuration[]> {
    const events = await this.aogEventRepository.getActiveAOGEvents(aircraftId);
    return events.map((event) => this.processEventForOutput(event));
  }

  /**
   * Counts active AOG events
   */
  async countActiveAOGEvents(aircraftId?: string): Promise<number> {
    return this.aogEventRepository.countActiveAOGEvents(aircraftId);
  }

  /**
   * Adds attachment S3 key to an AOG event
   * Requirements: 4.5
   */
  async addAttachment(id: string, s3Key: string, userId: string): Promise<AOGEventDocument | null> {
    const event = await this.aogEventRepository.findById(id);
    if (!event) {
      throw new NotFoundException(`AOG Event with ID ${id} not found`);
    }

    const attachments = [...(event.attachments || []), s3Key];
    return this.aogEventRepository.update(id, {
      attachments,
      updatedBy: new Types.ObjectId(userId),
    });
  }

  /**
   * Removes attachment S3 key from an AOG event
   */
  async removeAttachment(id: string, s3Key: string, userId: string): Promise<AOGEventDocument | null> {
    const event = await this.aogEventRepository.findById(id);
    if (!event) {
      throw new NotFoundException(`AOG Event with ID ${id} not found`);
    }

    const attachments = (event.attachments || []).filter((key) => key !== s3Key);
    return this.aogEventRepository.update(id, {
      attachments,
      updatedBy: new Types.ObjectId(userId),
    });
  }


  // ============================================
  // Part Request CRUD Methods
  // Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
  // ============================================

  /**
   * Adds a part request to an AOG event
   * Requirements: 4.1, 4.2
   */
  async addPartRequest(
    id: string,
    partRequest: Omit<PartRequest, '_id' | 'status'>,
    userId: string,
  ): Promise<AOGEventDocument> {
    const event = await this.aogEventRepository.findById(id);
    if (!event) {
      throw new NotFoundException({
        code: 'AOG_NOT_FOUND',
        message: `AOG event with ID ${id} not found`,
      });
    }

    const newPartRequest: PartRequest = {
      _id: new Types.ObjectId(),
      ...partRequest,
      status: PartRequestStatus.REQUESTED,
    };

    const updatedEvent = await this.aogEventRepository.update(id, {
      partRequests: [...(event.partRequests || []), newPartRequest],
      updatedBy: new Types.ObjectId(userId),
    });

    if (!updatedEvent) {
      throw new NotFoundException({
        code: 'AOG_NOT_FOUND',
        message: `AOG event with ID ${id} not found`,
      });
    }

    return updatedEvent;
  }

  /**
   * Updates a part request within an AOG event
   * Requirements: 4.3, 4.4
   */
  async updatePartRequest(
    id: string,
    partId: string,
    updates: Partial<PartRequest>,
    userId: string,
  ): Promise<AOGEventDocument> {
    const event = await this.aogEventRepository.findById(id);
    if (!event) {
      throw new NotFoundException({
        code: 'AOG_NOT_FOUND',
        message: `AOG event with ID ${id} not found`,
      });
    }

    const partIndex = (event.partRequests || []).findIndex(
      (p) => p._id.toString() === partId,
    );

    if (partIndex === -1) {
      throw new NotFoundException({
        code: 'PART_NOT_FOUND',
        message: `Part request with ID ${partId} not found`,
      });
    }

    // Update the part request
    const updatedPartRequests = [...(event.partRequests || [])];
    updatedPartRequests[partIndex] = {
      ...updatedPartRequests[partIndex],
      ...updates,
      _id: event.partRequests[partIndex]._id, // Preserve the ID
    };

    const updatedEvent = await this.aogEventRepository.update(id, {
      partRequests: updatedPartRequests,
      updatedBy: new Types.ObjectId(userId),
    });

    if (!updatedEvent) {
      throw new NotFoundException({
        code: 'AOG_NOT_FOUND',
        message: `AOG event with ID ${id} not found`,
      });
    }

    return updatedEvent;
  }

  /**
   * Calculates total parts cost for an AOG event
   * Requirements: 4.5
   */
  calculateTotalPartsCost(event: AOGEventDocument): number {
    if (!event.partRequests || event.partRequests.length === 0) {
      return 0;
    }

    return event.partRequests.reduce((total, part) => {
      return total + (part.actualCost || 0);
    }, 0);
  }


  // ============================================
  // Budget Integration Methods
  // Requirements: 5.4, 20.1, 20.2, 20.3, 20.4
  // ============================================

  /**
   * Generates an ActualSpend entry from AOG costs
   * Requirements: 5.4, 20.2, 20.3, 20.4
   * Note: This method requires ActualSpendRepository to be injected
   * The actual implementation will be in a separate method that takes the repository
   */
  async generateActualSpend(
    id: string,
    userId: string,
    actualSpendRepository: {
      create: (data: {
        period: string;
        aircraftId?: Types.ObjectId;
        clauseId: number;
        amount: number;
        currency: string;
        notes?: string;
        updatedBy: Types.ObjectId;
      }) => Promise<{ _id: Types.ObjectId }>;
    },
  ): Promise<AOGEventDocument> {
    const event = await this.aogEventRepository.findById(id);
    if (!event) {
      throw new NotFoundException({
        code: 'AOG_NOT_FOUND',
        message: `AOG event with ID ${id} not found`,
      });
    }

    // Check if already linked to an ActualSpend
    if (event.linkedActualSpendId) {
      throw new ConflictException({
        code: 'DUPLICATE_SPEND',
        message: 'ActualSpend already generated for this AOG',
      });
    }

    // Check if budget-affecting and has required fields
    if (!event.isBudgetAffecting) {
      throw new BadRequestException({
        code: 'NOT_BUDGET_AFFECTING',
        message: 'AOG event is not marked as budget-affecting',
      });
    }

    if (!event.budgetClauseId || !event.budgetPeriod) {
      throw new BadRequestException({
        code: 'MISSING_BUDGET_MAPPING',
        message: 'AOG event must have budgetClauseId and budgetPeriod set',
      });
    }

    // Calculate total cost
    const totalCost =
      (event.costLabor || 0) +
      (event.costParts || 0) +
      (event.costExternal || 0);

    if (totalCost <= 0) {
      throw new BadRequestException({
        code: 'NO_COSTS',
        message: 'AOG event has no costs to generate spend from',
      });
    }

    // Create ActualSpend entry
    const actualSpend = await actualSpendRepository.create({
      period: event.budgetPeriod,
      aircraftId: event.aircraftId,
      clauseId: event.budgetClauseId,
      amount: totalCost,
      currency: 'USD',
      notes: `Generated from AOG event ${id}`,
      updatedBy: new Types.ObjectId(userId),
    });

    // Link the ActualSpend to the AOG event
    const updatedEvent = await this.aogEventRepository.update(id, {
      linkedActualSpendId: actualSpend._id,
      updatedBy: new Types.ObjectId(userId),
    });

    if (!updatedEvent) {
      throw new NotFoundException({
        code: 'AOG_NOT_FOUND',
        message: `AOG event with ID ${id} not found`,
      });
    }

    return updatedEvent;
  }

  /**
   * Updates budget integration fields on an AOG event
   * Requirements: 20.1
   */
  async updateBudgetIntegration(
    id: string,
    budgetData: {
      budgetClauseId?: number;
      budgetPeriod?: string;
      isBudgetAffecting?: boolean;
    },
    userId: string,
  ): Promise<AOGEventDocument | null> {
    const event = await this.aogEventRepository.findById(id);
    if (!event) {
      throw new NotFoundException({
        code: 'AOG_NOT_FOUND',
        message: `AOG event with ID ${id} not found`,
      });
    }

    return this.aogEventRepository.update(id, {
      ...budgetData,
      updatedBy: new Types.ObjectId(userId),
    });
  }


  // ============================================
  // Analytics Methods
  // Requirements: 3.4, 3.5, 7.5, 7.6
  // ============================================

  /**
   * Gets stage breakdown analytics - count by currentStatus and blockingReason
   * Requirements: 3.4, 7.5
   */
  async getStageBreakdown(
    startDate?: Date,
    endDate?: Date,
    aircraftId?: string,
  ): Promise<StageBreakdownResult> {
    return this.aogEventRepository.getStageBreakdown(startDate, endDate, aircraftId);
  }

  /**
   * Gets bottleneck analytics - average time in each status and blocking states
   * Requirements: 3.5, 7.6
   */
  async getBottleneckAnalytics(
    startDate?: Date,
    endDate?: Date,
    aircraftId?: string,
  ): Promise<BottleneckAnalyticsResult> {
    return this.aogEventRepository.getBottleneckAnalytics(startDate, endDate, aircraftId);
  }

  /**
   * Gets three-bucket analytics for AOG events
   * 
   * Aggregates technicalTimeHours, procurementTimeHours, opsTimeHours across filtered events.
   * Calculates sum, average, and percentage for each bucket.
   * Groups by aircraft for detailed breakdown.
   * 
   * Requirements: 5.2, 5.3, 5.4
   * 
   * @param filter - Filter parameters (aircraftId, fleetGroup, startDate, endDate)
   * @returns ThreeBucketAnalytics with summary, bucket breakdown, and per-aircraft data
   */
  async getThreeBucketAnalytics(filter: ThreeBucketAnalyticsFilter): Promise<ThreeBucketAnalytics> {
    // Build the match stage for filtering
    const matchStage: Record<string, unknown> = {};

    if (filter.aircraftId) {
      matchStage.aircraftId = new Types.ObjectId(filter.aircraftId);
    }

    if (filter.startDate || filter.endDate) {
      // Use reportedAt for date filtering (falls back to detectedAt for legacy events)
      matchStage.$or = [
        {
          reportedAt: {
            ...(filter.startDate && { $gte: filter.startDate }),
            ...(filter.endDate && { $lte: filter.endDate }),
          },
        },
        {
          reportedAt: { $exists: false },
          detectedAt: {
            ...(filter.startDate && { $gte: filter.startDate }),
            ...(filter.endDate && { $lte: filter.endDate }),
          },
        },
      ];
    }

    // Build the aggregation pipeline
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [];

    // Add initial match stage if there are filters
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Convert aircraftId to ObjectId if it's a string (for proper lookup)
    pipeline.push({
      $addFields: {
        aircraftIdObj: {
          $cond: {
            if: { $eq: [{ $type: '$aircraftId' }, 'string'] },
            then: { $toObjectId: '$aircraftId' },
            else: '$aircraftId',
          },
        },
      },
    });

    // Lookup aircraft data to get registration and fleetGroup
    // Note: Mongoose pluralizes 'Aircraft' to 'aircrafts' for the collection name
    pipeline.push({
      $lookup: {
        from: 'aircrafts',
        localField: 'aircraftIdObj',
        foreignField: '_id',
        as: 'aircraft',
      },
    });

    // Unwind the aircraft array (should be single element)
    pipeline.push({
      $unwind: {
        path: '$aircraft',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Filter by fleetGroup if specified
    if (filter.fleetGroup) {
      pipeline.push({
        $match: {
          'aircraft.fleetGroup': filter.fleetGroup,
        },
      });
    }

    // Project the fields we need, handling legacy events
    pipeline.push({
      $project: {
        aircraftId: 1,
        registration: '$aircraft.registration',
        fleetGroup: '$aircraft.fleetGroup',
        clearedAt: 1,
        isLegacy: { $ifNull: ['$isLegacy', false] },
        // For legacy events, use total downtime as technical time
        technicalTimeHours: {
          $cond: {
            if: { $eq: ['$isLegacy', true] },
            then: '$totalDowntimeHours',
            else: { $ifNull: ['$technicalTimeHours', 0] },
          },
        },
        procurementTimeHours: {
          $cond: {
            if: { $eq: ['$isLegacy', true] },
            then: 0,
            else: { $ifNull: ['$procurementTimeHours', 0] },
          },
        },
        opsTimeHours: {
          $cond: {
            if: { $eq: ['$isLegacy', true] },
            then: 0,
            else: { $ifNull: ['$opsTimeHours', 0] },
          },
        },
        totalDowntimeHours: { $ifNull: ['$totalDowntimeHours', 0] },
        // Track legacy downtime separately
        legacyDowntime: {
          $cond: {
            if: { $eq: ['$isLegacy', true] },
            then: { $ifNull: ['$totalDowntimeHours', 0] },
            else: 0,
          },
        },
      },
    });

    // Facet to get both summary and per-aircraft breakdown
    pipeline.push({
      $facet: {
        // Summary statistics
        summary: [
          {
            $group: {
              _id: null,
              totalEvents: { $sum: 1 },
              activeEvents: {
                $sum: {
                  $cond: [{ $eq: ['$clearedAt', null] }, 1, 0],
                },
              },
              legacyEventCount: {
                $sum: {
                  $cond: [{ $eq: ['$isLegacy', true] }, 1, 0],
                },
              },
              totalTechnicalHours: { $sum: '$technicalTimeHours' },
              totalProcurementHours: { $sum: '$procurementTimeHours' },
              totalOpsHours: { $sum: '$opsTimeHours' },
              totalDowntimeHours: { $sum: '$totalDowntimeHours' },
              totalLegacyDowntime: { $sum: '$legacyDowntime' },
            },
          },
        ],
        // Per-aircraft breakdown
        byAircraft: [
          {
            $group: {
              _id: '$aircraftId',
              registration: { $first: '$registration' },
              technicalHours: { $sum: '$technicalTimeHours' },
              procurementHours: { $sum: '$procurementTimeHours' },
              opsHours: { $sum: '$opsTimeHours' },
              totalHours: { $sum: '$totalDowntimeHours' },
            },
          },
          {
            $project: {
              _id: 0,
              aircraftId: { $toString: '$_id' },
              registration: { $ifNull: ['$registration', 'Unknown'] },
              technicalHours: { $round: ['$technicalHours', 2] },
              procurementHours: { $round: ['$procurementHours', 2] },
              opsHours: { $round: ['$opsHours', 2] },
              totalHours: { $round: ['$totalHours', 2] },
            },
          },
          { $sort: { totalHours: -1 } },
        ],
      },
    });

    // Execute the aggregation
    const results = await this.aogEventRepository['aogEventModel'].aggregate(pipeline).exec();
    const result = results[0];

    // Extract summary data
    const summaryData = result.summary[0] || {
      totalEvents: 0,
      activeEvents: 0,
      legacyEventCount: 0,
      totalTechnicalHours: 0,
      totalProcurementHours: 0,
      totalOpsHours: 0,
      totalDowntimeHours: 0,
      totalLegacyDowntime: 0,
    };

    // Calculate averages and percentages
    const totalEvents = summaryData.totalEvents || 0;
    const legacyEventCount = summaryData.legacyEventCount || 0;
    const totalDowntimeHours = summaryData.totalDowntimeHours || 0;
    const totalTechnicalHours = summaryData.totalTechnicalHours || 0;
    const totalProcurementHours = summaryData.totalProcurementHours || 0;
    const totalOpsHours = summaryData.totalOpsHours || 0;
    const totalLegacyDowntime = summaryData.totalLegacyDowntime || 0;

    // Calculate percentages (avoid division by zero)
    const calculatePercentage = (value: number, total: number): number => {
      if (total === 0) return 0;
      return Math.round((value / total) * 10000) / 100; // Round to 2 decimal places
    };

    // Build the response
    const response: ThreeBucketAnalytics = {
      summary: {
        totalEvents,
        activeEvents: summaryData.activeEvents || 0,
        totalDowntimeHours: Math.round(totalDowntimeHours * 100) / 100,
        averageDowntimeHours: totalEvents > 0 
          ? Math.round((totalDowntimeHours / totalEvents) * 100) / 100 
          : 0,
      },
      buckets: {
        technical: {
          totalHours: Math.round(totalTechnicalHours * 100) / 100,
          averageHours: totalEvents > 0 
            ? Math.round((totalTechnicalHours / totalEvents) * 100) / 100 
            : 0,
          percentage: calculatePercentage(totalTechnicalHours, totalDowntimeHours),
        },
        procurement: {
          totalHours: Math.round(totalProcurementHours * 100) / 100,
          averageHours: totalEvents > 0 
            ? Math.round((totalProcurementHours / totalEvents) * 100) / 100 
            : 0,
          percentage: calculatePercentage(totalProcurementHours, totalDowntimeHours),
        },
        ops: {
          totalHours: Math.round(totalOpsHours * 100) / 100,
          averageHours: totalEvents > 0 
            ? Math.round((totalOpsHours / totalEvents) * 100) / 100 
            : 0,
          percentage: calculatePercentage(totalOpsHours, totalDowntimeHours),
        },
      },
      byAircraft: result.byAircraft || [],
      // Legacy data handling (FR-1.1, FR-1.3)
      legacyEventCount,
      legacyDowntimeHours: Math.round(totalLegacyDowntime * 100) / 100,
    };

    return response;
  }

  // ============================================
  // New Analytics Endpoints for Import Enhancement
  // Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 16.1-16.8
  // ============================================

  /**
   * Gets category breakdown analytics
   * Groups events by category and calculates count, percentage, and total hours
   * 
   * Requirements: 8.1, 16.4
   * 
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @param aircraftId - Optional aircraft ID filter
   * @returns Array of category breakdown with count, percentage, and total hours
   */
  async getCategoryBreakdown(
    startDate?: Date,
    endDate?: Date,
    aircraftId?: string,
  ): Promise<Array<{
    category: string;
    count: number;
    percentage: number;
    totalHours: number;
  }>> {
    const matchStage: Record<string, unknown> = {};

    if (aircraftId) {
      matchStage.aircraftId = new Types.ObjectId(aircraftId);
    }

    if (startDate || endDate) {
      matchStage.detectedAt = {
        ...(startDate && { $gte: startDate }),
        ...(endDate && { $lte: endDate }),
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [];

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalHours: { $sum: { $ifNull: ['$totalDowntimeHours', 0] } },
        },
      },
      {
        $group: {
          _id: null,
          categories: {
            $push: {
              category: '$_id',
              count: '$count',
              totalHours: '$totalHours',
            },
          },
          totalCount: { $sum: '$count' },
        },
      },
      {
        $unwind: '$categories',
      },
      {
        $project: {
          _id: 0,
          category: '$categories.category',
          count: '$categories.count',
          percentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$categories.count', '$totalCount'] },
                  100,
                ],
              },
              2,
            ],
          },
          totalHours: { $round: ['$categories.totalHours', 2] },
        },
      },
      {
        $sort: { count: -1 },
      },
    );

    return this.aogEventRepository['aogEventModel'].aggregate(pipeline).exec();
  }

  /**
   * Gets location heatmap analytics
   * Groups events by location and calculates count and percentage
   * Returns top N locations by event count
   * 
   * Requirements: 8.2, 16.3
   * 
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @param aircraftId - Optional aircraft ID filter
   * @param limit - Number of top locations to return (default: 5)
   * @returns Array of location breakdown with count and percentage
   */
  async getLocationHeatmap(
    startDate?: Date,
    endDate?: Date,
    aircraftId?: string,
    limit: number = 5,
  ): Promise<Array<{
    location: string;
    count: number;
    percentage: number;
  }>> {
    const matchStage: Record<string, unknown> = {};

    if (aircraftId) {
      matchStage.aircraftId = new Types.ObjectId(aircraftId);
    }

    if (startDate || endDate) {
      matchStage.detectedAt = {
        ...(startDate && { $gte: startDate }),
        ...(endDate && { $lte: endDate }),
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [];

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Filter out events without location
    pipeline.push({
      $match: {
        location: { $ne: null, $exists: true },
      },
    });

    pipeline.push(
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          locations: {
            $push: {
              location: '$_id',
              count: '$count',
            },
          },
          totalCount: { $sum: '$count' },
        },
      },
      {
        $unwind: '$locations',
      },
      {
        $project: {
          _id: 0,
          location: '$locations.location',
          count: '$locations.count',
          percentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$locations.count', '$totalCount'] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: limit,
      },
    );

    return this.aogEventRepository['aogEventModel'].aggregate(pipeline).exec();
  }

  /**
   * Gets duration distribution analytics
   * Groups events by duration ranges and calculates count and percentage
   * 
   * Duration ranges:
   * - < 24 hours
   * - 1-7 days
   * - 1-4 weeks
   * - > 1 month
   * 
   * Requirements: 8.3, 6.5
   * 
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @param aircraftId - Optional aircraft ID filter
   * @returns Array of duration ranges with count and percentage
   */
  async getDurationDistribution(
    startDate?: Date,
    endDate?: Date,
    aircraftId?: string,
  ): Promise<Array<{
    range: string;
    count: number;
    percentage: number;
  }>> {
    const matchStage: Record<string, unknown> = {};

    if (aircraftId) {
      matchStage.aircraftId = new Types.ObjectId(aircraftId);
    }

    if (startDate || endDate) {
      matchStage.detectedAt = {
        ...(startDate && { $gte: startDate }),
        ...(endDate && { $lte: endDate }),
      };
    }

    // Only include resolved events (with clearedAt)
    matchStage.clearedAt = { $ne: null, $exists: true };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [];

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
      {
        $addFields: {
          durationHours: { $ifNull: ['$totalDowntimeHours', 0] },
        },
      },
      {
        $bucket: {
          groupBy: '$durationHours',
          boundaries: [0, 24, 168, 672, Infinity], // 24h, 7d, 28d, infinity
          default: 'Unknown',
          output: {
            count: { $sum: 1 },
          },
        },
      },
      {
        $group: {
          _id: null,
          ranges: {
            $push: {
              boundary: '$_id',
              count: '$count',
            },
          },
          totalCount: { $sum: '$count' },
        },
      },
      {
        $unwind: '$ranges',
      },
      {
        $project: {
          _id: 0,
          range: {
            $switch: {
              branches: [
                { case: { $eq: ['$ranges.boundary', 0] }, then: '< 24 hours' },
                { case: { $eq: ['$ranges.boundary', 24] }, then: '1-7 days' },
                { case: { $eq: ['$ranges.boundary', 168] }, then: '1-4 weeks' },
                { case: { $eq: ['$ranges.boundary', 672] }, then: '> 1 month' },
              ],
              default: 'Unknown',
            },
          },
          count: '$ranges.count',
          percentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$ranges.count', '$totalCount'] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
    );

    return this.aogEventRepository['aogEventModel'].aggregate(pipeline).exec();
  }

  /**
   * Gets aircraft reliability analytics
   * Ranks aircraft by event count and total downtime
   * Returns top 3 most reliable and top 3 needing attention
   * 
   * Requirements: 8.4, 16.1
   * 
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns Object with mostReliable and needsAttention arrays
   */
  async getAircraftReliability(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    mostReliable: Array<{
      aircraftId: string;
      registration: string;
      eventCount: number;
      totalHours: number;
    }>;
    needsAttention: Array<{
      aircraftId: string;
      registration: string;
      eventCount: number;
      totalHours: number;
    }>;
  }> {
    const matchStage: Record<string, unknown> = {};

    if (startDate || endDate) {
      matchStage.detectedAt = {
        ...(startDate && { $gte: startDate }),
        ...(endDate && { $lte: endDate }),
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [];

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Convert aircraftId to ObjectId if it's a string
    pipeline.push({
      $addFields: {
        aircraftIdObj: {
          $cond: {
            if: { $eq: [{ $type: '$aircraftId' }, 'string'] },
            then: { $toObjectId: '$aircraftId' },
            else: '$aircraftId',
          },
        },
      },
    });

    // Lookup aircraft data
    pipeline.push({
      $lookup: {
        from: 'aircrafts',
        localField: 'aircraftIdObj',
        foreignField: '_id',
        as: 'aircraft',
      },
    });

    pipeline.push({
      $unwind: {
        path: '$aircraft',
        preserveNullAndEmptyArrays: true,
      },
    });

    pipeline.push(
      {
        $group: {
          _id: '$aircraftId',
          registration: { $first: '$aircraft.registration' },
          eventCount: { $sum: 1 },
          totalHours: { $sum: { $ifNull: ['$totalDowntimeHours', 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          aircraftId: { $toString: '$_id' },
          registration: { $ifNull: ['$registration', 'Unknown'] },
          eventCount: 1,
          totalHours: { $round: ['$totalHours', 2] },
        },
      },
    );

    const allAircraft = await this.aogEventRepository['aogEventModel']
      .aggregate(pipeline)
      .exec();

    // Sort by event count ascending for most reliable
    const mostReliable = [...allAircraft]
      .sort((a, b) => a.eventCount - b.eventCount)
      .slice(0, 3);

    // Sort by event count descending for needs attention
    const needsAttention = [...allAircraft]
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 3);

    return {
      mostReliable,
      needsAttention,
    };
  }

  /**
   * Gets monthly trend analytics
   * Groups events by month and calculates count and total hours
   * 
   * Requirements: 8.5, 16.5
   * 
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @param aircraftId - Optional aircraft ID filter
   * @returns Array of monthly data with count and total hours
   */
  async getMonthlyTrend(
    startDate?: Date,
    endDate?: Date,
    aircraftId?: string,
  ): Promise<{
    trends: Array<{
      month: string;
      eventCount: number;
      totalDowntimeHours: number;
      averageDowntimeHours: number;
    }>;
    movingAverage: Array<{
      month: string;
      value: number;
    }>;
  }> {
    const matchStage: Record<string, unknown> = {};

    if (aircraftId) {
      matchStage.aircraftId = new Types.ObjectId(aircraftId);
    }

    if (startDate || endDate) {
      matchStage.detectedAt = {
        ...(startDate && { $gte: startDate }),
        ...(endDate && { $lte: endDate }),
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [];

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
      {
        $group: {
          _id: {
            year: { $year: '$detectedAt' },
            month: { $month: '$detectedAt' },
          },
          eventCount: { $sum: 1 },
          totalDowntimeHours: { $sum: { $ifNull: ['$totalDowntimeHours', 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' },
                },
              },
            ],
          },
          eventCount: 1,
          totalDowntimeHours: { $round: ['$totalDowntimeHours', 2] },
          averageDowntimeHours: {
            $round: [
              {
                $cond: {
                  if: { $eq: ['$eventCount', 0] },
                  then: 0,
                  else: { $divide: ['$totalDowntimeHours', '$eventCount'] },
                },
              },
              2,
            ],
          },
        },
      },
      {
        $sort: { month: 1 },
      },
    );

    const trends = await this.aogEventRepository['aogEventModel'].aggregate(pipeline).exec();

    // Calculate 3-month moving average
    const movingAverage = this.calculateMovingAverage(trends, 3);

    return { trends, movingAverage };
  }

  /**
   * Calculates moving average for time-series data
   * 
   * For the first (window - 1) points, uses the actual value.
   * For subsequent points, calculates the average of the last 'window' points.
   * 
   * Requirements: FR-2.2
   * 
   * @param data - Array of data points with month and totalDowntimeHours
   * @param window - Window size for moving average (default: 3)
   * @returns Array of moving average data points
   */
  private calculateMovingAverage(
    data: Array<{ month: string; totalDowntimeHours: number }>,
    window: number,
  ): Array<{ month: string; value: number }> {
    const result: Array<{ month: string; value: number }> = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) {
        // For the first (window - 1) points, use the actual value
        result.push({ 
          month: data[i].month, 
          value: Math.round(data[i].totalDowntimeHours * 100) / 100,
        });
      } else {
        // Calculate average of the last 'window' points
        const sum = data
          .slice(i - window + 1, i + 1)
          .reduce((acc, item) => acc + item.totalDowntimeHours, 0);
        result.push({
          month: data[i].month,
          value: Math.round((sum / window) * 100) / 100,
        });
      }
    }
    
    return result;
  }

  /**
   * Generates insights from AOG data
   * Calculates top problem aircraft, most common issues, busiest locations,
   * average resolution time by category, and fleet health score
   * Enhanced with 8 insight detection algorithms
   * 
   * Requirements: FR-2.6, FR-1.3
   * 
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns InsightsResponseDto with top 5 insights and data quality metrics
   */
  async getInsights(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    insights: Array<{
      id: string;
      type: 'warning' | 'info' | 'success';
      title: string;
      description: string;
      metric?: number;
      recommendation?: string;
    }>;
    dataQuality: {
      completenessPercentage: number;
      legacyEventCount: number;
      totalEvents: number;
    };
  }> {
    const insights: Array<{
      id: string;
      type: 'warning' | 'info' | 'success';
      title: string;
      description: string;
      metric?: number;
      recommendation?: string;
    }> = [];

    // Fetch necessary data
    const filter: AOGEventFilter = {
      startDate,
      endDate,
    };
    const events = await this.findAll(filter);
    const bucketAnalytics = await this.getThreeBucketAnalytics({ startDate, endDate });

    // 1. Check for procurement bottleneck (>50% of downtime)
    const procurementPercentage = bucketAnalytics.buckets.procurement.percentage;
    if (procurementPercentage > 50) {
      insights.push({
        id: 'procurement-bottleneck',
        type: 'warning',
        title: 'Procurement Delays Detected',
        description: `Parts procurement accounts for ${procurementPercentage.toFixed(1)}% of total downtime, indicating supply chain issues.`,
        metric: procurementPercentage,
        recommendation: 'Review supplier contracts and consider increasing critical parts inventory.',
      });
    }

    // 2. Check for recurring issues (same reason code 3+ times in period)
    const reasonCodeCounts = this.countReasonCodes(events);
    const recurringIssues = reasonCodeCounts.filter(rc => rc.count >= 3);
    if (recurringIssues.length > 0) {
      const topIssue = recurringIssues[0];
      insights.push({
        id: 'recurring-issue',
        type: 'warning',
        title: `Recurring Issue: ${topIssue.reasonCode}`,
        description: `This issue has occurred ${topIssue.count} times in the selected period.`,
        metric: topIssue.count,
        recommendation: 'Conduct root cause analysis and implement preventive measures.',
      });
    }

    // 3. Check for cost spike (current month > 150% of 3-month average)
    const costSpike = await this.detectCostSpike(events);
    if (costSpike.detected) {
      insights.push({
        id: 'cost-spike',
        type: 'warning',
        title: 'Unusual Cost Increase',
        description: `AOG costs are ${costSpike.increasePercentage.toFixed(1)}% higher than the 3-month average.`,
        metric: costSpike.increasePercentage,
        recommendation: 'Review recent high-cost events and identify cost drivers.',
      });
    }

    // 4. Check for improving trend (downtime decreased >20% vs previous period)
    const trendAnalysis = await this.analyzeTrend(startDate, endDate);
    if (trendAnalysis.improving && trendAnalysis.improvement > 20) {
      insights.push({
        id: 'improving-trend',
        type: 'success',
        title: 'Downtime Reduction Success',
        description: `Total downtime decreased by ${trendAnalysis.improvement.toFixed(1)}% compared to the previous period.`,
        metric: trendAnalysis.improvement,
        recommendation: 'Document successful practices for replication across the fleet.',
      });
    }

    // 5. Check data quality (>30% legacy events)
    const legacyEventCount = events.filter(e => e.isLegacy).length;
    const completenessPercentage = events.length > 0 
      ? ((events.length - legacyEventCount) / events.length) * 100 
      : 100;
    
    if (completenessPercentage < 70) {
      insights.push({
        id: 'data-quality',
        type: 'info',
        title: 'Incomplete Data Detected',
        description: `${(100 - completenessPercentage).toFixed(1)}% of events lack milestone timestamps, limiting analytics accuracy.`,
        metric: completenessPercentage,
        recommendation: 'Update recent events with milestone data for better insights.',
      });
    }

    // 6. Check for high-risk aircraft (risk score > 70)
    const highRiskAircraft = await this.identifyHighRiskAircraft(events);
    if (highRiskAircraft.length > 0) {
      const topRisk = highRiskAircraft[0];
      insights.push({
        id: 'high-risk-aircraft',
        type: 'warning',
        title: `High-Risk Aircraft: ${topRisk.registration}`,
        description: `Aircraft has ${topRisk.eventCount} events with ${topRisk.totalHours.toFixed(1)} hours of downtime.`,
        metric: topRisk.eventCount,
        recommendation: 'Schedule comprehensive maintenance review and preventive actions.',
      });
    }

    // 7. Check for seasonal pattern (consistent pattern across years)
    const seasonalPattern = await this.detectSeasonalPattern(events);
    if (seasonalPattern.detected) {
      insights.push({
        id: 'seasonal-pattern',
        type: 'info',
        title: 'Seasonal Pattern Detected',
        description: `AOG events increase during ${seasonalPattern.peakMonths.join(', ')}.`,
        metric: seasonalPattern.peakIncrease,
        recommendation: 'Plan additional resources for peak periods.',
      });
    }

    // 8. Check for bottleneck (one bucket >60% of total time)
    const bottleneck = this.identifyBottleneck(bucketAnalytics);
    if (bottleneck.detected) {
      insights.push({
        id: 'bottleneck-identified',
        type: 'warning',
        title: `${bottleneck.bucketName} Bottleneck`,
        description: `${bottleneck.bucketName} time accounts for ${bottleneck.percentage.toFixed(1)}% of downtime.`,
        metric: bottleneck.percentage,
        recommendation: `Focus improvement efforts on ${bottleneck.specificArea}.`,
      });
    }

    // Sort insights by priority (warnings first, then info, then success)
    const priorityOrder = { warning: 1, info: 2, success: 3 };
    insights.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

    // Return top 5 insights
    const topInsights = insights.slice(0, 5);

    // Calculate data quality metrics
    const dataQuality = {
      completenessPercentage: Math.round(completenessPercentage * 100) / 100,
      legacyEventCount,
      totalEvents: events.length,
    };

    return { insights: topInsights, dataQuality };
  }

  /**
   * Helper method to get top problem aircraft
   * Requirements: 16.1
   */
  private async getTopProblemAircraft(
    matchStage: Record<string, unknown>,
  ): Promise<Array<{
    registration: string;
    eventCount: number;
    totalHours: number;
  }>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [];

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Convert aircraftId to ObjectId if it's a string
    pipeline.push({
      $addFields: {
        aircraftIdObj: {
          $cond: {
            if: { $eq: [{ $type: '$aircraftId' }, 'string'] },
            then: { $toObjectId: '$aircraftId' },
            else: '$aircraftId',
          },
        },
      },
    });

    // Lookup aircraft data
    pipeline.push({
      $lookup: {
        from: 'aircrafts',
        localField: 'aircraftIdObj',
        foreignField: '_id',
        as: 'aircraft',
      },
    });

    pipeline.push({
      $unwind: {
        path: '$aircraft',
        preserveNullAndEmptyArrays: true,
      },
    });

    pipeline.push(
      {
        $group: {
          _id: '$aircraftId',
          registration: { $first: '$aircraft.registration' },
          eventCount: { $sum: 1 },
          totalHours: { $sum: { $ifNull: ['$totalDowntimeHours', 0] } },
        },
      },
      {
        $match: {
          eventCount: { $gt: 10 },
        },
      },
      {
        $project: {
          _id: 0,
          registration: { $ifNull: ['$registration', 'Unknown'] },
          eventCount: 1,
          totalHours: { $round: ['$totalHours', 2] },
        },
      },
      {
        $sort: { eventCount: -1 },
      },
      {
        $limit: 5,
      },
    );

    return this.aogEventRepository['aogEventModel'].aggregate(pipeline).exec();
  }

  /**
   * Helper method to get most common issues
   * Requirements: 16.2
   */
  private async getMostCommonIssues(
    matchStage: Record<string, unknown>,
  ): Promise<Array<{
    issue: string;
    count: number;
  }>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [];

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Filter out events without reasonCode
    pipeline.push({
      $match: {
        $and: [
          { reasonCode: { $exists: true } },
          { reasonCode: { $ne: null } },
          { reasonCode: { $ne: '' } },
        ],
      },
    });

    pipeline.push(
      {
        $group: {
          _id: '$reasonCode',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          issue: '$_id',
          count: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    );

    return this.aogEventRepository['aogEventModel'].aggregate(pipeline).exec();
  }

  /**
   * Helper method to get busiest locations
   * Requirements: 16.3
   */
  private async getBusiestLocations(
    matchStage: Record<string, unknown>,
  ): Promise<Array<{
    location: string;
    count: number;
  }>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [];

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Filter out events without location
    pipeline.push({
      $match: {
        $and: [
          { location: { $exists: true } },
          { location: { $ne: null } },
          { location: { $ne: '' } },
        ],
      },
    });

    pipeline.push(
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          location: '$_id',
          count: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
    );

    return this.aogEventRepository['aogEventModel'].aggregate(pipeline).exec();
  }

  /**
   * Helper method to get average resolution time by category
   * Requirements: 16.4, 16.5
   */
  private async getAverageResolutionTimeByCategory(
    matchStage: Record<string, unknown>,
  ): Promise<{
    aog: number;
    scheduled: number;
    unscheduled: number;
    mro: number;
    cleaning: number;
  }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [];

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Only include resolved events
    pipeline.push({
      $match: {
        clearedAt: { $ne: null, $exists: true },
      },
    });

    pipeline.push(
      {
        $group: {
          _id: '$category',
          avgHours: { $avg: { $ifNull: ['$totalDowntimeHours', 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          avgHours: { $round: ['$avgHours', 2] },
        },
      },
    );

    const results = await this.aogEventRepository['aogEventModel']
      .aggregate(pipeline)
      .exec();

    // Build the response object with default values
    const response = {
      aog: 0,
      scheduled: 0,
      unscheduled: 0,
      mro: 0,
      cleaning: 0,
    };

    // Map the results to the response object
    for (const result of results) {
      if (result.category in response) {
        response[result.category as keyof typeof response] = result.avgHours;
      }
    }

    return response;
  }

  /**
   * Helper method to calculate fleet health score
   * Requirements: 16.6, 16.7, 16.8
   * 
   * Fleet Health Score (0-100) is calculated based on:
   * - Active AOG count (lower is better)
   * - Average downtime (lower is better)
   * - Event frequency (lower is better)
   */
  private async calculateFleetHealthScore(
    matchStage: Record<string, unknown>,
  ): Promise<number> {
    // Get active AOG count
    const activeCount = await this.aogEventRepository.countActiveAOGEvents();

    // Get total events in period
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [];

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push({
      $group: {
        _id: null,
        totalEvents: { $sum: 1 },
        avgDowntime: { $avg: { $ifNull: ['$totalDowntimeHours', 0] } },
      },
    });

    const results = await this.aogEventRepository['aogEventModel']
      .aggregate(pipeline)
      .exec();

    const stats = results[0] || { totalEvents: 0, avgDowntime: 0 };

    // Calculate score components
    // Active AOG penalty: -10 points per active AOG (max -50)
    const activeAOGPenalty = Math.min(activeCount * 10, 50);

    // Event frequency penalty: -1 point per event (max -30)
    const eventFrequencyPenalty = Math.min(stats.totalEvents, 30);

    // Average downtime penalty: -1 point per 10 hours (max -20)
    const downtimePenalty = Math.min(Math.floor(stats.avgDowntime / 10), 20);

    // Calculate final score (start at 100, subtract penalties)
    const score = Math.max(
      0,
      100 - activeAOGPenalty - eventFrequencyPenalty - downtimePenalty,
    );

    return Math.round(score);
  }

  /**
   * Helper method: Count reason codes and sort by frequency
   * Requirements: FR-2.6 (Insight 2: Recurring Issues)
   */
  private countReasonCodes(
    events: AOGEventWithDuration[],
  ): Array<{ reasonCode: string; count: number }> {
    const counts = new Map<string, number>();
    
    for (const event of events) {
      if (event.reasonCode) {
        const current = counts.get(event.reasonCode) || 0;
        counts.set(event.reasonCode, current + 1);
      }
    }
    
    return Array.from(counts.entries())
      .map(([reasonCode, count]) => ({ reasonCode, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Helper method: Detect cost spike (current month > 150% of 3-month average)
   * Requirements: FR-2.6 (Insight 3: Cost Spike)
   */
  private async detectCostSpike(
    events: AOGEventWithDuration[],
  ): Promise<{ detected: boolean; increasePercentage: number }> {
    if (events.length === 0) {
      return { detected: false, increasePercentage: 0 };
    }

    // Group events by month and calculate costs
    const monthlyCosts = new Map<string, number>();
    
    for (const event of events) {
      const month = new Date(event.detectedAt).toISOString().substring(0, 7); // YYYY-MM
      const totalCost = (event.internalCost || 0) + (event.externalCost || 0);
      const current = monthlyCosts.get(month) || 0;
      monthlyCosts.set(month, current + totalCost);
    }

    // Get sorted months
    const sortedMonths = Array.from(monthlyCosts.keys()).sort();
    
    if (sortedMonths.length < 2) {
      return { detected: false, increasePercentage: 0 };
    }

    // Get current month (most recent)
    const currentMonth = sortedMonths[sortedMonths.length - 1];
    const currentCost = monthlyCosts.get(currentMonth) || 0;

    // Calculate 3-month average (excluding current month)
    const previousMonths = sortedMonths.slice(Math.max(0, sortedMonths.length - 4), sortedMonths.length - 1);
    const previousCosts = previousMonths.map(m => monthlyCosts.get(m) || 0);
    const averageCost = previousCosts.length > 0
      ? previousCosts.reduce((sum, cost) => sum + cost, 0) / previousCosts.length
      : 0;

    if (averageCost === 0) {
      return { detected: false, increasePercentage: 0 };
    }

    const increasePercentage = ((currentCost - averageCost) / averageCost) * 100;
    const detected = currentCost > averageCost * 1.5;

    return { detected, increasePercentage };
  }

  /**
   * Helper method: Analyze trend (compare current period to previous period)
   * Requirements: FR-2.6 (Insight 4: Improving Trend)
   */
  private async analyzeTrend(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ improving: boolean; improvement: number }> {
    if (!startDate || !endDate) {
      return { improving: false, improvement: 0 };
    }

    // Calculate period duration
    const periodDuration = endDate.getTime() - startDate.getTime();
    
    // Calculate previous period dates
    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousStartDate = new Date(previousEndDate.getTime() - periodDuration);

    // Get current period downtime
    const currentEvents = await this.findAll({ startDate, endDate });
    const currentDowntime = currentEvents.reduce(
      (sum, event) => sum + (event.totalDowntimeHours || 0),
      0,
    );

    // Get previous period downtime
    const previousEvents = await this.findAll({
      startDate: previousStartDate,
      endDate: previousEndDate,
    });
    const previousDowntime = previousEvents.reduce(
      (sum, event) => sum + (event.totalDowntimeHours || 0),
      0,
    );

    if (previousDowntime === 0) {
      return { improving: false, improvement: 0 };
    }

    const improvement = ((previousDowntime - currentDowntime) / previousDowntime) * 100;
    const improving = improvement > 0;

    return { improving, improvement };
  }

  /**
   * Helper method: Identify high-risk aircraft (risk score > 70)
   * Requirements: FR-2.6 (Insight 6: Aircraft at Risk)
   */
  private async identifyHighRiskAircraft(
    events: AOGEventWithDuration[],
  ): Promise<Array<{ registration: string; eventCount: number; totalHours: number; riskScore: number }>> {
    // Group events by aircraft
    const aircraftMap = new Map<string, { eventCount: number; totalHours: number; registration: string }>();
    
    for (const event of events) {
      const aircraftId = event.aircraftId.toString();
      const existing = aircraftMap.get(aircraftId);
      
      if (existing) {
        existing.eventCount++;
        existing.totalHours += event.totalDowntimeHours || 0;
      } else {
        // Get aircraft registration from populated field or fetch it
        const registration = (event as any).aircraft?.registration || 'Unknown';
        aircraftMap.set(aircraftId, {
          eventCount: 1,
          totalHours: event.totalDowntimeHours || 0,
          registration,
        });
      }
    }

    // Calculate risk scores and filter high-risk aircraft
    const highRiskAircraft = Array.from(aircraftMap.values())
      .map(aircraft => {
        // Risk score based on event count and downtime
        // Formula: (eventCount * 5) + (totalHours / 10)
        const riskScore = (aircraft.eventCount * 5) + (aircraft.totalHours / 10);
        return { ...aircraft, riskScore };
      })
      .filter(aircraft => aircraft.riskScore > 70)
      .sort((a, b) => b.riskScore - a.riskScore);

    return highRiskAircraft;
  }

  /**
   * Helper method: Detect seasonal pattern
   * Requirements: FR-2.6 (Insight 7: Seasonal Pattern)
   */
  private async detectSeasonalPattern(
    events: AOGEventWithDuration[],
  ): Promise<{ detected: boolean; peakMonths: string[]; peakIncrease: number }> {
    if (events.length < 12) {
      // Need at least a year of data to detect seasonal patterns
      return { detected: false, peakMonths: [], peakIncrease: 0 };
    }

    // Group events by month (1-12)
    const monthCounts = new Array(12).fill(0);
    
    for (const event of events) {
      const month = new Date(event.detectedAt).getMonth(); // 0-11
      monthCounts[month]++;
    }

    // Calculate average
    const average = monthCounts.reduce((sum, count) => sum + count, 0) / 12;

    // Find peak months (>30% above average)
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const peakMonths: string[] = [];
    let maxIncrease = 0;

    for (let i = 0; i < 12; i++) {
      const increase = ((monthCounts[i] - average) / average) * 100;
      if (increase > 30) {
        peakMonths.push(monthNames[i]);
        maxIncrease = Math.max(maxIncrease, increase);
      }
    }

    const detected = peakMonths.length > 0;

    return { detected, peakMonths, peakIncrease: maxIncrease };
  }

  /**
   * Helper method: Identify bottleneck (one bucket >60% of total time)
   * Requirements: FR-2.6 (Insight 8: Bottleneck Identified)
   */
  private identifyBottleneck(
    bucketAnalytics: ThreeBucketAnalytics,
  ): { detected: boolean; bucketName: string; percentage: number; specificArea: string } {
    const buckets = [
      { name: 'Technical', percentage: bucketAnalytics.buckets.technical.percentage, area: 'troubleshooting and installation processes' },
      { name: 'Procurement', percentage: bucketAnalytics.buckets.procurement.percentage, area: 'parts procurement and supply chain' },
      { name: 'Ops', percentage: bucketAnalytics.buckets.ops.percentage, area: 'operational testing and validation' },
    ];

    // Find bucket with highest percentage
    const maxBucket = buckets.reduce((max, bucket) => 
      bucket.percentage > max.percentage ? bucket : max
    );

    const detected = maxBucket.percentage > 60;

    return {
      detected,
      bucketName: maxBucket.name,
      percentage: maxBucket.percentage,
      specificArea: maxBucket.area,
    };
  }

  /**
   * Generates 3-month downtime forecast using linear regression
   * 
   * Uses last 12 months of historical data to predict future downtime.
   * Applies simple linear regression (y = mx + b) and includes ±20% confidence intervals.
   * 
   * Requirements: FR-2.6, Property 8 (Forecast Bounds)
   * 
   * @param startDate - Optional start date filter (defaults to 12 months ago)
   * @param endDate - Optional end date filter (defaults to today)
   * @param aircraftId - Optional aircraft ID filter
   * @returns ForecastResponseDto with historical and predicted values
   */
  async generateForecast(
    startDate?: Date,
    endDate?: Date,
    aircraftId?: string,
  ): Promise<{
    historical: Array<{
      month: string;
      actual: number;
    }>;
    forecast: Array<{
      month: string;
      predicted: number;
      confidenceInterval: {
        lower: number;
        upper: number;
      };
    }>;
  }> {
    // Get historical monthly data (last 12 months if no date range specified)
    const defaultEndDate = endDate || new Date();
    const defaultStartDate = startDate || new Date(defaultEndDate.getFullYear(), defaultEndDate.getMonth() - 11, 1);

    const monthlyTrend = await this.getMonthlyTrend(
      defaultStartDate,
      defaultEndDate,
      aircraftId,
    );

    // Prepare data for linear regression
    const historicalData = monthlyTrend.trends.map((item, index) => ({
      x: index,
      y: item.totalDowntimeHours,
      month: item.month,
    }));

    // Need at least 3 data points for meaningful forecast
    if (historicalData.length < 3) {
      return {
        historical: historicalData.map(item => ({
          month: item.month,
          actual: item.y,
        })),
        forecast: [],
      };
    }

    // Calculate linear regression: y = mx + b
    const n = historicalData.length;
    const sumX = historicalData.reduce((sum, item) => sum + item.x, 0);
    const sumY = historicalData.reduce((sum, item) => sum + item.y, 0);
    const sumXY = historicalData.reduce((sum, item) => sum + item.x * item.y, 0);
    const sumX2 = historicalData.reduce((sum, item) => sum + item.x * item.x, 0);

    // Calculate slope (m) and intercept (b)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast for next 3 months
    const forecastData: Array<{
      month: string;
      predicted: number;
      confidenceInterval: {
        lower: number;
        upper: number;
      };
    }> = [];
    for (let i = 1; i <= 3; i++) {
      const x = n + i - 1;
      const predicted = slope * x + intercept;
      const confidenceInterval = Math.abs(predicted) * 0.2; // ±20% confidence

      // Calculate next month (YYYY-MM format)
      const lastMonth = new Date(historicalData[historicalData.length - 1].month + '-01');
      const nextMonth = new Date(lastMonth);
      nextMonth.setMonth(nextMonth.getMonth() + i);
      
      const year = nextMonth.getFullYear();
      const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
      const monthStr = `${year}-${month}`;

      forecastData.push({
        month: monthStr,
        predicted: Math.max(0, Math.round(predicted * 100) / 100),
        confidenceInterval: {
          lower: Math.max(0, Math.round((predicted - confidenceInterval) * 100) / 100),
          upper: Math.round((predicted + confidenceInterval) * 100) / 100,
        },
      });
    }

    return {
      historical: historicalData.map(item => ({
        month: item.month,
        actual: item.y,
      })),
      forecast: forecastData,
    };
  }
}
