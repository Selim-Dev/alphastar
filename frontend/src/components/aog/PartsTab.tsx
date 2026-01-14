import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Package, 
  Plus, 
  Edit2, 
  DollarSign, 
  Truck,
  Hash,
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';
import { Button, Input, Textarea, Select, FormField } from '@/components/ui/Form';
import { useAddPartRequest, useUpdatePartRequest } from '@/hooks/useAOGEvents';
import { usePermissions } from '@/hooks/usePermissions';
import type { PartRequest, PartRequestStatus, CreatePartRequestDto, UpdatePartRequestDto } from '@/types';
import { PART_REQUEST_STATUS_LABELS } from '@/types';

interface PartsTabProps {
  aogEventId: string;
  partRequests: PartRequest[];
  onUpdate?: () => void;
}

// Validation schema for new part request
const createPartRequestSchema = z.object({
  partNumber: z.string().min(1, 'Part number is required'),
  partDescription: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  estimatedCost: z.coerce.number().min(0, 'Cost must be 0 or greater').optional(),
  vendor: z.string().optional(),
  requestedDate: z.string().min(1, 'Request date is required'),
});

// Validation schema for updating part request
const updatePartRequestSchema = z.object({
  partNumber: z.string().optional(),
  partDescription: z.string().optional(),
  quantity: z.coerce.number().min(1).optional(),
  estimatedCost: z.coerce.number().min(0).optional(),
  actualCost: z.coerce.number().min(0).optional(),
  vendor: z.string().optional(),
  status: z.string().optional(),
  invoiceRef: z.string().optional(),
  trackingNumber: z.string().optional(),
  eta: z.string().optional(),
  receivedDate: z.string().optional(),
  issuedDate: z.string().optional(),
});

type CreatePartRequestFormData = z.infer<typeof createPartRequestSchema>;
type UpdatePartRequestFormData = z.infer<typeof updatePartRequestSchema>;

// Status options for update form
const STATUS_OPTIONS: { value: PartRequestStatus; label: string }[] = [
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ORDERED', label: 'Ordered' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'ISSUED', label: 'Issued' },
];

// Get status color
function getStatusColor(status: PartRequestStatus): { bg: string; text: string } {
  switch (status) {
    case 'REQUESTED':
      return { bg: 'bg-gray-500/10', text: 'text-gray-600' };
    case 'APPROVED':
      return { bg: 'bg-blue-500/10', text: 'text-blue-600' };
    case 'ORDERED':
      return { bg: 'bg-purple-500/10', text: 'text-purple-600' };
    case 'SHIPPED':
      return { bg: 'bg-orange-500/10', text: 'text-orange-600' };
    case 'RECEIVED':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-600' };
    case 'ISSUED':
      return { bg: 'bg-green-500/10', text: 'text-green-600' };
    default:
      return { bg: 'bg-gray-500/10', text: 'text-gray-600' };
  }
}

