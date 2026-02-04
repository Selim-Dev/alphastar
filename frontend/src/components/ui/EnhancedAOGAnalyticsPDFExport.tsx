import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

// Icons
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const LoaderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

interface DateRange {
  startDate?: string;
  endDate?: string;
}

interface SummaryData {
  totalEvents: number;
  activeEvents: number;
  totalDowntimeHours: number;
  averageDowntimeHours: number;
  totalCost?: number;
}

interface Insight {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  metric?: number;
  recommendation?: string;
}

interface EnhancedAOGAnalyticsPDFExportProps {
  filters: {
    dateRange: DateRange;
    aircraftFilter?: string;
    fleetFilter?: string;
  };
  summary: SummaryData;
  insights?: Insight[];
  filename?: string;
  label?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onSuccess?: () => void;
}

/**
 * Enhanced PDF Export Component for AOG Analytics
 * Requirements: FR-4.1, FR-4.2, FR-4.3
 * 
 * Features:
 * - Multi-page PDF support
 * - Professional cover page
 * - Executive summary
 * - High-resolution chart capture
 * - Page numbers and footers
 * - Progress indicator
 * - Proper error handling and retry logic
 */
export function EnhancedAOGAnalyticsPDFExport({
  filters,
  summary,
  insights = [],
  filename,
  label = 'Export PDF',
  variant = 'outline',
  size = 'md',
  className = '',
  onSuccess,
}: EnhancedAOGAnalyticsPDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Add cover page to PDF
   * Requirements: FR-4.2
   */
  const addCoverPage = (pdf: jsPDF) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AOG Analytics Report', pageWidth / 2, 60, { align: 'center' });

    // Subtitle
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Alpha Star Aviation', pageWidth / 2, 75, { align: 'center' });

    // Date range
    pdf.setFontSize(12);
    const dateRange = filters.dateRange.startDate && filters.dateRange.endDate
      ? `${format(new Date(filters.dateRange.startDate), 'MMM dd, yyyy')} - ${format(new Date(filters.dateRange.endDate), 'MMM dd, yyyy')}`
      : 'All Time';
    pdf.text(`Period: ${dateRange}`, pageWidth / 2, 100, { align: 'center' });

    // Generation timestamp
    pdf.setFontSize(10);
    pdf.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, pageWidth / 2, 110, { align: 'center' });

    // Filters applied
    if (filters.fleetFilter || filters.aircraftFilter) {
      const filterText = `Filters: ${filters.fleetFilter || 'All Fleets'}, ${filters.aircraftFilter || 'All Aircraft'}`;
      pdf.text(filterText, pageWidth / 2, 120, { align: 'center' });
    }

    // Company branding placeholder
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('Alpha Star Aviation KPI Dashboard', pageWidth / 2, pageHeight - 20, { align: 'center' });
  };

  /**
   * Add executive summary page to PDF
   * Requirements: FR-4.2
   */
  const addExecutiveSummary = (pdf: jsPDF, summary: SummaryData, insights: Insight[]) => {
    pdf.addPage();
    
    // Section title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Executive Summary', 15, 20);

    // Key Metrics
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    let y = 35;
    pdf.text('Key Metrics:', 15, y);
    y += 10;

    const metrics = [
      `Total Events: ${summary.totalEvents}`,
      `Active AOG: ${summary.activeEvents}`,
      `Total Downtime: ${summary.totalDowntimeHours.toFixed(1)} hours`,
      `Average Downtime: ${summary.averageDowntimeHours.toFixed(1)} hours`,
    ];

    if (summary.totalCost !== undefined) {
      metrics.push(`Total Cost: $${summary.totalCost.toLocaleString()}`);
    }

    pdf.setFontSize(10);
    metrics.forEach(metric => {
      pdf.text(`• ${metric}`, 20, y);
      y += 7;
    });

    // Top Insights
    if (insights.length > 0) {
      y += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Top Insights:', 15, y);
      y += 10;

      pdf.setFontSize(10);
      insights.slice(0, 5).forEach(insight => {
        // Check if we need a new page
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }

        pdf.text(`• ${insight.title}`, 20, y);
        y += 7;
      });
    }
  };

  /**
   * Wait for charts to fully render by checking for loading states
   */
  const waitForChartsToRender = async (element: HTMLElement, maxWaitTime: number = 8000): Promise<boolean> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      // Check if there are any loading skeletons or spinners
      const loadingElements = element.querySelectorAll('[class*="skeleton"], [class*="loading"], [class*="spinner"]');
      const emptyStates = element.querySelectorAll('[class*="empty-state"]');
      
      // Check if there are actual chart elements (SVG or canvas)
      const chartElements = element.querySelectorAll('svg, canvas, [class*="recharts"]');
      
      // Check if SVG elements have actual content (paths, rects, etc.)
      const svgWithContent = Array.from(element.querySelectorAll('svg')).filter(svg => {
        const hasContent = svg.querySelector('path, rect, circle, line, text');
        return hasContent !== null;
      });
      
      console.log(`Waiting for charts in ${element.id}: loading=${loadingElements.length}, charts=${chartElements.length}, svgWithContent=${svgWithContent.length}`);
      
      // If no loading elements and we have chart elements with content, we're good
      if (loadingElements.length === 0 && svgWithContent.length > 0) {
        // Wait a bit more for animations to complete
        console.log(`Charts ready in ${element.id}, waiting for animations...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
      
      // If we only have empty states and no loading, the section is empty but ready
      if (loadingElements.length === 0 && emptyStates.length > 0) {
        console.log(`Section ${element.id} has empty state, proceeding`);
        return true;
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Timeout reached, but proceed anyway
    console.warn(`Timeout waiting for charts in ${element.id}, proceeding with capture`);
    return false;
  };

  /**
   * Capture a section as canvas and add to PDF
   * Requirements: FR-4.2, FR-4.3
   */
  const captureSection = async (
    pdf: jsPDF,
    sectionId: string,
    title: string
  ): Promise<boolean> => {
    try {
      const element = document.getElementById(sectionId);
      if (!element) {
        console.warn(`Section ${sectionId} not found, skipping`);
        return false;
      }

      // Wait for charts to render (with timeout)
      console.log(`Capturing section: ${sectionId}`);
      await waitForChartsToRender(element, 8000);

      // Capture as canvas with high resolution and SVG support
      const canvas = await html2canvas(element, {
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        allowTaint: false,
        foreignObjectRendering: false, // Disable for better SVG support
        imageTimeout: 15000,
        removeContainer: true,
        onclone: (clonedDoc: Document) => {
          // Remove any loading skeletons from the cloned document
          const clonedElement = clonedDoc.getElementById(sectionId);
          if (clonedElement) {
            const loadingElements = clonedElement.querySelectorAll('[class*="skeleton"], [class*="loading"], [class*="spinner"]');
            loadingElements.forEach((el: Element) => el.remove());
            
            // Force visibility on all SVG elements
            const svgElements = clonedElement.querySelectorAll('svg');
            svgElements.forEach((svg: SVGElement) => {
              svg.style.visibility = 'visible';
              svg.style.display = 'block';
              // Ensure SVG has explicit dimensions
              if (!svg.getAttribute('width')) {
                svg.setAttribute('width', svg.getBoundingClientRect().width.toString());
              }
              if (!svg.getAttribute('height')) {
                svg.setAttribute('height', svg.getBoundingClientRect().height.toString());
              }
            });
            
            // Force visibility on Recharts containers
            const rechartsContainers = clonedElement.querySelectorAll('[class*="recharts"]');
            rechartsContainers.forEach((container: Element) => {
              (container as HTMLElement).style.visibility = 'visible';
              (container as HTMLElement).style.display = 'block';
            });
          }
        },
      } as any);

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.warn(`Failed to capture ${sectionId}, canvas is empty`);
        return false;
      }

      // Add new page
      pdf.addPage();

      // Add section title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(title, 15, 15);

      // Add chart image
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 180; // A4 width minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Handle multi-page sections if content is too tall
      let heightLeft = imgHeight;
      let position = 25; // Below title

      pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
      heightLeft -= (297 - position - 15); // A4 height minus margins

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 15;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
        heightLeft -= (297 - 15);
      }

      return true;
    } catch (err) {
      console.error(`Error capturing section ${sectionId}:`, err);
      return false;
    }
  };

  /**
   * Add page numbers and footers to all pages
   * Requirements: FR-4.2
   */
  const addPageNumbersAndFooters = (pdf: jsPDF) => {
    const pageCount = (pdf as any).internal.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(128, 128, 128);

      // Page number (center)
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // Confidentiality notice (left)
      pdf.text(
        'Confidential - Alpha Star Aviation',
        15,
        pageHeight - 10
      );

      // Generation info (right)
      pdf.text(
        'Generated by AOG Analytics System',
        pageWidth - 15,
        pageHeight - 10,
        { align: 'right' }
      );
    }
  };

  /**
   * Main PDF generation function
   * Requirements: FR-4.1
   */
  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    try {
      // Pre-check: Ensure we have data to export
      if (summary.totalEvents === 0) {
        throw new Error('No data available to export. Please adjust your filters or date range.');
      }

      // Pre-check: Wait for all sections to be present in DOM
      const requiredSections = [
        'three-bucket-section',
        'trend-analysis-section',
        'aircraft-performance-section',
        'root-cause-section',
        'cost-analysis-section',
        'predictive-section',
      ];

      const missingSections = requiredSections.filter(id => !document.getElementById(id));
      if (missingSections.length > 0) {
        console.warn('Some sections are missing:', missingSections);
        // Continue anyway, but warn user
      }

      // Wait a bit for progressive loading to complete
      setProgress(5);
      console.log('Waiting for progressive loading to complete...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Create PDF instance
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Step 1: Add cover page (10%)
      setProgress(10);
      addCoverPage(pdf);

      // Step 2: Add executive summary (20%)
      setProgress(20);
      addExecutiveSummary(pdf, summary, insights);

      // Step 3: Capture chart sections (30-90%)
      const sections = [
        { id: 'three-bucket-section', title: 'Three-Bucket Analysis' },
        { id: 'trend-analysis-section', title: 'Trend Analysis' },
        { id: 'aircraft-performance-section', title: 'Aircraft Performance' },
        { id: 'root-cause-section', title: 'Root Cause Analysis' },
        { id: 'cost-analysis-section', title: 'Cost Analysis' },
        { id: 'predictive-section', title: 'Predictive Analytics' },
      ];

      const progressPerSection = 60 / sections.length;
      let currentProgress = 30;
      let capturedCount = 0;

      for (const section of sections) {
        const captured = await captureSection(pdf, section.id, section.title);
        if (captured) {
          capturedCount++;
        }
        currentProgress += progressPerSection;
        setProgress(Math.round(currentProgress));
      }

      // Check if we captured at least some sections
      if (capturedCount === 0) {
        throw new Error('Failed to capture any chart sections. Please ensure charts are fully loaded and try again.');
      }

      // Step 4: Add page numbers and footers (95%)
      setProgress(95);
      addPageNumbersAndFooters(pdf);

      // Step 5: Save PDF (100%)
      setProgress(100);
      const timestamp = format(new Date(), 'yyyy-MM-dd');
      const defaultFilename = `aog-analytics-${timestamp}.pdf`;
      pdf.save(filename || defaultFilename);

      // Success!
      setSuccess(true);
      onSuccess?.();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setProgress(0);
      }, 3000);
    } catch (err) {
      console.error('PDF generation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'PDF export failed. Please try again.';
      setError(errorMessage);

      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExporting(false);
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
    if (isExporting) {
      return (
        <>
          <LoaderIcon />
          Exporting... {progress}%
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
                onClick={handleExport}
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
