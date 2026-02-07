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
      const dashboardElement = document.querySelector('[data-pdf-content]') as HTMLElement;
      
      if (!dashboardElement) {
        throw new Error('Dashboard content not found. Please refresh the page and try again.');
      }

      console.log('Dashboard element found:', dashboardElement);
      console.log('Dashboard element dimensions:', {
        width: dashboardElement.offsetWidth,
        height: dashboardElement.offsetHeight,
        scrollHeight: dashboardElement.scrollHeight
      });

      // Create a wrapper for the PDF content with white background
      const wrapper = document.createElement('div');
      wrapper.id = 'pdf-export-wrapper-dashboard';
      wrapper.style.cssText = `
        position: absolute;
        left: -99999px;
        top: 0;
        width: 1200px;
        background-color: rgb(255, 255, 255);
        padding: 40px;
        color: rgb(31, 41, 55);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 9999;
      `;

      // Add header
      const header = document.createElement('div');
      header.style.cssText = 'margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid rgb(14, 165, 233);';
      header.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="font-size: 28px; font-weight: 700; color: rgb(15, 23, 42); margin: 0 0 8px 0; letter-spacing: -0.5px;">Alpha Star Aviation</h1>
            <p style="font-size: 18px; color: rgb(100, 116, 139); margin: 0;">Executive Dashboard Summary</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 12px; color: rgb(148, 163, 184); margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Report Generated</p>
            <p style="font-size: 16px; font-weight: 600; color: rgb(30, 41, 59); margin: 0 0 4px 0;">${format(new Date(), 'MMMM d, yyyy')}</p>
            <p style="font-size: 13px; color: rgb(100, 116, 139); margin: 0;">Period: ${dateRange.startDate} to ${dateRange.endDate}</p>
          </div>
        </div>
      `;
      wrapper.appendChild(header);

      // Clone the dashboard content
      const contentClone = dashboardElement.cloneNode(true) as HTMLElement;
      
      // Remove interactive elements that shouldn't be in PDF
      const elementsToRemove = contentClone.querySelectorAll(
        'button, [role="button"], input, select, textarea, .filter-bar, [data-no-pdf]'
      );
      elementsToRemove.forEach(el => el.remove());
      
      // Apply white background to content
      contentClone.style.backgroundColor = 'rgb(255, 255, 255)';
      contentClone.style.color = 'rgb(31, 41, 55)';
      
      wrapper.appendChild(contentClone);

      // Add footer
      const footer = document.createElement('div');
      footer.style.cssText = 'margin-top: 40px; padding-top: 20px; border-top: 1px solid rgb(226, 232, 240); text-align: center;';
      footer.innerHTML = `
        <p style="font-size: 11px; color: rgb(148, 163, 184); margin: 0;">
          Alpha Star Aviation KPI Dashboard • Confidential • Generated on ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
        </p>
      `;
      wrapper.appendChild(footer);

      // Append to body
      document.body.appendChild(wrapper);
      console.log('Wrapper appended to body');

      // Wait for rendering and force reflow
      await new Promise(resolve => setTimeout(resolve, 1500));
      wrapper.offsetHeight; // Force reflow
      
      console.log('Starting canvas capture...');

      // Capture with html2canvas
      const canvas = await html2canvas(wrapper, {
        useCORS: true,
        logging: true, // Enable logging for debugging
        backgroundColor: '#ffffff',
        scale: 2,
        allowTaint: false,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        removeContainer: false, // Keep container for debugging
        width: wrapper.scrollWidth,
        height: wrapper.scrollHeight,
        windowWidth: wrapper.scrollWidth,
        windowHeight: wrapper.scrollHeight,
        onclone: (clonedDoc: Document) => {
          console.log('onclone callback triggered');
          const clonedWrapper = clonedDoc.getElementById('pdf-export-wrapper-dashboard');
          if (!clonedWrapper) {
            console.error('Cloned wrapper not found!');
            return;
          }

          console.log('Cloned wrapper found, applying fixes...');

          // Remove loading/skeleton elements
          const loadingElements = clonedWrapper.querySelectorAll(
            '[class*="skeleton"], [class*="loading"], [class*="spinner"], [class*="animate-pulse"], [class*="animate-spin"]'
          );
          loadingElements.forEach(el => el.remove());
          console.log(`Removed ${loadingElements.length} loading elements`);

          // Force visibility on all elements
          const allElements = clonedWrapper.querySelectorAll('*');
          allElements.forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.visibility = 'visible';
            htmlEl.style.opacity = '1';
            
            // Force display for hidden elements
            if (htmlEl.style.display === 'none') {
              htmlEl.style.display = 'block';
            }
          });

          // Special handling for SVG elements
          const svgElements = clonedWrapper.querySelectorAll('svg');
          svgElements.forEach((svg: SVGElement) => {
            svg.style.visibility = 'visible';
            svg.style.display = 'block';
            svg.style.opacity = '1';
          });
          console.log(`Processed ${svgElements.length} SVG elements`);

          // CRITICAL: Force bar chart rectangles to use solid colors instead of gradients
          // html2canvas has issues with SVG gradient references
          try {
            const barRects = clonedWrapper.querySelectorAll('rect[fill*="url(#barGradient"]');
            console.log(`Found ${barRects.length} bar chart rectangles with gradients`);
            
            barRects.forEach((rect: Element) => {
              const rectEl = rect as SVGRectElement;
              const fillAttr = rectEl.getAttribute('fill');
              
              // Extract gradient ID and map to solid color
              if (fillAttr?.includes('barGradient-flightHours')) {
                rectEl.setAttribute('fill', '#3b82f6'); // Blue for flight hours
                console.log('Fixed flightHours bar color');
              } else if (fillAttr?.includes('barGradient-cycles')) {
                rectEl.setAttribute('fill', '#8b5cf6'); // Purple for cycles
                console.log('Fixed cycles bar color');
              }
              
              // Ensure visibility
              rectEl.style.visibility = 'visible';
              rectEl.style.opacity = '1';
            });
          } catch (barError) {
            console.error('Error fixing bar chart colors:', barError);
            // Continue anyway - don't fail the entire PDF generation
          }

          // Force visibility on Recharts containers
          const rechartsContainers = clonedWrapper.querySelectorAll('[class*="recharts"]');
          rechartsContainers.forEach((container: Element) => {
            const htmlContainer = container as HTMLElement;
            htmlContainer.style.visibility = 'visible';
            htmlContainer.style.display = 'block';
            htmlContainer.style.opacity = '1';
          });
          console.log(`Processed ${rechartsContainers.length} Recharts containers`);

          // Apply computed colors as inline styles
          const originalWrapper = document.getElementById('pdf-export-wrapper-dashboard');
          if (originalWrapper) {
            const originalElements = originalWrapper.querySelectorAll('*');
            const clonedElements = clonedWrapper.querySelectorAll('*');
            
            clonedElements.forEach((clonedEl, index) => {
              if (index >= originalElements.length) return;
              
              const originalEl = originalElements[index];
              const clonedHtmlEl = clonedEl as HTMLElement;
              const computedStyle = window.getComputedStyle(originalEl);
              
              // Apply color properties
              const colorProps = ['color', 'background-color', 'border-color'];
              colorProps.forEach(prop => {
                const value = computedStyle.getPropertyValue(prop);
                if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
                  clonedHtmlEl.style.setProperty(prop, value, 'important');
                }
              });
              
              // SVG-specific properties
              if (clonedEl.tagName.toLowerCase() === 'svg' || 
                  clonedEl.tagName.toLowerCase() === 'path' ||
                  clonedEl.tagName.toLowerCase() === 'circle' ||
                  clonedEl.tagName.toLowerCase() === 'rect') {
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
            console.log(`Applied computed colors to ${clonedElements.length} elements`);
          }

          // Ensure wrapper has white background
          clonedWrapper.style.backgroundColor = 'rgb(255, 255, 255)';
          clonedWrapper.style.color = 'rgb(31, 41, 55)';
        },
      });

      console.log('Canvas captured:', {
        width: canvas.width,
        height: canvas.height,
        isEmpty: canvas.width === 0 || canvas.height === 0
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Failed to capture dashboard content - canvas is empty');
      }

      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png', 1.0);
      console.log('Image data generated, length:', imgData.length);
      
      // Check if image data is valid (not just a blank white image)
      if (imgData.length < 1000) {
        console.error('Image data too small, likely blank');
        throw new Error('Generated image appears to be blank');
      }

      // Remove wrapper
      document.body.removeChild(wrapper);
      console.log('Wrapper removed from DOM');

      // Create PDF with proper dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      console.log('PDF page dimensions:', { pdfWidth, pdfHeight });

      // Calculate image dimensions to fit PDF width
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      console.log('Image dimensions in PDF:', { imgWidth, imgHeight });

      // Add image to PDF, splitting across multiple pages if needed
      let heightLeft = imgHeight;
      let position = 0;
      let pageNumber = 1;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      console.log(`Added page ${pageNumber}`);
      heightLeft -= pdfHeight;

      // Add additional pages if content is taller than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pageNumber++;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        console.log(`Added page ${pageNumber}`);
        heightLeft -= pdfHeight;
      }

      // Save PDF
      const filename = `AlphaStar-Executive-Summary-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(filename);
      
      console.log(`PDF saved successfully: ${filename} (${pageNumber} pages)`);

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
