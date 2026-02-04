import { PartialType } from '@nestjs/mapped-types';
import { CreateBudgetProjectDto } from './create-budget-project.dto';

export class UpdateBudgetProjectDto extends PartialType(CreateBudgetProjectDto) {}
