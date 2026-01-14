import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Must match backend ImportType enum values
export type ImportType = 'utilization' | 'maintenance_tasks' | 'aog_events' | 'budget' | 'aircraft' | 'daily_status';

// Must match backend ExportType values (kebab-case)
export type ExportType =
  | 'aircraft'
  | 'utilization'
  | 'daily-status'
  | 'aog-events'
  | 'maintenance-tasks'
  | 'work-orders'
  | 'discrepancies'
  | 'budget-plans'
  | 'actual-spend'
  | 'dashboard'
  | 'aircraft-detail';

export interface ImportTypeInfo {
  type: ImportType;
  name: string;
}

export interface ValidRow {
  rowNumber: number;
  data: Record<string, unknown>;
}

export interface ImportError {
  row: number;
  errors: string[];
}

export interface ImportPreview {
  importType: ImportType;
  filename: string;
  totalRows: number;
  validCount: number;
  errorCount: number;
  validRows: ValidRow[];
  errors: ImportError[];
  sessionId: string;
}

export interface ImportResult {
  importLogId: string;
  successCount: number;
  errorCount: number;
  errors: { row: number; message: string }[];
}

export interface ImportLog {
  _id: string;
  filename: string;
  s3Key: string;
  importType: ImportType;
  rowCount: number;
  successCount: number;
  errorCount: number;
  errors: { row: number; message: string }[];
  importedBy: string;
  createdAt: string;
}

// Get available import types
export function useImportTypes() {
  return useQuery({
    queryKey: ['import', 'types'],
    queryFn: async () => {
      const { data } = await api.get<ImportTypeInfo[]>('/import/types');
      return data;
    },
  });
}

// Download template
export function useDownloadTemplate() {
  return useMutation({
    mutationFn: async (type: ImportType) => {
      const response = await api.get(`/import/template/${type}`, { responseType: 'blob' });
      return { blob: response.data as Blob, type };
    },
  });
}

// Upload and parse file for preview
export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ file, importType }: { file: File; importType: ImportType }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('importType', importType);
      const { data } = await api.post<ImportPreview>('/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
  });
}

// Confirm import of valid rows
export function useConfirmImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      const { data } = await api.post<ImportResult>('/import/confirm', { sessionId });
      return data;
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['utilization'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
      queryClient.invalidateQueries({ queryKey: ['budget-plans'] });
      queryClient.invalidateQueries({ queryKey: ['actual-spend'] });
      queryClient.invalidateQueries({ queryKey: ['daily-status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['import', 'history'] });
    },
  });
}

// Get import history
export function useImportHistory(importType?: ImportType) {
  return useQuery({
    queryKey: ['import', 'history', importType],
    queryFn: async () => {
      const params = importType ? { importType } : {};
      const { data } = await api.get<ImportLog[]>('/import/history', { params });
      return data;
    },
  });
}

// Export data
export function useExportData() {
  return useMutation({
    mutationFn: async ({ type, filters }: { type: ExportType; filters?: Record<string, unknown> }) => {
      const response = await api.get(`/export/${type}`, {
        params: filters,
        responseType: 'blob',
      });
      return { blob: response.data as Blob, type };
    },
  });
}

// Helper to trigger file download
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
