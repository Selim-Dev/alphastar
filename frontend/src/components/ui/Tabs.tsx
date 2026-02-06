import { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Reusable Tabs component with multiple variants
 * Provides better visual hierarchy than plain border-bottom tabs
 */
export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  size = 'md',
  className = '',
}: TabsProps) {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  const variantClasses = {
    default: {
      container: 'flex gap-1 border-b border-border',
      tab: (isActive: boolean) =>
        `${sizeClasses[size]} rounded-t-lg font-medium transition-all duration-200 ${
          isActive
            ? 'bg-card text-primary border-b-2 border-primary -mb-px'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`,
    },
    pills: {
      container: 'flex gap-2 p-1 bg-muted/30 rounded-lg',
      tab: (isActive: boolean) =>
        `${sizeClasses[size]} rounded-lg font-semibold transition-all duration-200 ${
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
        }`,
    },
    underline: {
      container: 'flex gap-6 border-b-2 border-border',
      tab: (isActive: boolean) =>
        `${sizeClasses[size]} font-semibold transition-all duration-200 border-b-2 -mb-0.5 ${
          isActive
            ? 'text-primary border-primary'
            : 'text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/50'
        }`,
    },
  };

  const { container, tab } = variantClasses[variant];

  return (
    <div className={`${container} ${className}`} role="tablist">
      {tabs.map((tabItem) => {
        const isActive = activeTab === tabItem.id;
        const Icon = tabItem.icon;

        return (
          <button
            key={tabItem.id}
            onClick={() => !tabItem.disabled && onChange(tabItem.id)}
            disabled={tabItem.disabled}
            className={`
              ${tab(isActive)}
              flex items-center justify-center
              cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2
            `}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tabItem.disabled}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{tabItem.label}</span>
            {tabItem.badge !== undefined && tabItem.badge > 0 && (
              <span
                className={`
                  px-1.5 py-0.5 text-xs rounded-full font-semibold
                  ${
                    isActive
                      ? variant === 'pills'
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-primary/20 text-primary'
                      : 'bg-muted-foreground/20 text-muted-foreground'
                  }
                `}
              >
                {tabItem.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps {
  children: ReactNode;
  value: string;
  activeTab: string;
  className?: string;
}

/**
 * Tab panel component to wrap tab content
 */
export function TabPanel({ children, value, activeTab, className = '' }: TabPanelProps) {
  if (value !== activeTab) return null;

  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
