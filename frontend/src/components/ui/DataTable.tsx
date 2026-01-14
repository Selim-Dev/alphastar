import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  searchPlaceholder?: string;
  searchColumn?: string;
  pageSize?: number;
  getRowClassName?: (row: T) => string;
  /** Enable alternating row colors for better readability */
  striped?: boolean;
  /** Enable sticky header for scrollable tables */
  stickyHeader?: boolean;
  /** Maximum height for scrollable table container (enables sticky header) */
  maxHeight?: string;
  /** Callback when a row is clicked */
  onRowClick?: (row: T) => void;
  /** Enable horizontal scrolling for mobile devices (Requirements: 9.9) */
  horizontalScroll?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  searchColumn,
  pageSize = 10,
  getRowClassName,
  striped = false,
  stickyHeader = false,
  maxHeight,
  onRowClick,
  horizontalScroll = true, // Enable by default for mobile-friendly tables
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize } },
  });

  // Determine if we should enable sticky header (either explicitly or via maxHeight)
  const enableStickyHeader = stickyHeader || !!maxHeight;

  return (
    <div className="space-y-4">
      {searchColumn && (
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="px-3 py-2 border border-input rounded-lg bg-background text-foreground w-full max-w-sm 
                     focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                     transition-all duration-150 ease-in-out"
        />
      )}

      <div 
        className={`border border-border rounded-lg shadow-theme-sm ${
          horizontalScroll ? 'overflow-x-auto' : 'overflow-hidden'
        }`}
        style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
      >
        <table className={`border-collapse ${horizontalScroll ? 'min-w-full' : 'w-full'}`}>
          <thead 
            className={`bg-muted/80 backdrop-blur-sm ${
              enableStickyHeader ? 'sticky top-0 z-10' : ''
            }`}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-small font-semibold text-muted-foreground uppercase tracking-wider
                               cursor-pointer select-none
                               hover:bg-accent/50 hover:text-foreground
                               transition-colors duration-150 ease-in-out
                               border-b border-border"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="text-aviation opacity-70">
                        {header.column.getIsSorted() === 'asc' && <ChevronUp className="w-4 h-4" />}
                        {header.column.getIsSorted() === 'desc' && <ChevronDown className="w-4 h-4" />}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/50">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-lg">No data available</span>
                    <span className="text-small">Try adjusting your filters or search criteria</span>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, index) => {
                const rowClassName = getRowClassName ? getRowClassName(row.original) : '';
                const isEven = index % 2 === 0;
                
                return (
                  <tr 
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={`
                      transition-colors duration-150 ease-in-out
                      hover:bg-aviation-muted/30 dark:hover:bg-aviation-muted/20
                      ${striped && !isEven ? 'bg-muted/30' : 'bg-card'}
                      ${rowClassName}
                      ${onRowClick ? 'cursor-pointer' : ''}
                    `}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td 
                        key={cell.id} 
                        className="px-4 py-3 text-sm text-foreground"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Premium Pagination Controls */}
      <div className="flex items-center justify-between px-1">
        <p className="text-small text-muted-foreground">
          Showing <span className="font-medium text-foreground">{table.getRowModel().rows.length}</span> of{' '}
          <span className="font-medium text-foreground">{data.length}</span> results
          {' · '}
          Page <span className="font-medium text-foreground">{table.getState().pagination.pageIndex + 1}</span> of{' '}
          <span className="font-medium text-foreground">{table.getPageCount() || 1}</span>
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-small font-medium
                       border border-border rounded-md bg-card
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:bg-accent hover:border-accent
                       active:scale-[0.98]
                       transition-all duration-150 ease-in-out"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-small font-medium
                       border border-border rounded-md bg-card
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:bg-accent hover:border-accent
                       active:scale-[0.98]
                       transition-all duration-150 ease-in-out"
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
