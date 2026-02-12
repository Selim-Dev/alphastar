import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { BudgetProject, BudgetKPIs, OverspendTerm } from '@/types/budget-projects';

// PDF icon
const PDFIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="M9 15h6"/>
    <path d="M9 11h6"/>
  </svg>
);

// Spinner icon for loading state
const SpinnerIcon = () => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

interface BudgetPDFExportProps {
  project: BudgetProject;
  kpis?: BudgetKPIs;
  top5Overspend?: OverspendTerm[];
  filters?: {
    startDate?: string;
    endDate?: string;
    aircraftType?: string;
    termSearch?: string;
  };
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Budget PDF Export Component
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10
 * 
 * Features:
 * - Multi-page PDF support with A4 dimensions
 * - Professional cover page with project details
 * - KPI summary section
 * - Charts section (captured at 2x scale for high resolution)
 * - Tables section (top 5 overspend + key totals)
 * - Page numbers and footers
 * - Loading indicator during generation (10-15 seconds)
 * - WYSIWYG output (PDF matches screen display)
 */
export function BudgetPDFExport({
  project,
  kpis,
  top5Overspend = [],
  filters = {},
  variant = 'outline',
  size = 'md',
  className = '',
}: BudgetPDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Add cover page to PDF
   * Requirements: 6.1, 6.2
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
    pdf.text('Budget Analytics', pageWidth / 2, 45, { align: 'center' });
    
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Performance Report', pageWidth / 2, 60, { align: 'center' });

    // Company name
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ALPHA STAR AVIATION', pageWidth / 2, 90, { align: 'center' });

    // Content in white box
    pdf.setTextColor(0, 0, 0);
    
    // Project name
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(project.name, pageWidth / 2, 120, { align: 'center' });
    
    // Date range
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const dateRange = `${format(new Date(project.dateRange.start), 'MMM dd, yyyy')} - ${format(new Date(project.dateRange.end), 'MMM dd, yyyy')}`;
    pdf.text(dateRange, pageWidth / 2, 133, { align: 'center' });

    // Template type
    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99); // Gray-600
    pdf.text(`Template: ${project.templateType}`, pageWidth / 2, 145, { align: 'center' });

