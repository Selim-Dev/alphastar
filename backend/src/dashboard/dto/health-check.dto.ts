import { ApiProperty } from '@nestjs/swagger';

export class CollectionCountDto {
  @ApiProperty({ description: 'Collection name' })
  name: string;

  @ApiProperty({ description: 'Number of documents in the collection' })
  count: number;

  @ApiProperty({ description: 'Status indicator', enum: ['ok', 'warning', 'empty'] })
  status: 'ok' | 'warning' | 'empty';
}

export class HealthCheckResponseDto {
  @ApiProperty({ type: [CollectionCountDto], description: 'Collection counts' })
  collections: CollectionCountDto[];

  @ApiProperty({ description: 'Last fetch timestamp' })
  lastFetch: Date;

  @ApiProperty({ description: 'API connection status', enum: ['connected', 'error'] })
  apiStatus: 'connected' | 'error';
}

export class SeedTriggerResponseDto {
  @ApiProperty({ description: 'Whether the seed operation was successful' })
  success: boolean;

  @ApiProperty({ description: 'Message describing the result' })
  message: string;
}
