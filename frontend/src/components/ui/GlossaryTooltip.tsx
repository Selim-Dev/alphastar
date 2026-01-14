import { useState, useRef, useEffect, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { getEntryByTermOrAcronym } from '@/lib/help/glossaryContent';

/**
 * GlossaryTooltip Component - Displays a tooltip with glossary definition on hover
 * Requirements: 5.1 - Display tooltip on hover showing short definition
 * Requirements: 5.2 - Include "Learn more" link to full Glossary entry
 * Requirements: 5.3 - Apply to acronyms: FMC, AOG, TTSN, TCSN, APU, ATA, MTBF, MTTR, NMC
 * Requirements: 5.4 - Use consistent styling with dashboard theme
 */

interface GlossaryTooltipProps {
  /** The term or acronym to look up in the glossary */
  term: string;
  /** Children to wrap with the tooltip (usually the text to display) */
  children: ReactNode;
  /** Optional custom display text if different from children */
  displayText?: string;
  /** Position of the tooltip relative to the trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Whether to show the dotted underline indicator */
  showIndicator?: boolean;
  /** Additional class names for the wrapper */
  className?: string;
}

export function GlossaryTooltip({
  term,
  children,
  position = 'top',
  showIndicator = true,
  className = '',
}: GlossaryTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Look up the glossary entry
  const entry = getEntryByTermOrAcronym(term);

  // If no entry found, just render children without tooltip
  if (!entry) {
    return <span className={className}>{children}</span>;
  }

  // Calculate tooltip position
  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 8;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - padding;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + padding;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - padding;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + padding;
        break;
    }

    // Ensure tooltip stays within viewport
    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }
    if (top < padding) {
      // Flip to bottom if not enough space on top
      top = triggerRect.bottom + padding;
    }
    if (top + tooltipRect.height > viewportHeight - padding) {
      // Flip to top if not enough space on bottom
      top = triggerRect.top - tooltipRect.height - padding;
    }

    setTooltipPosition({ top, left });
  };

  // Handle mouse enter with delay
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 200); // Small delay to prevent accidental triggers
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  // Update position when tooltip becomes visible
  useEffect(() => {
    if (isVisible) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        updatePosition();
      });
    }
  }, [isVisible]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Short definition (first sentence or truncated)
  const shortDefinition = entry.definition.length > 150
    ? entry.definition.substring(0, 150).trim() + '...'
    : entry.definition;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        tabIndex={0}
        className={`
          inline-flex items-center cursor-help
          ${showIndicator ? 'border-b border-dotted border-muted-foreground/50 hover:border-primary' : ''}
          transition-colors duration-150
          ${className}
        `}
        aria-describedby={`glossary-tooltip-${entry.id}`}
      >
        {children}
      </span>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            id={`glossary-tooltip-${entry.id}`}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              zIndex: 9999,
            }}
            className="max-w-xs sm:max-w-sm"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
              {/* Term header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-foreground">
                  {entry.acronym || entry.term}
                </span>
                {entry.acronym && (
                  <span className="text-xs text-muted-foreground">
                    ({entry.term})
                  </span>
                )}
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${entry.category === 'Operations' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                  ${entry.category === 'Maintenance' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                  ${entry.category === 'Finance' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                  ${entry.category === 'General' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' : ''}
                `}>
                  {entry.category}
                </span>
              </div>

              {/* Definition */}
              <p className="text-muted-foreground leading-relaxed mb-3">
                {shortDefinition}
              </p>

              {/* Learn more link */}
              <Link
                to={`/help?tab=glossary&term=${encodeURIComponent(entry.id)}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                onClick={() => setIsVisible(false)}
              >
                Learn more
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Helper component for wrapping text with glossary tooltip
 * Use this when you want to wrap specific acronyms in existing text
 */
interface GlossaryTermProps {
  /** The acronym or term to display and look up */
  term: string;
  /** Optional custom display text */
  display?: string;
  /** Additional class names */
  className?: string;
}

export function GlossaryTerm({ term, display, className }: GlossaryTermProps) {
  return (
    <GlossaryTooltip term={term} className={className}>
      {display || term}
    </GlossaryTooltip>
  );
}

export default GlossaryTooltip;
