import { Outlet, useLocation } from 'react-router-dom';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PageTransition } from '@/components/ui/PageTransition';
import { MobileDrawer } from './MobileDrawer';

// ============================================
// Sidebar State Context
// ============================================

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
}

interface SidebarContextValue extends SidebarState {
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobileOpen: () => void;
  setMobileOpen: (open: boolean) => void;
  closeMobile: () => void;
  sidebarWidth: number;
}

const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed';
const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 72;

// Breakpoint constants (matching Tailwind defaults)
const BREAKPOINT_LG = 1024; // lg breakpoint
const BREAKPOINT_MD = 768;  // md breakpoint (tablet)

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within an AppShell');
  }
  return context;
}

// ============================================
// Sidebar Provider
// ============================================

interface SidebarProviderProps {
  children: ReactNode;
}

function SidebarProvider({ children }: SidebarProviderProps) {
  const location = useLocation();
  
  // Initialize collapsed state from localStorage
  const [collapsed, setCollapsedState] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === 'true';
  });
  
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Handle responsive behavior on window resize
  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      
      // Close mobile drawer when resizing to desktop
      if (width >= BREAKPOINT_LG) {
        setMobileOpen(false);
      }
      
      // Auto-collapse sidebar on tablet
      if (width >= BREAKPOINT_MD && width < BREAKPOINT_LG) {
        setCollapsedState(true);
      }
    }

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapsed = useCallback(() => setCollapsedState(prev => !prev), []);
  const setCollapsed = useCallback((value: boolean) => setCollapsedState(value), []);
  const toggleMobileOpen = useCallback(() => setMobileOpen(prev => !prev), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  const value: SidebarContextValue = {
    collapsed,
    mobileOpen,
    toggleCollapsed,
    setCollapsed,
    toggleMobileOpen,
    setMobileOpen,
    closeMobile,
    sidebarWidth,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

// ============================================
// AppShell Component
// ============================================

interface AppShellProps {
  sidebar?: ReactNode;
  topbar?: ReactNode;
  children?: ReactNode;
}

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppShellContent sidebar={sidebar} topbar={topbar}>
        {children}
      </AppShellContent>
    </SidebarProvider>
  );
}

// Internal component that uses the sidebar context
function AppShellContent({ sidebar, topbar, children }: AppShellProps) {
  const { sidebarWidth, mobileOpen, closeMobile } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop/Tablet Sidebar - Hidden on mobile, visible on md+ */}
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden md:block transition-[width] duration-200 ease-out"
        style={{ width: sidebarWidth }}
      >
        {sidebar}
      </aside>

      {/* Mobile Drawer - Only visible on mobile (< md) */}
      <MobileDrawer open={mobileOpen} onClose={closeMobile}>
        {sidebar}
      </MobileDrawer>

      {/* Main content area */}
      <div 
        className="flex flex-col min-h-screen transition-[margin-left] duration-200 ease-out md:ml-[var(--sidebar-width)]"
        style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
      >
        {/* Topbar - Sticky at top */}
        <header className="sticky top-0 z-40 bg-white">
          {topbar}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          <PageTransition>
            {children || <Outlet />}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
