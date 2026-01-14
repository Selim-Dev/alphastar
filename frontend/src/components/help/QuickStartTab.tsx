import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { StepCard } from './StepCard';
import { Callout } from './Callout';
import { quickStartContent } from '@/lib/help/helpContent';

/**
 * QuickStartTab Component - Displays the Quick Start onboarding flow
 * Requirements: 2.1 - Display numbered step-by-step onboarding flow with at least 6 steps
 * Requirements: 2.2 - Show step number, title, description, expected outcome
 * Requirements: 2.3 - Provide clickable links to relevant pages
 * Requirements: 2.4 - Include callout boxes for common issues
 * Requirements: 2.5 - Cover Login, Date Range, Filtering, KPI Interpretation, Drill-down, Export
 */

export function QuickStartTab() {
  const { steps, callouts } = quickStartContent;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Rocket className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Quick Start Guide</h2>
          <p className="text-sm text-muted-foreground">
            Get up and running with the Alpha Star Aviation KPIs Dashboard in 6 easy steps
          </p>
        </div>
      </motion.div>

      {/* Steps */}
      <div className="relative">
        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            stepNumber={step.stepNumber}
            title={step.title}
            description={step.description}
            expectedOutcome={step.expectedOutcome}
            icon={step.icon}
            navigationLink={step.navigationLink}
            navigationLabel={step.navigationLabel}
            className={index === steps.length - 1 ? 'pb-0' : ''}
          />
        ))}
        {/* Remove the last connector line */}
        <div className="absolute left-5 bottom-0 w-px h-8 bg-card -translate-x-1/2" />
      </div>

      {/* Callouts Section */}
      <div className="pt-4 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Tips & Troubleshooting
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {callouts.map((callout) => (
            <Callout
              key={callout.id}
              type={callout.type}
              title={callout.title}
              description={callout.description}
              actionLink={callout.actionLink}
              actionLabel={callout.actionLabel}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default QuickStartTab;
