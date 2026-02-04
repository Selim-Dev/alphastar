import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

interface AnalyticsPDFExportProps {
  containerId?: string;
  filename?: string;
  label?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onSuccess?: () => void;
  maxRetries?: number;
}

/**
 * PDF Export Button for Analytics Page
 * Requirements: FR-4.1 - PDF Generation MUST work reliably
 * 
 * Exports the analytics page to PDF including:
 * - Charts and visualizations
 * - Summary statistics
 * - Date range and filters applied
 * 
 * Features:
 * - Automatic retry logic with exponential backoff
 * - Proper error handling and user feedback
 * - Multi-page PDF support for long content
 * - High-resolution chart capture
 */
export function AnalyticsPDFExport({
  containerId = 'aog-analytics-content',
  filename,
  label = 'Export PDF',
  variant = 'outline',
  size = 'md',
  className = '',
  onSuccess,
  maxRetries = 2,
}: AnalyticsPDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleExport = async (attemptNumber: number = 0) => {
    setIsExporting(true);
    setError(null);
    setSuccess(false);

    try {
      // Get the container element
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container with ID "${containerId}" not found. Please ensure the content is loaded.`);
      }

      // Create a clone of the container to avoid modifying the original
      const clone = container.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = '1200px'; // Fixed width for consistent PDF layout
      document.body.appendChild(clone);

      // Wait for any animations to complete and charts to render
      // Longer wait on first attempt, shorter on retries
      const waitTime = attemptNumber === 0 ? 1000 : 500;
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Capture the content as canvas with higher resolution
      const canvas = await html2canvas(clone, {
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution for better quality
        allowTaint: true,
        foreignObjectRendering: true,
      } as any); // Type assertion needed for html2canvas options

      // Remove the clone
      document.body.removeChild(clone);

      // Validate canvas was created successfully
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Failed to capture content. Canvas is empty.');
      }

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Calculate dimensions to fit the page
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add the image to the PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const defaultFilename = `aog-analytics-${timestamp}.pdf`;
      
      // Save the PDF
      pdf.save(filename || defaultFilename);

      // Success!
      setSuccess(true);
      setRetryCount(0); // Reset retry count on success
      onSuccess?.();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('PDF export failed:', err);
      
      // Retry logic with exponential backoff
      if (attemptNumber < maxRetries) {
        const nextAttempt = attemptNumber + 1;
        setRetryCount(nextAttempt);
        
        // Exponential backoff: 1s, 2s, 4s...
        const retryDelay = Math.pow(2, attemptNumber) * 1000;
        
        console.log(`Retrying PDF export (attempt ${nextAttempt + 1}/${maxRetries + 1}) in ${retryDelay}ms...`);
        
        setTimeout(() => {
          handleExport(nextAttempt);
        }, retryDelay);
      } else {
        // Max retries reached, show error
        const errorMessage = err instanceof Error ? err.message : 'PDF export failed. Please try again.';
        setError(errorMessage);
        setRetryCount(0);
        
        // Clear error message after 5 seconds
        setTimeout(() => setError(null), 5000);
      }
    } finally {
      // Only set isExporting to false if we're not retrying
      if (retryCount >= maxRetries) {
        setIsExporting(false);
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    handleExport(0);
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
    if (isExporting) {
      const retryText = retryCount > 0 ? ` (Retry ${retryCount}/${maxRetries})` : '';
      return (
        <>
          <span className="animate-spin">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          </span>
          Exporting{retryText}...
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
        onClick={() => handleExport(0)}
        disabled={isExporting}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
          success ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700' : ''
        }`}
      >
        {getButtonContent()}
      </button>
      {error && (
        <div className="absolute top-full mt-2 right-0 min-w-[300px] max-w-[400px] text-xs bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
            </svg>
            <div className="flex-1">
              <p className="font-medium mb-1">{error}</p>
              <button
                onClick={handleRetry}
                className="text-xs underline hover:no-underline"
              >
                Click to retry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
