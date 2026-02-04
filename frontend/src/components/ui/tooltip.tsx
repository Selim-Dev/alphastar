import { useState, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Simple Tooltip Component
 * 
 * A lightweight tooltip for displaying helpful information on hover.
 * Used for explaining data limitations, metrics, and other contextual help.
 */

interface TooltipProps {
  children: ReactNode;
}

interface TooltipContentProps {
  children: ReactNode;
  className?: string;
}

interface TooltipTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface TooltipProviderProps {
  children: ReactNode;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

export function Tooltip({ children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  // Clone children and inject props
  const childrenArray = Array.isArray(children) ? children : [children];
  const trigger = childrenArray.find((child: any) => child?.type === TooltipTrigger);
  const content = childrenArray.find((child: any) => child?.type === TooltipContent);

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {trigger}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
            role="tooltip"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TooltipTrigger({ children, asChild }: TooltipTriggerProps) {
  if (asChild) {
    return <>{children}</>;
  }
  return <div className="inline-flex">{children}</div>;
}

export function TooltipContent({ children, className = '' }: TooltipContentProps) {
  return (
    <div className={`
      bg-popover border border-border rounded-lg shadow-lg p-3 text-sm
      max-w-xs text-foreground
      ${className}
    `}>
      {children}
    </div>
  );
}
