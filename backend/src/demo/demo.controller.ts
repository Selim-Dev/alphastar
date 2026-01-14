import {
  Controller,
  Post,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DemoService } from './demo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';
import {
  DemoSeedResponseDto,
  DemoResetResponseDto,
  DemoStatusResponseDto,
} from './dto/demo-response.dto';

@ApiTags('Demo')
@Controller('demo')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Get('status')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get demo data status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns counts of demo records per collection',
    type: DemoStatusResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getStatus(): Promise<DemoStatusResponseDto> {
    return this.demoService.getStatus();
  }

  @Post('seed')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate demo data (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Demo data seeded successfully',
    type: DemoSeedResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 500, description: 'Failed to seed demo data' })
  async seed(): Promise<DemoSeedResponseDto> {
    return this.demoService.seed();
  }

  @Post('reset')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset (delete) demo data (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Demo data reset successfully',
    type: DemoResetResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 500, description: 'Failed to reset demo data' })
  async reset(): Promise<DemoResetResponseDto> {
    return this.demoService.reset();
  }
}
