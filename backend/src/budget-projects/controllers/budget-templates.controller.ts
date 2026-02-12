import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BudgetTemplatesService } from '../services/budget-templates.service';

@Controller('budget-templates')
@UseGuards(JwtAuthGuard)
export class BudgetTemplatesController {
  constructor(private readonly templatesService: BudgetTemplatesService) {}

  @Get()
  async getAllTemplates() {
    return this.templatesService.getAllTemplates();
  }

  @Get(':type')
  async getTemplate(@Param('type') type: string) {
    return this.templatesService.getTemplate(type);
  }

  @Get(':type/terms')
  async getSpendingTerms(@Param('type') type: string) {
    return this.templatesService.getSpendingTerms(type);
  }
}
