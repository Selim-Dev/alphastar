import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, LucideIcon } from 'lucide-react';

/**
 * StepCard Component - Displays numbered steps for Quick Start and Walkthrough
 * Requirements: 2.2 - Show step number, title, description, expected outcome, optional icon
 */

export interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  expectedOutcome?: string;
  icon?: LucideIcon;
  navigationLink?: string;
  navigationLabel?: string;
  estimatedMinutes?: number;
  children?: ReactNode;
  className?: string;
}

export function StepCard({
  stepNumber,
  title,
  description,
  expectedOutcome,
  icon: Icon,
  navigationLink,
  navigationLabel,
  estimatedMinutes,
  children,
  className = '',
}: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: stepNumber * 0.05 }}
      className={`relative flex gap-4 ${className}`}
    >
      {/* Step Number Badge */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shadow-sm">
          {stepNumber}
        </div>
        {/* Vertical connector line */}
        <div className="absolute left-5 top-12 bottom-0 w-px bg-border -translate-x-1/2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="bg-card border border-border rounded-xl p-5 shadow-theme-sm">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            </div>
            {estimatedMinutes && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full whitespace-nowrap">
                ~{estimatedMinutes} min
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {description}
          </p>

          {/* Expected Outcome */}
          {expectedOutcome && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-success-foreground">
                <span className="font-medium">Expected Outcome:</span> {expectedOutcome}
              </p>
            </div>
          )}

          {/* Additional Content */}
          {children}

          {/* Navigation Link */}
          {navigationLink && navigationLabel && (
            <Link
              to={navigationLink}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-2"
            >
              {navigationLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default StepCard;
