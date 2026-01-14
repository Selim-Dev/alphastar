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
      // Find the main dashboard content - try multiple selectors
      let dashboardElement = document.querySelector('[data-pdf-content]') as HTMLElement;
      
      if (!dashboardElement) {
        // Fallback to finding the main content area
        dashboardElement = document.querySelector('main .space-y-6') as HTMLElement;
      }
      
      if (!dashboardElement) {
        // Another fallback - find the first space-y-6 in the main content
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
      
      // Apply PDF-friendly styles to the clone
      applyPDFStyles(clone);
      
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
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate canvas from the wrapper with type assertion for extended options
      const canvas = await html2canvas(wrapper, {
        useCORS: true,
        logging: false,
        width: 1100,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc: Document) => {
          // Strip all CSS custom properties and modern color functions from stylesheets
          stripModernColorsFromDocument(clonedDoc);
          
          // Additional styling in the cloned document
          const clonedWrapper = clonedDoc.getElementById('pdf-export-wrapper');
          if (clonedWrapper) {
            clonedWrapper.style.left = '0';
            clonedWrapper.style.position = 'relative';
            clonedWrapper.style.backgroundColor = '#ffffff';
            // Apply PDF-safe styles to the cloned content
            applyPDFStyles(clonedWrapper);
          }
        },
      } as Parameters<typeof html2canvas>[1]);

      // Remove the wrapper from DOM
      document.body.removeChild(wrapper);

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

/**
 * Strip modern color functions from all stylesheets in the document
 * This must be done before html2canvas parses the styles
 */
function stripModernColorsFromDocument(doc: Document): void {
  // Remove all stylesheets that might contain modern color functions
  const styleSheets = doc.querySelectorAll('style, link[rel="stylesheet"]');
  styleSheets.forEach(sheet => {
    if (sheet.tagName === 'STYLE') {
      // Replace modern color functions in inline styles
      let css = sheet.textContent || '';
      css = css.replace(/oklab\([^)]+\)/gi, '#64748b');
      css = css.replace(/oklch\([^)]+\)/gi, '#64748b');
      css = css.replace(/lab\([^)]+\)/gi, '#64748b');
      css = css.replace(/lch\([^)]+\)/gi, '#64748b');
      css = css.replace(/color-mix\([^)]+\)/gi, '#64748b');
      css = css.replace(/color\([^)]+\)/gi, '#64748b');
      sheet.textContent = css;
    }
  });

  // Apply inline styles to all elements to override CSS variables
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    
    // Force safe colors on all elements
    const computed = doc.defaultView?.getComputedStyle(htmlEl);
    if (computed) {
      const bgColor = computed.backgroundColor;
      const textColor = computed.color;
      const borderColor = computed.borderColor;
      
      // Check for modern color functions and replace
      if (bgColor && hasModernColorFunction(bgColor)) {
        htmlEl.style.setProperty('background-color', '#ffffff', 'important');
      }
      if (textColor && hasModernColorFunction(textColor)) {
        htmlEl.style.setProperty('color', '#1f2937', 'important');
      }
      if (borderColor && hasModernColorFunction(borderColor)) {
        htmlEl.style.setProperty('border-color', '#e2e8f0', 'important');
      }
    }
    
    // Remove CSS custom properties that might reference modern colors
    const inlineStyle = htmlEl.getAttribute('style') || '';
    if (inlineStyle.includes('var(--')) {
      const cleanedStyle = inlineStyle.replace(/var\(--[^)]+\)/g, '#64748b');
      htmlEl.setAttribute('style', cleanedStyle);
    }
  });
}

/**
 * Check if a color value contains modern color functions
 */
