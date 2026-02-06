import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import { 
  ArrowLeft, 
  Plane, 
  Clock, 
  Users, 
  AlertCircle, 
  History, 
  Package, 
  Paperclip, 
  Wallet, 
  Edit2,
  Calendar,
  Tag,
  Building2,
  FileText,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/Form';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { MilestoneTimeline, MilestoneEditForm, MilestoneHistory, NextStepActionPanel, PartsTab, CostsTab, AttachmentsTab, EventTimeline, RelatedEvents, AOGEventEditForm } from '@/components/aog';
import { useAOGEventById, useAOGEvents } from '@/hooks/useAOGEvents';
import { useAircraft } from '@/hooks/useAircraft';
import type { Aircraft, AOGEvent } from '@/types';

type TabId = 'milestones' | 'history' | 'parts' | 'costs' | 'attachments';

function formatAgeDuration(detectedAt: Date, clearedAt?: Date): string {
  const endDate = clearedAt ? new Date(clearedAt) : new Date();
  const diffHours = differenceInHours(endDate, detectedAt);
  const diffDays = differenceInDays(endDate, detectedAt);
  if (diffHours < 1) return '<1 hour';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours % 24}h`;
  return `${diffDays} days`;
}

/** Loading skeleton for the detail page */
function DetailPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-5 w-48 bg-muted rounded" />
      
      {/* Header skeleton */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted" />
            <div className="space-y-2">
              <div className="h-7 w-32 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          </div>
          <div className="h-8 w-24 bg-muted rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 bg-muted rounded" />
              <div className="space-y-1">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-5 w-20 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Metrics skeleton */}
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-3">
            <div className="h-3 w-16 bg-muted rounded mb-2" />
            <div className="h-6 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>
      
      {/* Tabs skeleton */}
      <div className="flex gap-2 border-b border-border pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-28 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}



/** Simplified cost summary component */
function SimplifiedCostSummary({ event }: { event: AOGEvent }) {
  const internalCost = event.internalCost ?? event.costLabor ?? 0;
  const externalCost = event.externalCost ?? (event.costParts ?? 0) + (event.costExternal ?? 0);
  const totalCost = internalCost + externalCost;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-muted/30 rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-1">Internal Cost</p>
        <p className="text-lg font-bold text-foreground">${internalCost.toLocaleString()}</p>
      </div>
      <div className="bg-muted/30 rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-1">External Cost</p>
        <p className="text-lg font-bold text-foreground">${externalCost.toLocaleString()}</p>
      </div>
      <div className="bg-primary/10 rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
        <p className="text-lg font-bold text-primary">${totalCost.toLocaleString()}</p>
      </div>
    </div>
  );
}

/** Downtime metrics summary component with visual progress bars */
function DowntimeMetricsSummary({ event }: { event: AOGEvent }) {
  const technicalHours = event.technicalTimeHours ?? 0;
  const procurementHours = event.procurementTimeHours ?? 0;
  const opsHours = event.opsTimeHours ?? 0;
  const totalHours = event.totalDowntimeHours ?? 0;
  
  // Calculate percentages for visual bars
  const maxHours = Math.max(technicalHours, procurementHours, opsHours, 1);
  const technicalPct = (technicalHours / maxHours) * 100;
  const procurementPct = (procurementHours / maxHours) * 100;
  const opsPct = (opsHours / maxHours) * 100;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Downtime Breakdown
        </h3>
        <span className="text-xs text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{totalHours.toFixed(1)}h</span>
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Technical */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Technical</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{technicalHours.toFixed(1)}h</span>
          </div>
          <div className="h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${technicalPct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground">Troubleshooting & installation</p>
        </div>
        
        {/* Procurement */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Procurement</span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{procurementHours.toFixed(1)}h</span>
          </div>
          <div className="h-2 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${procurementPct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              className="h-full bg-amber-500 rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground">Waiting for parts</p>
        </div>
        
        {/* Ops */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Operations</span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{opsHours.toFixed(1)}h</span>
          </div>
          <div className="h-2 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${opsPct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
              className="h-full bg-purple-500 rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground">Testing & validation</p>
        </div>
      </div>
    </div>
  );
}

/** Info card component for consistent styling */
function InfoCard({ icon: Icon, label, value, subValue, className = '' }: { 
  icon: React.ElementType; 
  label: string; 
  value: string | React.ReactNode; 
  subValue?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground truncate">{value}</p>
        {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
      </div>
    </div>
  );
}

export function AOGDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('milestones');
  const [isEditingMilestones, setIsEditingMilestones] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: event, isLoading: eventLoading, refetch } = useAOGEventById(id || null);
  const { data: aircraftData, isLoading: aircraftLoading } = useAircraft();
  
  // Fetch related events for the same aircraft
  const { data: relatedEventsData } = useAOGEvents(
    event?.aircraftId ? { aircraftId: event.aircraftId } : undefined
  );
  const relatedEvents = relatedEventsData || [];

  // Find aircraft for this event - aircraftData is PaginatedResponse
  // Backend may return 'id' or '_id' depending on serialization
  const aircraftList = aircraftData?.data || [];
  const aircraft = aircraftList.find((a: Aircraft) => {
    const aircraftId = a._id || a.id;
    return aircraftId === event?.aircraftId;
  });

  // Determine if event is legacy (no milestone fields)
  const isLegacy = event?.isLegacy ?? false;

  // Determine if event is active (not cleared)
  const isActive = !event?.clearedAt;

  // Extract milestone timestamps
  const milestoneTimestamps = event ? {
    reportedAt: event.reportedAt || event.detectedAt,
    procurementRequestedAt: event.procurementRequestedAt,
    availableAtStoreAt: event.availableAtStoreAt,
    issuedBackAt: event.issuedBackAt,
    installationCompleteAt: event.installationCompleteAt,
    testStartAt: event.testStartAt,
    upAndRunningAt: event.upAndRunningAt || event.clearedAt,
  } : {};

  // Computed metrics
  const computedMetrics = event ? {
    technicalTimeHours: event.technicalTimeHours ?? 0,
    procurementTimeHours: event.procurementTimeHours ?? 0,
    opsTimeHours: event.opsTimeHours ?? 0,
    totalDowntimeHours: event.totalDowntimeHours ?? 0,
  } : undefined;

  // Copy event ID to clipboard
  const handleCopyId = () => {
    if (event?._id) {
      navigator.clipboard.writeText(event._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Show loading skeleton
  if (eventLoading || aircraftLoading) {
    return <DetailPageSkeleton />;
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">AOG event not found</p>
        <Button variant="outline" onClick={() => navigate('/aog/list')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to AOG List
        </Button>
      </div>
    );
  }

  const detectedDate = new Date(event.detectedAt);
  const clearedDate = event.clearedAt ? new Date(event.clearedAt) : undefined;

  // Calculate total cost for quick display
  const internalCost = event.internalCost ?? event.costLabor ?? 0;
  const externalCost = event.externalCost ?? (event.costParts ?? 0) + (event.costExternal ?? 0);
  const totalCost = internalCost + externalCost;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'AOG Events', path: '/aog/list' },
          { label: aircraft?.registration || 'AOG Event' },
        ]}
      />

      {/* Prominent Status Badge - Requirements 3.1, 3.2 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center mb-6"
      >
        {isActive ? (
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-500 text-white shadow-lg shadow-red-500/30">
            <div className="relative flex">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full bg-white h-4 w-4"></span>
            </div>
            <span className="text-2xl font-bold tracking-wide">ACTIVE</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-green-500 text-white shadow-lg shadow-green-500/30">
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-2xl font-bold tracking-wide">RESOLVED</span>
          </div>
        )}
      </motion.div>

      {/* Visual Timeline - Requirements 3.6, 10.1 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <EventTimeline
          detectedAt={event.detectedAt}
          clearedAt={event.clearedAt}
          isActive={isActive}
        />
      </motion.div>

      {/* Edit Event Section - Requirements 3.5, 3.7 */}
      {isEditingEvent ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Edit Event Details</h3>
          <AOGEventEditForm
            event={event}
            onUpdate={() => {
              setIsEditingEvent(false);
              refetch();
            }}
            onCancel={() => setIsEditingEvent(false)}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <Button
            variant="outline"
            onClick={() => setIsEditingEvent(true)}
            className="flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Event Details
          </Button>
        </motion.div>
      )}

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        {/* Status Banner */}
        <div className={`px-6 py-2 ${isActive ? 'bg-red-500/10 border-b border-red-500/20' : 'bg-green-500/10 border-b border-green-500/20'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isActive ? (
                <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
              <span className={`text-sm font-medium ${isActive ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {isActive ? 'Active AOG Event' : 'Resolved'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Copy Event ID"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="font-mono">{(event._id || '').slice(-8)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Aircraft Info Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isActive ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                <Plane className={`w-7 h-7 ${isActive ? 'text-red-500' : 'text-green-500'}`} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">
                    {aircraft?.registration || 'Unknown Aircraft'}
                  </h1>
                  {aircraft?.fleetGroup && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      {aircraft.fleetGroup}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {aircraft?.aircraftType || 'Unknown Type'}
                  {aircraft?.owner && <span className="text-muted-foreground/60"> • {aircraft.owner}</span>}
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-4 md:gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{formatAgeDuration(detectedDate, clearedDate)}</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
              {totalCost > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">${totalCost.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Cost</p>
                </div>
              )}
            </div>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <InfoCard 
              icon={Calendar} 
              label="Detected" 
              value={format(detectedDate, 'MMM dd, yyyy')}
              subValue={format(detectedDate, 'HH:mm')}
            />
            <InfoCard 
              icon={Users} 
              label="Manpower" 
              value={`${event.manpowerCount} personnel`}
              subValue={`${event.manHours} man-hours`}
            />
            <InfoCard 
              icon={Building2} 
              label="Responsible" 
              value={event.responsibleParty}
            />
            <InfoCard 
              icon={Tag} 
              label="Category" 
              value={<span className="capitalize">{event.category}</span>}
            />
          </div>

          {/* Reason and Action */}
          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reason Code</p>
              </div>
              <p className="text-sm text-foreground">{event.reasonCode || 'Not specified'}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Action Taken</p>
              </div>
              <p className="text-sm text-foreground">{event.actionTaken || 'Not specified'}</p>
            </div>
          </div>

          {/* Cleared Date (if resolved) */}
          {clearedDate && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">
                  Cleared on {format(clearedDate, 'MMM dd, yyyy')} at {format(clearedDate, 'HH:mm')}
                </span>
              </div>
            </div>
          )}

          {/* Legacy badge */}
          {isLegacy && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Legacy event - milestone tracking not available. Only basic downtime data is shown.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Downtime Metrics Summary (non-legacy only) */}
      {!isLegacy && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DowntimeMetricsSummary event={event} />
        </motion.div>
      )}

      {/* Next Step Action Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <NextStepActionPanel
          milestones={milestoneTimestamps}
          isLegacy={isLegacy}
          isActive={isActive}
        />
      </motion.div>

      {/* Related Events - Requirements 10.3 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <RelatedEvents events={relatedEvents} currentEventId={event._id} />
      </motion.div>

      {/* Tabs Navigation */}
      <Tabs
        tabs={[
          { id: 'milestones', label: 'Milestones', icon: Clock },
          { id: 'history', label: 'History', icon: History, badge: event.milestoneHistory?.length },
          { id: 'parts', label: 'Parts', icon: Package, badge: event.partRequests?.length },
          { id: 'costs', label: 'Costs', icon: Wallet },
          { id: 'attachments', label: 'Attachments', icon: Paperclip, badge: event.attachments?.length },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as TabId)}
        variant="pills"
      />

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        {activeTab === 'milestones' && (
          <div className="space-y-6">
            {/* Edit button */}
            {!isLegacy && !isEditingMilestones && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setIsEditingMilestones(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Milestones
                </Button>
              </div>
            )}

            {isEditingMilestones ? (
              <MilestoneEditForm
                aogEvent={event}
                onUpdate={() => {
                  setIsEditingMilestones(false);
                  refetch();
                }}
                onCancel={() => setIsEditingMilestones(false)}
              />
            ) : (
              <MilestoneTimeline
                milestones={milestoneTimestamps}
                computedMetrics={computedMetrics}
                isLegacy={isLegacy}
                detectedAt={event.detectedAt}
                clearedAt={event.clearedAt}
              />
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <MilestoneHistory
            history={event.milestoneHistory}
            isLegacy={isLegacy}
          />
        )}

        {activeTab === 'parts' && (
          <PartsTab 
            aogEventId={event._id} 
            partRequests={event.partRequests || []} 
            onUpdate={() => refetch()}
          />
        )}

        {activeTab === 'costs' && (
          <div className="space-y-6">
            <SimplifiedCostSummary event={event} />
            <CostsTab aogEvent={event} />
          </div>
        )}

        {activeTab === 'attachments' && (
          <AttachmentsTab 
            aogEventId={event._id}
            attachments={event.attachments || []} 
            attachmentsMeta={event.attachmentsMeta}
          />
        )}
      </motion.div>
    </div>
  );
}
