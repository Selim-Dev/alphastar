import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from './AppShell';
import { Breadcrumb, useBreadcrumbs } from '@/components/ui/Breadcrumb';
import {
  Sun,
  Moon,
  LogOut,
  Menu,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

// ============================================
// Route Configuration for Page Titles
// ============================================

interface RouteConfig {
  path: string;
  title: string;
}

const routeConfig: RouteConfig[] = [
  { path: '/', title: 'Dashboard' },
  { path: '/availability', title: 'Fleet Availability' },
  { path: '/aircraft', title: 'Aircraft Details' },
  { path: '/daily-status', title: 'Daily Status' },
  { path: '/maintenance', title: 'Maintenance Tasks' },
  { path: '/maintenance/tasks', title: 'Maintenance Tasks' },
  { path: '/maintenance/tasks/log', title: 'Log Task' },
  { path: '/maintenance/tasks/analytics', title: 'Analytics' },
  { path: '/aog', title: 'AOG & Events' },
  { path: '/aog/list', title: 'Events List' },
  { path: '/aog/log', title: 'Log Event' },
  { path: '/aog/analytics', title: 'Analytics' },
  { path: '/work-orders', title: 'Work Orders' },
  { path: '/work-orders/new', title: 'New Work Order' },
  { path: '/work-orders/analytics', title: 'Analytics' },
  { path: '/discrepancies', title: 'Discrepancies' },
  { path: '/discrepancies/new', title: 'New Discrepancy' },
  { path: '/discrepancies/analytics', title: 'Analytics' },
  { path: '/budget', title: 'Budget & Cost' },
  { path: '/import', title: 'Data Import' },
  { path: '/admin', title: 'Settings' },
  { path: '/help', title: 'Help Center' },
];

function getRouteTitle(pathname: string): string {
  // Try exact match first
  const exactMatch = routeConfig.find(r => r.path === pathname);
  if (exactMatch) return exactMatch.title;
  
  // Handle dynamic routes like /aircraft/:id
  const segments = pathname.split('/').filter(Boolean);
  
  // Aircraft detail page
  if (segments[0] === 'aircraft' && segments[1]) {
    return 'Aircraft Details';
  }
  
  // Work order edit
  if (segments[0] === 'work-orders' && segments[2] === 'edit') {
    return 'Edit Work Order';
  }
  
  // Discrepancy edit
  if (segments[0] === 'discrepancies' && segments[2] === 'edit') {
    return 'Edit Discrepancy';
  }
  
  // Try to match base path
  const basePath = '/' + segments[0];
  const baseMatch = routeConfig.find(r => r.path === basePath);
  if (baseMatch) return baseMatch.title;
  
  return 'Dashboard';
}

// ============================================
// PageHeader Component
// ============================================

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const location = useLocation();
  const breadcrumbs = useBreadcrumbs();
  const routeTitle = getRouteTitle(location.pathname);
  const displayTitle = title || routeTitle;

  return (
    <div className="flex items-center justify-between">
      <div>
        <Breadcrumb items={breadcrumbs} className="mb-1" />
        <h1 className="text-h2 text-foreground">{displayTitle}</h1>
        {subtitle && (
          <p className="text-small text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

// ============================================
// UserMenu Component
// ============================================

function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate initials from user name
  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-accent transition-colors duration-150"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-aviation flex items-center justify-center">
          <span className="text-small font-semibold text-aviation-foreground">
            {initials}
          </span>
        </div>
        {/* User info - hidden on small screens */}
        <div className="text-left hidden md:block">
          <p className="text-small font-medium text-foreground leading-tight">
            {user?.name}
          </p>
          <p className="text-tiny text-muted-foreground leading-tight">
            {user?.role}
          </p>
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-popover shadow-theme-md z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* User info in dropdown (visible on mobile) */}
          <div className="px-4 py-3 border-b border-border md:hidden">
            <p className="text-small font-medium text-foreground">{user?.name}</p>
            <p className="text-tiny text-muted-foreground">{user?.role}</p>
          </div>
          
          <div className="p-1">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-small text-foreground rounded-md hover:bg-accent transition-colors duration-150"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================
// ThemeToggle Component
// ============================================

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-lg flex items-center justify-center
                 hover:bg-accent transition-all duration-200 ease-out
                 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Sun icon - visible in dark mode */}
      <Sun 
        size={18} 
        className={`absolute transition-all duration-300 ease-out
          ${theme === 'dark' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 -rotate-90 scale-0'
          }`}
      />
      {/* Moon icon - visible in light mode */}
      <Moon 
        size={18} 
        className={`absolute transition-all duration-300 ease-out
          ${theme === 'light' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 rotate-90 scale-0'
          }`}
      />
    </button>
  );
}

// ============================================
// MobileMenuButton Component
// ============================================

function MobileMenuButton() {
  const { toggleMobileOpen } = useSidebar();

  return (
    <button
      onClick={toggleMobileOpen}
      className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center
                 hover:bg-accent transition-colors duration-150"
      aria-label="Open navigation menu"
    >
      <Menu size={20} />
    </button>
  );
}

// ============================================
// Topbar Component
// ============================================

interface TopbarProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <div className="sticky top-0 z-40 h-16 bg-background border-b border-border shadow-theme-sm">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left section: Mobile menu + Page header */}
        <div className="flex items-center gap-4">
          <MobileMenuButton />
          <PageHeader title={title} subtitle={subtitle} />
        </div>

        {/* Right section: Actions + Theme toggle + User menu */}
        <div className="flex items-center gap-2">
          {/* Global actions slot */}
          {actions && (
            <div className="hidden sm:flex items-center gap-2 mr-2">
              {actions}
            </div>
          )}
          
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </div>
  );
}

export default Topbar;
