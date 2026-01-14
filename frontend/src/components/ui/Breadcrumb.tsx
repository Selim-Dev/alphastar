import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumb Component - Navigation path display for nested routes
 * 
 * Design Specifications (from design.md):
 * - Display navigation path (e.g., "Maintenance → Tasks → Log Task")
 * - Clickable items navigate to that level in hierarchy
 * - Single breadcrumb or hidden on top-level routes
 * - Consistent styling with truncation for long labels
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

// ============================================
// Types and Interfaces
// ============================================

export interface BreadcrumbItem {
  /** Display label for the breadcrumb */
  label: string;
  /** Optional path for navigation - if undefined, item is not clickable */
  path?: string;
}

export interface BreadcrumbProps {
  /** Array of breadcrumb items to display */
  items: BreadcrumbItem[];
  /** Show home icon as first item */
  showHome?: boolean;
  /** Maximum characters before truncation */
  maxLabelLength?: number;
  /** Additional CSS classes */
  className?: string;
}

// ============================================
// Route to Breadcrumb Mapping
// ============================================

/**
 * Comprehensive route-to-breadcrumb mapping for all nested routes
 * Following the design document's ROUTE_BREADCRUMBS specification
 */
export const ROUTE_BREADCRUMBS: Record<string, BreadcrumbItem[]> = {
  // Dashboard (top-level)
  '/': [{ label: 'Dashboard' }],
  
  // Operations
  '/availability': [{ label: 'Fleet Availability' }],
  '/daily-status': [{ label: 'Daily Status' }],
  
  // Maintenance Tasks Module
  '/maintenance': [
    { label: 'Maintenance', path: '/maintenance/tasks' },
    { label: 'Tasks' },
  ],
  '/maintenance/tasks': [
    { label: 'Maintenance', path: '/maintenance/tasks' },
    { label: 'Tasks' },
  ],
  '/maintenance/tasks/log': [
    { label: 'Maintenance', path: '/maintenance/tasks' },
    { label: 'Tasks', path: '/maintenance/tasks' },
    { label: 'Log Task' },
  ],
  '/maintenance/tasks/analytics': [
    { label: 'Maintenance', path: '/maintenance/tasks' },
    { label: 'Tasks', path: '/maintenance/tasks' },
    { label: 'Analytics' },
  ],
  
  // AOG Module
  '/aog': [
    { label: 'AOG & Events', path: '/aog/list' },
    { label: 'Events List' },
  ],
  '/aog/list': [
    { label: 'AOG & Events', path: '/aog/list' },
    { label: 'Events List' },
  ],
  '/aog/log': [
    { label: 'AOG & Events', path: '/aog/list' },
    { label: 'Events List', path: '/aog/list' },
    { label: 'Log Event' },
  ],
  '/aog/analytics': [
    { label: 'AOG & Events', path: '/aog/list' },
    { label: 'Events List', path: '/aog/list' },
    { label: 'Analytics' },
  ],
  
  // Work Orders Module
  '/work-orders': [
    { label: 'Work Orders' },
  ],
  '/work-orders/new': [
    { label: 'Work Orders', path: '/work-orders' },
    { label: 'New Work Order' },
  ],
  '/work-orders/analytics': [
    { label: 'Work Orders', path: '/work-orders' },
    { label: 'Analytics' },
  ],
  
  // Discrepancies Module
  '/discrepancies': [
    { label: 'Discrepancies' },
  ],
  '/discrepancies/new': [
    { label: 'Discrepancies', path: '/discrepancies' },
    { label: 'New Discrepancy' },
  ],
  '/discrepancies/analytics': [
    { label: 'Discrepancies', path: '/discrepancies' },
    { label: 'Analytics' },
  ],
  
  // Budget
  '/budget': [{ label: 'Budget & Cost' }],
  
  // Admin
  '/import': [{ label: 'Data Import' }],
  '/admin': [{ label: 'Settings' }],
  '/help': [{ label: 'Help Center' }],
  '/vacation-plan': [{ label: 'Vacation Plan' }],
};

