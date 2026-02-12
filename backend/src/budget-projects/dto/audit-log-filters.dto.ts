import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';

export class AuditLogFiltersDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(['create', 'update', 'delete'])
  action?: 'create' | 'update' | 'delete';

  @IsOptional()
  @IsEnum(['project', 'planRow', 'actual'])
  entityType?: 'project' | 'planRow' | 'actual';
}