    // Filters section
    if (filters.startDate || filters.endDate || filters.aircraftType || filters.termSearch) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Applied Filters', pageWidth / 2, 165, { align: 'center' });
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99); // Gray-600
      
      let filterY = 177;
      if (filters.startDate && filters.endDate) {
        pdf.text(`Date Range: ${format(new Date(filters.startDate), 'MMM dd, yyyy')} - ${format(new Date(filters.endDate), 'MMM dd, yyyy')}`, pageWidth / 2, filterY, { align: 'center' });
        filterY += 8;
      }
      if (filters.aircraftType) {
        pdf.text(`Aircraft Type: ${filters.aircraftType}`, pageWidth / 2, filterY, { align: 'center' });
        filterY += 8;
      }
      if (filters.termSearch) {
        pdf.text(`Term Search: "${filters.termSearch}"`, pageWidth / 2, filterY, { align: 'center' });
      }
    }

    // Generation info at bottom
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128); // Gray-500
    pdf.text(`Generated: ${format(new Date(), 'MMM dd, yyyy • HH:mm')}`, pageWidth / 2, pageHeight - 25, { align: 'center' });
    
    // Footer branding
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175); // Gray-400
    pdf.text('Alpha Star Aviation Budget System', pageWidth / 2, pageHeight - 15, { align: 'center' });
  };

  /**
   * Add KPI summary page to PDF
   * Requirements: 6.3
   */
  const addKPISummary = (pdf: jsPDF, kpis: BudgetKPIs) => {
    pdf.addPage();

    // Section title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Key Performance Indicators', 15, 20);

    // Create a grid layout for KPI cards
    const cardWidth = 85;
    const cardHeight = 35;
    const cardSpacing = 5;
    const startX = 15;
    const startY = 35;

    const kpiData = [
      { label: 'Total Budgeted', value: `${project.currency} ${kpis.totalBudgeted.toLocaleString()}` },
      { label: 'Total Spent', value: `${project.currency} ${kpis.totalSpent.toLocaleString()}` },
      { label: 'Remaining Budget', value: `${project.currency} ${kpis.remainingBudget.toLocaleString()}` },
      { label: 'Budget Utilization', value: `${kpis.budgetUtilization.toFixed(1)}%` },
      { label: 'Burn Rate', value: `${project.currency} ${kpis.burnRate.toLocaleString()}/month` },
      { label: 'Forecast', value: `${kpis.forecastMonthsRemaining.toFixed(1)} months` },
    ];

    kpiData.forEach((kpi, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = startX + col * (cardWidth + cardSpacing);
      const y = startY + row * (cardHeight + cardSpacing);

      // Draw card background
      pdf.setFillColor(248, 250, 252); // Light gray background
      pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F');

      // Draw card border
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S');

      // Add label
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139); // Gray text
      pdf.text(kpi.label, x + cardWidth / 2, y + 12, { align: 'center' });

      // Add value
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(kpi.value, x + cardWidth / 2, y + 25, { align: 'center' });
    });

    // Add forecast depletion date if available
    if (kpis.forecastDepletionDate) {
      const y = startY + 3 * (cardHeight + cardSpacing);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.text(
        `Projected Depletion: ${format(new Date(kpis.forecastDepletionDate), 'MMMM dd, yyyy')}`,
        15,
        y
      );
    }
  };

  /**
   * Add top 5 overspend table to PDF
   * Requirements: 6.4, 6.5
   */
  const addTop5OverspendTable = (pdf: jsPDF, top5: OverspendTerm[]) => {
    if (top5.length === 0) return;

    pdf.addPage();

    // Section title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Top 5 Overspend Terms', 15, 20);

    // Table header
    const startY = 35;
    const rowHeight = 12;
    const colWidths = [80, 40, 40, 40];
    const startX = 15;

    // Header background
    pdf.setFillColor(37, 99, 235); // Blue-600
    pdf.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');

    // Header text
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    
    let currentX = startX;
    const headers = ['Spending Term', 'Budgeted', 'Spent', 'Variance'];
    headers.forEach((header, i) => {
      pdf.text(header, currentX + colWidths[i] / 2, startY + 8, { align: 'center' });
      currentX += colWidths[i];
    });

    // Table rows
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    top5.forEach((term, index) => {
      const y = startY + (index + 1) * rowHeight;

      // Alternating row background
      if (index % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
      }

      // Row data
      currentX = startX;
      const rowData = [
        term.termName,
        `${project.currency} ${term.budgeted.toLocaleString()}`,
        `${project.currency} ${term.spent.toLocaleString()}`,
        `${project.currency} ${term.variance.toLocaleString()}`,
      ];

      rowData.forEach((data, i) => {
        pdf.setFontSize(9);
        if (i === 0) {
          // Left-align term name
          pdf.text(data, currentX + 2, y + 8);
        } else {
          // Center-align numbers
          pdf.text(data, currentX + colWidths[i] / 2, y + 8, { align: 'center' });
        }
        currentX += colWidths[i];
      });
    });

    // Table border
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), rowHeight * (top5.length + 1), 'S');
  };

  /**
   * Wait for charts to fully render
   */
  const waitForChartsToRender = async (element: HTMLElement, maxWaitTime: number = 8000): Promise<boolean> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const loadingElements = element.querySelectorAll('[class*="skeleton"], [class*="loading"], [class*="spinner"], [class*="animate-pulse"]');
      const svgWithContent = Array.from(element.querySelectorAll('svg')).filter(svg => {
        const hasContent = svg.querySelector('path, rect, circle, line, text');
        return hasContent !== null;
      });
      
      if (loadingElements.length === 0 && svgWithContent.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    return false;
  };

  /**
   * Capture a chart section as canvas and add to PDF
   * Requirements: 6.4, 6.5, 6.6
   */
  const captureChartSection = async (
    pdf: jsPDF,
    sectionSelector: string,
    title: string
  ): Promise<boolean> => {
    try {
      const element = document.querySelector(sectionSelector) as HTMLElement;
      if (!element) {
        console.warn(`Section ${sectionSelector} not found, skipping`);
        return false;
      }

      // Scroll into view
      element.scrollIntoView({ behavior: 'instant', block: 'start' });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if element has content
      const hasContent = element.offsetHeight > 0 && element.offsetWidth > 0;
      if (!hasContent) {
        console.warn(`Section ${sectionSelector} has no content`);
        return false;
      }

      // Wait for charts to render
      await waitForChartsToRender(element, 8000);

      // Capture as canvas at 2x scale for high resolution
      const canvas = await html2canvas(element, {
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scale: 2, // 2x scale for high resolution (300 DPI equivalent)
        allowTaint: false,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        removeContainer: true,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc: Document) => {
          const clonedElement = clonedDoc.querySelector(sectionSelector) as HTMLElement;
          if (!clonedElement) return;

          // Remove loading elements
          const loadingElements = clonedElement.querySelectorAll('[class*="skeleton"], [class*="loading"], [class*="spinner"], [class*="animate-pulse"]');
          loadingElements.forEach((el: Element) => el.remove());
          
          // Force visibility on SVG elements
          const svgElements = clonedElement.querySelectorAll('svg');
          svgElements.forEach((svg: SVGElement) => {
            svg.style.visibility = 'visible';
            svg.style.display = 'block';
          });
          
          // Apply computed colors as inline styles
          const allClonedElements = clonedElement.querySelectorAll('*');
          const allOriginalElements = element.querySelectorAll('*');
          
          allClonedElements.forEach((clonedEl, index) => {
            if (index >= allOriginalElements.length) return;
            
            const originalEl = allOriginalElements[index];
            const clonedHtmlEl = clonedEl as HTMLElement;
            const computedStyle = window.getComputedStyle(originalEl);
            
            const colorProps = ['color', 'background-color', 'border-color', 'fill', 'stroke'];
            colorProps.forEach(prop => {
              const value = computedStyle.getPropertyValue(prop);
              if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent' && value !== 'none') {
                clonedHtmlEl.style.setProperty(prop, value, 'important');
              }
            });
          });
        },
      } as any);

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.warn(`Failed to capture ${sectionSelector}`);
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
      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = 180;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Handle multi-page sections if content is too tall
      let heightLeft = imgHeight;
      let position = 25;

      pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (297 - position - 15);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 15;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= (297 - 15);
      }

      return true;
    } catch (err) {
      console.error(`Error capturing section ${sectionSelector}:`, err);
      return false;
    }
  };

  /**
   * Add page numbers and footers to all pages
   * Requirements: 6.8, 6.9
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
        'Budget Analytics System',
        pageWidth - 15,
        pageHeight - 10,
        { align: 'right' }
      );
    }
  };

  /**
   * Main PDF generation function
   * Requirements: 6.7, 6.10
   */
  const generatePDF = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Wait for all charts to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create PDF instance
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // Step 1: Add cover page
      addCoverPage(pdf);

      // Step 2: Add KPI summary
      if (kpis) {
        addKPISummary(pdf, kpis);
      }

      // Step 3: Capture chart sections
      const chartSections = [
        { selector: '[data-chart="monthly-spend"]', title: 'Monthly Spend by Term' },
        { selector: '[data-chart="cumulative-spend"]', title: 'Cumulative Spend vs Budget' },
        { selector: '[data-chart="spend-distribution"]', title: 'Spend Distribution by Category' },
        { selector: '[data-chart="budgeted-vs-spent"]', title: 'Budgeted vs Spent by Aircraft Type' },
        { selector: '[data-chart="top5-overspend"]', title: 'Top 5 Overspend Terms' },
        { selector: '[data-chart="heatmap"]', title: 'Spending Heatmap' },
      ];

      let capturedCount = 0;
      for (const section of chartSections) {
        const captured = await captureChartSection(pdf, section.selector, section.title);
        if (captured) {
          capturedCount++;
        }
      }

      // Step 4: Add top 5 overspend table
      if (top5Overspend.length > 0) {
        addTop5OverspendTable(pdf, top5Overspend);
      }

      // Check if we captured at least some content
      if (capturedCount === 0 && !kpis && top5Overspend.length === 0) {
        throw new Error('No content available to export. Please ensure data is loaded and try again.');
      }

      // Step 5: Add page numbers and footers
      addPageNumbersAndFooters(pdf);

      // Step 6: Save PDF
      const timestamp = format(new Date(), 'yyyy-MM-dd');
      const filename = `${project.name.replace(/[^a-z0-9]/gi, '-')}-analytics-${timestamp}.pdf`;
      pdf.save(filename);

      console.log(`PDF saved successfully: ${filename}`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  }, [project, kpis, top5Overspend, filters]);

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

  return (
    <div className="relative">
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        title="Export Budget Analytics as PDF"
      >
        {isGenerating ? <SpinnerIcon /> : <PDFIcon />}
        {isGenerating ? 'Generating PDF...' : 'Export to PDF'}
      </button>
      {error && (
        <div className="absolute top-full mt-1 right-0 text-xs text-destructive whitespace-nowrap bg-background border border-destructive/20 rounded px-2 py-1 shadow-lg z-50">
          {error}
        </div>
      )}
    </div>
  );
}

export default BudgetPDFExport;
