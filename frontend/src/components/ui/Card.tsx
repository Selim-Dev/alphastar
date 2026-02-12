import { motion, HTMLMotionProps } from 'framer-motion';
import React from 'react';

/**
 * Card - Reusable card container component with motion support
 * 
 * Features:
 * - Framer Motion animations
 * - Responsive design
 * - Dark mode support
 * - Hover effects
 * - Flexible layout
 */
export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Card content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Enable hover effect */
  hoverable?: boolean;
  /** Enable click interaction */
  clickable?: boolean;
  /** Animation delay */
  delay?: number;
}

export function Card({
  children,
  className = '',
  hoverable = false,
  clickable = false,
  delay = 0,
  ...props
}: CardProps) {
  const hoverClass = hoverable || clickable
    ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200'
    : '';
  
  const cursorClass = clickable ? 'cursor-pointer' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`
        bg-card border border-border rounded-lg shadow-sm
        ${hoverClass}
        ${cursorClass}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
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
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function CardTitle({ children, className = '', as: Component = 'h3' }: CardTitleProps) {
  const sizeClasses = {
    h2: 'text-h2',
    h3: 'text-h3',
    h4: 'text-h4',
    h5: 'text-h5',
    h6: 'text-h6',
    h1: 'text-h1',
  };

  return (
    <Component className={`font-semibold text-foreground ${sizeClasses[Component]} ${className}`.trim()}>
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
