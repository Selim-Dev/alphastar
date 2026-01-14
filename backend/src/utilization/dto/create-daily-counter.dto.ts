import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDailyCounterDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Aircraft ID (MongoDB ObjectId)',
  })
  @IsMongoId({ message: 'Aircraft ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Aircraft ID is required' })
  aircraftId: string;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Date of the counter reading (ISO 8601 format)',
  })
  @IsDateString({}, { message: 'Date must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Date is required' })
  date: string;

  @ApiProperty({
    example: 12500.5,
    description: 'Total airframe hours since new (TTSN)',
    minimum: 0,
  })
  @IsNumber({}, { message: 'Airframe hours must be a number' })
  @Min(0, { message: 'Airframe hours cannot be negative' })
  airframeHoursTtsn: number;

  @ApiProperty({
    example: 4500,
    description: 'Total airframe cycles since new (TCSN)',
    minimum: 0,
  })
  @IsNumber({}, { message: 'Airframe cycles must be a number' })
  @Min(0, { message: 'Airframe cycles cannot be negative' })
  airframeCyclesTcsn: number;

  @ApiProperty({
    example: 11000.25,
    description: 'Engine 1 total hours',
    minimum: 0,
  })
  @IsNumber({}, { message: 'Engine 1 hours must be a number' })
  @Min(0, { message: 'Engine 1 hours cannot be negative' })
  engine1Hours: number;

  @ApiProperty({
    example: 4200,
    description: 'Engine 1 total cycles',
    minimum: 0,
  })
  @IsNumber({}, { message: 'Engine 1 cycles must be a number' })
  @Min(0, { message: 'Engine 1 cycles cannot be negative' })
  engine1Cycles: number;

  @ApiProperty({
    example: 10800.75,
    description: 'Engine 2 total hours',
    minimum: 0,
  })
  @IsNumber({}, { message: 'Engine 2 hours must be a number' })
  @Min(0, { message: 'Engine 2 hours cannot be negative' })
  engine2Hours: number;

  @ApiProperty({
    example: 4100,
    description: 'Engine 2 total cycles',
    minimum: 0,
  })
  @IsNumber({}, { message: 'Engine 2 cycles must be a number' })
  @Min(0, { message: 'Engine 2 cycles cannot be negative' })
  engine2Cycles: number;

  @ApiPropertyOptional({
    example: 9500.0,
    description: 'Engine 3 total hours (for 3+ engine aircraft)',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Engine 3 hours must be a number' })
  @Min(0, { message: 'Engine 3 hours cannot be negative' })
  engine3Hours?: number;

  @ApiPropertyOptional({
    example: 3800,
    description: 'Engine 3 total cycles (for 3+ engine aircraft)',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Engine 3 cycles must be a number' })
  @Min(0, { message: 'Engine 3 cycles cannot be negative' })
  engine3Cycles?: number;

  @ApiPropertyOptional({
    example: 9200.5,
    description: 'Engine 4 total hours (for 4 engine aircraft)',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Engine 4 hours must be a number' })
  @Min(0, { message: 'Engine 4 hours cannot be negative' })
  engine4Hours?: number;

  @ApiPropertyOptional({
    example: 3700,
    description: 'Engine 4 total cycles (for 4 engine aircraft)',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Engine 4 cycles must be a number' })
  @Min(0, { message: 'Engine 4 cycles cannot be negative' })
  engine4Cycles?: number;

  @ApiProperty({
    example: 8500.25,
    description: 'APU total hours',
    minimum: 0,
  })
  @IsNumber({}, { message: 'APU hours must be a number' })
  @Min(0, { message: 'APU hours cannot be negative' })
  apuHours: number;

  @ApiPropertyOptional({
    example: 15000,
    description: 'APU total cycles',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'APU cycles must be a number' })
  @Min(0, { message: 'APU cycles cannot be negative' })
  apuCycles?: number;

  @ApiPropertyOptional({
    example: '2024-01-14',
    description: 'Date of last flight (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Last flight date must be a valid ISO 8601 date string' })
  lastFlightDate?: string;
}
