import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  BudgetAuditEntry,
  BudgetAuditSummary,
  AuditLogFilters,
} from '@/types/budget-projects';

/**
 * Custom hook for budget audit trail queries
 * Provides queries for audit log and summary
 * @param projectId - Budget project ID
 */
export function useBudgetAudit(projectId: string) {
  /**
   * Query to fetch audit log for a project with optional filters
   * @param filters - Optional filters for date range, user, action, entity type
   */
  const useAuditLog = (filters?: AuditLogFilters) => {
    return useQuery({
      queryKey: ['budget-audit', projectId, 'log', filters],
      queryFn: async () => {
        const { data } = await api.get<BudgetAuditEntry[]>(
          `/budget-audit/${projectId}`,
          {
            params: filters,
          }
        );
        return data;
      },
      enabled: !!projectId,
    });
  };

  /**
   * Query to fetch audit summary (change count by user and type)
   */
  const useAuditSummary = () => {
    return useQuery({
      queryKey: ['budget-audit', projectId, 'summary'],
      queryFn: async () => {
        const { data } = await api.get<BudgetAuditSummary>(
          `/budget-audit/${projectId}/summary`
        );
        return data;
      },
      enabled: !!projectId,
    });
  };

  return {
    useAuditLog,
    useAuditSummary,
  };
}
