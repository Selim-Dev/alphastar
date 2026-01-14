import React from 'react';

/**
 * FilterBar Component - Unified filter controls container
 * 
 * Design Specifications (from design.md):
 * - Background: muted/5
 * - Border: 1px solid border
 * - Border radius: 8px (rounded-lg)
 * - Padding: 12px 16px (py-3 px-4)
 * - Gap between controls: 16px (gap-4)
 * - Control height: 36px (h-9)
 * 
 * Requirements: 4.4 - FilterBar SHALL present controls as a unified control bar
 * with consistent sizing, aligned labels, and compact layout
 */

export interface FilterBarProps {
  /** Filter controls to render inside the bar */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Layout direction */
  direction?: 'row' | 'column';
  /** Alignment of items */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Justify content */
  justify?: 'start' | 'center' | 'end' | 'between';
  /** Whether to wrap items on smaller screens */
  wrap?: boolean;
}

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

export function FilterBar({
  children,
  className = '',
  direction = 'row',
  align = 'center',
  justify = 'start',
  wrap = true,
}: FilterBarProps) {
  const baseClasses = [
    // Background with subtle muted color
    'bg-muted/5',
    // Border with theme-aware color
    'border border-border',
    // Border radius (8px)
    'rounded-lg',
    // Padding: 12px vertical, 16px horizontal
    'py-3 px-4',
    // Gap between controls (16px)
    'gap-4',
    // Flexbox layout
    'flex',
    // Direction
    direction === 'row' ? 'flex-row' : 'flex-col',
    // Alignment
    alignClasses[align],
    // Justify
    justifyClasses[justify],
    // Wrap behavior
    wrap ? 'flex-wrap' : 'flex-nowrap',
    // Smooth transitions
    'transition-colors duration-200',
  ].join(' ');

  return (
    <div className={`${baseClasses} ${className}`.trim()}>
      {children}
    </div>
  );
}

/**
 * FilterGroup - Groups related filter controls with an optional label
 */
export interface FilterGroupProps {
  /** Group label */
  label?: string;
  /** Filter controls */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function FilterGroup({ label, children, className = '' }: FilterGroupProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      {label && (
        <span className="text-small text-muted-foreground font-medium whitespace-nowrap">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

/**
 * FilterInput - Styled input for filter controls
 * Ensures consistent height (36px) and modern styling
 */
export interface FilterInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Additional CSS classes */
  className?: string;
}

export function FilterInput({ className = '', ...props }: FilterInputProps) {
  const baseClasses = [
    // Height: 36px
    'h-9',
    // Padding
    'px-3',
    // Typography
    'text-sm font-medium',
    // Background and text
    'bg-card text-foreground',
    // Border with better visibility
    'border-2 border-border/80',
    // Border radius - more rounded
    'rounded-lg',
    // Shadow for depth
    'shadow-sm',
    // Focus states with glow effect
    'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 focus:shadow-md focus:shadow-primary/10',
    // Hover state
    'hover:border-primary/40 hover:shadow-md',
    // Placeholder
    'placeholder:text-muted-foreground/70',
    // Transitions
    'transition-all duration-200 ease-out',
    // Disabled state
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border/80 disabled:hover:shadow-sm',
  ].join(' ');

  return (
    <input className={`${baseClasses} ${className}`.trim()} {...props} />
  );
}

/**
 * FilterSelect - Styled select for filter controls
 * Ensures consistent height (36px) and modern styling
 */
export interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Additional CSS classes */
  className?: string;
}

export function FilterSelect({ className = '', children, ...props }: FilterSelectProps) {
  const baseClasses = [
    // Height: 36px
    'h-9',
    // Padding
    'px-3 pr-9',
    // Typography
    'text-sm font-medium',
    // Background and text
    'bg-card text-foreground',
    // Border with better visibility
    'border-2 border-border/80',
    // Border radius - more rounded
    'rounded-lg',
    // Shadow for depth
    'shadow-sm',
    // Focus states with glow effect
    'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 focus:shadow-md focus:shadow-primary/10',
    // Hover state
    'hover:border-primary/40 hover:shadow-md',
    // Appearance
    'appearance-none',
    // Background arrow
    'bg-no-repeat bg-right',
    // Cursor
    'cursor-pointer',
    // Transitions
    'transition-all duration-200 ease-out',
    // Disabled state
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border/80 disabled:hover:shadow-sm',
  ].join(' ');

  // Custom dropdown arrow using CSS with better styling
  const selectStyle: React.CSSProperties = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundPosition: 'right 0.6rem center',
  };

  return (
    <select className={`${baseClasses} ${className}`.trim()} style={selectStyle} {...props}>
      {children}
    </select>
  );
}

/**
 * FilterButton - Styled button for filter actions
 * Modern design with gradient backgrounds, shadows, and smooth hover effects
 */
export interface FilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'default' | 'primary' | 'outline' | 'ghost';
  /** Additional CSS classes */
  className?: string;
}

const variantClasses = {
  default: [
    'bg-card text-foreground',
    'border-2 border-border/80',
    'shadow-sm',
    'hover:bg-muted/80 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5',
    'active:bg-muted active:scale-[0.98] active:translate-y-0',
  ].join(' '),
  primary: [
    'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground',
    'border border-primary/20',
    'shadow-sm shadow-primary/10',
    'hover:from-primary/95 hover:to-primary/85 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5',
    'active:from-primary/90 active:to-primary/80 active:scale-[0.98] active:translate-y-0',
  ].join(' '),
  outline: [
    'bg-transparent text-foreground',
    'border-2 border-border/80',
    'shadow-sm',
    'hover:bg-accent/50 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5',
    'active:bg-accent/70 active:scale-[0.98] active:translate-y-0',
  ].join(' '),
  ghost: [
    'bg-transparent text-muted-foreground',
    'border border-transparent',
    'hover:bg-muted/80 hover:text-foreground hover:border-border/50',
    'active:bg-muted active:scale-[0.98]',
  ].join(' '),
};

export function FilterButton({
  variant = 'default',
  className = '',
  children,
  ...props
}: FilterButtonProps) {
  const baseClasses = [
    // Height: 36px
    'h-9',
    // Padding
    'px-4',
    // Typography
    'text-sm font-semibold',
    // Border radius - more rounded
    'rounded-lg',
    // Flexbox for icon alignment
    'inline-flex items-center justify-center gap-2',
    // Focus states with glow
    'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1',
    // Transitions - smooth and elegant
    'transition-all duration-200 ease-out',
    // Disabled state
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm',
    // Cursor
    'cursor-pointer',
  ].join(' ');

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * FilterDivider - Visual separator between filter groups
 */
export function FilterDivider() {
  return (
    <div className="h-6 w-px bg-border hidden sm:block" aria-hidden="true" />
  );
}

export default FilterBar;
