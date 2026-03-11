import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AOGSubEventsService } from '../services/aog-sub-events.service';
import { AOGSubEventRepository } from '../repositories/aog-sub-event.repository';
import { AOGEventRepository } from '../repositories/aog-event.repository';

describe('AOGSubEventsService', () => {
  let service: AOGSubEventsService;
  let subEventRepo: Record<string, jest.Mock>;
  let eventRepo: Record<string, jest.Mock>;

  const mockUserId = new Types.ObjectId().toString();
  const mockParentId = new Types.ObjectId().toString();
  const mockSubId = new Types.ObjectId().toString();

  beforeEach(async () => {
    subEventRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByParentId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    eventRepo = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AOGSubEventsService,
        { provide: AOGSubEventRepository, useValue: subEventRepo },
        { provide: AOGEventRepository, useValue: eventRepo },
      ],
    }).compile();

    service = module.get<AOGSubEventsService>(AOGSubEventsService);
  });

  describe('computeTimeBuckets', () => {
    it('should compute zero downtime for same detectedAt and clearedAt', () => {
      const now = new Date('2025-01-10T12:00:00Z');
      const result = service.computeTimeBuckets({
        detectedAt: now,
        clearedAt: now,
        departmentHandoffs: [],
      });

      expect(result.totalDowntimeHours).toBe(0);
      expect(result.technicalTimeHours).toBe(0);
      expect(result.departmentTimeHours).toBe(0);
      expect(result.departmentTimeTotals).toEqual({});
    });

    it('should compute correct downtime with no handoffs', () => {
      const result = service.computeTimeBuckets({
        detectedAt: new Date('2025-01-10T00:00:00Z'),
        clearedAt: new Date('2025-01-10T10:00:00Z'),
        departmentHandoffs: [],
      });

      expect(result.totalDowntimeHours).toBe(10);
      expect(result.technicalTimeHours).toBe(10);
      expect(result.departmentTimeHours).toBe(0);
      expect(result.departmentTimeTotals).toEqual({});
    });

    it('should compute correct buckets with handoffs', () => {
      const result = service.computeTimeBuckets({
        detectedAt: new Date('2025-01-10T00:00:00Z'),
        clearedAt: new Date('2025-01-10T10:00:00Z'),
        departmentHandoffs: [
          {
            _id: new Types.ObjectId(),
            department: 'QC',
            sentAt: new Date('2025-01-10T01:00:00Z'),
            returnedAt: new Date('2025-01-10T04:00:00Z'),
          },
          {
            _id: new Types.ObjectId(),
            department: 'Engineering',
            sentAt: new Date('2025-01-10T05:00:00Z'),
            returnedAt: new Date('2025-01-10T07:00:00Z'),
          },
        ],
      });

      expect(result.totalDowntimeHours).toBe(10);
      expect(result.departmentTimeHours).toBe(5);
      expect(result.technicalTimeHours).toBe(5);
      expect(result.departmentTimeTotals).toEqual({
        QC: 3,
        Engineering: 2,
      });
    });

    it('should group multiple handoffs to the same department', () => {
      const result = service.computeTimeBuckets({
        detectedAt: new Date('2025-01-10T00:00:00Z'),
        clearedAt: new Date('2025-01-10T12:00:00Z'),
        departmentHandoffs: [
          {
            _id: new Types.ObjectId(),
            department: 'QC',
            sentAt: new Date('2025-01-10T01:00:00Z'),
            returnedAt: new Date('2025-01-10T03:00:00Z'),
          },
          {
            _id: new Types.ObjectId(),
            department: 'QC',
            sentAt: new Date('2025-01-10T06:00:00Z'),
            returnedAt: new Date('2025-01-10T08:00:00Z'),
          },
        ],
      });

      expect(result.departmentTimeTotals).toEqual({ QC: 4 });
      expect(result.departmentTimeHours).toBe(4);
      expect(result.technicalTimeHours).toBe(8);
    });

    it('should floor technicalTimeHours at zero when handoffs exceed total', () => {
      const result = service.computeTimeBuckets({
        detectedAt: new Date('2025-01-10T00:00:00Z'),
        clearedAt: new Date('2025-01-10T02:00:00Z'),
        departmentHandoffs: [
          {
            _id: new Types.ObjectId(),
            department: 'QC',
            sentAt: new Date('2025-01-09T00:00:00Z'),
            returnedAt: new Date('2025-01-10T10:00:00Z'),
          },
        ],
      });

      expect(result.totalDowntimeHours).toBe(2);
      expect(result.technicalTimeHours).toBe(0);
    });

    it('should floor totalDowntimeHours at zero', () => {
      const result = service.computeTimeBuckets({
        detectedAt: new Date('2025-01-10T10:00:00Z'),
        clearedAt: new Date('2025-01-10T05:00:00Z'),
        departmentHandoffs: [],
      });

      expect(result.totalDowntimeHours).toBe(0);
      expect(result.technicalTimeHours).toBe(0);
    });
  });

  describe('create', () => {
    it('should throw BadRequestException if parent does not exist', async () => {
      eventRepo.findById.mockResolvedValue(null);

      await expect(
        service.create(
          mockParentId,
          {
            category: 'aog',
            reasonCode: 'Engine failure',
            actionTaken: 'Replaced engine',
            detectedAt: '2025-01-10T00:00:00Z',
            manpowerCount: 3,
            manHours: 12,
          },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a sub-event with computed time buckets', async () => {
      eventRepo.findById.mockResolvedValue({
        _id: new Types.ObjectId(mockParentId),
      });
      subEventRepo.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        parentEventId: new Types.ObjectId(mockParentId),
        category: 'aog',
        totalDowntimeHours: 10,
      });

      const result = await service.create(
        mockParentId,
        {
          category: 'aog',
          reasonCode: 'Engine failure',
          actionTaken: 'Replaced engine',
          detectedAt: '2025-01-10T00:00:00Z',
          clearedAt: '2025-01-10T10:00:00Z',
          manpowerCount: 3,
          manHours: 12,
        },
        mockUserId,
      );

      expect(subEventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'aog',
          technicalTimeHours: 10,
          departmentTimeHours: 0,
          totalDowntimeHours: 10,
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if sub-event does not exist', async () => {
      subEventRepo.findById.mockResolvedValue(null);

      await expect(service.findById(mockParentId, mockSubId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if parentId does not match', async () => {
      const differentParentId = new Types.ObjectId();
      subEventRepo.findById.mockResolvedValue({
        _id: new Types.ObjectId(mockSubId),
        parentEventId: differentParentId,
      });

      await expect(service.findById(mockParentId, mockSubId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return sub-event when found and parentId matches', async () => {
      const doc = {
        _id: new Types.ObjectId(mockSubId),
        parentEventId: new Types.ObjectId(mockParentId),
        category: 'aog',
      };
      subEventRepo.findById.mockResolvedValue(doc);

      const result = await service.findById(mockParentId, mockSubId);
      expect(result).toBe(doc);
    });
  });

  describe('update', () => {
    it('should update and recompute time buckets', async () => {
      const existing = {
        _id: new Types.ObjectId(mockSubId),
        parentEventId: new Types.ObjectId(mockParentId),
        detectedAt: new Date('2025-01-10T00:00:00Z'),
        clearedAt: new Date('2025-01-10T10:00:00Z'),
        departmentHandoffs: [],
      };
      subEventRepo.findById.mockResolvedValue(existing);
      subEventRepo.update.mockResolvedValue({
        ...existing,
        clearedAt: new Date('2025-01-10T20:00:00Z'),
        totalDowntimeHours: 20,
        technicalTimeHours: 20,
        departmentTimeHours: 0,
      });

      const result = await service.update(
        mockParentId,
        mockSubId,
        { clearedAt: '2025-01-10T20:00:00Z' },
        mockUserId,
      );

      expect(subEventRepo.update).toHaveBeenCalledWith(
        mockSubId,
        expect.objectContaining({
          clearedAt: new Date('2025-01-10T20:00:00Z'),
          totalDowntimeHours: 20,
          technicalTimeHours: 20,
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should validate parentId match before deleting', async () => {
      subEventRepo.findById.mockResolvedValue(null);

      await expect(service.delete(mockParentId, mockSubId)).rejects.toThrow(
        NotFoundException,
      );
      expect(subEventRepo.delete).not.toHaveBeenCalled();
    });

    it('should delete when parentId matches', async () => {
      subEventRepo.findById.mockResolvedValue({
        _id: new Types.ObjectId(mockSubId),
        parentEventId: new Types.ObjectId(mockParentId),
      });
      subEventRepo.delete.mockResolvedValue(null);

      await service.delete(mockParentId, mockSubId);
      expect(subEventRepo.delete).toHaveBeenCalledWith(mockSubId);
    });
  });

  describe('addHandoff', () => {
    const makeSubEvent = (handoffs: unknown[] = []) => ({
      _id: new Types.ObjectId(mockSubId),
      parentEventId: new Types.ObjectId(mockParentId),
      detectedAt: new Date('2025-01-10T00:00:00Z'),
      clearedAt: new Date('2025-01-10T10:00:00Z'),
      departmentHandoffs: handoffs,
    });

    it('should add a handoff and recompute time buckets', async () => {
      const subEvent = makeSubEvent();
      subEventRepo.findById.mockResolvedValue(subEvent);
      subEventRepo.update.mockResolvedValue({
        ...subEvent,
        departmentHandoffs: [
          {
            _id: expect.any(Types.ObjectId),
            department: 'QC',
            sentAt: new Date('2025-01-10T02:00:00Z'),
            returnedAt: new Date('2025-01-10T05:00:00Z'),
          },
        ],
        technicalTimeHours: 7,
        departmentTimeHours: 3,
        totalDowntimeHours: 10,
      });

      const result = await service.addHandoff(
        mockParentId,
        mockSubId,
        {
          department: 'QC',
          sentAt: '2025-01-10T02:00:00Z',
          returnedAt: '2025-01-10T05:00:00Z',
        },
        mockUserId,
      );

      expect(subEventRepo.update).toHaveBeenCalledWith(
        mockSubId,
        expect.objectContaining({
          technicalTimeHours: 7,
          departmentTimeHours: 3,
          totalDowntimeHours: 10,
          departmentHandoffs: expect.arrayContaining([
            expect.objectContaining({
              department: 'QC',
              sentAt: new Date('2025-01-10T02:00:00Z'),
              returnedAt: new Date('2025-01-10T05:00:00Z'),
            }),
          ]),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if returnedAt < sentAt', async () => {
      const subEvent = makeSubEvent();
      subEventRepo.findById.mockResolvedValue(subEvent);

      await expect(
        service.addHandoff(
          mockParentId,
          mockSubId,
          {
            department: 'Engineering',
            sentAt: '2025-01-10T05:00:00Z',
            returnedAt: '2025-01-10T02:00:00Z',
          },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow handoff without returnedAt', async () => {
      const subEvent = makeSubEvent();
      subEventRepo.findById.mockResolvedValue(subEvent);
      subEventRepo.update.mockResolvedValue({
        ...subEvent,
        departmentHandoffs: [
          {
            _id: expect.any(Types.ObjectId),
            department: 'Others',
            sentAt: new Date('2025-01-10T03:00:00Z'),
          },
        ],
      });

      const result = await service.addHandoff(
        mockParentId,
        mockSubId,
        {
          department: 'Others',
          sentAt: '2025-01-10T03:00:00Z',
        },
        mockUserId,
      );

      expect(subEventRepo.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('updateHandoff', () => {
    const mockHandoffId = new Types.ObjectId();

    const makeSubEventWithHandoff = () => ({
      _id: new Types.ObjectId(mockSubId),
      parentEventId: new Types.ObjectId(mockParentId),
      detectedAt: new Date('2025-01-10T00:00:00Z'),
      clearedAt: new Date('2025-01-10T10:00:00Z'),
      departmentHandoffs: [
        {
          _id: mockHandoffId,
          department: 'QC',
          sentAt: new Date('2025-01-10T01:00:00Z'),
          returnedAt: new Date('2025-01-10T04:00:00Z'),
          notes: 'original',
        },
      ],
    });

    it('should update handoff fields and recompute buckets', async () => {
      const subEvent = makeSubEventWithHandoff();
      subEventRepo.findById.mockResolvedValue(subEvent);
      subEventRepo.update.mockResolvedValue({
        ...subEvent,
        technicalTimeHours: 4,
        departmentTimeHours: 6,
      });

      const result = await service.updateHandoff(
        mockParentId,
        mockSubId,
        mockHandoffId.toString(),
        { returnedAt: '2025-01-10T07:00:00Z' },
        mockUserId,
      );

      expect(subEventRepo.update).toHaveBeenCalledWith(
        mockSubId,
        expect.objectContaining({
          departmentHandoffs: expect.arrayContaining([
            expect.objectContaining({
              department: 'QC',
              returnedAt: new Date('2025-01-10T07:00:00Z'),
            }),
          ]),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if handoffId not found', async () => {
      const subEvent = makeSubEventWithHandoff();
      subEventRepo.findById.mockResolvedValue(subEvent);

      await expect(
        service.updateHandoff(
          mockParentId,
          mockSubId,
          new Types.ObjectId().toString(),
          { notes: 'updated' },
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if merged returnedAt < sentAt', async () => {
      const subEvent = makeSubEventWithHandoff();
      subEventRepo.findById.mockResolvedValue(subEvent);

      await expect(
        service.updateHandoff(
          mockParentId,
          mockSubId,
          mockHandoffId.toString(),
          { returnedAt: '2025-01-10T00:30:00Z' },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeHandoff', () => {
    const mockHandoffId = new Types.ObjectId();

    const makeSubEventWithHandoff = () => ({
      _id: new Types.ObjectId(mockSubId),
      parentEventId: new Types.ObjectId(mockParentId),
      detectedAt: new Date('2025-01-10T00:00:00Z'),
      clearedAt: new Date('2025-01-10T10:00:00Z'),
      departmentHandoffs: [
        {
          _id: mockHandoffId,
          department: 'QC',
          sentAt: new Date('2025-01-10T01:00:00Z'),
          returnedAt: new Date('2025-01-10T04:00:00Z'),
        },
      ],
    });

    it('should remove handoff and recompute buckets', async () => {
      const subEvent = makeSubEventWithHandoff();
      subEventRepo.findById.mockResolvedValue(subEvent);
      subEventRepo.update.mockResolvedValue({
        ...subEvent,
        departmentHandoffs: [],
        technicalTimeHours: 10,
        departmentTimeHours: 0,
      });

      const result = await service.removeHandoff(
        mockParentId,
        mockSubId,
        mockHandoffId.toString(),
        mockUserId,
      );

      expect(subEventRepo.update).toHaveBeenCalledWith(
        mockSubId,
        expect.objectContaining({
          departmentHandoffs: [],
          technicalTimeHours: 10,
          departmentTimeHours: 0,
          totalDowntimeHours: 10,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if handoffId not found', async () => {
      const subEvent = makeSubEventWithHandoff();
      subEventRepo.findById.mockResolvedValue(subEvent);

      await expect(
        service.removeHandoff(
          mockParentId,
          mockSubId,
          new Types.ObjectId().toString(),
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
