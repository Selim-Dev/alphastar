import { PartialType } from '@nestjs/swagger';
import { CreateVacationPlanDto } from './create-vacation-plan.dto';

/**
 * DTO for updating a vacation plan
 * Requirements: 15.1
 */
export class UpdateVacationPlanDto extends PartialType(CreateVacationPlanDto) {}
