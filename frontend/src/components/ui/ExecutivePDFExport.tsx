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
      
      // Add CSS for page break control
      const style = document.createElement('style');
      style.textContent = `
        #pdf-export-wrapper * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* Prevent page breaks inside these elements */
        #pdf-export-wrapper .recharts-wrapper,
        #pdf-export-wrapper [class*="Chart"],
        #pdf-export-wrapper .grid,
        #pdf-export-wrapper section,
        #pdf-export-wrapper [class*="card"] {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Add spacing to help with page breaks */
        #pdf-export-wrapper > * {
          margin-bottom: 16px;
        }
        
        /* Specific handling for trend charts */
        #pdf-export-wrapper [class*="trend"],
        #pdf-export-wrapper [class*="performance"] {
          page-break-before: auto;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-top: 24px;
        }
      `;
      wrapper.appendChild(style);

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
      
      // Add page break hints to prevent content splitting
      addPageBreakHints(clone);
      
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

      // Wait for rendering and ensure all charts are loaded
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force reflow to ensure all styles are computed
      wrapper.offsetHeight;

      // Generate canvas from the wrapper with type assertion for extended options
      const canvas = await html2canvas(wrapper, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 1100,
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        removeContainer: false,
        imageTimeout: 0,
        onclone: (clonedDoc: Document) => {
          // Strip all CSS custom properties and modern color functions from stylesheets
          stripModernColorsFromDocument(clonedDoc);
          
          // Additional styling in the cloned document
          const clonedWrapper = clonedDoc.getElementById('pdf-export-wrapper');
          if (clonedWrapper) {
            clonedWrapper.style.left = '0';
            clonedWrapper.style.position = 'relative';
            clonedWrapper.style.backgroundColor = '#ffffff';
            clonedWrapper.style.color = '#1f2937';
            
            // Apply PDF-safe styles to the cloned content
            applyPDFStyles(clonedWrapper);
            
            // Sanitize SVG gradients to prevent non-finite values
            sanitizeSVGGradients(clonedWrapper);
            
            // Force all text to be visible
            const allText = clonedWrapper.querySelectorAll('*');
            allText.forEach(el => {
              const htmlEl = el as HTMLElement;
              const computed = clonedDoc.defaultView?.getComputedStyle(htmlEl);
              if (computed) {
                // Ensure text is visible
                if (computed.color && computed.color.includes('rgb')) {
                  const rgb = computed.color.match(/\d+/g);
                  if (rgb && rgb.length >= 3) {
                    const avg = (parseInt(rgb[0]) + parseInt(rgb[1]) + parseInt(rgb[2])) / 3;
                    if (avg > 200) {
                      htmlEl.style.color = '#1f2937';
                    }
                  }
                }
              }
            });
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
 * Add page break hints to prevent content from being split across pages
 * This ensures charts and sections stay together
 */
function addPageBreakHints(element: HTMLElement): void {
  // A4 page height in pixels at 96 DPI (approximate)
  const pageHeightPx = 1123; // 297mm at 96 DPI
  const marginPx = 113; // 30mm margins
  const usablePageHeight = pageHeightPx - (marginPx * 2);
  
  // Find all major sections that should not be split
  const sectionsToKeepTogether = [
    // Chart containers
    '.recharts-wrapper',
    '[class*="Chart"]',
    // Card groups
    '.grid',
    // Specific sections
    '[class*="trend"]',
    '[class*="performance"]',
    '[class*="comparison"]',
    '[class*="forecast"]',
    '[class*="efficiency"]',
    // Any section with a title
    'section',
    // Collapsible sections
    '[class*="collapsible"]',
  ];
  
  // Process each major section
  const allSections = element.querySelectorAll(sectionsToKeepTogether.join(', '));
  allSections.forEach((section, index) => {
    const htmlSection = section as HTMLElement;
    
    // Skip if already processed or nested
    if (htmlSection.dataset.pageBreakProcessed) return;
    htmlSection.dataset.pageBreakProcessed = 'true';
    
    // Get section height
    const sectionHeight = htmlSection.offsetHeight;
    const sectionTop = htmlSection.offsetTop;
    
    // Calculate position in current page
    const positionInPage = sectionTop % usablePageHeight;
    
    // If section would be split across pages, push it to next page
    if (positionInPage + sectionHeight > usablePageHeight && sectionHeight < usablePageHeight) {
      const spacingNeeded = usablePageHeight - positionInPage;
      
      // Add margin to push to next page
      const currentMarginTop = parseInt(window.getComputedStyle(htmlSection).marginTop) || 0;
      htmlSection.style.marginTop = `${currentMarginTop + spacingNeeded + 20}px`;
      
      console.log(`[PDF] Pushing section ${index} to next page (height: ${sectionHeight}px, would split at: ${positionInPage}px)`);
    }
    
    // Add CSS properties to keep content together
    htmlSection.style.pageBreakInside = 'avoid';
    htmlSection.style.breakInside = 'avoid';
    
    // For very tall sections, allow breaks but try to avoid
    if (sectionHeight > usablePageHeight * 0.8) {
      htmlSection.style.pageBreakInside = 'auto';
    }
  });
  
  // Specifically handle chart containers with titles
  const chartContainers = element.querySelectorAll('.recharts-wrapper, [class*="Chart"]');
  chartContainers.forEach(chart => {
    const htmlChart = chart as HTMLElement;
    const parent = htmlChart.parentElement;
    
    if (parent) {
      // Ensure the parent container also stays together
      parent.style.pageBreakInside = 'avoid';
      parent.style.breakInside = 'avoid';
      
      // Look for a title element before the chart
      const prevSibling = parent.previousElementSibling;
      if (prevSibling && (prevSibling.tagName === 'H2' || prevSibling.tagName === 'H3')) {
        // Keep title with chart
        (prevSibling as HTMLElement).style.pageBreakAfter = 'avoid';
        (prevSibling as HTMLElement).style.breakAfter = 'avoid';
      }
    }
  });
  
  // Handle grid layouts - keep rows together
  const grids = element.querySelectorAll('.grid, [class*="grid"]');
  grids.forEach(grid => {
    const htmlGrid = grid as HTMLElement;
    htmlGrid.style.pageBreakInside = 'avoid';
    htmlGrid.style.breakInside = 'avoid';
    
    // Add spacing between grid items
    const gridItems = htmlGrid.children;
    Array.from(gridItems).forEach((item) => {
      const htmlItem = item as HTMLElement;
      htmlItem.style.pageBreakInside = 'avoid';
      htmlItem.style.breakInside = 'avoid';
    });
  });
}

/**
 * Strip modern color functions from all stylesheets in the document
 * This must be done before html2canvas parses the styles
 */
function stripModernColorsFromDocument(doc: Document): void {
  // Create a comprehensive color mapping for safe PDF colors
  const colorMap: Record<string, string> = {
    // Primary colors
    'primary': '#0f172a',
    'primary-foreground': '#f8fafc',
    // Background colors
    'background': '#ffffff',
    'foreground': '#0f172a',
    // Card colors
    'card': '#ffffff',
    'card-foreground': '#0f172a',
    // Muted colors
    'muted': '#f1f5f9',
    'muted-foreground': '#64748b',
    // Border colors
    'border': '#e2e8f0',
    'input': '#e2e8f0',
    'ring': '#0891b2',
    // Aviation colors
    'aviation': '#0891b2',
    'aviation-foreground': '#ffffff',
    // Semantic colors
    'destructive': '#dc2626',
    'destructive-foreground': '#ffffff',
    'success': '#16a34a',
    'warning': '#ea580c',
    'info': '#0284c7',
    // Popover
    'popover': '#ffffff',
    'popover-foreground': '#0f172a',
    // Accent
    'accent': '#f1f5f9',
    'accent-foreground': '#0f172a',
  };

  // Process all style elements
  const styleSheets = doc.querySelectorAll('style');
  styleSheets.forEach(sheet => {
    let css = sheet.textContent || '';
    
    // Replace modern color functions with safe fallbacks - more aggressive patterns
    css = css.replace(/oklab\s*\([^)]+\)/gi, '#64748b');
    css = css.replace(/oklch\s*\([^)]+\)/gi, '#64748b');
    css = css.replace(/lab\s*\([^)]+\)/gi, '#64748b');
    css = css.replace(/lch\s*\([^)]+\)/gi, '#64748b');
    css = css.replace(/color-mix\s*\([^)]+\)/gi, '#64748b');
    css = css.replace(/color\s*\(\s*display-p3[^)]+\)/gi, '#64748b');
    css = css.replace(/hwb\s*\([^)]+\)/gi, '#64748b');
    
    // Replace CSS custom properties with actual colors
    Object.entries(colorMap).forEach(([key, value]) => {
      // Match var(--key) or var(--key, fallback)
      const regex = new RegExp(`var\\s*\\(\\s*--${key}[^)]*\\)`, 'gi');
      css = css.replace(regex, value);
    });
    
    // Replace any remaining CSS variables with fallback
    css = css.replace(/var\s*\(\s*--[^)]+\)/gi, '#64748b');
    
    // Replace hsl() with rgb() for better compatibility
    css = css.replace(/hsl\s*\(\s*([^)]+)\)/gi, (_match, hslValues) => {
      try {
        const values = hslValues.split(/[\s,/]+/).map((v: string) => parseFloat(v));
        if (values.length >= 3) {
          const [h, s, l] = values;
          const rgb = hslToRgb(h, s, l);
          return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        }
      } catch {
        // Fallback
      }
      return '#64748b';
    });
    
    sheet.textContent = css;
  });

  // Also process link stylesheets (external CSS)
  const linkSheets = doc.querySelectorAll('link[rel="stylesheet"]');
  linkSheets.forEach(link => {
    try {
      const sheet = (link as HTMLLinkElement).sheet;
      if (sheet && sheet.cssRules) {
        for (let i = 0; i < sheet.cssRules.length; i++) {
          const rule = sheet.cssRules[i];
          if (rule instanceof CSSStyleRule) {
            let cssText = rule.cssText;
            
            // Apply same replacements
            cssText = cssText.replace(/oklab\s*\([^)]+\)/gi, '#64748b');
            cssText = cssText.replace(/oklch\s*\([^)]+\)/gi, '#64748b');
            cssText = cssText.replace(/lab\s*\([^)]+\)/gi, '#64748b');
            cssText = cssText.replace(/lch\s*\([^)]+\)/gi, '#64748b');
            cssText = cssText.replace(/var\s*\(\s*--[^)]+\)/gi, '#64748b');
            
            Object.entries(colorMap).forEach(([key, value]) => {
              const regex = new RegExp(`var\\s*\\(\\s*--${key}[^)]*\\)`, 'gi');
              cssText = cssText.replace(regex, value);
            });
            
            // Try to update the rule (may fail due to CORS)
            try {
              sheet.deleteRule(i);
              sheet.insertRule(cssText, i);
            } catch {
              // Ignore CORS errors
            }
          }
        }
      }
    } catch {
      // Ignore errors accessing external stylesheets
    }
  });

  // Apply inline styles to all elements
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    
    // Get computed style
    const computed = doc.defaultView?.getComputedStyle(htmlEl);
    
    // Get inline style
    const inlineStyle = htmlEl.getAttribute('style') || '';
    
    // Replace CSS custom properties in inline styles
    if (inlineStyle.includes('var(--')) {
      let cleanedStyle = inlineStyle;
      Object.entries(colorMap).forEach(([key, value]) => {
        const regex = new RegExp(`var\\s*\\(\\s*--${key}[^)]*\\)`, 'gi');
        cleanedStyle = cleanedStyle.replace(regex, value);
      });
      // Replace any remaining CSS variables
      cleanedStyle = cleanedStyle.replace(/var\s*\(\s*--[^)]+\)/gi, '#64748b');
      htmlEl.setAttribute('style', cleanedStyle);
    }
    
    // Replace modern color functions in inline styles
    if (hasModernColorFunction(inlineStyle)) {
      let cleanedStyle = inlineStyle;
      cleanedStyle = cleanedStyle.replace(/oklab\s*\([^)]+\)/gi, '#64748b');
      cleanedStyle = cleanedStyle.replace(/oklch\s*\([^)]+\)/gi, '#64748b');
      cleanedStyle = cleanedStyle.replace(/lab\s*\([^)]+\)/gi, '#64748b');
      cleanedStyle = cleanedStyle.replace(/lch\s*\([^)]+\)/gi, '#64748b');
      cleanedStyle = cleanedStyle.replace(/color-mix\s*\([^)]+\)/gi, '#64748b');
      cleanedStyle = cleanedStyle.replace(/hwb\s*\([^)]+\)/gi, '#64748b');
      htmlEl.setAttribute('style', cleanedStyle);
    }
    
    // Check computed styles for modern color functions
    if (computed) {
      ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke'].forEach(prop => {
        const value = computed.getPropertyValue(prop);
        if (value && hasModernColorFunction(value)) {
          // Set explicit fallback color
          const fallbackColor = prop === 'backgroundColor' ? '#ffffff' : 
                               prop === 'borderColor' ? '#e2e8f0' : '#1f2937';
          htmlEl.style.setProperty(prop, fallbackColor, 'important');
        }
      });
    }
  });
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Check if a color value contains modern color functions
 */
