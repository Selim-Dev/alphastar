import { useState, useCallback, useRef } from 'react';
import { 
  Calendar, 
  Download, 
  Upload, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Users,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { VacationPlanGrid } from '@/components/vacation/VacationPlanGrid';
import {
  useVacationPlanByYearAndTeam,
  useCreateVacationPlan,
  useUpdateVacationPlanCell,
  useAddEmployee,
  useRemoveEmployee,
  useExportVacationPlan,
  useImportVacationPlans,
} from '@/hooks/useVacationPlans';
import { useAuth } from '@/contexts/AuthContext';
import type { VacationTeam } from '@/types';
import { VACATION_TEAM_LABELS } from '@/types';

/**
 * VacationPlanPage Component
 * Main page for managing vacation plans with tabs for Engineering and TPL teams
 * Requirements: 16.1, 16.2, 16.4, 16.6
 */
export function VacationPlanPage() {
  const { user } = useAuth();
  const isEditable = user?.role === 'Admin' || user?.role === 'Editor';
  
  // State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTeam, setSelectedTeam] = useState<VacationTeam>('Engineering');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries and mutations
  const { data: plan, isLoading, error } = useVacationPlanByYearAndTeam(selectedYear, selectedTeam);
  const createPlan = useCreateVacationPlan();
  const updateCell = useUpdateVacationPlanCell();
  const addEmployee = useAddEmployee();
  const removeEmployee = useRemoveEmployee();
  const exportPlan = useExportVacationPlan();
  const importPlans = useImportVacationPlans();

  // Handle year navigation
  const handlePreviousYear = () => setSelectedYear((y) => y - 1);
  const handleNextYear = () => setSelectedYear((y) => y + 1);

  // Handle team tab change
  const handleTeamChange = (team: VacationTeam) => {
    setSelectedTeam(team);
    setShowAddEmployee(false);
    setNewEmployeeName('');
  };

  // Handle cell change
  const handleCellChange = useCallback(
    async (employeeIndex: number, weekIndex: number, value: number) => {
      if (!plan?._id) return;
      
      const employeeName = plan.employees[employeeIndex]?.name;
      if (!employeeName) return;
      
      try {
        await updateCell.mutateAsync({
          id: plan._id,
          employeeName,
          weekIndex,
          value,
        });
      } catch (err) {
        console.error('Failed to update cell:', err);
      }
    },
    [plan?._id, plan?.employees, updateCell]
  );

  // Handle add employee
  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim()) return;

    try {
      // If no plan exists, create one first with the employee
      if (!plan) {
        await createPlan.mutateAsync({
          year: selectedYear,
          team: selectedTeam,
          employees: [{ name: newEmployeeName.trim(), cells: new Array(48).fill(0), total: 0 }],
        });
      } else {
        // Plan exists, add employee to it
        await addEmployee.mutateAsync({
          id: plan._id,
          name: newEmployeeName.trim(),
        });
      }
      setNewEmployeeName('');
      setShowAddEmployee(false);
    } catch (err) {
      console.error('Failed to add employee:', err);
      // Show error to user
      alert('Failed to add employee. Please try again.');
    }
  };

  // Handle remove employee
  const handleRemoveEmployee = async (employeeIndex: number) => {
    if (!plan?._id) return;
    
    const employeeName = plan.employees[employeeIndex]?.name;
    if (!employeeName) return;
    
    const confirmed = window.confirm(`Are you sure you want to remove "${employeeName}" from the vacation plan?`);
    if (!confirmed) return;

    try {
      await removeEmployee.mutateAsync({
        id: plan._id,
        employeeIndex,
        employeeName,
      });
    } catch (err) {
      console.error('Failed to remove employee:', err);
      alert('Failed to remove employee. Please try again.');
    }
  };

  // Handle export
  const handleExport = async () => {
    if (!plan?._id) return;
    
    try {
      await exportPlan.mutateAsync(plan._id);
    } catch (err) {
      console.error('Failed to export plan:', err);
    }
  };

  // Handle import
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await importPlans.mutateAsync({ file, year: selectedYear });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Show success message
      if (result.successCount > 0) {
        alert(`Successfully imported ${result.successCount} vacation plan(s).`);
      }
      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map(e => `Row ${e.row}: ${e.message}`).join('\n');
        alert(`Import completed with errors:\n${errorMessages}`);
      }
    } catch (err) {
      console.error('Failed to import plans:', err);
      alert('Failed to import vacation plans. Please check the file format.');
    }
  };

  // Create empty plan if none exists
  const handleCreatePlan = async () => {
    try {
      await createPlan.mutateAsync({
        year: selectedYear,
        team: selectedTeam,
        employees: [],
      });
    } catch (err) {
      console.error('Failed to create plan:', err);
    }
  };

  const isMutating = 
    updateCell.isPending || 
    addEmployee.isPending || 
    removeEmployee.isPending ||
    createPlan.isPending ||
    exportPlan.isPending ||
    importPlans.isPending;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Home', path: '/' },
          { label: 'Vacation Plan' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vacation Plan</h1>
            <p className="text-sm text-muted-foreground">
              Manage team vacation schedules
            </p>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousYear}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            title="Previous year"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 py-2 rounded-lg bg-muted font-semibold min-w-[100px] text-center">
            {selectedYear}
          </div>
          <button
            onClick={handleNextYear}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            title="Next year"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Team Tabs and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Team Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(['Engineering', 'TPL'] as VacationTeam[]).map((team) => (
            <button
              key={team}
              onClick={() => handleTeamChange(team)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTeam === team
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users size={16} />
                {VACATION_TEAM_LABELS[team]}
              </span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isEditable && (
            <>
              <button
                onClick={() => setShowAddEmployee(true)}
                disabled={isMutating}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add Employee</span>
              </button>
              <button
                onClick={handleImportClick}
                disabled={isMutating}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                title="Import from Excel"
              >
                <Upload size={16} />
                <span className="hidden sm:inline">Import</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </>
          )}
          <button
            onClick={handleExport}
            disabled={!plan || isMutating}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
            title="Export to Excel"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Add Employee Form */}
      {showAddEmployee && isEditable && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={newEmployeeName}
              onChange={(e) => setNewEmployeeName(e.target.value)}
              placeholder="Enter employee name"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddEmployee();
                if (e.key === 'Escape') {
                  setShowAddEmployee(false);
                  setNewEmployeeName('');
                }
              }}
              autoFocus
            />
            <button
              onClick={handleAddEmployee}
              disabled={!newEmployeeName.trim() || isMutating}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddEmployee(false);
                setNewEmployeeName('');
              }}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle size={20} />
            <span>Failed to load vacation plan. Please try again.</span>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </Card>
      )}

      {/* No Plan State */}
      {!isLoading && !error && !plan && (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No Vacation Plan</h3>
              <p className="text-muted-foreground">
                No vacation plan exists for {VACATION_TEAM_LABELS[selectedTeam]} in {selectedYear}.
              </p>
            </div>
            {isEditable && (
              <button
                onClick={handleCreatePlan}
                disabled={createPlan.isPending}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Create Vacation Plan
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Vacation Plan Grid */}
      {!isLoading && !error && plan && (
        <VacationPlanGrid
          plan={plan}
          onCellChange={handleCellChange}
          onRemoveEmployee={handleRemoveEmployee}
          isEditable={isEditable}
          isLoading={isMutating}
        />
      )}

      {/* Legend */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Legend</h3>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 border border-border"></div>
            <span>Vacation day (1 or more)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-50 dark:bg-blue-900/20 border border-border"></div>
            <span>Partial day (0.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 border border-border flex items-center justify-center">
              <span className="text-green-700 dark:text-green-400 text-xs">✓</span>
            </div>
            <span>No overlap</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/30 border border-border flex items-center justify-center">
              <span className="text-amber-700 dark:text-amber-400 text-xs">!</span>
            </div>
            <span>Overlap (multiple employees)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default VacationPlanPage;