function hasModernColorFunction(value: string): boolean {
  return /oklab|oklch|lab\(|lch\(|color-mix|color\(/i.test(value);
}

/**
 * Convert modern color functions (oklab, oklch, etc.) to RGB fallbacks
 */
function convertModernColorToRgb(colorValue: string): string | null {
  // Handle oklab, oklch, lab, lch color functions that html2canvas doesn't support
  if (colorValue.includes('oklab') || colorValue.includes('oklch') || 
      colorValue.includes('lab(') || colorValue.includes('lch(')) {
    // Return a safe fallback - we'll determine light/dark based on context
    return null;
  }
  
  // Handle color-mix function
  if (colorValue.includes('color-mix')) {
    return null;
  }
  
  return colorValue;
}

/**
 * Apply PDF-friendly styles to the cloned element
 */
function applyPDFStyles(element: HTMLElement): void {
  // Set base styles for the container
  element.style.backgroundColor = '#ffffff';
  element.style.color = '#1f2937';
  
  // Process all child elements
  const allElements = element.querySelectorAll('*');
  
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    
    // Get computed styles safely
    let computedStyle: CSSStyleDeclaration;
    try {
      computedStyle = window.getComputedStyle(htmlEl);
    } catch {
      return;
    }
    
    // Remove buttons and interactive elements visibility
    if (htmlEl.tagName === 'BUTTON' || htmlEl.getAttribute('role') === 'button') {
      // Keep export-related buttons hidden
      if (htmlEl.textContent?.includes('Export') || htmlEl.textContent?.includes('PDF')) {
        htmlEl.style.display = 'none';
      }
    }
    
    // Fix background colors - handle modern color functions and convert dark to light
    const bgColor = computedStyle.backgroundColor;
    if (bgColor) {
      const convertedBg = convertModernColorToRgb(bgColor);
      if (convertedBg === null) {
        // Modern color function detected - use safe fallback
        htmlEl.style.backgroundColor = '#ffffff';
      } else {
        const rgb = bgColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const r = parseInt(rgb[0]);
          const g = parseInt(rgb[1]);
          const b = parseInt(rgb[2]);
          // If it's a dark background (average < 50), make it light
          if ((r + g + b) / 3 < 50) {
            htmlEl.style.backgroundColor = '#ffffff';
          }
          // If it's a very dark gray, lighten it
          if (r < 30 && g < 30 && b < 30) {
            htmlEl.style.backgroundColor = '#f8fafc';
          }
        }
      }
    }
    
    // Fix text colors - handle modern color functions and convert light to dark
    const textColor = computedStyle.color;
    if (textColor) {
      const convertedText = convertModernColorToRgb(textColor);
      if (convertedText === null) {
        // Modern color function detected - use safe fallback
        htmlEl.style.color = '#1f2937';
      } else {
        const rgb = textColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const r = parseInt(rgb[0]);
          const g = parseInt(rgb[1]);
          const b = parseInt(rgb[2]);
          // If it's light text (average > 200), make it dark
          if ((r + g + b) / 3 > 200) {
            htmlEl.style.color = '#1f2937';
          }
        }
      }
    }
    
    // Fix border colors - handle modern color functions
    const borderColor = computedStyle.borderColor;
    if (borderColor) {
      const convertedBorder = convertModernColorToRgb(borderColor);
      if (convertedBorder === null) {
        // Modern color function detected - use safe fallback
        htmlEl.style.borderColor = '#e2e8f0';
      } else if (borderColor.includes('rgb')) {
        const rgb = borderColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const r = parseInt(rgb[0]);
          const g = parseInt(rgb[1]);
          const b = parseInt(rgb[2]);
          // If it's a dark border, lighten it
          if ((r + g + b) / 3 < 50) {
            htmlEl.style.borderColor = '#e2e8f0';
          }
        }
      }
    }
    
    // Ensure cards have visible borders
    if (htmlEl.classList.contains('rounded-lg') || htmlEl.classList.contains('rounded-xl')) {
      if (!htmlEl.style.border || htmlEl.style.border === 'none') {
        htmlEl.style.border = '1px solid #e2e8f0';
      }
      htmlEl.style.backgroundColor = '#ffffff';
    }
    
    // Fix SVG colors
    if (htmlEl.tagName === 'svg' || htmlEl.closest('svg')) {
      const stroke = htmlEl.getAttribute('stroke');
      if (stroke === 'currentColor' || stroke === '#fff' || stroke === 'white') {
        htmlEl.setAttribute('stroke', '#64748b');
      }
    }
    
    // Clear any CSS custom properties that might use modern color functions
    const style = htmlEl.style;
    for (let i = 0; i < style.length; i++) {
      const prop = style[i];
      const value = style.getPropertyValue(prop);
      if (value && (value.includes('oklab') || value.includes('oklch') || 
          value.includes('color-mix') || value.includes('var(--'))) {
        // Remove problematic custom property values
        if (prop.includes('color') || prop.includes('background') || prop.includes('border')) {
          style.removeProperty(prop);
        }
      }
    }
  });
  
  // Hide specific elements that shouldn't be in PDF
  const hideSelectors = [
    '[data-no-pdf]',
    '.animate-spin',
    '[role="tooltip"]',
    '.tooltip',
  ];
  
  hideSelectors.forEach(selector => {
    element.querySelectorAll(selector).forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
  });
}

export default ExecutivePDFExport;
