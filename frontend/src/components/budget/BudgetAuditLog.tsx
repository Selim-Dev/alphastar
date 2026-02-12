import { useState } from 'react';
import { useBudgetAudit } from '@/hooks/useBudgetAudit';
import { format } from 'date-fns';
import {
  Loader2,
  AlertCircle,
  Filter,
  User,
  Calendar,
  FileEdit,
  FilePlus,
  FileX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { AuditLogFilters } from '@/types/budget-projects';

interface BudgetAuditLogProps {
  projectId: string;
}

/**
 * Budget Audit Log Component
 * 
 * Features:
 * - Display audit entries in reverse chronological order
 * - Show: timestamp, user, action, field changed, old/new values
 * - Add filters: date range, user, change type
 * - Implement pagination for large logs
 * 
 * Requirements: 8.2, 8.3, 8.4
 */
export function BudgetAuditLog({ projectId }: BudgetAuditLogProps) {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { useAuditLog, useAuditSummary } = useBudgetAudit(projectId);
  const { data: auditEntries, isLoading, error } = useAuditLog(filters);
  const { data: summary } = useAuditSummary();

  // Pagination
  const totalPages = auditEntries ? Math.ceil(auditEntries.length / itemsPerPage) : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEntries = auditEntries?.slice(startIndex, endIndex) || [];

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <FilePlus className="w-4 h-4 text-green-500" />;
      case 'update':
        return <FileEdit className="w-4 h-4 text-blue-500" />;
      case 'delete':
        return <FileX className="w-4 h-4 text-red-500" />;
      default:
        return <FileEdit className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-500/20 text-green-600 dark:text-green-400';
      case 'update':
        return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
      case 'delete':
        return 'bg-red-500/20 text-red-600 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    switch (entityType) {
      case 'project':
        return 'Project';
      case 'planRow':
        return 'Plan Row';
      case 'actual':
        return 'Actual';
      default:
        return entityType;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
          <span className="text-muted-foreground">Loading audit log...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-destructive p-8">
        <div className="flex items-center justify-center text-destructive">
          <AlertCircle className="w-8 h-8 mr-3" />
          <div>
            <p className="font-semibold">Failed to load audit log</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Changes</div>
            <div className="text-2xl font-bold text-foreground">
              {summary.totalChanges.toLocaleString()}
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-sm text-muted-foreground mb-1">Active Users</div>
            <div className="text-2xl font-bold text-foreground">
              {summary.changesByUser.length}
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-sm text-muted-foreground mb-1">Entity Types</div>
            <div className="text-2xl font-bold text-foreground">
              {summary.changesByType.length}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          {Object.keys(filters).length > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Action
              </label>
              <select
                value={filters.action || ''}
                onChange={(e) =>
                  handleFilterChange('action', e.target.value || undefined)
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
            </div>

            {/* Entity Type Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Entity Type
              </label>
              <select
                value={filters.entityType || ''}
                onChange={(e) =>
                  handleFilterChange('entityType', e.target.value || undefined)
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Types</option>
                <option value="project">Project</option>
                <option value="planRow">Plan Row</option>
                <option value="actual">Actual</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Audit Entries */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {!auditEntries || auditEntries.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No audit entries found</p>
            {Object.keys(filters).length > 0 && (
              <button
                onClick={clearFilters}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Clear filters to see all entries
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {paginatedEntries.map((entry) => (
                <div key={entry._id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Action Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(entry.action)}
                    </div>

                    {/* Entry Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(
                            entry.action
                          )}`}
                        >
                          {entry.action.toUpperCase()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {getEntityTypeLabel(entry.entityType)}
                        </span>
                      </div>

                      {/* Field Changed */}
                      {entry.fieldChanged && (
                        <div className="text-sm text-foreground mb-2">
                          <span className="font-medium">Field:</span> {entry.fieldChanged}
                        </div>
                      )}

                      {/* Old/New Values */}
                      {entry.action === 'update' && (
                        <div className="flex items-center gap-4 text-sm">
                          {entry.oldValue !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Old:</span>
                              <span className="font-mono text-red-600 dark:text-red-400">
                                {JSON.stringify(entry.oldValue)}
                              </span>
                            </div>
                          )}
                          {entry.newValue !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">New:</span>
                              <span className="font-mono text-green-600 dark:text-green-400">
                                {JSON.stringify(entry.newValue)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>User ID: {entry.userId}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm:ss')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-muted/30 px-4 py-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, auditEntries.length)} of{' '}
                    {auditEntries.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
