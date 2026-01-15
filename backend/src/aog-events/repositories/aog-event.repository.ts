import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AOGEvent,
  AOGEventDocument,
  ResponsibleParty,
  AOGWorkflowStatus,
  BlockingReason,
} from '../schemas/aog-event.schema';

export interface AOGEventFilter {
  aircraftId?: string;
  responsibleParty?: ResponsibleParty;
  startDate?: Date;
  endDate?: Date;
  category?: string;
  currentStatus?: AOGWorkflowStatus;
  blockingReason?: BlockingReason;
}

export interface DowntimeByResponsibilityResult {
  responsibleParty: ResponsibleParty;
  totalDowntimeHours: number;
  eventCount: number;
}

/**
 * Stage breakdown analytics result
 * Requirements: 3.4, 7.5
 */
export interface StageBreakdownResult {
  byStatus: Array<{
    status: AOGWorkflowStatus;
    count: number;
  }>;
  byBlockingReason: Array<{
    blockingReason: BlockingReason;
    count: number;
  }>;
  totalActive: number;
  totalBlocked: number;
}

/**
 * Bottleneck analytics result
 * Requirements: 3.5, 7.6
 */
export interface BottleneckAnalyticsResult {
  averageTimeByStatus: Array<{
    status: AOGWorkflowStatus;
    averageHours: number;
    eventCount: number;
  }>;
  averageTimeInBlockingStates: Array<{
    blockingReason: BlockingReason;
    averageHours: number;
    eventCount: number;
  }>;
  overallAverageResolutionTime: number;
}

@Injectable()
export class AOGEventRepository {
  constructor(
    @InjectModel(AOGEvent.name)
    private readonly aogEventModel: Model<AOGEventDocument>,
  ) {}

  async create(data: Partial<AOGEvent>): Promise<AOGEventDocument> {
    const event = new this.aogEventModel(data);
    return event.save();
  }

  async findById(id: string): Promise<AOGEventDocument | null> {
    return this.aogEventModel.findById(id).exec();
  }

