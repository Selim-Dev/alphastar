import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AircraftService } from './services/aircraft.service';
import { CreateAircraftDto } from './dto/create-aircraft.dto';
import { UpdateAircraftDto } from './dto/update-aircraft.dto';
import { FilterAircraftDto } from './dto/filter-aircraft.dto';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth';
import { UserRole } from '../auth/schemas/user.schema';

@ApiTags('Aircraft')
@Controller('aircraft')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AircraftController {
  constructor(private readonly aircraftService: AircraftService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Create a new aircraft' })
  @ApiResponse({ status: 201, description: 'Aircraft created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Aircraft with registration already exists' })
  async create(@Body() createAircraftDto: CreateAircraftDto) {
    return this.aircraftService.create({
      ...createAircraftDto,
      manufactureDate: createAircraftDto.manufactureDate
        ? new Date(createAircraftDto.manufactureDate)
        : undefined,
      certificationDate: createAircraftDto.certificationDate
        ? new Date(createAircraftDto.certificationDate)
        : undefined,
      inServiceDate: createAircraftDto.inServiceDate
        ? new Date(createAircraftDto.inServiceDate)
        : undefined,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all aircraft with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns list of aircraft' })
  async findAll(@Query() filter: FilterAircraftDto) {
    return this.aircraftService.findAll(filter);
  }

  @Get('registration/:registration')
  @ApiOperation({ summary: 'Get aircraft by registration' })
  @ApiParam({ name: 'registration', description: 'Aircraft registration (tail number)' })
  @ApiResponse({ status: 200, description: 'Returns the aircraft' })
  @ApiResponse({ status: 404, description: 'Aircraft not found' })
  async findByRegistration(@Param('registration') registration: string) {
    return this.aircraftService.findByRegistration(registration);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get aircraft by ID' })
  @ApiParam({ name: 'id', description: 'Aircraft ID' })
  @ApiResponse({ status: 200, description: 'Returns the aircraft' })
  @ApiResponse({ status: 404, description: 'Aircraft not found' })
  async findById(@Param('id') id: string) {
    return this.aircraftService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Update aircraft by ID' })
  @ApiParam({ name: 'id', description: 'Aircraft ID' })
  @ApiResponse({ status: 200, description: 'Aircraft updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Aircraft not found' })
  async update(
    @Param('id') id: string,
    @Body() updateAircraftDto: UpdateAircraftDto,
  ) {
    const updateData = {
      ...updateAircraftDto,
      manufactureDate: updateAircraftDto.manufactureDate
        ? new Date(updateAircraftDto.manufactureDate)
        : undefined,
      certificationDate: updateAircraftDto.certificationDate
        ? new Date(updateAircraftDto.certificationDate)
        : undefined,
      inServiceDate: updateAircraftDto.inServiceDate
        ? new Date(updateAircraftDto.inServiceDate)
        : undefined,
    };
    return this.aircraftService.update(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete aircraft by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Aircraft ID' })
  @ApiResponse({ status: 204, description: 'Aircraft deleted successfully' })
  @ApiResponse({ status: 404, description: 'Aircraft not found' })
  async delete(@Param('id') id: string) {
    await this.aircraftService.delete(id);
  }
}
