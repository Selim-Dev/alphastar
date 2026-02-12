import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BudgetTemplate,
  SpendingTerm,
  BUDGET_TEMPLATES,
} from '../templates/spending-terms.registry';

@Injectable()
export class BudgetTemplatesService {
  /**
   * Get a budget template by type
   */
  getTemplate(templateType: string): BudgetTemplate {
    const template = BUDGET_TEMPLATES[templateType];
    if (!template) {
      throw new NotFoundException(`Budget template '${templateType}' not found`);
    }
    return template;
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): BudgetTemplate[] {
    return Object.values(BUDGET_TEMPLATES);
  }

  /**
   * Get spending terms for a specific template
   */
  getSpendingTerms(templateType: string): SpendingTerm[] {
    const template = this.getTemplate(templateType);
    return template.spendingTerms;
  }

  /**
   * Get a specific spending term by ID
   */
  getSpendingTerm(templateType: string, termId: string): SpendingTerm {
    const terms = this.getSpendingTerms(templateType);
    const term = terms.find((t) => t.id === termId);
    if (!term) {
      throw new NotFoundException(
        `Spending term '${termId}' not found in template '${templateType}'`,
      );
    }
    return term;
  }

  /**
   * Validate that a template type exists
   */
  validateTemplateType(templateType: string): boolean {
    return templateType in BUDGET_TEMPLATES;
  }

  /**
   * Get spending terms grouped by category
   */
  getSpendingTermsByCategory(templateType: string): Map<string, SpendingTerm[]> {
    const terms = this.getSpendingTerms(templateType);
    const grouped = new Map<string, SpendingTerm[]>();

    for (const term of terms) {
      if (!grouped.has(term.category)) {
        grouped.set(term.category, []);
      }
      grouped.get(term.category)!.push(term);
    }

    return grouped;
  }
}