function hasModernColorFunction(value: string): boolean {
  return /oklab|oklch|lab\s*\(|lch\s*\(|color-mix|color\s*\(\s*display-p3|var\s*\(\s*--|hwb\s*\(/i.test(value);
}

/**
 * Convert modern color functions (oklab, oklch, etc.) to RGB fallbacks
 */
function convertModernColorToRgb(colorValue: string): string | null {
  // Handle oklab, oklch, lab, lch color functions that html2canvas doesn't support
  if (colorValue.includes('oklab') || colorValue.includes('oklch') || 
      colorValue.includes('lab(') || colorValue.includes('lch(')) {
    return null;
  }
  
  // Handle color-mix function
  if (colorValue.includes('color-mix') || colorValue.includes('color(display-p3')) {
    return null;
  }
  
  // Handle CSS custom properties
  if (colorValue.includes('var(--')) {
    return null;
  }
  
  return colorValue;
}

/**
 * Apply PDF-friendly styles to the cloned element
 */
function applyPDFStyles(element: HTMLElement): void {
  // Define safe PDF color palette
  const pdfColors = {
    white: '#ffffff',
    lightGray: '#f8fafc',
    gray: '#e2e8f0',
    darkGray: '#64748b',
    text: '#1f2937',
    textLight: '#64748b',
    primary: '#0f172a',
    aviation: '#0891b2',
    success: '#16a34a',
    warning: '#ea580c',
    danger: '#dc2626',
  };
  
  // Set base styles for the container
  element.style.backgroundColor = pdfColors.white;
  element.style.color = pdfColors.text;
  
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
    
    // Fix background colors
    const bgColor = computedStyle.backgroundColor;
    if (bgColor) {
      const convertedBg = convertModernColorToRgb(bgColor);
      if (convertedBg === null) {
        // Modern color function or CSS var detected - use safe fallback
        htmlEl.style.backgroundColor = pdfColors.white;
      } else if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        const rgb = bgColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const r = parseInt(rgb[0]);
          const g = parseInt(rgb[1]);
          const b = parseInt(rgb[2]);
          const avg = (r + g + b) / 3;
          
          // If it's a dark background, make it light
          if (avg < 50) {
            htmlEl.style.backgroundColor = pdfColors.white;
          } else if (avg < 100) {
            htmlEl.style.backgroundColor = pdfColors.lightGray;
          }
        }
      }
    }
    
    // Fix text colors
    const textColor = computedStyle.color;
    if (textColor) {
      const convertedText = convertModernColorToRgb(textColor);
      if (convertedText === null) {
        // Modern color function or CSS var detected - use safe fallback
        htmlEl.style.color = pdfColors.text;
      } else {
        const rgb = textColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const r = parseInt(rgb[0]);
          const g = parseInt(rgb[1]);
          const b = parseInt(rgb[2]);
          const avg = (r + g + b) / 3;
          
          // If it's light text, make it dark
          if (avg > 200) {
            htmlEl.style.color = pdfColors.text;
          }
        }
      }
    }
    
    // Fix border colors
    const borderColor = computedStyle.borderColor;
    if (borderColor) {
      const convertedBorder = convertModernColorToRgb(borderColor);
      if (convertedBorder === null) {
        // Modern color function or CSS var detected - use safe fallback
        htmlEl.style.borderColor = pdfColors.gray;
      } else if (borderColor.includes('rgb')) {
        const rgb = borderColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const r = parseInt(rgb[0]);
          const g = parseInt(rgb[1]);
          const b = parseInt(rgb[2]);
          const avg = (r + g + b) / 3;
          
          // If it's a dark border, lighten it
          if (avg < 50) {
            htmlEl.style.borderColor = pdfColors.gray;
          }
        }
      }
    }
    
    // Ensure cards have visible borders and backgrounds
    if (htmlEl.classList.contains('rounded-lg') || 
        htmlEl.classList.contains('rounded-xl') ||
        htmlEl.classList.contains('border')) {
      if (!htmlEl.style.border || htmlEl.style.border === 'none') {
        htmlEl.style.border = `1px solid ${pdfColors.gray}`;
      }
      if (!htmlEl.style.backgroundColor || htmlEl.style.backgroundColor === 'transparent') {
        htmlEl.style.backgroundColor = pdfColors.white;
      }
    }
    
    // Fix SVG colors
    if (htmlEl.tagName === 'svg') {
      const stroke = htmlEl.getAttribute('stroke');
      const fill = htmlEl.getAttribute('fill');
      
      if (stroke === 'currentColor' || stroke === '#fff' || stroke === 'white') {
        htmlEl.setAttribute('stroke', pdfColors.darkGray);
      }
      if (fill === 'currentColor' || fill === '#fff' || fill === 'white') {
        htmlEl.setAttribute('fill', pdfColors.darkGray);
      }
    }
    
    // Fix SVG path elements
    if (htmlEl.tagName === 'path' || htmlEl.tagName === 'circle' || htmlEl.tagName === 'rect') {
      const stroke = htmlEl.getAttribute('stroke');
      const fill = htmlEl.getAttribute('fill');
      
      if (stroke === 'currentColor') {
        htmlEl.setAttribute('stroke', pdfColors.darkGray);
      }
      if (fill === 'currentColor') {
        htmlEl.setAttribute('fill', pdfColors.darkGray);
      }
    }
    
    // Clear any CSS custom properties and modern color functions
    const style = htmlEl.style;
    for (let i = style.length - 1; i >= 0; i--) {
      const prop = style[i];
      const value = style.getPropertyValue(prop);
      
      if (value && hasModernColorFunction(value)) {
        // Replace with safe fallback based on property type
        if (prop.includes('background')) {
          style.setProperty(prop, pdfColors.white, 'important');
        } else if (prop.includes('color') && !prop.includes('background')) {
          style.setProperty(prop, pdfColors.text, 'important');
        } else if (prop.includes('border')) {
          style.setProperty(prop, pdfColors.gray, 'important');
        } else {
          style.removeProperty(prop);
        }
      }
    }
    
    // Force specific chart colors for Recharts
    if (htmlEl.classList.contains('recharts-wrapper') || 
        htmlEl.closest('.recharts-wrapper')) {
      htmlEl.style.backgroundColor = pdfColors.white;
    }
    
    // Fix chart text elements
    if (htmlEl.tagName === 'text' || htmlEl.classList.contains('recharts-text')) {
      htmlEl.style.fill = pdfColors.text;
      htmlEl.setAttribute('fill', pdfColors.text);
    }
  });
  
  // Hide specific elements that shouldn't be in PDF
  const hideSelectors = [
    '[data-no-pdf]',
    '.animate-spin',
    '[role="tooltip"]',
    '.tooltip',
    'button[title*="Export"]',
    'button[title*="PDF"]',
  ];
  
  hideSelectors.forEach(selector => {
    element.querySelectorAll(selector).forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
  });
}

