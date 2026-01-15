import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Icons
const PDFIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="M9 15h6"/>
    <path d="M9 11h6"/>
  </svg>
);

const ExcelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="16" y2="17"/>
    <line x1="10" y1="9" x2="14" y2="9"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const SortIcon = ({ direction }: { direction: 'asc' | 'desc' | null }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={direction ? 'text-primary' : 'text-muted-foreground/50'}>
    {direction === 'asc' ? (
      <path d="M12 5v14M5 12l7-7 7 7"/>
    ) : direction === 'desc' ? (
      <path d="M12 19V5M5 12l7 7 7-7"/>
    ) : (
      <>
        <path d="M7 15l5 5 5-5"/>
        <path d="M7 9l5-5 5 5"/>
      </>
    )}
  </svg>
);

export interface AircraftBreakdownRow {
  aircraftId: string;
  registration: string;
  technicalHours: number;
  procurementHours: number;
  opsHours: number;
  totalHours: number;
}

interface FilterInfo {
  dateRange?: { startDate?: string; endDate?: string };
  fleetGroup?: string;
  aircraftFilter?: string;
}

interface AOGAircraftBreakdownTableProps {
  data: AircraftBreakdownRow[];
  filterInfo?: FilterInfo;
  isLoading?: boolean;
}

type SortKey = 'registration' | 'technicalHours' | 'procurementHours' | 'opsHours' | 'totalHours';
type SortDirection = 'asc' | 'desc';

