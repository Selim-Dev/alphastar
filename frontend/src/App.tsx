import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

/**
 * RedirectWithParams - A component that redirects to a new path while preserving query parameters
 * This ensures backward compatibility for legacy routes (Requirements 6.1, 6.2, 6.3, 6.4)
 */
function RedirectWithParams({ to }: { to: string }) {
  const location = useLocation();
  // Preserve query params from the original URL
  const targetPath = location.search ? `${to}${location.search}` : to;
  return <Navigate to={targetPath} replace />;
}

// Lazy load pages (placeholders for now)
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AvailabilityPage } from '@/pages/AvailabilityPage';
import { DailyStatusPage } from '@/pages/DailyStatusPage';
import { AircraftDetailPage } from '@/pages/AircraftDetailPage';
import { MaintenanceTasksListPage, MaintenanceTasksLogPage, MaintenanceTasksAnalyticsPage } from '@/pages/maintenance';
import { AOGListPageEnhanced, AOGLogPage, AOGAnalyticsPage, AOGDetailPage } from '@/pages/aog';
import { WorkOrdersListPage, WorkOrdersNewPage, WorkOrdersAnalyticsPage, WorkOrderSummaryPage } from '@/pages/work-orders';
import { DiscrepanciesListPage, DiscrepanciesNewPage, DiscrepanciesAnalyticsPage } from '@/pages/discrepancies';
import { BudgetPage } from '@/pages/BudgetPage';
import { ImportPage } from '@/pages/ImportPage';
import { AdminPage } from '@/pages/AdminPage';
import { HelpCenterPage } from '@/pages/HelpCenterPage';
import { VacationPlanPage } from '@/pages/VacationPlanPage';
import { FleetAtMROPage } from '@/pages/FleetAtMROPage';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes with layout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/daily-status" element={<DailyStatusPage />} />
        <Route path="/aircraft/:id" element={<AircraftDetailPage />} />
        
        {/* Maintenance Tasks Routes - separate pages instead of tabs */}
        <Route path="/maintenance" element={<RedirectWithParams to="/maintenance/tasks" />} />
        <Route path="/maintenance/tasks" element={<MaintenanceTasksListPage />} />
        <Route path="/maintenance/tasks/log" element={
          <ProtectedRoute allowedRoles={['Admin', 'Editor']}>
            <MaintenanceTasksLogPage />
          </ProtectedRoute>
        } />
        <Route path="/maintenance/tasks/analytics" element={<MaintenanceTasksAnalyticsPage />} />
        
        {/* AOG Routes - separate pages instead of tabs */}
        <Route path="/aog" element={<RedirectWithParams to="/aog/list" />} />
        <Route path="/aog/list" element={<AOGListPageEnhanced />} />
        <Route path="/aog/:id" element={<AOGDetailPage />} />
        <Route path="/aog/log" element={
          <ProtectedRoute allowedRoles={['Admin', 'Editor']}>
            <AOGLogPage />
          </ProtectedRoute>
        } />
        <Route path="/aog/analytics" element={<AOGAnalyticsPage />} />
        {/* Legacy route redirects - preserves query params */}
        <Route path="/events" element={<RedirectWithParams to="/aog/list" />} />
        <Route path="/aog-events" element={<RedirectWithParams to="/aog/list" />} />
        
        {/* Work Orders Routes - separate pages instead of tabs */}
        <Route path="/work-orders" element={<RedirectWithParams to="/work-orders/summary" />} />
        <Route path="/work-orders/summary" element={<WorkOrderSummaryPage />} />
        <Route path="/work-orders/historical" element={<WorkOrdersListPage />} />
        <Route path="/work-orders/new" element={
          <ProtectedRoute allowedRoles={['Admin', 'Editor']}>
            <WorkOrdersNewPage />
          </ProtectedRoute>
        } />
        <Route path="/work-orders/:id/edit" element={
          <ProtectedRoute allowedRoles={['Admin', 'Editor']}>
            <WorkOrdersNewPage />
          </ProtectedRoute>
        } />
        <Route path="/work-orders/analytics" element={<WorkOrdersAnalyticsPage />} />
        
        {/* Discrepancies Routes - separate pages instead of tabs */}
        <Route path="/discrepancies" element={<DiscrepanciesListPage />} />
        <Route path="/discrepancies/new" element={
          <ProtectedRoute allowedRoles={['Admin', 'Editor']}>
            <DiscrepanciesNewPage />
          </ProtectedRoute>
        } />
        <Route path="/discrepancies/:id/edit" element={
          <ProtectedRoute allowedRoles={['Admin', 'Editor']}>
            <DiscrepanciesNewPage />
          </ProtectedRoute>
        } />
        <Route path="/discrepancies/analytics" element={<DiscrepanciesAnalyticsPage />} />
        
        <Route path="/fleet-at-mro" element={<FleetAtMROPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/vacation-plan" element={<VacationPlanPage />} />
        <Route
          path="/import"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ImportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="/help" element={<HelpCenterPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
