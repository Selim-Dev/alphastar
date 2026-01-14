import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  BookOpen,
  BookA,
  Database,
  Presentation,
  type LucideIcon,
} from 'lucide-react';
import {
  QuickStartTab,
  ModuleGuidesTab,
  GlossaryTab,
  DataReadinessTab,
  DemoModeTab,
} from '@/components/help';

/**
 * HelpCenterPage Component - Main Help Center page with tabbed interface
 * Requirements: 1.3 - Display tabbed interface with 5 tabs
 * Requirements: 1.4 - Display corresponding content without page reload
 * Requirements: 1.5 - Apply consistent styling with theme support
 * Requirements: 10.1 - Consistent card styling, spacing, typography
 * Requirements: 10.2 - Clear visual hierarchy
 * Requirements: 10.3 - Color-coded callouts
 * Requirements: 10.4 - Dark/light theme support
 * Requirements: 10.5 - Smooth transitions for tab switching
 */

type TabId = 'quick-start' | 'module-guides' | 'glossary' | 'data-readiness' | 'demo-mode';

interface TabConfig {
  id: TabId;
  label: string;
  icon: LucideIcon;
  component: React.ComponentType;
}

const tabs: TabConfig[] = [
  { id: 'quick-start', label: 'Quick Start', icon: Rocket, component: QuickStartTab },
  { id: 'module-guides', label: 'Module Guides', icon: BookOpen, component: ModuleGuidesTab },
  { id: 'glossary', label: 'Glossary', icon: BookA, component: GlossaryTab },
  { id: 'data-readiness', label: 'Data Readiness', icon: Database, component: DataReadinessTab },
  { id: 'demo-mode', label: 'Demo Mode', icon: Presentation, component: DemoModeTab },
];

export function HelpCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabId | null;
  
  // Initialize active tab from URL or default to first tab
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (tabParam && tabs.some((t) => t.id === tabParam)) {
      return tabParam;
    }
    return 'quick-start';
  });

  // Sync URL with active tab
  useEffect(() => {
    if (tabParam !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, tabParam, setSearchParams]);

  // Handle tab change
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  // Get active tab config
  const activeTabConfig = tabs.find((t) => t.id === activeTab) || tabs[0];
  const ActiveComponent = activeTabConfig.component;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Documentation, guides, and tools to help you get the most out of the dashboard
          </p>
        </div>
      </div>

      {/* Tab Navigation - Modern pill-style tabs */}
      <div className="bg-muted/50 p-1.5 rounded-xl border border-border/50">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Help Center tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                  whitespace-nowrap transition-all duration-200 rounded-lg
                  ${isActive
                    ? 'bg-background text-primary shadow-sm border border-border/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }
                `}
                aria-selected={isActive}
                role="tab"
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                <span>{tab.label}</span>
                
                {/* Active glow effect */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute inset-0 rounded-lg bg-primary/5 -z-10"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="min-h-[400px]"
        >
          <ActiveComponent />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default HelpCenterPage;
