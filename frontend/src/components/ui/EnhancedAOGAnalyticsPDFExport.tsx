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
 * - Multi-page PDF support with 10+ sections
 * - Professional cover page with branding
 * - Executive summary with key metrics, insights, AND summary statistics (combined on Page 2)
 * - High-resolution chart capture (2x scale, 300 DPI)
 * - Page numbers and footers on all pages
 * - Progress indicator during generation
 * - Proper error handling and retry logic
 * - Comprehensive analytics coverage:
 *   1. Cover Page
 *   2. Executive Summary + Summary Statistics (combined)
 *   3. Three-Bucket Summary Cards
 *   4. Three-Bucket Breakdown Charts
 *   5. Three-Bucket Visualizations (Trend & Waterfall)
 *   6. Per-Aircraft Breakdown Table
 *   7. Trend Analysis (Monthly, Moving Average, YoY)
 *   8. Aircraft Performance (Heatmap & Reliability)
 *   9. Root Cause Analysis (Pareto, Category, Responsibility)
 *   10. Cost Analysis (Breakdown & Efficiency)
 *   11. Predictive Analytics (Forecast, Risk, Insights)
 *   12. Recent Events Timeline
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

    // Modern gradient background (simulated with rectangles)
    pdf.setFillColor(37, 99, 235); // Blue-600
    pdf.rect(0, 0, pageWidth, 80, 'F');
    
    pdf.setFillColor(59, 130, 246); // Blue-500
    pdf.rect(0, 80, pageWidth, 40, 'F');

    // White content area
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(15, 100, pageWidth - 30, pageHeight - 130, 3, 3, 'F');

    // Title with white text on blue background
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AOG Analytics', pageWidth / 2, 45, { align: 'center' });
    
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Performance Report', pageWidth / 2, 60, { align: 'center' });

    // Company name
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ALPHA STAR AVIATION', pageWidth / 2, 90, { align: 'center' });

    // Content in white box
    pdf.setTextColor(0, 0, 0);
    
    // Date range with icon-like bullet
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Report Period', pageWidth / 2, 125, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const dateRange = filters.dateRange.startDate && filters.dateRange.endDate
      ? `${format(new Date(filters.dateRange.startDate), 'MMM dd, yyyy')} - ${format(new Date(filters.dateRange.endDate), 'MMM dd, yyyy')}`
      : 'All Time';
    pdf.text(dateRange, pageWidth / 2, 138, { align: 'center' });

    // Filters section
    if (filters.fleetFilter || filters.aircraftFilter) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Applied Filters', pageWidth / 2, 160, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99); // Gray-600
      
      let filterY = 172;
      if (filters.fleetFilter) {
        pdf.text(`Fleet: ${filters.fleetFilter}`, pageWidth / 2, filterY, { align: 'center' });
        filterY += 10;
      }
      if (filters.aircraftFilter) {
        pdf.text(`Aircraft: ${filters.aircraftFilter}`, pageWidth / 2, filterY, { align: 'center' });
      }
    }

    // Generation info at bottom
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128); // Gray-500
    pdf.text(`Generated: ${format(new Date(), 'MMM dd, yyyy • HH:mm')}`, pageWidth / 2, pageHeight - 25, { align: 'center' });
    
    // Footer branding
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175); // Gray-400
    pdf.text('Alpha Star Aviation KPI Dashboard', pageWidth / 2, pageHeight - 15, { align: 'center' });
  };

  /**
   * Add executive summary page with summary statistics to PDF
   * Requirements: FR-4.2
   */
  const addExecutiveSummary = (pdf: jsPDF, summary: SummaryData, insights: Insight[]) => {
      pdf.addPage();

      // Section title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Executive Summary', 15, 20);

      // Key Metrics in a more compact format
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      let y = 35;
      pdf.text('Key Metrics:', 15, y);
      y += 8;

      const metrics = [
        `Total Events: ${summary.totalEvents}`,
        `Active AOG: ${summary.activeEvents}`,
        `Total Downtime: ${summary.totalDowntimeHours.toFixed(1)} hours`,
        `Average Downtime: ${summary.averageDowntimeHours.toFixed(1)} hours`,
      ];

      if (summary.totalCost !== undefined) {
        metrics.push(`Total Cost: ${summary.totalCost.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}`);
      }

      pdf.setFontSize(10);
      metrics.forEach(metric => {
        pdf.text(`• ${metric}`, 20, y);
        y += 6;
      });

      // Top Insights (limited to 3 for space)
      if (insights.length > 0) {
        y += 8;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Top Insights:', 15, y);
        y += 8;

        pdf.setFontSize(9);
        insights.slice(0, 3).forEach(insight => {
          // Check if we need to move to summary statistics section
          if (y > 110) {
            return; // Stop adding insights if we're running out of space
          }

          pdf.text(`• ${insight.title}`, 20, y);
          y += 6;
        });
      }

      // Add separator line
      y += 10;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, y, 195, y);
      y += 10;

      // Summary Statistics Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Summary Statistics', 15, y);
      y += 10;

      // Create a grid layout for statistics cards
      const cardWidth = 35;
      const cardHeight = 25;
      const cardSpacing = 2;
      const startX = 15;
      let currentX = startX;
      let currentY = y;

      const stats = [
        { label: 'Total Events', value: summary.totalEvents.toLocaleString() },
        { label: 'Active AOG', value: summary.activeEvents.toLocaleString() },
        { label: 'Total Downtime', value: `${summary.totalDowntimeHours.toFixed(1)} hrs` },
        { label: 'Avg Downtime', value: `${summary.averageDowntimeHours.toFixed(1)} hrs` },
        { label: 'Total Cost', value: summary.totalCost !== undefined ? `${(summary.totalCost / 1000).toFixed(0)}K` : 'N/A' },
      ];

      stats.forEach((stat, index) => {
        // Draw card background
        pdf.setFillColor(248, 250, 252); // Light gray background
        pdf.roundedRect(currentX, currentY, cardWidth, cardHeight, 2, 2, 'F');

        // Draw card border
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(currentX, currentY, cardWidth, cardHeight, 2, 2, 'S');

        // Add label
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139); // Gray text
        pdf.text(stat.label, currentX + cardWidth / 2, currentY + 8, { align: 'center' });

        // Add value
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(stat.value, currentX + cardWidth / 2, currentY + 18, { align: 'center' });

        // Move to next position
        currentX += cardWidth + cardSpacing;

        // Move to next row after 5 cards
        if ((index + 1) % 5 === 0) {
          currentX = startX;
          currentY += cardHeight + cardSpacing;
        }
      });
    }

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
      // const chartElements = element.querySelectorAll('svg, canvas, [class*="recharts"]');
      
      // Check if SVG elements have actual content (paths, rects, etc.)
      const svgWithContent = Array.from(element.querySelectorAll('svg')).filter(svg => {
        const hasContent = svg.querySelector('path, rect, circle, line, text');
        return hasContent !== null;
      });
      
      // If no loading elements and we have chart elements with content, we're good
      if (loadingElements.length === 0 && svgWithContent.length > 0) {
        // Wait a bit more for animations to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
      
      // If we only have empty states and no loading, the section is empty but ready
      if (loadingElements.length === 0 && emptyStates.length > 0) {
        return true;
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Timeout reached, but proceed anyway
    return false;
  };

  /**
   * Capture a section as canvas and add to PDF
   * Requirements: FR-4.2, FR-4.3
   * 
   * CRITICAL FIX: Handles oklab/oklch colors by applying computed RGB values as inline styles
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

      // Scroll the element into view to ensure it's rendered
      element.scrollIntoView({ behavior: 'instant', block: 'start' });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if element has content
      const hasContent = element.offsetHeight > 0 && element.offsetWidth > 0;
      if (!hasContent) {
        console.warn(`Section ${sectionId} has no content`);
        return false;
      }

      // Wait for charts to render
      await waitForChartsToRender(element, 8000);

      // CRITICAL FIX: Inject CSS to override any oklab/oklch colors
      // Create a temporary style element that forces all colors to their computed RGB values
      const tempStyleId = `pdf-export-color-fix-${sectionId}`;
      const tempStyle = document.createElement('style');
      tempStyle.id = tempStyleId;
      
      // Build CSS rules for all elements with oklab/oklch colors
      let cssRules = '';
      const allElements = element.querySelectorAll('*');
      allElements.forEach((el, index) => {
        const computedStyle = window.getComputedStyle(el);
        const colorProps = ['color', 'background-color', 'border-color', 'fill', 'stroke'];
        
        let hasModernColor = false;
        let rules = '';
        
        colorProps.forEach(prop => {
          const value = computedStyle.getPropertyValue(prop);
          if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent' && value !== 'none') {
            rules += `${prop}: ${value} !important; `;
            hasModernColor = true;
          }
        });
        
        if (hasModernColor) {
          // Add a unique class to this element
          el.classList.add(`pdf-color-fix-${index}`);
          cssRules += `.pdf-color-fix-${index} { ${rules} }\n`;
        }
      });
      
      tempStyle.textContent = cssRules;
      document.head.appendChild(tempStyle);

      // Capture as canvas with proper color handling
      const canvas = await html2canvas(element, {
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        foreignObjectRendering: false, // Keep false for SVG support
        imageTimeout: 15000,
        removeContainer: true,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc: Document) => {
          const clonedElement = clonedDoc.getElementById(sectionId);
          if (!clonedElement) return;

          // Remove loading elements
          const loadingElements = clonedElement.querySelectorAll('[class*="skeleton"], [class*="loading"], [class*="spinner"]');
          loadingElements.forEach((el: Element) => el.remove());
          
          // Force visibility on SVG elements
          const svgElements = clonedElement.querySelectorAll('svg');
          svgElements.forEach((svg: SVGElement) => {
            svg.style.visibility = 'visible';
            svg.style.display = 'block';
          });
          
          // Force visibility on Recharts containers
          const rechartsContainers = clonedElement.querySelectorAll('[class*="recharts"]');
          rechartsContainers.forEach((container: Element) => {
            (container as HTMLElement).style.visibility = 'visible';
            (container as HTMLElement).style.display = 'block';
          });
          
          // CRITICAL FIX: Apply computed RGB colors as inline styles
          // This overrides any oklab/oklch colors from stylesheets
          const allClonedElements = clonedElement.querySelectorAll('*');
          const allOriginalElements = element.querySelectorAll('*');
          
          // Map cloned elements to original elements by index
          allClonedElements.forEach((clonedEl, index) => {
            if (index >= allOriginalElements.length) return;
            
            const originalEl = allOriginalElements[index];
            const clonedHtmlEl = clonedEl as HTMLElement;
            const computedStyle = window.getComputedStyle(originalEl);
            
            // Apply ONLY color properties as inline styles with !important
            // This overrides stylesheet colors while preserving other styles
            const colorProps = [
              'color',
              'background-color',
              'border-color',
              'border-top-color',
              'border-right-color',
              'border-bottom-color',
              'border-left-color',
            ];
            
            colorProps.forEach(prop => {
              const value = computedStyle.getPropertyValue(prop);
              if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent' && value !== 'none') {
                clonedHtmlEl.style.setProperty(prop, value, 'important');
              }
            });
            
            // Special handling for SVG elements (fill and stroke)
            if (clonedEl.tagName.toLowerCase() === 'svg' || 
                clonedEl.tagName.toLowerCase() === 'path' ||
                clonedEl.tagName.toLowerCase() === 'circle' ||
                clonedEl.tagName.toLowerCase() === 'rect' ||
                clonedEl.tagName.toLowerCase() === 'line') {
              const fill = computedStyle.getPropertyValue('fill');
              const stroke = computedStyle.getPropertyValue('stroke');
              
              if (fill && fill !== 'none') {
                clonedHtmlEl.style.setProperty('fill', fill, 'important');
              }
              if (stroke && stroke !== 'none') {
                clonedHtmlEl.style.setProperty('stroke', stroke, 'important');
              }
            }
          });
        },
      } as any);

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.warn(`Failed to capture ${sectionId}`);
        // Clean up temporary style
        const tempStyleEl = document.getElementById(tempStyleId);
        if (tempStyleEl) tempStyleEl.remove();
        return false;
      }

      // Clean up temporary style and classes
      const tempStyleEl = document.getElementById(tempStyleId);
      if (tempStyleEl) tempStyleEl.remove();
      allElements.forEach((el, index) => {
        el.classList.remove(`pdf-color-fix-${index}`);
      });

      // Add new page
      pdf.addPage();

      // Add section title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(title, 15, 15);

      // Add chart image
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 180;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Handle multi-page sections if content is too tall
      let heightLeft = imgHeight;
      let position = 25;

      pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
      heightLeft -= (297 - position - 15);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 15;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
        heightLeft -= (297 - 15);
      }

      return true;
    } catch (err) {
      console.error(`Error capturing section ${sectionId}:`, err);
      // Clean up on error
      const tempStyleEl = document.getElementById(`pdf-export-color-fix-${sectionId}`);
      if (tempStyleEl) tempStyleEl.remove();
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
      // Wait for progressive loading to complete
      setProgress(5);
      await new Promise(resolve => setTimeout(resolve, 5000));

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
        { id: 'bucket-summary-cards-section', title: 'Three-Bucket Summary' },
        { id: 'three-bucket-chart-section', title: 'Three-Bucket Breakdown' },
        { id: 'three-bucket-section', title: 'Three-Bucket Visualizations' },
        { id: 'aircraft-breakdown-section', title: 'Per-Aircraft Breakdown' },
        { id: 'trend-analysis-section', title: 'Trend Analysis' },
        { id: 'aircraft-performance-section', title: 'Aircraft Performance' },
        { id: 'root-cause-section-part1', title: 'Root Cause Analysis - Part 1' },
        { id: 'root-cause-section-part2', title: 'Root Cause Analysis - Part 2' },
        { id: 'cost-analysis-section', title: 'Cost Analysis' },
        { id: 'predictive-section-without-forecast', title: 'Predictive Analytics' },
        { id: 'forecast-and-timeline-section', title: 'Forecast & Recent Events' },
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
