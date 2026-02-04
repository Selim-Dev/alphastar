import { IsNumber, Min } from 'class-validator';

export class UpdatePlanRowDto {
  @IsNumber()
  @Min(0)
  plannedAmount: number;
}
