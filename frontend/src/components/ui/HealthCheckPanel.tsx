import { useHealthCheck, useTriggerSeed } from '@/hooks/useHealthCheck';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './Form';

export function HealthCheckPanel() {
  const { user } = useAuth();
  const { data: healthData, isLoading, error, refetch } = useHealthCheck();
  const triggerSeed = useTriggerSeed();

  const isAdmin = user?.role === 'Admin';

  const handleSeed = async () => {
    if (window.confirm('This will populate the database with demo data. Continue?')) {
      try {
        const result = await triggerSeed.mutateAsync();
        if (result.success) {
          alert('Seed completed successfully!');
          refetch();
        } else {
          alert(`Seed failed: ${result.message}`);
        }
      } catch (err) {
        alert(`Seed failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Data Health Check</h3>
        <div className="text-muted-foreground">Loading health check data...</div>
      </div>
    );
  }

  if (error || !healthData) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Data Health Check</h3>
        <div className="text-destructive">Failed to load health check data</div>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: 'ok' | 'warning' | 'empty') => {
    switch (status) {
      case 'ok':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'empty':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const getStatusIcon = (status: 'ok' | 'warning' | 'empty') => {
    switch (status) {
      case 'ok':
        return '✓';
      case 'warning':
        return '⚠';
      case 'empty':
        return '✗';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">Data Health Check</h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Last fetch: {new Date(healthData.lastFetch).toLocaleTimeString()}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              healthData.apiStatus === 'connected'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            API: {healthData.apiStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
        {healthData.collections.map((collection) => (
          <div
            key={collection.name}
            className={`p-4 rounded-lg border ${
              collection.status === 'empty'
                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950'
                : collection.status === 'warning'
                ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950'
                : 'border-border bg-background'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground truncate">
                {collection.name}
              </span>
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${getStatusColor(
                  collection.status
                )}`}
              >
                {getStatusIcon(collection.status)}
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {collection.count.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {collection.status === 'empty'
                ? 'No records'
                : collection.status === 'warning'
                ? 'Low count'
                : 'OK'}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="text-sm text-muted-foreground">
          {healthData.collections.filter((c) => c.status === 'empty').length > 0 && (
            <span className="text-destructive">
              ⚠ {healthData.collections.filter((c) => c.status === 'empty').length} collection(s)
              need attention
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
          {isAdmin && (
            <Button
              onClick={handleSeed}
              isLoading={triggerSeed.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              Run Seed Script
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
