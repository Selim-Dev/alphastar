import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

/**
 * Card Component - Premium elevated surface container
 * 
 * Design Specifications (from design.md):
 * - Border radius: 12px (rounded-xl)
 * - Padding: 20px (p-5)
 * - Border: 1px solid border color
 * - Shadow: shadow-sm (light), shadow (dark) - using theme-aware shadows
 * - Background: card color
 * 
 * Requirements: 4.1 - Card SHALL display with appropriate elevation, padding,
 * subtle border, and shadow tuned for the current theme mode
 */

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Card content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Card padding variant */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Enable hover elevation effect */
  hoverable?: boolean;
  /** Disable animation */
  static?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  children,
  className = '',
  padding = 'md',
  hoverable = false,
  static: isStatic = false,
  ...motionProps
}: CardProps) {
  const baseClasses = [
    // Background and text
    'bg-card text-card-foreground',
    // Border with theme-aware color
    'border border-border',
    // Premium border radius (12px)
    'rounded-xl',
    // Theme-aware shadow
    'shadow-theme-sm',
    // Padding based on variant
    paddingClasses[padding],
    // Smooth transitions for hover and theme changes
    'transition-shadow duration-200 ease-out',
  ].join(' ');

  const hoverClasses = hoverable
    ? 'hover:shadow-theme-md hover:border-border/80 cursor-pointer'
    : '';

  const combinedClasses = `${baseClasses} ${hoverClasses} ${className}`.trim();

  if (isStatic) {
    return (
      <div className={combinedClasses}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={combinedClasses}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

/**
 * CardHeader - Optional header section for cards
 */
export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`.trim()}>
      {children}
    </div>
  );
}

/**
 * CardTitle - Title element for card headers
 */
export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3' | 'h4';
}

export function CardTitle({ children, className = '', as: Component = 'h3' }: CardTitleProps) {
  const sizeClasses = {
    h2: 'text-h2',
    h3: 'text-h3',
    h4: 'text-lg font-semibold',
  };

  return (
    <Component className={`${sizeClasses[Component]} text-foreground ${className}`.trim()}>
      {children}
    </Component>
  );
}

/**
 * CardDescription - Subtitle/description for card headers
 */
export interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`text-small text-muted-foreground mt-1 ${className}`.trim()}>
      {children}
    </p>
  );
}

/**
 * CardContent - Main content area of the card
 */
export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

/**
 * CardFooter - Optional footer section for cards
 */
export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-border ${className}`.trim()}>
      {children}
    </div>
  );
}

export default Card;
