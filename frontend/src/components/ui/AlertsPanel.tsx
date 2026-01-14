import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import type { AlertsResponse, ExecutiveAlert } from '@/types';

// Alert routing configuration - maps alert types to destination routes with query params
// Requirements: 3.1, 3.2, 3.3, 3.4
interface AlertRouteConfig {
  route: string;
  params?: Record<string, string>;
}

const ALERT_ROUTES: Record<ExecutiveAlert['type'], AlertRouteConfig> = {
  // AOG alerts navigate to /aog/list with status filter
  aog: {
    route: '/aog/list',
    params: { status: 'active' },
  },
  // AOG blocked alerts navigate to /aog/list with blocked filter
  aog_blocked: {
    route: '/aog/list',
    params: { blocked: 'true' },
  },
  // Overdue work order alerts navigate to /work-orders with overdue filter
  overdue_wo: {
    route: '/work-orders',
    params: { overdue: 'true' },
  },
  // Low availability alerts navigate to /discrepancies with uncorrected filter
  low_availability: {
    route: '/discrepancies',
    params: { uncorrected: 'true' },
  },
  // Budget overrun alerts navigate to /budget
  budget_overrun: {
    route: '/budget',
    params: {},
  },
};

/**
 * Builds the navigation URL for an alert, combining the base route with query params
 * Preserves any existing actionUrl from the alert if present
 * Requirements: 3.5
 */
function buildAlertNavigationUrl(alert: ExecutiveAlert): string {
  // If alert has a specific actionUrl, use it directly
  if (alert.actionUrl) {
    return alert.actionUrl;
  }

  // Get route config for this alert type
  const routeConfig = ALERT_ROUTES[alert.type];
  if (!routeConfig) {
    return '/'; // Fallback to dashboard
  }

  // Build URL with query params
  const { route, params } = routeConfig;
  if (!params || Object.keys(params).length === 0) {
    return route;
  }

  const searchParams = new URLSearchParams(params);
  return `${route}?${searchParams.toString()}`;
}

interface AlertsPanelProps {
  data?: AlertsResponse;
  isLoading?: boolean;
  maxHeight?: number;
}

function AlertIcon({ priority }: { priority: string }) {
  switch (priority) {
    case 'critical':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
}

function AlertItem({ alert, index }: { alert: ExecutiveAlert; index: number }) {
  const navigate = useNavigate();
  
  const priorityColors = {
    critical: 'border-l-red-500 bg-red-500/5',
    warning: 'border-l-amber-500 bg-amber-500/5',
    info: 'border-l-blue-500 bg-blue-500/5',
  };

  /**
   * Handle alert click - navigate to the appropriate destination with query params
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  const handleAlertClick = () => {
    const navigationUrl = buildAlertNavigationUrl(alert);
    navigate(navigationUrl);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleAlertClick}
      className={`p-3 border-l-4 rounded-r-lg cursor-pointer hover:bg-muted/50 transition-colors ${priorityColors[alert.priority]}`}
    >
      <div className="flex items-start gap-2">
        <AlertIcon priority={alert.priority} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
          <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function AlertsPanel({ data, isLoading, maxHeight = 300 }: AlertsPanelProps) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="animate-pulse bg-muted h-5 w-5 rounded" />
          <div className="animate-pulse bg-muted h-5 w-24 rounded" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-muted h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const hasAlerts = data?.hasAlerts ?? false;
  const allAlerts = [...(data?.critical || []), ...(data?.warning || []), ...(data?.info || [])];

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Alerts</h3>
        </div>
        {hasAlerts && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/10 text-red-500">
            {data?.totalCount}
          </span>
        )}
      </div>

      {!hasAlerts ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
          <p className="text-sm font-medium text-green-600">All Systems Normal</p>
          <p className="text-xs text-muted-foreground">No issues requiring attention</p>
        </motion.div>
      ) : (
        <div className="space-y-2 overflow-y-auto" style={{ maxHeight }}>
          {allAlerts.map((alert, index) => (
            <AlertItem key={alert.id} alert={alert} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
