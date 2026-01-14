import { PartialType } from '@nestjs/swagger';
import { CreateWorkOrderSummaryDto } from './create-work-order-summary.dto';

/**
 * DTO for updating a work order summary
 * All fields are optional
 */
export class UpdateWorkOrderSummaryDto extends PartialType(CreateWorkOrderSummaryDto) {}
