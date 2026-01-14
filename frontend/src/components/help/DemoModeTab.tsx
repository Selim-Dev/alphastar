import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Lock,
  Presentation,
  Clock,
  ArrowRight,
  Database,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoSeed, useDemoReset, useDemoStatus } from '@/hooks/useDemo';
import { walkthroughContent } from '@/lib/help/walkthroughContent';
import type { WalkthroughStep } from '@/lib/help/types';

/**
 * DemoModeTab Component - Demo data management and walkthrough script
 * Requirements: 7.1 - Display "Generate Demo Data" button for Admin users
 * Requirements: 7.2 - Call backend seed endpoint and create tagged demo records
 * Requirements: 7.4 - Invalidate queries and display success message with record counts
 * Requirements: 7.5 - Display "Reset Demo Data" button for Admin users
 * Requirements: 7.6 - Delete only records with isDemo: true with confirmation dialog
 * Requirements: 7.7 - Display message for non-Admin users
 * Requirements: 8.1 - Display "Demo Walkthrough Script" section
 * Requirements: 8.2 - Provide numbered steps with page, features, talking points, expected output
 * Requirements: 8.3 - Include clickable links to navigate to each page
 * Requirements: 8.4 - Cover Executive Dashboard, Fleet Health, Alerts, Availability, AOG, Budget, Export
 * Requirements: 8.5 - Indicate estimated time per section
 */

interface WalkthroughStepCardProps {
  step: WalkthroughStep;
  isExpanded: boolean;
  onToggle: () => void;
}

function WalkthroughStepCard({ step, isExpanded, onToggle }: WalkthroughStepCardProps) {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0">
          {step.stepNumber}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground">{step.pageToVisit}</h4>
          <p className="text-xs text-muted-foreground truncate">
            {step.featuresToHighlight.slice(0, 2).join(', ')}
            {step.featuresToHighlight.length > 2 && '...'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ~{step.estimatedMinutes} min
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
              {/* Navigate Link */}
              <Link
                to={step.pageRoute}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Go to {step.pageToVisit}
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Features to Highlight */}
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Features to Highlight
                </h5>
                <ul className="space-y-1">
                  {step.featuresToHighlight.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Talking Points */}
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Talking Points
                </h5>
                <ul className="space-y-2">
                  {step.talkingPoints.map((point, index) => (
                    <li key={index} className="text-sm text-muted-foreground leading-relaxed">
                      "{point}"
                    </li>
                  ))}
                </ul>
              </div>

              {/* Expected Visual Output */}
              <div className="bg-muted/50 rounded-lg p-3">
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Expected Visual Output
                </h5>
                <p className="text-sm text-foreground">{step.expectedVisualOutput}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isLoading,
  variant = 'danger',
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'primary';
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function DemoModeTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const { data: demoStatus, isLoading: statusLoading } = useDemoStatus();
  const seedMutation = useDemoSeed();
  const resetMutation = useDemoReset();

  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(walkthroughContent.steps[0]?.id || null);

  const handleSeed = async () => {
    try {
      await seedMutation.mutateAsync();
      setShowSeedConfirm(false);
    } catch (error) {
      console.error('Failed to seed demo data:', error);
    }
  };

  const handleReset = async () => {
    try {
      await resetMutation.mutateAsync();
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Failed to reset demo data:', error);
    }
  };

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
          <Presentation className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Demo Mode</h2>
          <p className="text-sm text-muted-foreground">
            Manage demo data and follow the presentation walkthrough
          </p>
        </div>
      </motion.div>

      {/* Admin Controls Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Demo Data Management</h3>

        {!isAdmin ? (
          /* Non-Admin Message */
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Admin Access Required
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Only administrators can generate or reset demo data. Contact your admin for assistance.
              </p>
            </div>
          </div>
        ) : (
          /* Admin Controls */
          <div className="space-y-4">
            {/* Demo Status */}
            {statusLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading demo status...
              </div>
            ) : demoStatus?.hasDemoData ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  Demo data is active ({Object.values(demoStatus.counts).reduce((a, b) => a + b, 0)} records)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Database className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No demo data currently loaded</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowSeedConfirm(true)}
                disabled={seedMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
              >
                {seedMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Generate Demo Data
              </button>

              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={resetMutation.isPending || !demoStatus?.hasDemoData}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {resetMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Reset Demo Data
              </button>
            </div>

            {/* Success Messages */}
            {seedMutation.isSuccess && seedMutation.data && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {seedMutation.data.message}
                  </span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Created {Object.values(seedMutation.data.counts).reduce((a, b) => a + b, 0)} records in{' '}
                  {(seedMutation.data.duration / 1000).toFixed(1)}s
                </p>
              </div>
            )}

            {resetMutation.isSuccess && resetMutation.data && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {resetMutation.data.message}
                  </span>
                </div>
              </div>
            )}

            {/* Error Messages */}
            {(seedMutation.isError || resetMutation.isError) && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-700 dark:text-red-300">
                    Operation failed. Please try again.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Walkthrough Script Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{walkthroughContent.title}</h3>
            <p className="text-sm text-muted-foreground">{walkthroughContent.description}</p>
          </div>
          <span className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            ~{walkthroughContent.totalEstimatedMinutes} min total
          </span>
        </div>

        <div className="space-y-3">
          {walkthroughContent.steps.map((step) => (
            <WalkthroughStepCard
              key={step.id}
              step={step}
              isExpanded={expandedStep === step.id}
              onToggle={() => setExpandedStep((prev) => (prev === step.id ? null : step.id))}
            />
          ))}
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={showSeedConfirm}
        title="Generate Demo Data"
        message="This will create sample records across all collections with the isDemo flag. Existing demo data will not be affected. Continue?"
        confirmLabel="Generate"
        onConfirm={handleSeed}
        onCancel={() => setShowSeedConfirm(false)}
        isLoading={seedMutation.isPending}
        variant="primary"
      />

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Demo Data"
        message="This will permanently delete all records with the isDemo flag. Production data will not be affected. This action cannot be undone."
        confirmLabel="Delete Demo Data"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
        isLoading={resetMutation.isPending}
        variant="danger"
      />
    </div>
  );
}

export default DemoModeTab;
