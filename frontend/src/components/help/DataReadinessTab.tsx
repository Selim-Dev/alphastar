import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Database,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ArrowRight,
  Upload,
  Settings,
  Play,
} from 'lucide-react';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import type { CollectionCount } from '@/types';

/**
 * DataReadinessTab Component - Data diagnostic checklist
 * Requirements: 6.1 - Display checklist mapping each dashboard page to its required data
 * Requirements: 6.2 - Show page name, required collections, record count, status indicator, fix instructions
 * Requirements: 6.3 - Display warning indicator for zero records with fix instructions
 * Requirements: 6.4 - Provide direct links to relevant pages
 * Requirements: 6.5 - Fetch current collection counts from health check endpoint
 */

// Page to collection mapping
const pageDataRequirements = [
  {
    pageName: 'Executive Dashboard',
    pageRoute: '/',
    collections: ['aircraft', 'dailystatus', 'dailycounters', 'aogevents', 'workorders', 'budgetplans', 'actualspends'],
    fixInstructions: [
      { method: 'seed', description: 'Generate demo data', link: '/help?tab=demo-mode', linkLabel: 'Go to Demo Mode' },
      { method: 'import', description: 'Import from Excel', link: '/import', linkLabel: 'Go to Import' },
    ],
  },
  {
    pageName: 'Fleet Availability',
    pageRoute: '/availability',
    collections: ['aircraft', 'dailystatus'],
    fixInstructions: [
      { method: 'import', description: 'Import daily status records', link: '/import', linkLabel: 'Import Data' },
      { method: 'ui', description: 'Add aircraft first', link: '/admin', linkLabel: 'Manage Aircraft' },
    ],
  },
  {
    pageName: 'Maintenance Tasks',
    pageRoute: '/maintenance',
    collections: ['aircraft', 'maintenancetasks'],
    fixInstructions: [
      { method: 'ui', description: 'Log maintenance tasks manually', link: '/maintenance', linkLabel: 'Add Task' },
      { method: 'import', description: 'Import from Excel', link: '/import', linkLabel: 'Import Data' },
    ],
  },
  {
    pageName: 'AOG & Events',
    pageRoute: '/aog-events',
    collections: ['aircraft', 'aogevents'],
    fixInstructions: [
      { method: 'ui', description: 'Log AOG events manually', link: '/aog-events', linkLabel: 'Add AOG Event' },
      { method: 'import', description: 'Import from Excel', link: '/import', linkLabel: 'Import Data' },
    ],
  },
  {
    pageName: 'Work Orders',
    pageRoute: '/work-orders',
    collections: ['aircraft', 'workorders'],
    fixInstructions: [
      { method: 'ui', description: 'Create work orders manually', link: '/work-orders', linkLabel: 'Add Work Order' },
      { method: 'import', description: 'Import from Excel', link: '/import', linkLabel: 'Import Data' },
    ],
  },
  {
    pageName: 'Discrepancies',
    pageRoute: '/discrepancies',
    collections: ['aircraft', 'discrepancies'],
    fixInstructions: [
      { method: 'ui', description: 'Log discrepancies manually', link: '/discrepancies', linkLabel: 'Add Discrepancy' },
      { method: 'import', description: 'Import from Excel', link: '/import', linkLabel: 'Import Data' },
    ],
  },
  {
    pageName: 'Budget & Cost',
    pageRoute: '/budget',
    collections: ['budgetplans', 'actualspends'],
    fixInstructions: [
      { method: 'ui', description: 'Create budget plans', link: '/budget', linkLabel: 'Add Budget Plan' },
      { method: 'import', description: 'Import from Excel', link: '/import', linkLabel: 'Import Data' },
    ],
  },
];

const statusConfig = {
  ok: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'OK',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Low',
  },
  empty: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Empty',
  },
};

const methodIcons = {
  seed: Play,
  import: Upload,
  ui: Settings,
  api: Database,
};

interface CollectionStatusBadgeProps {
  collection: CollectionCount;
}

function CollectionStatusBadge({ collection }: CollectionStatusBadgeProps) {
  const config = statusConfig[collection.status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-mono text-foreground">{collection.name}</span>
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}
      >
        <Icon className="w-3 h-3" />
        {collection.count}
      </span>
    </div>
  );
}

interface PageReadinessCardProps {
  page: typeof pageDataRequirements[0];
  collectionCounts: Map<string, CollectionCount>;
}

function PageReadinessCard({ page, collectionCounts }: PageReadinessCardProps) {
  // Determine overall page status based on required collections
  const pageCollections = page.collections.map((name) => {
    const collection = collectionCounts.get(name);
    return collection || { name, count: 0, status: 'empty' as const };
  });

  const hasEmpty = pageCollections.some((c) => c.status === 'empty');
  const hasWarning = pageCollections.some((c) => c.status === 'warning');
  const overallStatus = hasEmpty ? 'empty' : hasWarning ? 'warning' : 'ok';
  const statusCfg = statusConfig[overallStatus];
  const StatusIcon = statusCfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <Link
            to={page.pageRoute}
            className="font-semibold text-foreground hover:text-primary transition-colors"
          >
            {page.pageName}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">{page.pageRoute}</p>
        </div>
        <div
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.bgColor} ${statusCfg.color}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {statusCfg.label}
        </div>
      </div>

      {/* Required Collections */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Required Collections
        </h4>
        <div className="flex flex-wrap gap-2">
          {pageCollections.map((collection) => (
            <CollectionStatusBadge key={collection.name} collection={collection} />
          ))}
        </div>
      </div>

      {/* Fix Instructions - Only show if there are issues */}
      {overallStatus !== 'ok' && (
        <div className="pt-3 border-t border-border">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            How to Fix
          </h4>
          <div className="space-y-2">
            {page.fixInstructions.map((instruction, index) => {
              const MethodIcon = methodIcons[instruction.method as keyof typeof methodIcons] || Database;
              return (
                <div key={index} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MethodIcon className="w-4 h-4" />
                    {instruction.description}
                  </div>
                  {instruction.link && instruction.linkLabel && (
                    <Link
                      to={instruction.link}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      {instruction.linkLabel}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function DataReadinessTab() {
  const { data: healthData, isLoading, error, refetch, isFetching } = useHealthCheck();

  // Create a map of collection counts for easy lookup
  const collectionCounts = useMemo(() => {
    const map = new Map<string, CollectionCount>();
    if (healthData?.collections) {
      healthData.collections.forEach((collection) => {
        map.set(collection.name, collection);
      });
    }
    return map;
  }, [healthData]);

  // Calculate summary stats
  const summary = useMemo(() => {
    if (!healthData?.collections) return { ok: 0, warning: 0, empty: 0, total: 0 };
    return healthData.collections.reduce(
      (acc, c) => {
        acc[c.status]++;
        acc.total++;
        return acc;
      },
      { ok: 0, warning: 0, empty: 0, total: 0 }
    );
  }, [healthData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Data Readiness</h2>
            <p className="text-sm text-muted-foreground">
              Check what data is required for each page
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      {/* Summary Cards */}
      {healthData && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.ok}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">Collections OK</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary.warning}
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300">Low Data</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary.empty}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">Empty</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading data status...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
          <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-700 dark:text-red-300">
            Failed to load data status. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Page Readiness Cards */}
      {healthData && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Page Requirements
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {pageDataRequirements.map((page) => (
              <PageReadinessCard
                key={page.pageName}
                page={page}
                collectionCounts={collectionCounts}
              />
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      {healthData?.lastFetch && (
        <p className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(healthData.lastFetch).toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default DataReadinessTab;
