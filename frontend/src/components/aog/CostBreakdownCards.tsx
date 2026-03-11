import { useState } from 'react';
import { DollarSign, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Form';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useCostEntries,
  useDeleteCostEntry,
  type CostEntryDepartment,
  type CostEntryResponse,
} from '@/hooks/useAOGCostEntries';
import { usePermissions } from '@/hooks/usePermissions';
import { CostEntryFormDialog } from './CostEntryFormDialog';

// ── Constants ──────────────────────────────────────────────────────────────────

const DEPT_COLORS: Record<CostEntryDepartment, string> = {
  QC: 'bg-amber-500/15 text-amber-700 border-amber-500/40',
  Engineering: 'bg-blue-500/15 text-blue-700 border-blue-500/40',
  'Project Management': 'bg-purple-500/15 text-purple-700 border-purple-500/40',
  Procurement: 'bg-teal-500/15 text-teal-700 border-teal-500/40',
  Technical: 'bg-slate-500/15 text-slate-700 border-slate-500/40',
  Others: 'bg-green-500/15 text-green-700 border-green-500/40',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ── Single Entry Card ──────────────────────────────────────────────────────────

function CostEntryCard({
  entry,
  parentId,
  canWrite,
  onEdit,
  onDeleted,
  showToast,
}: {
  entry: CostEntryResponse;
  parentId: string;
  canWrite: boolean;
  onEdit: (entry: CostEntryResponse) => void;
  onDeleted: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteMutation = useDeleteCostEntry();
  const deptColor = DEPT_COLORS[entry.department] || 'bg-gray-500/15 text-gray-700 border-gray-500/40';
  const total = entry.internalCost + entry.externalCost;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ parentId, entryId: entry._id });
      showToast('Cost entry deleted', 'success');
      onDeleted();
    } catch {
      showToast('Failed to delete cost entry', 'error');
    }
    setConfirmDelete(false);
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${deptColor}`}
        >
          {entry.department}
        </span>
        {canWrite && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(entry)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Cost grid */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Internal</p>
          <p className="font-medium text-foreground">{formatUSD(entry.internalCost)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">External</p>
          <p className="font-medium text-foreground">{formatUSD(entry.externalCost)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-semibold text-foreground">{formatUSD(total)}</p>
        </div>
      </div>

      {/* Note */}
      {entry.note && (
        <p className="text-xs text-muted-foreground border-t border-border pt-2">{entry.note}</p>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Cost Entry"
        maxWidth="sm"
      >
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to delete this cost entry? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            isLoading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface CostBreakdownCardsProps {
  parentId: string;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export function CostBreakdownCards({ parentId, showToast }: CostBreakdownCardsProps) {
  const { data: entries, isLoading } = useCostEntries(parentId);
  const { canWrite } = usePermissions();

  const [editingEntry, setEditingEntry] = useState<CostEntryResponse | null>(null);
  const [showForm, setShowForm] = useState(false);

  const totalInternal = (entries || []).reduce((sum, e) => sum + e.internalCost, 0);
  const totalExternal = (entries || []).reduce((sum, e) => sum + e.externalCost, 0);
  const grandTotal = totalInternal + totalExternal;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Summary row */}
      {entries && entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Total Internal', value: totalInternal, accent: 'border-l-blue-500' },
            { label: 'Total External', value: totalExternal, accent: 'border-l-amber-500' },
            { label: 'Grand Total', value: grandTotal, accent: 'border-l-green-500' },
          ].map((item) => (
            <div
              key={item.label}
              className={`bg-muted/40 border border-border rounded-lg p-3 border-l-4 ${item.accent}`}
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-base font-bold mt-0.5">{formatUSD(item.value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Entry cards */}
      {!entries || entries.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No cost breakdowns yet. Click "Add Cost Breakdown" to record costs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {entries.map((entry) => (
            <CostEntryCard
              key={entry._id}
              entry={entry}
              parentId={parentId}
              canWrite={canWrite}
              onEdit={(e) => {
                setEditingEntry(e);
                setShowForm(true);
              }}
              onDeleted={() => {}}
              showToast={showToast}
            />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <CostEntryFormDialog
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingEntry(null);
        }}
        parentId={parentId}
        editingEntry={editingEntry}
        onSuccess={(msg) => showToast(msg, 'success')}
        onError={(msg) => showToast(msg, 'error')}
      />
    </>
  );
}