export function AOGAircraftBreakdownTable({ data, filterInfo, isLoading }: AOGAircraftBreakdownTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalHours');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Sort data
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [data, sortKey, sortDirection]);

  // Calculate totals
  const totals = useMemo(() => {
    return data.reduce(
      (acc, row) => ({
        technicalHours: acc.technicalHours + row.technicalHours,
        procurementHours: acc.procurementHours + row.procurementHours,
        opsHours: acc.opsHours + row.opsHours,
        totalHours: acc.totalHours + row.totalHours,
      }),
      { technicalHours: 0, procurementHours: 0, opsHours: 0, totalHours: 0 }
    );
  }, [data]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const getFilterDescription = useCallback(() => {
    const parts: string[] = [];
    if (filterInfo?.dateRange?.startDate && filterInfo?.dateRange?.endDate) {
      parts.push(`${filterInfo.dateRange.startDate} to ${filterInfo.dateRange.endDate}`);
    } else if (filterInfo?.dateRange?.startDate) {
      parts.push(`From ${filterInfo.dateRange.startDate}`);
    } else if (filterInfo?.dateRange?.endDate) {
      parts.push(`Until ${filterInfo.dateRange.endDate}`);
    } else {
      parts.push('All Time');
    }
    if (filterInfo?.fleetGroup) parts.push(`Fleet: ${filterInfo.fleetGroup}`);
    if (filterInfo?.aircraftFilter) parts.push(`Aircraft: ${filterInfo.aircraftFilter}`);
    return parts.join(' | ');
  }, [filterInfo]);

  // Export to Excel (CSV format for simplicity)
  const handleExportExcel = useCallback(async () => {
    setIsExportingExcel(true);
    try {
      const headers = ['Aircraft', 'Technical (hrs)', 'Procurement (hrs)', 'Ops (hrs)', 'Total (hrs)'];
      const rows = sortedData.map(row => [
        row.registration,
        row.technicalHours.toFixed(2),
        row.procurementHours.toFixed(2),
        row.opsHours.toFixed(2),
        row.totalHours.toFixed(2),
      ]);
      
      // Add totals row
      rows.push([
        'TOTAL',
        totals.technicalHours.toFixed(2),
        totals.procurementHours.toFixed(2),
        totals.opsHours.toFixed(2),
        totals.totalHours.toFixed(2),
      ]);

      // Add filter info as header rows
      const filterDesc = getFilterDescription();
      const csvContent = [
        ['AOG Downtime by Aircraft Report'],
        [`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`],
        [`Filters: ${filterDesc}`],
        [''],
        headers,
        ...rows,
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AOG-Downtime-by-Aircraft-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel export failed:', error);
    } finally {
      setIsExportingExcel(false);
    }
  }, [sortedData, totals, getFilterDescription]);

  // Export to PDF
  const handleExportPDF = useCallback(async () => {
    setIsExportingPDF(true);
    try {
      const tableElement = document.getElementById('aog-aircraft-breakdown-table');
      if (!tableElement) throw new Error('Table not found');

      // Create wrapper for PDF
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 800px;
        background: #ffffff;
        padding: 30px;
        color: #1f2937;
        font-family: system-ui, -apple-system, sans-serif;
      `;

      // Header
      const header = document.createElement('div');
      header.innerHTML = `
        <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #0ea5e9;">
          <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0;">AOG Downtime by Aircraft</h1>
          <p style="font-size: 12px; color: #64748b; margin: 8px 0 0 0;">Alpha Star Aviation - Three-Bucket Analysis</p>
          <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 0 0;">Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}</p>
          <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Filters: ${getFilterDescription()}</p>
        </div>
      `;
      wrapper.appendChild(header);

      // Create table HTML
      const tableHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #475569;">Aircraft</th>
              <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #3b82f6;">Technical (hrs)</th>
              <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #f59e0b;">Procurement (hrs)</th>
              <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #10b981;">Ops (hrs)</th>
              <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #0f172a;">Total (hrs)</th>
            </tr>
          </thead>
          <tbody>
            ${sortedData.map((row, i) => `
              <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${row.registration}</td>
                <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #3b82f6;">${row.technicalHours.toFixed(1)}</td>
                <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #f59e0b;">${row.procurementHours.toFixed(1)}</td>
                <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #10b981;">${row.opsHours.toFixed(1)}</td>
                <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${row.totalHours.toFixed(1)}</td>
              </tr>
            `).join('')}
            <tr style="background: #f1f5f9; font-weight: 700;">
              <td style="padding: 10px 8px; border-top: 2px solid #cbd5e1;">TOTAL</td>
              <td style="padding: 10px 8px; text-align: right; border-top: 2px solid #cbd5e1; color: #3b82f6;">${totals.technicalHours.toFixed(1)}</td>
              <td style="padding: 10px 8px; text-align: right; border-top: 2px solid #cbd5e1; color: #f59e0b;">${totals.procurementHours.toFixed(1)}</td>
              <td style="padding: 10px 8px; text-align: right; border-top: 2px solid #cbd5e1; color: #10b981;">${totals.opsHours.toFixed(1)}</td>
              <td style="padding: 10px 8px; text-align: right; border-top: 2px solid #cbd5e1;">${totals.totalHours.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      `;
      
      const tableContainer = document.createElement('div');
      tableContainer.innerHTML = tableHTML;
      wrapper.appendChild(tableContainer);

      // Footer
      const footer = document.createElement('div');
      footer.innerHTML = `
        <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 9px; color: #94a3b8; margin: 0;">
            Technical = Troubleshooting + Installation | Procurement = Waiting for parts | Ops = Operational testing
          </p>
          <p style="font-size: 9px; color: #94a3b8; margin: 4px 0 0 0;">
            Alpha Star Aviation KPI Dashboard • Confidential
          </p>
        </div>
      `;
      wrapper.appendChild(footer);

      document.body.appendChild(wrapper);
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(wrapper, {
        useCORS: true,
        logging: false,
        width: 800,
        background: '#ffffff',
      });

      document.body.removeChild(wrapper);

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: imgHeight > 280 ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`AOG-Downtime-by-Aircraft-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExportingPDF(false);
    }
  }, [sortedData, totals, getFilterDescription]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-48 mb-4" />
        <div className="h-[300px] bg-muted rounded" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Downtime by Aircraft
        </h3>
        <p className="text-muted-foreground text-center py-8">No data available for the selected filters</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4"
    >
      {/* Header with title and export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Downtime by Aircraft
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {data.length} aircraft • {getFilterDescription()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border bg-card text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            title="Export to Excel (CSV)"
          >
            {isExportingExcel ? <SpinnerIcon /> : <ExcelIcon />}
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border bg-card text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            title="Export to PDF"
          >
            {isExportingPDF ? <SpinnerIcon /> : <PDFIcon />}
            PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" id="aog-aircraft-breakdown-table">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-muted/30">
              <th 
                className="text-left py-3 px-3 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('registration')}
              >
                <div className="flex items-center gap-1">
                  Aircraft
                  <SortIcon direction={sortKey === 'registration' ? sortDirection : null} />
                </div>
              </th>
              <th 
                className="text-right py-3 px-3 font-semibold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
                onClick={() => handleSort('technicalHours')}
              >
                <div className="flex items-center justify-end gap-1">
                  Technical
                  <SortIcon direction={sortKey === 'technicalHours' ? sortDirection : null} />
                </div>
              </th>
              <th 
                className="text-right py-3 px-3 font-semibold text-amber-600 cursor-pointer hover:text-amber-700 transition-colors"
                onClick={() => handleSort('procurementHours')}
              >
                <div className="flex items-center justify-end gap-1">
                  Procurement
                  <SortIcon direction={sortKey === 'procurementHours' ? sortDirection : null} />
                </div>
              </th>
              <th 
                className="text-right py-3 px-3 font-semibold text-emerald-600 cursor-pointer hover:text-emerald-700 transition-colors"
                onClick={() => handleSort('opsHours')}
              >
                <div className="flex items-center justify-end gap-1">
                  Ops
                  <SortIcon direction={sortKey === 'opsHours' ? sortDirection : null} />
                </div>
              </th>
              <th 
                className="text-right py-3 px-3 font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('totalHours')}
              >
                <div className="flex items-center justify-end gap-1">
                  Total
                  <SortIcon direction={sortKey === 'totalHours' ? sortDirection : null} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => {
              // Calculate percentage of total for visual indicator
              const percentage = totals.totalHours > 0 ? (row.totalHours / totals.totalHours) * 100 : 0;
              
              return (
                <motion.tr
                  key={row.aircraftId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{row.registration}</span>
                      {percentage >= 20 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-destructive/10 text-destructive rounded">
                          High
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-blue-600 font-medium">{row.technicalHours.toFixed(1)}</span>
                    <span className="text-muted-foreground text-xs ml-1">hrs</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-amber-600 font-medium">{row.procurementHours.toFixed(1)}</span>
                    <span className="text-muted-foreground text-xs ml-1">hrs</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-emerald-600 font-medium">{row.opsHours.toFixed(1)}</span>
                    <span className="text-muted-foreground text-xs ml-1">hrs</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-semibold text-foreground">{row.totalHours.toFixed(1)}</span>
                      <span className="text-muted-foreground text-xs">hrs</span>
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50 font-semibold border-t-2 border-border">
              <td className="py-3 px-3 text-foreground">TOTAL ({data.length} aircraft)</td>
              <td className="py-3 px-3 text-right text-blue-600">{totals.technicalHours.toFixed(1)} hrs</td>
              <td className="py-3 px-3 text-right text-amber-600">{totals.procurementHours.toFixed(1)} hrs</td>
              <td className="py-3 px-3 text-right text-emerald-600">{totals.opsHours.toFixed(1)} hrs</td>
              <td className="py-3 px-3 text-right text-foreground">{totals.totalHours.toFixed(1)} hrs</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Technical = Troubleshooting + Installation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Procurement = Waiting for parts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Ops = Operational testing</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AOGAircraftBreakdownTable;
