import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Paperclip, 
  Upload, 
  Download, 
  Eye, 
  Trash2,
  FileText,
  Image,
  File,
  FileSpreadsheet,
  X,
  Calendar,
  HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/Form';
import { usePermissions } from '@/hooks/usePermissions';
import type { AttachmentMeta } from '@/types';

interface AttachmentsTabProps {
  aogEventId?: string; // Optional, kept for future use
  attachments: string[]; // Legacy S3 keys
  attachmentsMeta?: AttachmentMeta[];
  onUpload?: (files: File[]) => Promise<void>;
  onDelete?: (s3Key: string) => Promise<void>;
}

// Get icon for file type
function getFileIcon(filename: string, mimeType?: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
    return <Image className="w-5 h-5 text-purple-500" />;
  }
  if (['pdf'].includes(ext || '')) {
    return <FileText className="w-5 h-5 text-red-500" />;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
  }
  if (['doc', 'docx'].includes(ext || '')) {
    return <FileText className="w-5 h-5 text-blue-500" />;
  }
  return <File className="w-5 h-5 text-muted-foreground" />;
}

// Get attachment type label
function getAttachmentTypeLabel(type: string): { label: string; color: string } {
  switch (type) {
    case 'purchase_order':
      return { label: 'Purchase Order', color: 'bg-blue-500/10 text-blue-600' };
    case 'invoice':
      return { label: 'Invoice', color: 'bg-green-500/10 text-green-600' };
    case 'shipping_doc':
      return { label: 'Shipping Doc', color: 'bg-orange-500/10 text-orange-600' };
    case 'photo':
      return { label: 'Photo', color: 'bg-purple-500/10 text-purple-600' };
    default:
      return { label: type, color: 'bg-gray-500/10 text-gray-600' };
  }
}

// Format file size
function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Attachment card component
function AttachmentCard({ 
  attachment, 
  onView, 
  onDownload, 
  onDelete,
  canDelete 
}: { 
  attachment: AttachmentMeta;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const typeInfo = getAttachmentTypeLabel(attachment.attachmentType);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-muted rounded-lg">
          {getFileIcon(attachment.filename, attachment.mimeType)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate" title={attachment.filename}>
            {attachment.filename}
          </p>
          <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-1 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          <span>{format(new Date(attachment.uploadedAt), 'MMM dd, yyyy HH:mm')}</span>
        </div>
        {attachment.fileSize && (
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3 h-3" />
            <span>{formatFileSize(attachment.fileSize)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onView}
          className="flex-1"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="flex-1"
        >
          <Download className="w-3.5 h-3.5 mr-1" />
          Download
        </Button>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Legacy attachment card (for attachments without metadata)
function LegacyAttachmentCard({ 
  s3Key, 
  onView, 
  onDownload, 
  onDelete,
  canDelete 
}: { 
  s3Key: string;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const filename = s3Key.split('/').pop() || s3Key;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-muted rounded-lg">
          {getFileIcon(filename)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate" title={filename}>
            {filename}
          </p>
          <span className="inline-block px-2 py-0.5 text-xs rounded-full mt-1 bg-gray-500/10 text-gray-600">
            Legacy
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onView}
          className="flex-1"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="flex-1"
        >
          <Download className="w-3.5 h-3.5 mr-1" />
          Download
        </Button>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Upload type options
const ATTACHMENT_TYPE_OPTIONS = [
  { value: 'purchase_order', label: 'Purchase Order' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'shipping_doc', label: 'Shipping Document' },
  { value: 'photo', label: 'Photo' },
  { value: 'other', label: 'Other' },
];

export function AttachmentsTab({ 
  attachments, 
  attachmentsMeta = [],
  onUpload,
  onDelete 
}: AttachmentsTabProps) {
  const { canWrite, canDelete: hasDeletePermission } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedType, setSelectedType] = useState('other');
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Combine legacy attachments with metadata attachments
  const allAttachments = [
    ...attachmentsMeta,
    // Add legacy attachments that don't have metadata
    ...attachments
      .filter(s3Key => !attachmentsMeta.some(m => m.s3Key === s3Key))
      .map(s3Key => ({ s3Key, isLegacy: true })),
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
      setShowUploadForm(true);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !onUpload) return;
    
    setIsUploading(true);
    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]);
      setShowUploadForm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFiles([]);
    setShowUploadForm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleView = (s3Key: string) => {
    // In a real implementation, this would open the file in a new tab
    // For now, we'll just log it
    console.log('View attachment:', s3Key);
    window.open(`/api/attachments/${encodeURIComponent(s3Key)}`, '_blank');
  };

  const handleDownload = (s3Key: string, filename?: string) => {
    // In a real implementation, this would trigger a download
    console.log('Download attachment:', s3Key);
    const link = document.createElement('a');
    link.href = `/api/attachments/${encodeURIComponent(s3Key)}?download=true`;
    link.download = filename || s3Key.split('/').pop() || 'attachment';
    link.click();
  };

  const handleDelete = async (s3Key: string) => {
    if (!onDelete) return;
    
    try {
      await onDelete(s3Key);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-primary" />
          Attachments
          {allAttachments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({allAttachments.length})
            </span>
          )}
        </h3>
        {canWrite && !showUploadForm && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </Button>
          </>
        )}
      </div>

      {/* Upload Form */}
      <AnimatePresence>
        {showUploadForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-muted/30 border border-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-foreground">Upload Files</h4>
              <button
                onClick={handleCancelUpload}
                className="p-1 rounded hover:bg-muted"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Selected files */}
            <div className="space-y-2 mb-4">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 bg-background rounded-lg"
                >
                  {getFileIcon(file.name, file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                    className="p-1 rounded hover:bg-muted"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>

            {/* Attachment type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1">
                Attachment Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                {ATTACHMENT_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-primary hover:underline"
              >
                + Add more files
              </button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelUpload}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpload}
                  isLoading={isUploading}
                  disabled={selectedFiles.length === 0}
                >
                  Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-destructive/10 border border-destructive/30 rounded-lg p-4"
          >
            <p className="text-sm text-foreground mb-3">
              Are you sure you want to delete this attachment?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachments grid */}
      {allAttachments.length === 0 ? (
        <div className="bg-muted/30 rounded-xl p-8 text-center">
          <Paperclip className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No attachments yet.</p>
          {canWrite && (
            <p className="text-sm text-muted-foreground mt-1">
              Click "Upload" to add files.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allAttachments.map((attachment) => {
            if ('isLegacy' in attachment) {
              return (
                <LegacyAttachmentCard
                  key={attachment.s3Key}
                  s3Key={attachment.s3Key}
                  onView={() => handleView(attachment.s3Key)}
                  onDownload={() => handleDownload(attachment.s3Key)}
                  onDelete={() => setDeleteConfirm(attachment.s3Key)}
                  canDelete={hasDeletePermission && !deleteConfirm}
                />
              );
            }
            return (
              <AttachmentCard
                key={attachment.s3Key}
                attachment={attachment}
                onView={() => handleView(attachment.s3Key)}
                onDownload={() => handleDownload(attachment.s3Key, attachment.filename)}
                onDelete={() => setDeleteConfirm(attachment.s3Key)}
                canDelete={hasDeletePermission && !deleteConfirm}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AttachmentsTab;
