import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, DollarSign, Calendar, FileText } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Form';
import { Card } from '@/components/ui/Card';
import { useBudgetProjects } from '@/hooks/useBudgetProjects';
import { useAuth } from '@/contexts/AuthContext';
import type { BudgetProject } from '@/types/budget-projects';
import { CreateProjectDialog } from '@/components/budget/CreateProjectDialog';

export function BudgetProjectsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'closed'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { useProjects } = useBudgetProjects();
  const { data: projects, isLoading } = useProjects({
    year: yearFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  // Check if user can create projects (Editor or Admin)
  const canCreateProject = user?.role === 'Editor' || user?.role === 'Admin';

  // Generate year options (current year ± 2 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  // Table columns
  const columns = useMemo<ColumnDef<BudgetProject>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Project Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'templateType',
        header: 'Template',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {row.original.templateType}
          </span>
        ),
      },
      {
        accessorKey: 'dateRange',
        header: 'Date Range',
        cell: ({ row }) => {
          const start = format(new Date(row.original.dateRange.start), 'MMM dd, yyyy');
          const end = format(new Date(row.original.dateRange.end), 'MMM dd, yyyy');
          return (
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span>{start} - {end}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'currency',
        header: 'Currency',
        cell: ({ row }) => (
          <span className="text-sm font-mono">{row.original.currency}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const statusColors = {
            draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
            active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
            closed: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
          };
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[status]
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-sm text-gray-500">
            {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
          </span>
        ),
      },
    ],
    []
  );

  const handleRowClick = (project: BudgetProject) => {
    navigate(`/budget-projects/${project._id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8" />
            Budget Projects
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage budget projects and track spending across your fleet
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Role Indicator */}
          {user && (
            <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {user.role}
            </div>
          )}
          {/* Create Button - Only for Editor/Admin */}
          {canCreateProject && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Create New Project</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Year Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 sm:flex-initial">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Year:
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(Number(e.target.value))}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 sm:flex-initial">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Projects Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-sm text-gray-500">Loading projects...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden md:block">
              <DataTable
                columns={columns}
                data={projects || []}
                onRowClick={handleRowClick}
              />
            </div>
            
            {/* Mobile Card View - Shown only on mobile */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {projects && projects.length > 0 ? (
                projects.map((project) => (
                  <div
                    key={project._id}
                    onClick={() => handleRowClick(project)}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {project.name}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                          project.status === 'draft'
                            ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            : project.status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        }`}
                      >
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-500 w-20">Template:</span>
                        <span>{project.templateType}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs">
                          {format(new Date(project.dateRange.start), 'MMM dd, yyyy')} -{' '}
                          {format(new Date(project.dateRange.end), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-500 w-20">Currency:</span>
                        <span className="font-mono">{project.currency}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-500 w-20">Created:</span>
                        <span className="text-xs">
                          {format(new Date(project.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 px-4">
                  <p className="text-gray-500">No budget projects found. Create your first project to get started.</p>
                </div>
              )}
            </div>
          </>
        )}
        {!isLoading && (!projects || projects.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">No budget projects found. Create your first project to get started.</p>
          </div>
        )}
      </Card>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
}