// ============================================
// Helper Functions
// ============================================

/**
 * Truncate label if it exceeds max length
 */
function truncateLabel(label: string, maxLength: number): string {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 3)}...`;
}

/**
 * Get breadcrumbs for a given pathname
 * Handles dynamic routes like /aircraft/:id and /work-orders/:id/edit
 */
export function getBreadcrumbsForPath(pathname: string): BreadcrumbItem[] {
  // Direct match
  if (ROUTE_BREADCRUMBS[pathname]) {
    return ROUTE_BREADCRUMBS[pathname];
  }
  
  // Handle dynamic routes
  const segments = pathname.split('/').filter(Boolean);
  
  // Aircraft detail page: /aircraft/:id
  if (segments[0] === 'aircraft' && segments[1]) {
    return [
      { label: 'Fleet Availability', path: '/availability' },
      { label: 'Aircraft Details' },
    ];
  }
  
  // Work order edit: /work-orders/:id/edit
  if (segments[0] === 'work-orders' && segments[2] === 'edit') {
    return [
      { label: 'Work Orders', path: '/work-orders' },
      { label: 'Edit Work Order' },
    ];
  }
  
  // Discrepancy edit: /discrepancies/:id/edit
  if (segments[0] === 'discrepancies' && segments[2] === 'edit') {
    return [
      { label: 'Discrepancies', path: '/discrepancies' },
      { label: 'Edit Discrepancy' },
    ];
  }
  
  // Fallback: try to match parent path
  const parentPath = '/' + segments.slice(0, -1).join('/');
  if (ROUTE_BREADCRUMBS[parentPath]) {
    return [
      ...ROUTE_BREADCRUMBS[parentPath].map(item => ({
        ...item,
        path: item.path || parentPath,
      })),
      { label: segments[segments.length - 1] },
    ];
  }
  
  // Default fallback
  return [{ label: 'Dashboard', path: '/' }];
}

// ============================================
// useBreadcrumbs Hook
// ============================================

/**
 * Hook to get breadcrumbs for the current route
 * Automatically updates when route changes
 */
export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  return getBreadcrumbsForPath(location.pathname);
}

// ============================================
// Breadcrumb Component
// ============================================

export function Breadcrumb({
  items,
  showHome = false,
  maxLabelLength = 30,
  className = '',
}: BreadcrumbProps) {
  // Don't render if only one item (top-level route)
  if (items.length <= 1 && !showHome) {
    return null;
  }

  const allItems = showHome
    ? [{ label: 'Home', path: '/' }, ...items]
    : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1 text-small ${className}`.trim()}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const displayLabel = truncateLabel(item.label, maxLabelLength);
          const isHome = showHome && index === 0;

          return (
            <li key={index} className="flex items-center gap-1">
              {/* Separator */}
              {index > 0 && (
                <ChevronRight
                  size={14}
                  className="text-muted-foreground/50 flex-shrink-0"
                  aria-hidden="true"
                />
              )}

              {/* Breadcrumb item */}
              {item.path && !isLast ? (
                <Link
                  to={item.path}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground 
                           transition-colors duration-150 focus:outline-none focus:ring-2 
                           focus:ring-ring focus:ring-offset-1 rounded px-1 -mx-1"
                  title={item.label.length > maxLabelLength ? item.label : undefined}
                >
                  {isHome && <Home size={14} className="flex-shrink-0" />}
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    {isHome ? '' : displayLabel}
                  </span>
                </Link>
              ) : (
                <span
                  className={`flex items-center gap-1 truncate max-w-[150px] sm:max-w-[200px] ${
                    isLast
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  }`}
                  title={item.label.length > maxLabelLength ? item.label : undefined}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {isHome && <Home size={14} className="flex-shrink-0" />}
                  {isHome ? '' : displayLabel}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
