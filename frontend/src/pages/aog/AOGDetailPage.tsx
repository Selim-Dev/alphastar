import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInHours } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plane, MapPin, Clock, Wrench, ChevronDown, ChevronUp,
  Plus, Trash2, Pencil, AlertTriangle, CheckCircle2, X, Users, Timer,
} from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui/Form';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { CategoryBadge } from '@/components/aog/CategoryBadge';
import { useAOGEventById, useUpdateAOGEvent, useDeleteAOGEvent } from '@/hooks/useAOGEvents';
import { useDeleteSubEvent } from '@/hooks/useAOGSubEvents';
import { SubEventFormDialog } from '@/components/aog/SubEventFormDialog';
import { CostBreakdownCards } from '@/components/aog/CostBreakdownCards';
import { CostEntryFormDialog } from '@/components/aog/CostEntryFormDialog';
import { usePermissions } from '@/hooks/usePermissions';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SubEventResponse {
  _id: string;
  parentEventId: string;
  category: 'aog' | 'scheduled' | 'unscheduled';
  reasonCode: string;
  actionTaken: string;
  detectedAt: string;
  clearedAt: string | null;
  manpowerCount: number;
  manHours: number;
  departmentHandoffs: DepartmentHandoffResponse[];
  technicalTimeHours: number;
  departmentTimeHours: number;
  departmentTimeTotals: Record<string, number>;
  totalDowntimeHours: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DepartmentHandoffResponse {
  _id: string;
  department: 'QC' | 'Engineering' | 'Project Management' | 'Procurement' | 'Technical' | 'MCC' | 'Others';
  sentAt: string;
  returnedAt: string | null;
  notes: string | null;
}

interface ToastState { message: string; type: 'success' | 'error' }

// ── Toast ──────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: ToastState & { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
    >
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
      {message}
      <button onClick={onClose} className="ml-2 hover:opacity-80"><X className="w-3.5 h-3.5" /></button>
    </motion.div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'active' | 'completed' }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/15 text-red-600 border border-red-500/30">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
        </span>
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/15 text-green-600 border border-green-500/30">
      <CheckCircle2 className="w-3 h-3" /> Completed
    </span>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────────

function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-7 w-64" />
      </div>
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Department Colors ──────────────────────────────────────────────────────────

const DEPT_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  QC: { bg: 'bg-amber-500/15', text: 'text-amber-600', bar: 'bg-amber-500' },
  Engineering: { bg: 'bg-blue-500/15', text: 'text-blue-600', bar: 'bg-blue-500' },
  'Project Management': { bg: 'bg-purple-500/15', text: 'text-purple-600', bar: 'bg-purple-500' },
  Procurement: { bg: 'bg-teal-500/15', text: 'text-teal-600', bar: 'bg-teal-500' },
  Technical: { bg: 'bg-orange-500/15', text: 'text-orange-600', bar: 'bg-orange-500' },
  MCC: { bg: 'bg-cyan-500/15', text: 'text-cyan-600', bar: 'bg-cyan-500' },
  Others: { bg: 'bg-green-500/15', text: 'text-green-600', bar: 'bg-green-500' },
};

// ── Time Breakdown Summary (Task 12.2) ────────────────────────────────────────

