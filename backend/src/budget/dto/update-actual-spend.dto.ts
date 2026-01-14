import { PartialType } from '@nestjs/swagger';
import { CreateActualSpendDto } from './create-actual-spend.dto';

export class UpdateActualSpendDto extends PartialType(CreateActualSpendDto) {}
