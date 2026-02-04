import { CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ isActive, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  if (isActive) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-red-500 text-white ${sizeClasses[size]}`}
      >
        <span className="relative flex">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className={`relative inline-flex rounded-full bg-white ${iconSizes[size] === 'w-3 h-3' ? 'h-2 w-2' : iconSizes[size] === 'w-3.5 h-3.5' ? 'h-2.5 w-2.5' : 'h-3 w-3'}`}></span>
        </span>
        ACTIVE
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-green-500 text-white ${sizeClasses[size]}`}
    >
      <CheckCircle2 className={iconSizes[size]} />
      RESOLVED
    </span>
  );
}
