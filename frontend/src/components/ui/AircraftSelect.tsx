import React from 'react';
import { useAircraft } from '@/hooks/useAircraft';
import type { Aircraft } from '@/types';

/**
 * AircraftSelect Component - Reusable aircraft dropdown with loading/error/empty states
 * 
 * Requirements:
 * - 1.1: Fetch aircraft data from API and populate dropdown with active aircraft registrations
 * - 1.2: Display error message with retry button on API failure
 * - 1.3: Display loading indicator during fetch
 * - 1.4: Display helpful message when no aircraft exist
 */

export interface AircraftSelectProps {
  /** Currently selected aircraft ID */
  value?: string;
  /** Callback when selection changes */
  onChange: (aircraftId: string) => void;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Include "All Aircraft" option at the top */
  includeAll?: boolean;
  /** Label for the "All" option */
  allLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Show registration with fleet group */
  showFleetGroup?: boolean;
  /** Filter by status (default: only active) */
  statusFilter?: 'active' | 'all';
  /** Error state from parent form */
  error?: boolean;
  /** Name attribute for form integration */
  name?: string;
}

export function AircraftSelect({
  value = '',
  onChange,
  placeholder = 'Select Aircraft',
  includeAll = false,
  allLabel = 'All Aircraft',
  className = '',
  disabled = false,
  required = false,
  showFleetGroup = true,
  statusFilter = 'active',
  error = false,
  name,
}: AircraftSelectProps) {
  const { 
    data: aircraftData, 
    isLoading, 
    isError, 
    error: fetchError,
    refetch 
  } = useAircraft(statusFilter === 'active' ? { status: 'active' } : undefined);

  const aircraft = aircraftData?.data || [];

  // Format aircraft option label
  const formatLabel = (a: Aircraft): string => {
    if (showFleetGroup) {
      return `${a.registration} - ${a.fleetGroup}`;
    }
    return a.registration;
  };

  // Base classes for the select element
  const baseClasses = [
    'h-9',
    'px-3 pr-8',
    'text-sm',
    'bg-card text-foreground',
    'border',
    error ? 'border-destructive' : 'border-border',
    'rounded-md',
    'focus:outline-none focus:ring-2',
    error ? 'focus:ring-destructive' : 'focus:ring-ring',
    'focus:ring-offset-1',
    'appearance-none',
    'bg-no-repeat bg-right',
    'cursor-pointer',
    'transition-colors duration-150',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'min-w-[180px]',
  ].join(' ');

  // Custom dropdown arrow
  const selectStyle: React.CSSProperties = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundPosition: 'right 0.5rem center',
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <select
          disabled
          className={`${baseClasses} animate-pulse`}
          style={selectStyle}
        >
          <option>Loading aircraft...</option>
        </select>
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-2 text-sm border border-destructive/50 rounded-md bg-destructive/10 text-destructive">
          <ErrorIcon />
          <span className="flex-1">Failed to load aircraft</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-2 py-1 text-xs font-medium bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
          >
            Retry
          </button>
        </div>
        {fetchError && (
          <p className="text-xs text-muted-foreground">
            {fetchError instanceof Error ? fetchError.message : 'Unknown error occurred'}
          </p>
        )}
      </div>
    );
  }

  // Empty state
  if (aircraft.length === 0) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-2 text-sm border border-amber-500/50 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
          <WarningIcon />
          <span className="flex-1">No aircraft found</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Add aircraft via the Admin page or run the seed script to populate demo data.
        </p>
      </div>
    );
  }

  // Normal state with data
  return (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required={required}
      className={`${baseClasses} ${className}`}
      style={selectStyle}
    >
      {includeAll && <option value="">{allLabel}</option>}
      {!includeAll && !value && <option value="">{placeholder}</option>}
      {aircraft.map((a) => {
        const aircraftId = a._id || a.id;
        return (
          <option key={aircraftId} value={aircraftId}>
            {formatLabel(a)}
          </option>
        );
      })}
    </select>
  );
}

// Loading spinner component
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-muted-foreground"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Error icon component
function ErrorIcon() {
  return (
    <svg
      className="h-4 w-4 flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// Warning icon component
function WarningIcon() {
  return (
    <svg
      className="h-4 w-4 flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default AircraftSelect;