/**
 * Sanitize SVG gradients to prevent non-finite values
 * This fixes the "addColorStop: non-finite value" error
 */
function sanitizeSVGGradients(element: HTMLElement): void {
  // Find all SVG elements
  const svgs = element.querySelectorAll('svg');
  
  svgs.forEach(svg => {
    // Find all gradient elements (linearGradient, radialGradient)
    const gradients = svg.querySelectorAll('linearGradient, radialGradient');
    
    gradients.forEach(gradient => {
      // Check gradient attributes for non-finite values
      ['x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'fx', 'fy'].forEach(attr => {
        const value = gradient.getAttribute(attr);
        if (value) {
          const numValue = parseFloat(value);
          if (!isFinite(numValue) || isNaN(numValue)) {
            // Set to safe default based on attribute
            const defaultValue = ['x2', 'r'].includes(attr) ? '100%' : '0%';
            gradient.setAttribute(attr, defaultValue);
          }
        }
      });
      
      // Check all stop elements within the gradient
      const stops = gradient.querySelectorAll('stop');
      stops.forEach(stop => {
        const offset = stop.getAttribute('offset');
        if (offset) {
          const numValue = parseFloat(offset);
          if (!isFinite(numValue) || isNaN(numValue)) {
            // Set to safe default (0% or 100%)
            stop.setAttribute('offset', '0%');
          } else if (numValue < 0) {
            stop.setAttribute('offset', '0%');
          } else if (numValue > 1 && !offset.includes('%')) {
            stop.setAttribute('offset', '100%');
          }
        }
        
        // Check stop-opacity
        const opacity = stop.getAttribute('stop-opacity');
        if (opacity) {
          const numValue = parseFloat(opacity);
          if (!isFinite(numValue) || isNaN(numValue)) {
            stop.setAttribute('stop-opacity', '1');
          } else if (numValue < 0) {
            stop.setAttribute('stop-opacity', '0');
          } else if (numValue > 1) {
            stop.setAttribute('stop-opacity', '1');
          }
        }
      });
    });
    
    // Also check for any elements with gradient fills/strokes
    const elementsWithGradients = svg.querySelectorAll('[fill^="url("], [stroke^="url("]');
    elementsWithGradients.forEach(el => {
      const fill = el.getAttribute('fill');
      const stroke = el.getAttribute('stroke');
      
      // If gradient reference is broken, replace with solid color
      if (fill && fill.startsWith('url(')) {
        const gradientId = fill.match(/#([^)]+)/)?.[1];
        if (gradientId) {
          const gradientEl = svg.querySelector(`#${gradientId}`);
          if (!gradientEl) {
            // Gradient doesn't exist, use solid color
            el.setAttribute('fill', '#64748b');
          }
        }
      }
      
      if (stroke && stroke.startsWith('url(')) {
        const gradientId = stroke.match(/#([^)]+)/)?.[1];
        if (gradientId) {
          const gradientEl = svg.querySelector(`#${gradientId}`);
          if (!gradientEl) {
            // Gradient doesn't exist, use solid color
            el.setAttribute('stroke', '#64748b');
          }
        }
      }
    });
  });
  
  // Also check for CSS gradients in styles
  const allElements = element.querySelectorAll('*');
  allElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    const style = htmlEl.style;
    
    // Check background-image for gradients
    const bgImage = style.backgroundImage;
    if (bgImage && (bgImage.includes('gradient') || bgImage.includes('linear-gradient') || bgImage.includes('radial-gradient'))) {
      // Try to parse and validate gradient
      try {
        // If gradient has NaN or Infinity, replace with solid color
        if (bgImage.includes('NaN') || bgImage.includes('Infinity')) {
          style.backgroundImage = 'none';
          style.backgroundColor = '#f1f5f9';
        }
      } catch {
        // If parsing fails, use solid color
        style.backgroundImage = 'none';
        style.backgroundColor = '#f1f5f9';
      }
    }
  });
}

export default ExecutivePDFExport;