// Status progression indicator
function StatusProgression({ currentStatus }: { currentStatus: PartRequestStatus }) {
  const statuses: PartRequestStatus[] = ['REQUESTED', 'APPROVED', 'ORDERED', 'SHIPPED', 'RECEIVED', 'ISSUED'];
  const currentIndex = statuses.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1">
      {statuses.map((status, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div key={status} className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                isCompleted 
                  ? isCurrent 
                    ? 'bg-primary' 
                    : 'bg-green-500'
                  : 'bg-muted'
              }`}
              title={PART_REQUEST_STATUS_LABELS[status]}
            />
            {index < statuses.length - 1 && (
              <div className={`w-3 h-0.5 ${isCompleted && index < currentIndex ? 'bg-green-500' : 'bg-muted'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Part request card component
function PartRequestCard({ 
  part, 
  onEdit, 
  canEdit 
}: { 
  part: PartRequest; 
  onEdit: () => void;
  canEdit: boolean;
}) {
  const colors = getStatusColor(part.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">{part.partNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs rounded-full ${colors.bg} ${colors.text}`}>
            {PART_REQUEST_STATUS_LABELS[part.status]}
          </span>
          {canEdit && (
            <button
              onClick={onEdit}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Edit part request"
            >
              <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-3">{part.partDescription}</p>

      {/* Status progression */}
      <div className="mb-3">
        <StatusProgression currentStatus={part.status} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Hash className="w-3 h-3" />
          <span>Qty: {part.quantity}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <DollarSign className="w-3 h-3" />
          <span>
            {part.actualCost !== undefined 
              ? `$${part.actualCost.toLocaleString()} (actual)`
              : part.estimatedCost !== undefined
              ? `$${part.estimatedCost.toLocaleString()} (est.)`
              : '—'}
          </span>
        </div>
        {part.vendor && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="w-3 h-3" />
            <span>{part.vendor}</span>
          </div>
        )}
        {part.trackingNumber && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Truck className="w-3 h-3" />
            <span>{part.trackingNumber}</span>
          </div>
        )}
        {part.eta && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>ETA: {format(new Date(part.eta), 'MMM dd')}</span>
          </div>
        )}
        {part.receivedDate && (
          <div className="flex items-center gap-1.5 text-green-600">
            <CheckCircle2 className="w-3 h-3" />
            <span>Received: {format(new Date(part.receivedDate), 'MMM dd')}</span>
          </div>
        )}
      </div>

      {/* Invoice reference */}
      {part.invoiceRef && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="w-3 h-3" />
            <span>Invoice: {part.invoiceRef}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function PartsTab({ aogEventId, partRequests, onUpdate }: PartsTabProps) {
  const { canWrite } = usePermissions();
  const addPartMutation = useAddPartRequest();
  const updatePartMutation = useUpdatePartRequest();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPart, setEditingPart] = useState<PartRequest | null>(null);

  // Create form
  const createForm = useForm<CreatePartRequestFormData>({
    resolver: zodResolver(createPartRequestSchema) as never,
    defaultValues: {
      partNumber: '',
      partDescription: '',
      quantity: 1,
      estimatedCost: 0,
      vendor: '',
      requestedDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  // Update form
  const updateForm = useForm<UpdatePartRequestFormData>({
    resolver: zodResolver(updatePartRequestSchema) as never,
  });

  const handleAddPart = async (data: CreatePartRequestFormData) => {
    try {
      await addPartMutation.mutateAsync({
        id: aogEventId,
        partRequest: data as CreatePartRequestDto,
      });
      createForm.reset();
      setShowAddForm(false);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to add part request:', error);
    }
  };

  const handleUpdatePart = async (data: UpdatePartRequestFormData) => {
    if (!editingPart) return;
    
    try {
      // Filter out empty values
      const updates: UpdatePartRequestDto = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== '' && value !== undefined) {
          (updates as Record<string, unknown>)[key] = value;
        }
      });

      await updatePartMutation.mutateAsync({
        id: aogEventId,
        partId: editingPart._id,
        updates,
      });
      setEditingPart(null);
      updateForm.reset();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update part request:', error);
    }
  };

  const handleEditClick = (part: PartRequest) => {
    setEditingPart(part);
    updateForm.reset({
      partNumber: part.partNumber,
      partDescription: part.partDescription,
      quantity: part.quantity,
      estimatedCost: part.estimatedCost,
      actualCost: part.actualCost,
      vendor: part.vendor || '',
      status: part.status,
      invoiceRef: part.invoiceRef || '',
      trackingNumber: part.trackingNumber || '',
      eta: part.eta ? format(new Date(part.eta), 'yyyy-MM-dd') : '',
      receivedDate: part.receivedDate ? format(new Date(part.receivedDate), 'yyyy-MM-dd') : '',
      issuedDate: part.issuedDate ? format(new Date(part.issuedDate), 'yyyy-MM-dd') : '',
    });
  };

  // Calculate totals
  const totalEstimated = partRequests.reduce((sum, p) => sum + (p.estimatedCost || 0), 0);
  const totalActual = partRequests.reduce((sum, p) => sum + (p.actualCost || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header with totals */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Parts & Procurement
          </h3>
          {partRequests.length > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">
                Est: <span className="font-medium text-foreground">${totalEstimated.toLocaleString()}</span>
              </span>
              {totalActual > 0 && (
                <span className="text-muted-foreground">
                  Actual: <span className="font-medium text-green-600">${totalActual.toLocaleString()}</span>
                </span>
              )}
            </div>
          )}
        </div>
        {canWrite && !showAddForm && !editingPart && (
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Part
          </Button>
        )}
      </div>

      {/* Add Part Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-muted/30 border border-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-foreground">Add Part Request</h4>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  createForm.reset();
                }}
                className="p-1 rounded hover:bg-muted"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={createForm.handleSubmit(handleAddPart)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Part Number" error={createForm.formState.errors.partNumber} required>
                  <Input {...createForm.register('partNumber')} placeholder="e.g., PN-12345" />
                </FormField>
                <FormField label="Quantity" error={createForm.formState.errors.quantity} required>
                  <Input type="number" min="1" {...createForm.register('quantity')} />
                </FormField>
                <FormField label="Estimated Cost (USD)" error={createForm.formState.errors.estimatedCost}>
                  <Input type="number" min="0" step="0.01" {...createForm.register('estimatedCost')} />
                </FormField>
                <FormField label="Vendor" error={createForm.formState.errors.vendor}>
                  <Input {...createForm.register('vendor')} placeholder="Vendor name" />
                </FormField>
                <FormField label="Request Date" error={createForm.formState.errors.requestedDate} required>
                  <Input type="date" {...createForm.register('requestedDate')} />
                </FormField>
              </div>
              <FormField label="Description" error={createForm.formState.errors.partDescription} required>
                <Textarea {...createForm.register('partDescription')} placeholder="Part description..." />
              </FormField>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setShowAddForm(false);
                  createForm.reset();
                }}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={addPartMutation.isPending}>
                  Add Part
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Part Form */}
      <AnimatePresence>
        {editingPart && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-muted/30 border border-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-foreground">Edit Part Request: {editingPart.partNumber}</h4>
              <button
                onClick={() => {
                  setEditingPart(null);
                  updateForm.reset();
                }}
                className="p-1 rounded hover:bg-muted"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={updateForm.handleSubmit(handleUpdatePart)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Status">
                  <Select {...updateForm.register('status')} options={STATUS_OPTIONS} />
                </FormField>
                <FormField label="Actual Cost (USD)">
                  <Input type="number" min="0" step="0.01" {...updateForm.register('actualCost')} />
                </FormField>
                <FormField label="Invoice Reference">
                  <Input {...updateForm.register('invoiceRef')} placeholder="INV-12345" />
                </FormField>
                <FormField label="Tracking Number">
                  <Input {...updateForm.register('trackingNumber')} placeholder="Tracking #" />
                </FormField>
                <FormField label="ETA">
                  <Input type="date" {...updateForm.register('eta')} />
                </FormField>
                <FormField label="Received Date">
                  <Input type="date" {...updateForm.register('receivedDate')} />
                </FormField>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setEditingPart(null);
                  updateForm.reset();
                }}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={updatePartMutation.isPending}>
                  Update Part
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parts list */}
      {partRequests.length === 0 ? (
        <div className="bg-muted/30 rounded-xl p-8 text-center">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No part requests yet.</p>
          {canWrite && (
            <p className="text-sm text-muted-foreground mt-1">
              Click "Add Part" to create a part request.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partRequests.map((part) => (
            <PartRequestCard
              key={part._id}
              part={part}
              onEdit={() => handleEditClick(part)}
              canEdit={canWrite && !editingPart && !showAddForm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PartsTab;