  async findAll(filter?: AOGEventFilter): Promise<AOGEventDocument[]> {
    const query: Record<string, unknown> = {};

    if (filter?.aircraftId) {
      query.aircraftId = new Types.ObjectId(filter.aircraftId);
    }
    if (filter?.responsibleParty) {
      query.responsibleParty = filter.responsibleParty;
    }
    if (filter?.category) {
      query.category = filter.category;
    }
    if (filter?.currentStatus) {
      query.currentStatus = filter.currentStatus;
    }
    if (filter?.blockingReason) {
      query.blockingReason = filter.blockingReason;
    }
    if (filter?.startDate || filter?.endDate) {
      query.detectedAt = {};
      if (filter.startDate) {
        (query.detectedAt as Record<string, Date>).$gte = filter.startDate;
      }
      if (filter.endDate) {
        (query.detectedAt as Record<string, Date>).$lte = filter.endDate;
      }
    }

    return this.aogEventModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async update(
    id: string,
    updateData: Partial<AOGEvent>,
  ): Promise<AOGEventDocument | null> {
    return this.aogEventModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<AOGEventDocument | null> {
    return this.aogEventModel.findByIdAndDelete(id).exec();
  }

  /**
   * Aggregates total downtime hours grouped by responsible party
   * Requirements: 4.4
   */
  async aggregateDowntimeByResponsibility(
    startDate?: Date,
    endDate?: Date,
    aircraftId?: string,
  ): Promise<DowntimeByResponsibilityResult[]> {
    const matchStage: Record<string, unknown> = {
      clearedAt: { $exists: true, $ne: null },
    };

    if (aircraftId) {
      matchStage.aircraftId = new Types.ObjectId(aircraftId);
    }
    if (startDate || endDate) {
      matchStage.detectedAt = {};
      if (startDate) {
        (matchStage.detectedAt as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (matchStage.detectedAt as Record<string, Date>).$lte = endDate;
      }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $project: {
          responsibleParty: 1,
          downtimeHours: {
            $divide: [
              { $subtract: ['$clearedAt', '$detectedAt'] },
              1000 * 60 * 60, // Convert ms to hours
            ],
          },
        },
      },
      {
        $group: {
          _id: '$responsibleParty',
          totalDowntimeHours: { $sum: '$downtimeHours' },
          eventCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          responsibleParty: '$_id',
          totalDowntimeHours: { $round: ['$totalDowntimeHours', 2] },
          eventCount: 1,
        },
      },
      { $sort: { totalDowntimeHours: -1 as const } },
    ];

    return this.aogEventModel.aggregate(pipeline).exec();
  }

  /**
   * Gets active AOG events (not yet cleared)
   */
  async getActiveAOGEvents(aircraftId?: string): Promise<AOGEventDocument[]> {
    const query: Record<string, unknown> = {
      clearedAt: { $exists: false },
    };

    if (aircraftId) {
      query.aircraftId = new Types.ObjectId(aircraftId);
    }

    return this.aogEventModel.find(query).sort({ detectedAt: -1 }).exec();
  }

  /**
   * Counts active AOG events
   */
  async countActiveAOGEvents(aircraftId?: string): Promise<number> {
    const query: Record<string, unknown> = {
      clearedAt: { $exists: false },
    };

    if (aircraftId) {
      query.aircraftId = new Types.ObjectId(aircraftId);
    }

    return this.aogEventModel.countDocuments(query).exec();
  }

  /**
   * Gets stage breakdown analytics - count by currentStatus and blockingReason
   * Requirements: 3.4, 7.5
   */
  async getStageBreakdown(
    startDate?: Date,
    endDate?: Date,
    aircraftId?: string,
  ): Promise<StageBreakdownResult> {
    const matchStage: Record<string, unknown> = {};

    if (aircraftId) {
      matchStage.aircraftId = new Types.ObjectId(aircraftId);
    }
    if (startDate || endDate) {
      matchStage.detectedAt = {};
      if (startDate) {
        (matchStage.detectedAt as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (matchStage.detectedAt as Record<string, Date>).$lte = endDate;
      }
    }

    // Count by currentStatus
    const statusPipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$currentStatus',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },
      { $sort: { count: -1 as const } },
    ];

    // Count by blockingReason (only for events with blocking reason set)
    const blockingReasonPipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $match: {
          blockingReason: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$blockingReason',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          blockingReason: '$_id',
          count: 1,
        },
      },
      { $sort: { count: -1 as const } },
    ];

    // Count active (not cleared) events
    const activeMatchStage = {
      ...matchStage,
      clearedAt: { $exists: false },
    };

    // Count blocked events (events in blocking statuses)
    const blockedMatchStage = {
      ...matchStage,
      currentStatus: {
        $in: [
          AOGWorkflowStatus.FINANCE_APPROVAL_PENDING,
          AOGWorkflowStatus.AT_PORT,
          AOGWorkflowStatus.CUSTOMS_CLEARANCE,
          AOGWorkflowStatus.IN_TRANSIT,
        ],
      },
    };

    const [byStatus, byBlockingReason, totalActive, totalBlocked] =
      await Promise.all([
        this.aogEventModel.aggregate(statusPipeline).exec(),
        this.aogEventModel.aggregate(blockingReasonPipeline).exec(),
        this.aogEventModel.countDocuments(activeMatchStage).exec(),
        this.aogEventModel.countDocuments(blockedMatchStage).exec(),
      ]);

    return {
      byStatus,
      byBlockingReason,
      totalActive,
      totalBlocked,
    };
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
    const matchStage: Record<string, unknown> = {
      statusHistory: { $exists: true, $ne: [] },
    };

    if (aircraftId) {
      matchStage.aircraftId = new Types.ObjectId(aircraftId);
    }
    if (startDate || endDate) {
      matchStage.detectedAt = {};
      if (startDate) {
        (matchStage.detectedAt as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (matchStage.detectedAt as Record<string, Date>).$lte = endDate;
      }
    }

    // Calculate average time in each status from status history
    // We need to calculate time spent in each status by looking at consecutive transitions
    const timeByStatusPipeline = [
      { $match: matchStage },
      { $unwind: '$statusHistory' },
      {
        $group: {
          _id: '$statusHistory.fromStatus',
          transitions: {
            $push: {
              timestamp: '$statusHistory.timestamp',
              toStatus: '$statusHistory.toStatus',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          eventCount: { $size: '$transitions' },
        },
      },
      { $sort: { eventCount: -1 as const } },
    ];

    // For more accurate time calculation, we need to look at pairs of transitions
    // This aggregation calculates time spent in each status
    const detailedTimeByStatusPipeline = [
      { $match: matchStage },
      {
        $project: {
          statusHistory: 1,
          detectedAt: 1,
          clearedAt: 1,
          currentStatus: 1,
        },
      },
      { $unwind: { path: '$statusHistory', includeArrayIndex: 'idx' } },
      {
        $group: {
          _id: {
            eventId: '$_id',
            fromStatus: '$statusHistory.fromStatus',
          },
          timestamp: { $first: '$statusHistory.timestamp' },
          nextTimestamp: { $last: '$statusHistory.timestamp' },
        },
      },
      {
        $group: {
          _id: '$_id.fromStatus',
          totalTimeMs: {
            $sum: {
              $subtract: ['$nextTimestamp', '$timestamp'],
            },
          },
          eventCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          averageHours: {
            $round: [
              {
                $divide: [
                  { $divide: ['$totalTimeMs', '$eventCount'] },
                  1000 * 60 * 60, // Convert ms to hours
                ],
              },
              2,
            ],
          },
          eventCount: 1,
        },
      },
      { $match: { status: { $ne: null } } },
      { $sort: { averageHours: -1 as const } },
    ];

    // Calculate average time in blocking states
    const blockingStatuses = [
      AOGWorkflowStatus.FINANCE_APPROVAL_PENDING,
      AOGWorkflowStatus.AT_PORT,
      AOGWorkflowStatus.CUSTOMS_CLEARANCE,
      AOGWorkflowStatus.IN_TRANSIT,
    ];

    const timeInBlockingStatesPipeline = [
      {
        $match: {
          ...matchStage,
          blockingReason: { $exists: true, $ne: null },
          statusHistory: { $exists: true, $ne: [] },
        },
      },
      { $unwind: '$statusHistory' },
      {
        $match: {
          'statusHistory.fromStatus': { $in: blockingStatuses },
        },
      },
      {
        $group: {
          _id: {
            eventId: '$_id',
            blockingReason: '$blockingReason',
          },
          entryTime: { $min: '$statusHistory.timestamp' },
          exitTime: { $max: '$statusHistory.timestamp' },
        },
      },
      {
        $group: {
          _id: '$_id.blockingReason',
          totalTimeMs: {
            $sum: { $subtract: ['$exitTime', '$entryTime'] },
          },
          eventCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          blockingReason: '$_id',
          averageHours: {
            $round: [
              {
                $divide: [
                  { $divide: ['$totalTimeMs', '$eventCount'] },
                  1000 * 60 * 60,
                ],
              },
              2,
            ],
          },
          eventCount: 1,
        },
      },
      { $match: { blockingReason: { $ne: null } } },
      { $sort: { averageHours: -1 as const } },
    ];

    // Calculate overall average resolution time (for cleared events)
    const overallResolutionPipeline = [
      {
        $match: {
          ...matchStage,
          clearedAt: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          resolutionTimeMs: { $subtract: ['$clearedAt', '$detectedAt'] },
        },
      },
      {
        $group: {
          _id: null,
          avgResolutionTimeMs: { $avg: '$resolutionTimeMs' },
        },
      },
      {
        $project: {
          _id: 0,
          averageHours: {
            $round: [
              { $divide: ['$avgResolutionTimeMs', 1000 * 60 * 60] },
              2,
            ],
          },
        },
      },
    ];

    const [averageTimeByStatus, averageTimeInBlockingStates, overallResolution] =
      await Promise.all([
        this.aogEventModel.aggregate(detailedTimeByStatusPipeline).exec(),
        this.aogEventModel.aggregate(timeInBlockingStatesPipeline).exec(),
        this.aogEventModel.aggregate(overallResolutionPipeline).exec(),
      ]);

    return {
      averageTimeByStatus,
      averageTimeInBlockingStates,
      overallAverageResolutionTime: overallResolution[0]?.averageHours || 0,
    };
  }
}
