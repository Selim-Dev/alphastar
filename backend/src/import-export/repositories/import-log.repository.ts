import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ImportLog, ImportLogDocument, ImportType } from '../schemas/import-log.schema';

export interface ImportLogFilter {
  importType?: ImportType;
  importedBy?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class ImportLogRepository {
  constructor(
    @InjectModel(ImportLog.name)
    private readonly importLogModel: Model<ImportLogDocument>,
  ) {}

  async create(data: Partial<ImportLog>): Promise<ImportLogDocument> {
    const log = new this.importLogModel(data);
    return log.save();
  }

  async findById(id: string): Promise<ImportLogDocument | null> {
    return this.importLogModel.findById(id).exec();
  }

  async findAll(filter?: ImportLogFilter): Promise<ImportLogDocument[]> {
    const query: Record<string, unknown> = {};

    if (filter?.importType) {
      query.importType = filter.importType;
    }
    if (filter?.importedBy) {
      query.importedBy = new Types.ObjectId(filter.importedBy);
    }
    if (filter?.startDate || filter?.endDate) {
      query.createdAt = {};
      if (filter.startDate) {
        (query.createdAt as Record<string, Date>).$gte = filter.startDate;
      }
      if (filter.endDate) {
        (query.createdAt as Record<string, Date>).$lte = filter.endDate;
      }
    }

    return this.importLogModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async delete(id: string): Promise<ImportLogDocument | null> {
    return this.importLogModel.findByIdAndDelete(id).exec();
  }

  async getRecentImports(limit: number = 10): Promise<ImportLogDocument[]> {
    return this.importLogModel.find().sort({ createdAt: -1 }).limit(limit).exec();
  }
}
