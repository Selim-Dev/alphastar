import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from './AppShell';
import {
  LayoutDashboard,
  Plane,
  Calendar,
  Wrench,
  AlertTriangle,
  ClipboardList,
  Search,
  DollarSign,
  Upload,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  List,
  PlusCircle,
  BarChart3,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react';
import { useState, useRef, ReactNode, useEffect } from 'react';

// ============================================
// Navigation Configuration
// ============================================

interface NavSubItemConfig {
  path: string;
  label: string;
  icon: LucideIcon;
  editorOnly?: boolean;
}

interface NavItemConfig {
  path: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  editorOnly?: boolean;
  subItems?: NavSubItemConfig[];
}

interface NavGroupConfig {
  label: string;
  items: NavItemConfig[];
}

const navigationGroups: NavGroupConfig[] = [
  {
    label: 'Operations',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/availability', label: 'Fleet Availability', icon: Plane },
      { path: '/daily-status', label: 'Daily Status', icon: Calendar },
    ],
  },
  {
    label: 'Maintenance',
    items: [
      { 
        path: '/aog', 
        label: 'AOG & Events', 
        icon: AlertTriangle,
        subItems: [
          { path: '/aog/list', label: 'Events List', icon: List },
          { path: '/aog/log', label: 'Log Event', icon: PlusCircle, editorOnly: true },
          { path: '/aog/analytics', label: 'Analytics', icon: BarChart3 },
        ],
      },
      { 
        path: '/maintenance/tasks', 
        label: 'Maintenance Tasks', 
        icon: Wrench,
        subItems: [
          { path: '/maintenance/tasks', label: 'Task List', icon: List },
          { path: '/maintenance/tasks/log', label: 'Log Task', icon: PlusCircle, editorOnly: true },
          { path: '/maintenance/tasks/analytics', label: 'Analytics', icon: BarChart3 },
        ],
      },
      { 
        path: '/work-orders', 
        label: 'Work Orders', 
        icon: ClipboardList,
        subItems: [
          { path: '/work-orders/summary', label: 'Monthly Summary', icon: List },
          { path: '/work-orders/historical', label: 'Historical WOs', icon: List },
          { path: '/work-orders/new', label: 'New WO', icon: PlusCircle, editorOnly: true },
          { path: '/work-orders/analytics', label: 'Analytics', icon: BarChart3 },
        ],
      },
      { 
        path: '/discrepancies', 
        label: 'Discrepancies', 
        icon: Search,
        subItems: [
          { path: '/discrepancies', label: 'Discrepancies', icon: List },
          { path: '/discrepancies/new', label: 'New', icon: PlusCircle, editorOnly: true },
          { path: '/discrepancies/analytics', label: 'Analytics', icon: BarChart3 },
        ],
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      { path: '/budget', label: 'Budget & Cost', icon: DollarSign },
    ],
  },
  {
    label: 'Administration',
    items: [
      { path: '/import', label: 'Data Import', icon: Upload, adminOnly: true },
      { path: '/admin', label: 'Settings', icon: Settings, adminOnly: true },
    ],
  },
  {
    label: 'Coming Soon',
    items: [
      { path: '/fleet-at-mro', label: 'Fleet at MRO', icon: Wrench },
      { path: '/vacation-plan', label: 'Vacation Plan', icon: CalendarDays },
    ],
  },
  {
    label: 'Support',
    items: [
      { path: '/help', label: 'Help Center', icon: HelpCircle },
    ],
  },
];

// ============================================
// NavTooltip Component
// ============================================

interface NavTooltipProps {
  children: ReactNode;
  label: string;
  show: boolean;
}

function NavTooltip({ children, label, show }: NavTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  if (!show) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && (
        <div
          ref={tooltipRef}
          className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
                     px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap
                     bg-popover text-popover-foreground border border-border
                     shadow-theme-md animate-in fade-in-0 zoom-in-95 duration-150"
          role="tooltip"
        >
          {label}
          {/* Arrow */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 
                          border-4 border-transparent border-r-popover" />
        </div>
      )}
    </div>
  );
}

// ============================================
// NavGroup Component
// ============================================

interface NavGroupProps {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}

function NavGroup({ label, collapsed, children }: NavGroupProps) {
  return (
    <div className="mb-6">
      {/* Section label - hidden when collapsed */}
      {!collapsed && (
        <div className="px-3 mb-2">
          <span className="text-tiny uppercase tracking-wider text-sidebar-muted font-medium theme-transition">
            {label}
          </span>
        </div>
      )}
      {/* Collapsed state: show a subtle divider instead */}
      {collapsed && (
        <div className="mx-3 mb-2 border-t border-sidebar-border opacity-30 theme-transition" />
      )}
      <nav className="space-y-1">
        {children}
      </nav>
    </div>
  );
}

// ============================================
// NavItem Component
// ============================================

