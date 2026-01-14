import { useState } from 'react';
import { useExportData, downloadBlob, ExportType } from '@/hooks/useImportExport';

// Download icon
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);

// Check icon for success state
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

interface ExportButtonProps {
  exportType: ExportType;
  filters?: Record<string, unknown>;
  filename?: string;
  label?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onSuccess?: () => void;
}

export function ExportButton({
  exportType,
  filters,
  filename,
  label = 'Export',
  variant = 'outline',
  size = 'md',
  className = '',
  onSuccess,
}: ExportButtonProps) {
  const exportMutation = useExportData();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleExport = async () => {
    setError(null);
    setSuccess(false);
    try {
      const result = await exportMutation.mutateAsync({
        type: exportType,
        filters,
      });
      const defaultFilename = `${exportType}-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadBlob(result.blob, filename || defaultFilename);
      setSuccess(true);
      onSuccess?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const baseClasses = 'inline-flex items-center gap-2 font-medium transition-colors rounded-lg disabled:opacity-50';
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-border bg-card text-foreground hover:bg-muted',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const getButtonContent = () => {
    if (exportMutation.isPending) {
      return (
        <>
          <span className="animate-spin">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          </span>
          Exporting...
        </>
      );
    }
    if (success) {
      return (
        <>
          <CheckIcon />
          Exported!
        </>
      );
    }
    return (
      <>
        <DownloadIcon />
        {label}
      </>
    );
  };

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={exportMutation.isPending}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
          success ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700' : ''
        }`}
      >
        {getButtonContent()}
      </button>
      {error && (
        <div className="absolute top-full mt-1 right-0 text-xs text-destructive whitespace-nowrap bg-destructive/10 px-2 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
