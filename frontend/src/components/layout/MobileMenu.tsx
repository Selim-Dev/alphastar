import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from './AppShell';
import { MobileDrawer } from './MobileDrawer';
import {
  LayoutDashboard,
  Plane,
  Wrench,
  AlertTriangle,
  ClipboardList,
  Search,
  DollarSign,
  Calculator,
  Upload,
  Settings,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { ReactNode } from 'react';

// ============================================
// Navigation Configuration (consistent with Sidebar)
// ============================================

interface NavItemConfig {
  path: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
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
    ],
  },
  {
    label: 'Maintenance',
    items: [
      { path: '/maintenance', label: 'Maintenance Tasks', icon: Wrench },
      { path: '/aog/list', label: 'AOG Events', icon: AlertTriangle },
      { path: '/aog/analytics', label: 'AOG Analytics', icon: BarChart3 },
      { path: '/work-orders', label: 'Work Orders', icon: ClipboardList },
      { path: '/discrepancies', label: 'Discrepancies', icon: Search },
    ],
  },
  {
    label: 'Finance',
    items: [
      // Legacy Budget & Cost (deprecated - use Budget Projects instead)
      // { path: '/budget', label: 'Budget & Cost (Legacy)', icon: DollarSign },
      { path: '/budget-projects', label: 'Budget Projects', icon: Calculator },
    ],
  },
  {
    label: 'Administration',
    items: [
      { path: '/import', label: 'Data Import', icon: Upload },
      { path: '/admin', label: 'Settings', icon: Settings, adminOnly: true },
    ],
  },
];


// ============================================
// MobileNavGroup Component
// ============================================

interface MobileNavGroupProps {
  label: string;
  children: ReactNode;
}

function MobileNavGroup({ label, children }: MobileNavGroupProps) {
  return (
    <div className="mb-6">
      <div className="px-3 mb-2">
        <span className="text-tiny uppercase tracking-wider text-sidebar-muted font-medium">
          {label}
        </span>
      </div>
      <nav className="space-y-1">
        {children}
      </nav>
    </div>
  );
}

// ============================================
// MobileNavItem Component
// ============================================

interface MobileNavItemProps {
  path: string;
  label: string;
  icon: LucideIcon;
  onNavigate: () => void;
  end?: boolean;
}

function MobileNavItem({ path, label, icon: Icon, onNavigate, end }: MobileNavItemProps) {
  return (
    <NavLink
      to={path}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg
        text-sm font-medium transition-all duration-150 ease-out
        ${isActive
          ? 'bg-sidebar-muted text-sidebar border-l-[3px] border-sidebar-accent shadow-theme-glow'
          : 'text-sidebar-muted hover:bg-sidebar-muted/50 hover:text-sidebar border-l-[3px] border-transparent'
        }
      `}
    >
      <Icon size={20} className="flex-shrink-0 ml-0.5" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

// ============================================
// MobileMenu Component
// ============================================

export function MobileMenu() {
  const { user } = useAuth();
  const { mobileOpen, closeMobile } = useSidebar();

  return (
    <MobileDrawer open={mobileOpen} onClose={closeMobile}>
      {/* Logo/Brand */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <h1 className="text-lg font-bold text-sidebar">Alpha Star</h1>
        <p className="text-small text-sidebar-muted">Aviation KPIs</p>
      </div>

      {/* Navigation */}
      <div className="py-4 overflow-y-auto">
        {navigationGroups.map((group) => {
          // Filter out admin-only items if user is not admin
          const visibleItems = group.items.filter(
            (item) => !item.adminOnly || user?.role === 'Admin'
          );

          // Don't render empty groups
          if (visibleItems.length === 0) return null;

          return (
            <MobileNavGroup key={group.label} label={group.label}>
              {visibleItems.map((item) => (
                <MobileNavItem
                  key={item.path}
                  path={item.path}
                  label={item.label}
                  icon={item.icon}
                  onNavigate={closeMobile}
                  end={item.path === '/'}
                />
              ))}
            </MobileNavGroup>
          );
        })}
      </div>

      {/* Footer - Version info */}
      <div className="px-6 py-4 border-t border-sidebar-border mt-auto">
        <p className="text-tiny text-sidebar-muted">v1.0.0</p>
      </div>
    </MobileDrawer>
  );
}

export default MobileMenu;
