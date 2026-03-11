import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Plane, Clock, AlertTriangle, CheckCircle2, Filter, X, Layers, MapPin } from 'lucide-react';
import { Button, Input, Select, Textarea, FormField } from '@/components/ui/Form';
import { Dialog } from '@/components/ui/Dialog';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { CategoryBadge } from '@/components/aog/CategoryBadge';
import { useAOGEvents, useCreateAOGEvent } from '@/hooks/useAOGEvents';
import { useAircraft } from '@/hooks/useAircraft';

interface AOGEventFilter {
  aircraftId?: string;
  fleetGroup?: string;
  status?: 'active' | 'completed';
  startDate?: string;
  endDate?: string;
}

const FLEET_GROUPS = [
  { value: 'A330', label: 'A330' }, { value: 'A340', label: 'A340' },
  { value: 'G650ER', label: 'G650ER' }, { value: 'Cessna', label: 'Cessna' },
  { value: 'Hawker', label: 'Hawker' }, { value: 'A320', label: 'A320' },
  { value: 'A319', label: 'A319' }, { value: 'A318', label: 'A318' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const createEventSchema = z.object({
  aircraftId: z.string().min(1, 'Aircraft is required'),
  detectedAt: z.string().min(1, 'Detected date is required'),
  location: z.string().optional(),
  notes: z.string().optional(),
});
type CreateEventFormData = z.infer<typeof createEventSchema>;

interface ToastState { message: string; type: 'success' | 'error' }


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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Plane className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">No AOG Events</h3>
      <p className="text-sm text-muted-foreground max-w-sm">No events match your current filters. Try adjusting the filters or create a new event.</p>
    </div>
  );
}

function FilterBar({ filters, onFilterChange }: { filters: AOGEventFilter; onFilterChange: (f: AOGEventFilter) => void }) {
  const { data: aircraftData } = useAircraft();
  const aircraftList = aircraftData?.data || [];
  const aircraftOptions = [{ value: '', label: 'All Aircraft' }, ...aircraftList.map((a) => ({ value: a._id || a.id || '', label: a.registration }))];
  const fleetGroupOptions = [{ value: '', label: 'All Fleet Groups' }, ...FLEET_GROUPS];
  const hasActiveFilters = filters.aircraftId || filters.fleetGroup || filters.status || filters.startDate || filters.endDate;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Filters</span>
        {hasActiveFilters && (
          <button onClick={() => onFilterChange({})} className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Select options={aircraftOptions} value={filters.aircraftId || ''} onChange={(e) => onFilterChange({ ...filters, aircraftId: e.target.value || undefined })} />
        <Select options={fleetGroupOptions} value={filters.fleetGroup || ''} onChange={(e) => onFilterChange({ ...filters, fleetGroup: e.target.value || undefined })} />
        <Select options={STATUS_OPTIONS} value={filters.status || ''} onChange={(e) => onFilterChange({ ...filters, status: (e.target.value as 'active' | 'completed') || undefined })} />
        <Input type="date" value={filters.startDate || ''} onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value || undefined })} placeholder="Start date" />
        <Input type="date" value={filters.endDate || ''} onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value || undefined })} placeholder="End date" />
      </div>
    </div>
  );
}


function CreateEventDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const { data: aircraftData } = useAircraft();
  const aircraftList = aircraftData?.data || [];
  const createMutation = useCreateAOGEvent();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { aircraftId: '', detectedAt: '', location: '', notes: '' },
  });
  const aircraftOptions = aircraftList.map((a) => ({ value: a._id || a.id || '', label: a.registration }));

  const onSubmit = async (data: CreateEventFormData) => {
    try {
      await createMutation.mutateAsync({
        aircraftId: data.aircraftId,
        detectedAt: new Date(data.detectedAt).toISOString(),
        location: data.location || undefined,
        notes: data.notes || undefined,
      });
      reset();
      onSuccess();
    } catch {
      // mutation error state handles display
    }
  };
  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} title="Create AOG Event" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Aircraft" error={errors.aircraftId} required>
          <Select options={aircraftOptions} error={!!errors.aircraftId} {...register('aircraftId')} />
        </FormField>
        <FormField label="Detected At" error={errors.detectedAt} required>
          <Input type="datetime-local" error={!!errors.detectedAt} {...register('detectedAt')} />
        </FormField>
        <FormField label="Location (ICAO Code)" error={errors.location}>
          <Input placeholder="e.g. OERK" {...register('location')} />
        </FormField>
        <FormField label="Notes" error={errors.notes}>
          <Textarea placeholder="Optional notes about this event..." {...register('notes')} />
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          <Button type="submit" isLoading={createMutation.isPending}>Create Event</Button>
        </div>
        {createMutation.isError && <p className="text-sm text-destructive mt-2">Failed to create event. Please try again.</p>}
      </form>
    </Dialog>
  );
}


export function AOGListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AOGEventFilter>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const { data: events, isLoading, isError } = useAOGEvents(Object.keys(filters).length > 0 ? filters : undefined);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleCreateSuccess = () => { setCreateDialogOpen(false); showToast('AOG event created successfully', 'success'); };

  const sortedEvents = events
    ? [...events].sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AOG Events</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage aircraft grounding incidents</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}><Plus className="w-4 h-4" /> Create Event</Button>
      </div>

      <FilterBar filters={filters} onFilterChange={setFilters} />

      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : isError ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <p className="text-sm text-destructive font-medium">Failed to load AOG events</p>
          <p className="text-xs text-muted-foreground mt-1">Please try refreshing the page.</p>
        </div>
      ) : sortedEvents.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Aircraft</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Detected</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cleared</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categories</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Sub-Events</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Downtime (hrs)</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedEvents.map((event) => (
                  <motion.tr key={event._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/aog/${event._id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground">{event.aircraft?.registration || '\u2014'}</span>
                        {event.aircraft?.fleetGroup && <span className="text-xs text-muted-foreground">({event.aircraft.fleetGroup})</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {event.location
                        ? <div className="flex items-center gap-1.5 text-foreground"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />{event.location}</div>
                        : <span className="text-muted-foreground">{'\u2014'}</span>}
                    </td>
                    <td className="px-4 py-3 text-foreground">{format(new Date(event.detectedAt), 'dd MMM yyyy HH:mm')}</td>
                    <td className="px-4 py-3">
                      {event.clearedAt
                        ? <span className="text-foreground">{format(new Date(event.clearedAt), 'dd MMM yyyy HH:mm')}</span>
                        : <StatusBadge status="active" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {event.categories && event.categories.length > 0
                          ? event.categories.map((cat) => <CategoryBadge key={cat} category={cat as 'aog' | 'scheduled' | 'unscheduled'} showTooltip={false} />)
                          : <span className="text-xs text-muted-foreground italic">No sub-events</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5 text-foreground"><Layers className="w-3.5 h-3.5 text-muted-foreground" />{event.subEventCount}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 text-foreground font-medium"><Clock className="w-3.5 h-3.5 text-muted-foreground" />{event.totalDowntimeHours.toFixed(1)}</div>
                    </td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={event.status} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border bg-muted/30 text-xs text-muted-foreground">
            Showing {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <CreateEventDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onSuccess={handleCreateSuccess} />
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