function TimeBreakdownSummary({
  totalTechnicalTime,
  totalDepartmentTime,
  subEvents,
}: {
  totalTechnicalTime: number;
  totalDepartmentTime: number;
  subEvents: SubEventResponse[];
}) {
  const departmentBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const se of subEvents) {
      if (se.departmentTimeTotals) {
        for (const [dept, hours] of Object.entries(se.departmentTimeTotals)) {
          totals[dept] = (totals[dept] || 0) + hours;
        }
      }
    }
    return totals;
  }, [subEvents]);

  const grandTotal = totalTechnicalTime + totalDepartmentTime;
  if (grandTotal === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Timer className="w-4 h-4 text-muted-foreground" /> Time Breakdown
        </h3>
        <p className="text-sm text-muted-foreground">No time data available yet. Add sub-events to see the breakdown.</p>
      </div>
    );
  }

  const techPct = grandTotal > 0 ? (totalTechnicalTime / grandTotal) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Timer className="w-4 h-4 text-muted-foreground" /> Time Breakdown
      </h3>
      <div className="space-y-3">
        {/* Technical Time */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-foreground font-medium flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-muted-foreground" /> Technical
            </span>
            <span className="text-muted-foreground">{totalTechnicalTime.toFixed(1)}h ({techPct.toFixed(0)}%)</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-slate-500 rounded-full transition-all" style={{ width: `${techPct}%` }} />
          </div>
        </div>
        {/* Per-department */}
        {Object.entries(departmentBreakdown).map(([dept, hours]) => {
          const pct = grandTotal > 0 ? (hours / grandTotal) * 100 : 0;
          const colors = DEPT_COLORS[dept] || { bar: 'bg-gray-500' };
          return (
            <div key={dept}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-foreground font-medium">{dept}</span>
                <span className="text-muted-foreground">{hours.toFixed(1)}h ({pct.toFixed(0)}%)</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${colors.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total</span>
        <span className="font-semibold text-foreground">{grandTotal.toFixed(1)} hours</span>
      </div>
    </div>
  );
}

// ── Handoff Row ────────────────────────────────────────────────────────────────

function HandoffRow({ handoff }: { handoff: DepartmentHandoffResponse }) {
  const colors = DEPT_COLORS[handoff.department] || { bg: 'bg-gray-500/15', text: 'text-gray-600' };
  const durationHours = handoff.returnedAt
    ? differenceInHours(new Date(handoff.returnedAt), new Date(handoff.sentAt))
    : null;

  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded-md bg-muted/30">
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${colors.bg} ${colors.text} shrink-0 mt-0.5`}>
        {handoff.department}
      </span>
      <div className="flex-1 min-w-0 text-sm">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          <span>Sent: {format(new Date(handoff.sentAt), 'dd MMM yyyy HH:mm')}</span>
          <span>
            Returned: {handoff.returnedAt
              ? format(new Date(handoff.returnedAt), 'dd MMM yyyy HH:mm')
              : <span className="text-amber-600 font-medium">Pending</span>}
          </span>
          {durationHours !== null && (
            <span className="font-medium text-foreground">{durationHours}h</span>
          )}
        </div>
        {handoff.notes && <p className="text-xs text-muted-foreground mt-1">{handoff.notes}</p>}
      </div>
    </div>
  );
}

// ── Sub-Event Card (Task 12.3) ─────────────────────────────────────────────────

function SubEventCard({
  subEvent,
  parentId,
  onEdit,
  onDeleted,
  showToast,
}: {
  subEvent: SubEventResponse;
  parentId: string;
  onEdit: (se: SubEventResponse) => void;
  onDeleted: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteMutation = useDeleteSubEvent();
  const isActive = !subEvent.clearedAt;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ parentId, subId: subEvent._id });
      showToast('Sub-event deleted', 'success');
      onDeleted();
    } catch {
      showToast('Failed to delete sub-event', 'error');
    }
    setConfirmDelete(false);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Card header — clickable to expand */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <CategoryBadge category={subEvent.category} showTooltip={false} />
        <span className="text-sm font-medium text-foreground truncate flex-1">{subEvent.reasonCode}</span>
        <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
          <span>Tech: {subEvent.technicalTimeHours.toFixed(1)}h</span>
          <span>Dept: {subEvent.departmentTimeHours.toFixed(1)}h</span>
          <span>{format(new Date(subEvent.detectedAt), 'dd MMM yyyy')}</span>
        </div>
        <StatusBadge status={isActive ? 'active' : 'completed'} />
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border space-y-4">
              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Detected</span>
                  <p className="text-foreground">{format(new Date(subEvent.detectedAt), 'dd MMM yyyy HH:mm')}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Cleared</span>
                  <p className="text-foreground">{subEvent.clearedAt ? format(new Date(subEvent.clearedAt), 'dd MMM yyyy HH:mm') : '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Manpower</span>
                  <p className="text-foreground flex items-center gap-1"><Users className="w-3.5 h-3.5 text-muted-foreground" />{subEvent.manpowerCount} ({subEvent.manHours}h)</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Total Downtime</span>
                  <p className="text-foreground font-medium">{subEvent.totalDowntimeHours.toFixed(1)}h</p>
                </div>
              </div>

              {/* Action taken */}
              <div>
                <span className="text-xs text-muted-foreground">Action Taken</span>
                <p className="text-sm text-foreground mt-0.5">{subEvent.actionTaken}</p>
              </div>

              {subEvent.notes && (
                <div>
                  <span className="text-xs text-muted-foreground">Notes</span>
                  <p className="text-sm text-foreground mt-0.5">{subEvent.notes}</p>
                </div>
              )}

              {/* Department Handoffs */}
              {subEvent.departmentHandoffs.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground mb-2 block">Department Handoffs ({subEvent.departmentHandoffs.length})</span>
                  <div className="space-y-2">
                    {subEvent.departmentHandoffs.map((h) => (
                      <HandoffRow key={h._id} handoff={h} />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => onEdit(subEvent)}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete Sub-Event" maxWidth="sm">
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to delete this sub-event? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} isLoading={deleteMutation.isPending}>Delete</Button>
        </div>
      </Dialog>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────────

export function AOGDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canWrite, isSuperAdmin } = usePermissions();

  const { data: event, isLoading, isError } = useAOGEventById(id || null);
  const updateMutation = useUpdateAOGEvent();
  const deleteMutation = useDeleteAOGEvent();

  // Inline edit state
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationValue, setLocationValue] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [editingClearedAt, setEditingClearedAt] = useState(false);
  const [clearedAtValue, setClearedAtValue] = useState('');

  // Sub-event form state
  const [showSubEventForm, setShowSubEventForm] = useState(false);
  const [editingSubEvent, setEditingSubEvent] = useState<SubEventResponse | null>(null);

  // Cost entry form state
  const [showCostEntryForm, setShowCostEntryForm] = useState(false);

  // Delete confirmation
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Inline save helpers ──────────────────────────────────────────────────────

  const saveLocation = async (value: string) => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, location: value || undefined });
      showToast('Location updated', 'success');
    } catch {
      showToast('Failed to update location', 'error');
    }
    setEditingLocation(false);
  };

  const saveClearedAt = async (value: string) => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, clearedAt: value ? new Date(value).toISOString() : undefined });
      showToast('Cleared date updated', 'success');
    } catch {
      showToast('Failed to update cleared date', 'error');
    }
    setEditingClearedAt(false);
  };

  const saveNotes = async (value: string) => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, notes: value || undefined });
      showToast('Notes updated', 'success');
    } catch {
      showToast('Failed to update notes', 'error');
    }
    setEditingNotes(false);
  };

  const handleDeleteEvent = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast('Event deleted', 'success');
      navigate('/aog/list');
    } catch {
      showToast('Failed to delete event', 'error');
    }
    setConfirmDeleteEvent(false);
  };

  // ── Loading / Error states ───────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/aog/list')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </button>
        <DetailPageSkeleton />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/aog/list')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </button>
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <p className="text-sm text-destructive font-medium">Event not found</p>
          <p className="text-xs text-muted-foreground mt-1">The event may have been deleted or the ID is invalid.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/aog/list')}>Return to List</Button>
        </div>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────────

  const subEvents: SubEventResponse[] = event.subEvents || [];

  // Format clearedAt for datetime-local input
  const clearedAtInputValue = event.clearedAt
    ? format(new Date(event.clearedAt), "yyyy-MM-dd'T'HH:mm")
    : '';

  return (
    <div className="space-y-6">
      {/* ── Back button + Title ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/aog/list')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </button>
        {isSuperAdmin && (
          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setConfirmDeleteEvent(true)}>
            <Trash2 className="w-3.5 h-3.5" /> Delete Event
          </Button>
        )}
      </div>

      {/* ── Header Card (Task 12.1) ──────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        {/* Top row: aircraft + status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Plane className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {event.aircraft?.registration || 'Unknown Aircraft'}
              </h1>
              {event.aircraft?.fleetGroup && (
                <span className="text-sm text-muted-foreground">{event.aircraft.fleetGroup}</span>
              )}
            </div>
          </div>
          <StatusBadge status={event.status} />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Location — inline editable */}
          <div>
            <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3" /> Location
            </span>
            {editingLocation ? (
              <Input
                autoFocus
                value={locationValue}
                onChange={(e) => setLocationValue(e.target.value)}
                onBlur={() => saveLocation(locationValue)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveLocation(locationValue); if (e.key === 'Escape') setEditingLocation(false); }}
                placeholder="e.g. OERK"
                className="h-8 text-sm"
              />
            ) : (
              <button
                type="button"
                onClick={() => { setLocationValue(event.location || ''); setEditingLocation(true); }}
                className="text-sm text-foreground hover:text-primary transition-colors text-left"
                title="Click to edit"
              >
                {event.location || <span className="text-muted-foreground italic">Click to set</span>}
              </button>
            )}
          </div>

          {/* Detected date — read only */}
          <div>
            <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3" /> Detected
            </span>
            <p className="text-sm text-foreground">{format(new Date(event.detectedAt), 'dd MMM yyyy HH:mm')}</p>
          </div>

          {/* Cleared date — editable */}
          <div>
            <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <CheckCircle2 className="w-3 h-3" /> Cleared
            </span>
            {editingClearedAt ? (
              <div className="flex items-center gap-1.5">
                <Input
                  autoFocus
                  type="datetime-local"
                  value={clearedAtValue}
                  onChange={(e) => setClearedAtValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveClearedAt(clearedAtValue);
                    if (e.key === 'Escape') setEditingClearedAt(false);
                  }}
                  className="h-8 text-sm"
                />
                <Button size="sm" className="h-8 px-2 shrink-0" onClick={() => saveClearedAt(clearedAtValue)}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-2 shrink-0" onClick={() => setEditingClearedAt(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setClearedAtValue(event.clearedAt ? format(new Date(event.clearedAt), "yyyy-MM-dd'T'HH:mm") : '');
                  setEditingClearedAt(true);
                }}
                className="text-sm text-foreground hover:text-primary transition-colors text-left"
                title="Click to edit"
              >
                {event.clearedAt
                  ? format(new Date(event.clearedAt), 'dd MMM yyyy HH:mm')
                  : <span className="text-muted-foreground italic">Click to set</span>}
              </button>
            )}
          </div>

          {/* Total downtime */}
          <div>
            <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <Timer className="w-3 h-3" /> Total Downtime
            </span>
            <p className="text-sm font-semibold text-foreground">{event.totalDowntimeHours.toFixed(1)} hours</p>
          </div>
        </div>

        {/* Notes — inline editable */}
        <div>
          <span className="text-xs text-muted-foreground mb-1 block">Notes</span>
          {editingNotes ? (
            <Textarea
              autoFocus
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={() => saveNotes(notesValue)}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditingNotes(false); }}
              placeholder="Add notes about this event..."
              rows={3}
              className="text-sm"
            />
          ) : (
            <button
              type="button"
              onClick={() => { setNotesValue(event.notes || ''); setEditingNotes(true); }}
              className="text-sm text-foreground hover:text-primary transition-colors text-left w-full min-h-[2rem]"
              title="Click to edit"
            >
              {event.notes || <span className="text-muted-foreground italic">Click to add notes...</span>}
            </button>
          )}
        </div>
      </div>

      {/* ── Time Breakdown Summary (Task 12.2) ───────────────────────────────── */}
      <TimeBreakdownSummary
        totalTechnicalTime={event.totalTechnicalTime}
        totalDepartmentTime={event.totalDepartmentTime}
        subEvents={subEvents}
      />

      {/* ── Sub-Events List (Task 12.3) ──────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Sub-Events ({subEvents.length})
          </h3>
          <div className="flex items-center gap-2">
            {canWrite && (
              <Button size="sm" variant="outline" onClick={() => setShowCostEntryForm(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Cost Breakdown
              </Button>
            )}
            <Button size="sm" onClick={() => { setEditingSubEvent(null); setShowSubEventForm(true); }}>
              <Plus className="w-3.5 h-3.5" /> Add Sub-Event
            </Button>
          </div>
        </div>

        {subEvents.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Wrench className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No sub-events yet. Add one to start tracking maintenance activities.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {subEvents.map((se) => (
              <SubEventCard
                key={se._id}
                subEvent={se}
                parentId={event._id}
                onEdit={(se) => { setEditingSubEvent(se); setShowSubEventForm(true); }}
                onDeleted={() => showToast('Sub-event deleted', 'success')}
                showToast={showToast}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Cost Breakdown Section ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          Cost Breakdown
        </h3>
        <CostBreakdownCards parentId={event._id} showToast={showToast} />
      </div>

      {/* ── Sub-Event Form Dialog (Task 13) ──────────────────────────────────── */}
      <SubEventFormDialog
        open={showSubEventForm}
        onClose={() => { setShowSubEventForm(false); setEditingSubEvent(null); }}
        parentId={event._id}
        editingSubEvent={editingSubEvent}
        onSuccess={(msg) => showToast(msg, 'success')}
        onError={(msg) => showToast(msg, 'error')}
      />

      {/* ── Cost Entry Form Dialog ───────────────────────────────────────────── */}
      <CostEntryFormDialog
        open={showCostEntryForm}
        onClose={() => setShowCostEntryForm(false)}
        parentId={event._id}
        onSuccess={(msg) => showToast(msg, 'success')}
        onError={(msg) => showToast(msg, 'error')}
      />

      {/* ── Delete Event Confirmation Dialog ─────────────────────────────────── */}
      <Dialog open={confirmDeleteEvent} onClose={() => setConfirmDeleteEvent(false)} title="Delete AOG Event" maxWidth="sm">
        <p className="text-sm text-muted-foreground mb-2">
          Are you sure you want to delete this event and all its sub-events?
        </p>
        <p className="text-sm text-destructive font-medium mb-4">This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDeleteEvent(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDeleteEvent} isLoading={deleteMutation.isPending}>Delete Event</Button>
        </div>
      </Dialog>

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
