import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Table as TableIcon,
  BarChart3,
  History,
  Trash2,
} from 'lucide-react';
import { useBudgetProjects } from '@/hooks/useBudgetProjects';
import { useBudgetAnalytics } from '@/hooks/useBudgetAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { BudgetTable } from '@/components/budget/BudgetTable';
import { BudgetAuditLog } from '@/components/budget/BudgetAuditLog';
import { format } from 'date-fns';

/**
 * Budget Project Detail Page
 * 
 * Features:
 * - Project header with name, date range, template type
 * - Sticky KPI cards showing key metrics
 * - Tabs: Table View, Analytics, Audit Log
 * - Breadcrumb navigation
 * - Export to Excel button
 * 
 * Requirements: 9.3, 9.4, 9.5, 2.7, 2.8
 */
export function BudgetProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('table');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { useProject, useDeleteProject } = useBudgetProjects();
  const { data: project, isLoading: projectLoading, error: projectError } = useProject(id!);
  const deleteProject = useDeleteProject();

  const { useKPIs } = useBudgetAnalytics(id!);
  const { data: kpis, isLoading: kpisLoading } = useKPIs();

  // Check user permissions
  const canEdit = user?.role === 'Editor' || user?.role === 'Admin';
  const canDelete = user?.role === 'Admin';
  const isViewer = user?.role === 'Viewer';

  // Handle delete project
  const handleDeleteProject = async () => {
    if (!project || !canDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteProject.mutateAsync(id!);
      navigate('/budget-projects');
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Handle export to Excel
  const handleExportExcel = async () => {
    if (!project) return;
    
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/budget-import-export/export/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Export failed');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load project</p>
          <button
            onClick={() => navigate('/budget-projects')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'table', label: 'Table View', icon: TableIcon },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Log', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/budget-projects"
          className="hover:text-foreground transition-colors"
        >
          Budget Projects
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">{project.name}</span>
      </nav>

      {/* Project Header */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Template: {project.templateType}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(project.dateRange.start), 'MMM d, yyyy')} -{' '}
                  {format(new Date(project.dateRange.end), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>{project.currency}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`
                  px-2 py-1 text-xs font-semibold rounded-full
                  ${
                    project.status === 'active'
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                      : project.status === 'draft'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                {project.status.toUpperCase()}
              </span>
              {/* Role Indicator */}
              {user && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {user.role}
                </span>
              )}
              {/* Viewer Notice */}
              {isViewer && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  Read-only access
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Export Button */}
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export to Excel
                </>
              )}
            </button>

            {/* Delete Button - Admin Only */}
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky KPI Cards */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Budgeted */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Budgeted</span>
              <DollarSign className="w-4 h-4 text-blue-500" />
            </div>
            {kpisLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {project.currency} {kpis?.totalBudgeted.toLocaleString() || '0'}
              </div>
            )}
          </div>

          {/* Total Spent */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Spent</span>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            {kpisLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {project.currency} {kpis?.totalSpent.toLocaleString() || '0'}
              </div>
            )}
            {kpis && (
              <div className="text-xs text-muted-foreground mt-1">
                {kpis.budgetUtilization.toFixed(1)}% utilized
              </div>
            )}
          </div>

          {/* Remaining Budget */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Remaining</span>
              {kpis && kpis.remainingBudget >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
            {kpisLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            ) : (
              <div
                className={`text-2xl font-bold ${
                  kpis && kpis.remainingBudget >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {project.currency} {kpis?.remainingBudget.toLocaleString() || '0'}
              </div>
            )}
          </div>

          {/* Burn Rate */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Burn Rate</span>
              <BarChart3 className="w-4 h-4 text-purple-500" />
            </div>
            {kpisLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {project.currency} {kpis?.burnRate.toLocaleString() || '0'}
              </div>
            )}
            {kpis && (
              <div className="text-xs text-muted-foreground mt-1">per month</div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab Content */}
      <TabPanel value="table" activeTab={activeTab}>
        <BudgetTable projectId={id!} readOnly={isViewer} />
      </TabPanel>

      <TabPanel value="analytics" activeTab={activeTab}>
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <BarChart3 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            View Full Analytics
          </h3>
          <p className="text-muted-foreground mb-6">
            Access comprehensive analytics with charts, KPIs, and insights on a dedicated page.
          </p>
          <button
            onClick={() => navigate(`/budget-projects/${id}/analytics`)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Open Analytics Page
          </button>
        </div>
      </TabPanel>

      <TabPanel value="audit" activeTab={activeTab}>
        <BudgetAuditLog projectId={id!} />
      </TabPanel>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Project</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete "{project?.name}"? This action cannot be undone and will delete all associated data including plan rows, actuals, and audit logs.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