interface NavItemProps {
  path: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
  end?: boolean;
  subItems?: NavSubItemConfig[];
}

/**
 * Checks if a path is active based on the current location
 * Handles both exact matches and prefix matches for nested routes
 */
function isPathActive(currentPath: string, itemPath: string, isEnd?: boolean): boolean {
  if (isEnd) {
    return currentPath === itemPath;
  }
  // For root path, only match exactly
  if (itemPath === '/') {
    return currentPath === '/';
  }
  // For other paths, check if current path starts with item path
  return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
}

/**
 * Checks if any sub-item is currently active
 */
function isAnySubItemActive(currentPath: string, subItems?: NavSubItemConfig[]): boolean {
  if (!subItems || subItems.length === 0) return false;
  return subItems.some(item => isPathActive(currentPath, item.path));
}

function NavItem({ path, label, icon: Icon, collapsed, end, subItems }: NavItemProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [wasManuallyCollapsed, setWasManuallyCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const hasSubItems = subItems && subItems.length > 0;
  
  // Check if this item or any sub-item is active
  const isParentActive = isPathActive(location.pathname, path, end);
  const isChildActive = isAnySubItemActive(location.pathname, subItems);
  const isActive = isParentActive || isChildActive;
  
  // Auto-expand if a sub-item is active (unless manually collapsed)
  useEffect(() => {
    if (hasSubItems && isChildActive && !wasManuallyCollapsed) {
      setIsExpanded(true);
    }
    // Reset manual collapse flag when navigating to a different parent
    if (!isActive) {
      setWasManuallyCollapsed(false);
    }
  }, [location.pathname, hasSubItems, isChildActive, isActive, wasManuallyCollapsed]);

  // Handle toggle with manual collapse tracking
  const handleToggle = () => {
    if (collapsed) return;
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    // Track if user manually collapsed while a child is active
    if (!newExpanded && isChildActive) {
      setWasManuallyCollapsed(true);
    } else {
      setWasManuallyCollapsed(false);
    }
  };

  // Filter sub-items based on user role
  const visibleSubItems = subItems?.filter(
    (item) => !item.editorOnly || user?.role === 'Admin' || user?.role === 'Editor'
  );

  // Build tooltip content for collapsed state with sub-items
  const tooltipContent = hasSubItems && collapsed
    ? `${label} (${visibleSubItems?.length || 0} items)`
    : label;

  if (hasSubItems) {
    return (
      <div className="relative">
        <NavTooltip label={tooltipContent} show={collapsed && !isHovered}>
          <button
            onClick={handleToggle}
            onMouseEnter={() => collapsed && setIsHovered(true)}
            onMouseLeave={() => collapsed && setIsHovered(false)}
            className={`
              w-full group flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg
              text-sm font-medium theme-transition
              ${isActive
                ? 'bg-sidebar-muted text-sidebar border-l-[3px] border-sidebar-accent shadow-theme-glow'
                : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar border-l-[3px] border-transparent'
              }
              ${collapsed ? 'justify-center px-0 mx-3' : ''}
            `}
            aria-expanded={!collapsed && isExpanded}
            aria-haspopup="true"
          >
            <Icon 
              size={20} 
              className={`flex-shrink-0 theme-transition ${collapsed ? '' : 'ml-0.5'}`}
            />
            {!collapsed && (
              <>
                <span className="truncate flex-1 text-left">{label}</span>
                <ChevronDown 
                  size={16} 
                  className={`flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        </NavTooltip>
        
        {/* Sub-items - shown when expanded and not collapsed */}
        {!collapsed && isExpanded && visibleSubItems && (
          <div 
            className="mt-1 ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200"
            role="menu"
            aria-label={`${label} submenu`}
          >
            {visibleSubItems.map((subItem) => {
              const isSubItemActive = isPathActive(location.pathname, subItem.path);
              return (
                <NavLink
                  key={subItem.path}
                  to={subItem.path}
                  role="menuitem"
                  className={`
                    group flex items-center gap-2 px-3 py-2 mx-2 rounded-lg
                    text-sm theme-transition
                    ${isSubItemActive
                      ? 'bg-sidebar-accent/10 text-sidebar-accent font-medium'
                      : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar'
                    }
                  `}
                >
                  <subItem.icon size={16} className="flex-shrink-0" />
                  <span className="truncate">{subItem.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
        
        {/* Collapsed state: show sub-items in flyout menu on hover */}
        {collapsed && isHovered && (
          <CollapsedSubMenu 
            label={label}
            subItems={visibleSubItems || []}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          />
        )}
      </div>
    );
  }

  return (
    <NavTooltip label={label} show={collapsed}>
      <NavLink
        to={path}
        end={end}
        className={({ isActive: linkActive }) => {
          const active = linkActive || isActive;
          return `
            group flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg
            text-sm font-medium theme-transition
            ${active
              ? 'bg-sidebar-muted text-sidebar border-l-[3px] border-sidebar-accent shadow-theme-glow'
              : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar border-l-[3px] border-transparent'
            }
            ${collapsed ? 'justify-center px-0 mx-3' : ''}
          `;
        }}
      >
        <Icon 
          size={20} 
          className={`flex-shrink-0 theme-transition
            ${collapsed ? '' : 'ml-0.5'}
          `}
        />
        {!collapsed && (
          <span className="truncate">{label}</span>
        )}
      </NavLink>
    </NavTooltip>
  );
}

// ============================================
// CollapsedSubMenu Component
// ============================================

interface CollapsedSubMenuProps {
  label: string;
  subItems: NavSubItemConfig[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * Flyout menu for collapsed sidebar with sub-items
 * Shows on hover when sidebar is collapsed
 */
function CollapsedSubMenu({ label, subItems, onMouseEnter, onMouseLeave }: CollapsedSubMenuProps) {
  const location = useLocation();

  if (subItems.length === 0) return null;

  return (
    <div
      className="absolute left-full top-0 ml-2 z-50"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Invisible bridge to prevent menu from closing when moving mouse */}
      <div className="absolute -left-2 top-0 w-2 h-full" />
      
      <div 
        className="min-w-[180px] py-2 rounded-lg border border-border bg-popover shadow-theme-lg
                   animate-in fade-in-0 zoom-in-95 slide-in-from-left-2 duration-150"
        role="menu"
        aria-label={`${label} submenu`}
      >
        {/* Header */}
        <div className="px-3 py-1.5 border-b border-border mb-1">
          <span className="text-small font-medium text-foreground">{label}</span>
        </div>
        
        {/* Sub-items */}
        {subItems.map((subItem) => {
          const isSubItemActive = isPathActive(location.pathname, subItem.path);
          return (
            <NavLink
              key={subItem.path}
              to={subItem.path}
              role="menuitem"
              className={`
                flex items-center gap-2 px-3 py-2 mx-1 rounded-md
                text-sm theme-transition
                ${isSubItemActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
            >
              <subItem.icon size={16} className="flex-shrink-0" />
              <span className="truncate">{subItem.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Sidebar Toggle Button
// ============================================

interface SidebarToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

function SidebarToggle({ collapsed, onToggle }: SidebarToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="absolute -right-3 top-20 z-50
                 w-6 h-6 rounded-full
                 bg-sidebar-accent text-sidebar-accent-foreground
                 flex items-center justify-center
                 shadow-theme-md hover:shadow-theme-glow
                 transition-all duration-200 ease-out
                 hover:scale-110 active:scale-95"
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {collapsed ? (
        <ChevronRight size={14} strokeWidth={2.5} />
      ) : (
        <ChevronLeft size={14} strokeWidth={2.5} />
      )}
    </button>
  );
}

// ============================================
// Sidebar Component
// ============================================

export function Sidebar() {
  const { user } = useAuth();
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <div className="relative h-full bg-sidebar border-r border-sidebar-border flex flex-col theme-transition">
      {/* Toggle button */}
      <SidebarToggle collapsed={collapsed} onToggle={toggleCollapsed} />

      {/* Logo/Brand */}
      <div className={`
        flex items-center border-b border-sidebar-border theme-transition
        ${collapsed ? 'px-4 py-5 justify-center' : 'px-6 py-5'}
      `}>
        {collapsed ? (
          <div className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center theme-transition">
            <span className="text-sidebar-accent-foreground font-bold text-lg">A</span>
          </div>
        ) : (
          <div>
            <h1 className="text-lg font-bold text-sidebar theme-transition">Alpha Star</h1>
            <p className="text-small text-sidebar-muted theme-transition">Aviation KPIs</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {navigationGroups.map((group) => {
          // Filter out admin-only items if user is not admin
          const visibleItems = group.items.filter(
            (item) => !item.adminOnly || user?.role === 'Admin'
          ).filter(
            (item) => !item.editorOnly || user?.role === 'Admin' || user?.role === 'Editor'
          );

          // Don't render empty groups
          if (visibleItems.length === 0) return null;

          return (
            <NavGroup key={group.label} label={group.label} collapsed={collapsed}>
              {visibleItems.map((item) => (
                <NavItem
                  key={item.path}
                  path={item.path}
                  label={item.label}
                  icon={item.icon}
                  collapsed={collapsed}
                  end={item.path === '/'}
                  subItems={item.subItems}
                />
              ))}
            </NavGroup>
          );
        })}
      </div>

      {/* Footer - Version info */}
      {!collapsed && (
        <div className="px-6 py-4 border-t border-sidebar-border theme-transition">
          <p className="text-tiny text-sidebar-muted theme-transition">v1.0.0</p>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
