import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  storageKey?: string;
  className?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
  storageKey,
  className = '',
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(`dashboard-section-${storageKey}`);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultExpanded;
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`dashboard-section-${storageKey}`, String(isExpanded));
    }
  }, [isExpanded, storageKey]);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className={`${className}`}>
      <button
        onClick={toggleExpanded}
        className="flex items-center gap-2 w-full text-left py-2 px-1 hover:bg-muted/50 rounded-lg transition-colors group cursor-pointer"
      >
        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>
        <h2 className="text-sm font-semibold text-muted-foreground group-hover:text-foreground uppercase tracking-wide transition-colors">
          {title}
        </h2>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
