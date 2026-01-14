import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Form';
import {
  useImportTypes,
  useDownloadTemplate,
  useUploadFile,
  useConfirmImport,
  useImportHistory,
  downloadBlob,
  ImportType,
  ImportPreview,
  ImportError,
  ValidRow,
  ImportLog,
} from '@/hooks/useImportExport';

// Icons
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

type WorkflowStep = 'select' | 'upload' | 'preview' | 'complete';

const IMPORT_TYPE_LABELS: Record<ImportType, string> = {
  utilization: 'Daily Utilization Counters',
  maintenance_tasks: 'Maintenance Tasks',
  aog_events: 'AOG Events',
  budget: 'Budget Plan',
  aircraft: 'Aircraft Master',
  daily_status: 'Daily Status',
};

export function ImportPage() {
  const [step, setStep] = useState<WorkflowStep>('select');
  const [selectedType, setSelectedType] = useState<ImportType | ''>('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importResult, setImportResult] = useState<{ successCount: number; errorCount: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Queries and mutations
  const { data: importTypes } = useImportTypes();
  const downloadTemplate = useDownloadTemplate();
  const uploadFile = useUploadFile();
  const confirmImport = useConfirmImport();
  const { data: importHistory } = useImportHistory();

  // Handle template download
  const handleDownloadTemplate = useCallback(async () => {
    if (!selectedType) return;
    try {
      const result = await downloadTemplate.mutateAsync(selectedType);
      downloadBlob(result.blob, `${selectedType}_template.xlsx`);
    } catch (error) {
      console.error('Failed to download template:', error);
    }
  }, [selectedType, downloadTemplate]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (!selectedType) return;
    
    try {
      const result = await uploadFile.mutateAsync({ file, importType: selectedType });
      setPreview(result);
      setStep('preview');
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  }, [selectedType, uploadFile]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  // Handle import confirmation
  const handleConfirmImport = useCallback(async () => {
    if (!preview?.sessionId) return;
    
    try {
      const result = await confirmImport.mutateAsync({ sessionId: preview.sessionId });
      setImportResult({ successCount: result.successCount, errorCount: result.errorCount });
      setStep('complete');
    } catch (error) {
      console.error('Failed to confirm import:', error);
    }
  }, [preview, confirmImport]);

  // Reset workflow
  const handleReset = useCallback(() => {
    setStep('select');
    setSelectedType('');
    setPreview(null);
    setImportResult(null);
  }, []);

  // Proceed to upload step
  const handleProceedToUpload = useCallback(() => {
    if (selectedType) {
      setStep('upload');
    }
  }, [selectedType]);

  // Valid rows table columns
  const validRowColumns: ColumnDef<ValidRow>[] = useMemo(() => [
    {
      accessorKey: 'rowNumber',
      header: 'Row',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.rowNumber}</span>,
    },
    {
      accessorKey: 'data',
      header: 'Data Preview',
      cell: ({ row }) => {
        const data = row.original.data;
        const entries = Object.entries(data).slice(0, 4);
        return (
          <div className="text-sm text-muted-foreground">
            {entries.map(([key, value]) => (
              <span key={key} className="mr-3">
                <span className="font-medium">{key}:</span> {String(value)}
              </span>
            ))}
            {Object.keys(data).length > 4 && <span>...</span>}
          </div>
        );
      },
    },
  ], []);

  // Error rows table columns
  const errorColumns: ColumnDef<ImportError>[] = useMemo(() => [
    {
      accessorKey: 'row',
      header: 'Row',
      cell: ({ row }) => <span className="font-mono text-sm text-destructive">{row.original.row}</span>,
    },
    {
      accessorKey: 'errors',
      header: 'Validation Errors',
      cell: ({ row }) => (
        <ul className="list-disc list-inside text-sm text-destructive">
          {row.original.errors.map((error, idx) => (
            <li key={idx}>{error}</li>
          ))}
        </ul>
      ),
    },
  ], []);

  // Import history columns
  const historyColumns: ColumnDef<ImportLog>[] = useMemo(() => [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      accessorKey: 'importType',
      header: 'Type',
      cell: ({ row }) => IMPORT_TYPE_LABELS[row.original.importType] || row.original.importType,
    },
    {
      accessorKey: 'filename',
      header: 'Filename',
    },
    {
      accessorKey: 'successCount',
      header: 'Success',
      cell: ({ row }) => (
        <span className="text-green-600 font-medium">{row.original.successCount}</span>
      ),
    },
    {
      accessorKey: 'errorCount',
      header: 'Errors',
      cell: ({ row }) => (
        <span className={row.original.errorCount > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
          {row.original.errorCount}
        </span>
      ),
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Import</h1>
          <p className="text-muted-foreground">Upload Excel files to import bulk data</p>
        </div>
        {step !== 'select' && (
          <Button variant="outline" onClick={handleReset}>
            Start New Import
          </Button>
        )}
      </motion.div>

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center gap-2"
      >
        {(['select', 'upload', 'preview', 'complete'] as WorkflowStep[]).map((s, idx) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : ['select', 'upload', 'preview', 'complete'].indexOf(step) > idx
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {['select', 'upload', 'preview', 'complete'].indexOf(step) > idx ? (
                <CheckIcon />
              ) : (
                idx + 1
              )}
            </div>
            {idx < 3 && (
              <div
                className={`w-12 h-0.5 mx-1 ${
                  ['select', 'upload', 'preview', 'complete'].indexOf(step) > idx
                    ? 'bg-green-500'
                    : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </motion.div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* Step 1: Select Import Type */}
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Step 1: Select Data Type</h2>
            <p className="text-muted-foreground mb-6">
              Choose the type of data you want to import. You can download a template to see the required format.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {(importTypes || []).map((type) => (
                <button
                  key={type.type}
                  onClick={() => setSelectedType(type.type)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    selectedType === type.type
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <h3 className="font-medium text-foreground">{type.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Import {type.name.toLowerCase()} from Excel
                  </p>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                disabled={!selectedType || downloadTemplate.isPending}
                isLoading={downloadTemplate.isPending}
              >
                <span className="flex items-center gap-2">
                  <DownloadIcon />
                  Download Template
                </span>
              </Button>
              <Button
                onClick={handleProceedToUpload}
                disabled={!selectedType}
              >
                Continue to Upload
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Upload File */}
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Step 2: Upload {selectedType && IMPORT_TYPE_LABELS[selectedType]} File
            </h2>
            <p className="text-muted-foreground mb-6">
              Upload your completed Excel file. The system will validate the data before importing.
            </p>

            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="text-muted-foreground">
                  <FileIcon />
                </div>
                <div>
                  <p className="text-foreground font-medium">
                    Drag and drop your Excel file here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 border border-input rounded-md font-medium bg-background hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer ${
                    uploadFile.isPending ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {uploadFile.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Uploading...
                    </span>
                  ) : (
                    <>
                      <UploadIcon />
                      Select File
                    </>
                  )}
                </label>
              </div>
            </div>

            {uploadFile.isError && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">
                  Failed to upload file. Please check the file format and try again.
                </p>
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <Button variant="outline" onClick={() => setStep('select')}>
                Back
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                disabled={downloadTemplate.isPending}
              >
                <span className="flex items-center gap-2">
                  <DownloadIcon />
                  Download Template
                </span>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Preview and Validate */}
        {step === 'preview' && preview && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Step 3: Review Import Preview</h2>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">File</p>
                  <p className="font-medium text-foreground truncate">{preview.filename}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                  <p className="text-2xl font-bold text-foreground">{preview.totalRows}</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4">
                  <p className="text-sm text-green-600">Valid Rows</p>
                  <p className="text-2xl font-bold text-green-600">{preview.validCount}</p>
                </div>
                <div className={`rounded-lg p-4 ${preview.errorCount > 0 ? 'bg-destructive/10' : 'bg-muted/50'}`}>
                  <p className={`text-sm ${preview.errorCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    Invalid Rows
                  </p>
                  <p className={`text-2xl font-bold ${preview.errorCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {preview.errorCount}
                  </p>
                </div>
              </div>

              {/* Validation Errors */}
              {preview.errors.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertIcon />
                    <h3 className="font-medium text-destructive">Validation Errors</h3>
                  </div>
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                    <DataTable
                      data={preview.errors}
                      columns={errorColumns}
                      searchPlaceholder="Search errors..."
                    />
                  </div>
                </div>
              )}

              {/* Valid Rows Preview */}
              {preview.validRows.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckIcon />
                    <h3 className="font-medium text-green-600">Valid Rows Preview</h3>
                  </div>
                  <DataTable
                    data={preview.validRows.slice(0, 10)}
                    columns={validRowColumns}
                    searchPlaceholder="Search rows..."
                  />
                  {preview.validRows.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing first 10 of {preview.validRows.length} valid rows
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <div className="flex items-center gap-3">
                {preview.validCount === 0 ? (
                  <p className="text-destructive text-sm">No valid rows to import</p>
                ) : (
                  <Button
                    onClick={handleConfirmImport}
                    disabled={confirmImport.isPending}
                    isLoading={confirmImport.isPending}
                  >
                    <span className="flex items-center gap-2">
                      <CheckIcon />
                      Import {preview.validCount} Valid Rows
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && importResult && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-lg p-8 text-center"
          >
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Import Complete!</h2>
            <p className="text-muted-foreground mb-6">
              Successfully imported {importResult.successCount} records
              {importResult.errorCount > 0 && ` (${importResult.errorCount} errors)`}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={handleReset}>
                Import More Data
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import History */}
      {step === 'select' && importHistory && importHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <HistoryIcon />
            <h3 className="text-lg font-semibold text-foreground">Recent Imports</h3>
          </div>
          <DataTable
            data={importHistory.slice(0, 10)}
            columns={historyColumns}
            searchPlaceholder="Search import history..."
            searchColumn="filename"
          />
        </motion.div>
      )}
    </div>
  );
}
