import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

interface ExecutivePDFExportProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ExecutivePDFExport({
  dateRange,
  variant = 'outline',
  size = 'md',
  className = '',
}: ExecutivePDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Find the main dashboard content
      let dashboardElement = document.querySelector('[data-pdf-content]') as HTMLElement;
      
      if (!dashboardElement) {
        dashboardElement = document.querySelector('main .space-y-6') as HTMLElement;
      }
      
      if (!dashboardElement) {
        dashboardElement = document.querySelector('.space-y-6') as HTMLElement;
      }
      
      if (!dashboardElement) {
        throw new Error('Dashboard content not found. Please refresh the page and try again.');
      }

      // Create a wrapper for the PDF content
      const wrapper = document.createElement('div');
      wrapper.id = 'pdf-export-wrapper';
      wrapper.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 1100px;
        background: #ffffff;
        padding: 30px;
        color: #1f2937;
        font-family: system-ui, -apple-system, sans-serif;
        z-index: -1;
      `;

      // Add header with logo and title
      const header = document.createElement('div');
      header.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #0ea5e9;">
          <div>
            <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; letter-spacing: -0.5px;">Alpha Star Aviation</h1>
            <p style="font-size: 16px; color: #64748b; margin: 4px 0 0 0;">Executive Dashboard Summary</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Report Generated</p>
            <p style="font-size: 14px; font-weight: 600; color: #1e293b; margin: 4px 0 0 0;">${format(new Date(), 'MMMM d, yyyy')}</p>
            <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Period: ${dateRange.startDate} to ${dateRange.endDate}</p>
          </div>
        </div>
      `;
      wrapper.appendChild(header);

      // Clone the dashboard content
      const clone = dashboardElement.cloneNode(true) as HTMLElement;
      wrapper.appendChild(clone);

      // Add footer
      const footer = document.createElement('div');
      footer.innerHTML = `
        <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="font-size: 10px; color: #94a3b8; margin: 0;">
            Alpha Star Aviation KPI Dashboard • Confidential • Generated on ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
          </p>
        </div>
      `;
      wrapper.appendChild(footer);

      document.body.appendChild(wrapper);

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force reflow
      wrapper.offsetHeight;

      // CRITICAL: Strip OKLAB/OKLCH from stylesheets AND inline styles BEFORE html2canvas
      // Step 1: Process all <style> tags in the document to remove OKLAB/OKLCH
      const styleElements = document.querySelectorAll('style');
      const originalStyles: Array<{ element: HTMLStyleElement; content: string }> = [];
      
      styleElements.forEach((styleEl) => {
        const originalContent = styleEl.textContent || '';
        originalStyles.push({ element: styleEl, content: originalContent });
        
        // Replace OKLAB/OKLCH with safe RGB fallbacks
        let cleanedContent = originalContent;
        cleanedContent = cleanedContent.replace(/oklab\([^)]+\)/gi, '#64748b');
        cleanedContent = cleanedContent.replace(/oklch\([^)]+\)/gi, '#64748b');
        cleanedContent = cleanedContent.replace(/color\(display-p3[^)]+\)/gi, '#64748b');
        
        styleEl.textContent = cleanedContent;
      });

      // Step 2: Set inline styles on wrapper elements to override any remaining OKLAB
      const allElements = wrapper.querySelectorAll('*');
      allElements.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        const computedStyle = window.getComputedStyle(htmlEl);
        
        // Check and fix color properties that might use oklab/oklch
        const colorProps = [
          'color', 
          'backgroundColor', 
          'borderColor', 
          'borderTopColor', 
          'borderRightColor', 
          'borderBottomColor', 
          'borderLeftColor',
        ];
        
        colorProps.forEach(prop => {
          const value = computedStyle.getPropertyValue(prop);
          if (value && (value.includes('oklab') || value.includes('oklch') || value.includes('color(display-p3'))) {
            // Set inline style with safe fallback to override computed style
            const fallbackColor = prop.includes('background') ? '#ffffff' : 
                                prop.includes('border') ? '#e2e8f0' : '#1f2937';
            htmlEl.style.setProperty(prop, fallbackColor, 'important');
          }
        });
        
        // Handle SVG elements separately
        if (htmlEl.tagName === 'svg' || htmlEl.tagName === 'path' || htmlEl.tagName === 'circle' || htmlEl.tagName === 'rect') {
          const fill = htmlEl.getAttribute('fill');
          const stroke = htmlEl.getAttribute('stroke');
          
          if (fill && (fill.includes('oklab') || fill.includes('oklch'))) {
            htmlEl.setAttribute('fill', '#64748b');
          }
          if (stroke && (stroke.includes('oklab') || stroke.includes('oklch'))) {
            htmlEl.setAttribute('stroke', '#64748b');
          }
        }
      });

      // Generate canvas - simplified approach matching AOG Analytics
      const canvas = await html2canvas(wrapper, {
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scale: 2,
        allowTaint: false,
        foreignObjectRendering: false, // Critical: prevents gradient and OKLCH issues
        imageTimeout: 15000,
        removeContainer: true,
        onclone: (clonedDoc: Document) => {
          const clonedWrapper = clonedDoc.getElementById('pdf-export-wrapper');
          if (clonedWrapper) {
            // Remove loading elements
            const loadingElements = clonedWrapper.querySelectorAll('[class*="skeleton"], [class*="loading"], [class*="spinner"], [class*="animate-pulse"]');
            loadingElements.forEach((el: Element) => el.remove());
            
            // Force visibility on SVG elements
            const svgElements = clonedWrapper.querySelectorAll('svg');
            svgElements.forEach((svg: SVGElement) => {
              svg.style.visibility = 'visible';
              svg.style.display = 'block';
              // Ensure SVG has explicit dimensions
              if (!svg.getAttribute('width')) {
                const rect = svg.getBoundingClientRect();
                if (rect.width) svg.setAttribute('width', rect.width.toString());
              }
              if (!svg.getAttribute('height')) {
                const rect = svg.getBoundingClientRect();
                if (rect.height) svg.setAttribute('height', rect.height.toString());
              }
            });
            
            // Force visibility on Recharts containers
            const rechartsContainers = clonedWrapper.querySelectorAll('[class*="recharts"]');
            rechartsContainers.forEach((container: Element) => {
              (container as HTMLElement).style.visibility = 'visible';
              (container as HTMLElement).style.display = 'block';
            });
            
            // FIX: Convert modern CSS color functions (oklab, oklch) to RGB
            // html2canvas doesn't support these modern color spaces
            const allElements = clonedWrapper.querySelectorAll('*');
            allElements.forEach((el: Element) => {
              const htmlEl = el as HTMLElement;
              const computedStyle = window.getComputedStyle(el);
              
              // Convert color properties that might use oklab/oklch
              const colorProps = [
                'color', 
                'backgroundColor', 
                'borderColor', 
                'borderTopColor', 
                'borderRightColor', 
                'borderBottomColor', 
                'borderLeftColor',
                'fill',
                'stroke'
              ];
              
              colorProps.forEach(prop => {
                const value = computedStyle.getPropertyValue(prop);
                if (value && (value.includes('oklab') || value.includes('oklch') || value.includes('color(display-p3'))) {
                  // For SVG attributes, set directly
                  if (prop === 'fill' || prop === 'stroke') {
                    htmlEl.setAttribute(prop, '#64748b'); // Safe fallback color
                  } else {
                    // For CSS properties, set inline style with safe fallback
                    const fallbackColor = prop.includes('background') ? '#ffffff' : 
                                        prop.includes('border') ? '#e2e8f0' : '#1f2937';
                    htmlEl.style.setProperty(prop, fallbackColor, 'important');
                  }
                }
              });
            });
            
            // Remove any elements marked as no-pdf
            const noPdfElements = clonedWrapper.querySelectorAll('[data-no-pdf="true"]');
            noPdfElements.forEach((el: Element) => el.remove());
            
            // Ensure all text is visible
            clonedWrapper.style.color = '#1f2937';
            clonedWrapper.style.backgroundColor = '#ffffff';
          }
        },
      } as any);

      // Remove the wrapper from DOM
      document.body.removeChild(wrapper);

      // Restore original stylesheets
      originalStyles.forEach(({ element, content }) => {
        element.textContent = content;
      });

      // Calculate PDF dimensions (A4 format)
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let heightLeft = imgHeight;
      let position = 0;
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with date
      const filename = `AlphaStar-Executive-Summary-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      
      // Download the PDF
      pdf.save(filename);

    } catch (err) {
      console.error('PDF generation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  }, [dateRange]);

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
        title="Export Executive Summary as PDF"
      >
        {isGenerating ? <SpinnerIcon /> : <PDFIcon />}
        {isGenerating ? 'Generating...' : 'PDF Report'}
      </button>
      {error && (
        <div className="absolute top-full mt-1 right-0 text-xs text-destructive whitespace-nowrap bg-background border border-destructive/20 rounded px-2 py-1 shadow-lg z-50">
          {error}
        </div>
      )}
    </div>
  );
}

export default ExecutivePDFExport;
