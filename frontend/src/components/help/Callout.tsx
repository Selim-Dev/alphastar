import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Info, AlertTriangle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

/**
 * Callout Component - Info/warning/success/error boxes for Help Center
 * Requirements: 2.4 - Include callout boxes for common issues
 * Requirements: 10.3 - Use color-coded boxes (info=blue, warning=amber, success=green, error=red)
 */

export type CalloutType = 'info' | 'warning' | 'success' | 'error';

export interface CalloutProps {
  type: CalloutType;
  title: string;
  description: string;
  actionLink?: string;
  actionLabel?: string;
  children?: ReactNode;
  className?: string;
}

const calloutConfig: Record<
  CalloutType,
  {
    icon: typeof Info;
    bgClass: string;
    borderClass: string;
    iconClass: string;
    titleClass: string;
  }
> = {
  info: {
    icon: Info,
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    borderClass: 'border-blue-200 dark:border-blue-800',
    iconClass: 'text-blue-600 dark:text-blue-400',
    titleClass: 'text-blue-900 dark:text-blue-100',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    borderClass: 'border-amber-200 dark:border-amber-800',
    iconClass: 'text-amber-600 dark:text-amber-400',
    titleClass: 'text-amber-900 dark:text-amber-100',
  },
  success: {
    icon: CheckCircle,
    bgClass: 'bg-green-50 dark:bg-green-950/30',
    borderClass: 'border-green-200 dark:border-green-800',
    iconClass: 'text-green-600 dark:text-green-400',
    titleClass: 'text-green-900 dark:text-green-100',
  },
  error: {
    icon: XCircle,
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    borderClass: 'border-red-200 dark:border-red-800',
    iconClass: 'text-red-600 dark:text-red-400',
    titleClass: 'text-red-900 dark:text-red-100',
  },
};

export function Callout({
  type,
  title,
  description,
  actionLink,
  actionLabel,
  children,
  className = '',
}: CalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border p-4 ${config.bgClass} ${config.borderClass} ${className}`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${config.iconClass}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${config.titleClass} mb-1`}>
            {title}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>

          {/* Additional Content */}
          {children}

          {/* Action Link */}
          {actionLink && actionLabel && (
            <Link
              to={actionLink}
              className={`inline-flex items-center gap-1.5 text-sm font-medium mt-3 ${config.iconClass} hover:opacity-80 transition-opacity`}
            >
              {actionLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default Callout;
