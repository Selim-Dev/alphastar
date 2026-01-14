import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import { 
  ArrowLeft, 
  Plane, 
  Clock, 
  Users, 
  DollarSign,
  AlertCircle,
  History,
  Package,
  Paperclip,
  Wallet,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Form';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { 
  StatusTimeline, 
  NextStepActionPanel, 
  PartsTab, 
  CostsTab, 
  AttachmentsTab 
} from '@/components/aog';
import { useAOGEventById, useAOGStatusHistory } from '@/hooks/useAOGEvents';
import { useAircraft } from '@/hooks/useAircraft';
import type { Aircraft, AOGWorkflowStatus } from '@/types';
import { AOG_WORKFLOW_STATUS_LABELS, BLOCKING_REASON_LABELS, BLOCKING_STATUSES, TERMINAL_STATUSES } from '@/types';

// Tab type
type TabId = 'timeline' | 'parts' | 'costs' | 'attachments';

// Get workflow status color
function getWorkflowStatusColor(status: AOGWorkflowStatus): { bg: string; text: string; border: string } {
  if (TERMINAL_STATUSES.includes(status)) {
    return { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/30' };
  }
  if (BLOCKING_STATUSES.includes(status)) {
    return { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/30' };
  }
  if (status === 'REPORTED') {
    return { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30' };
  }
  return { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30' };
}

// Format age duration
function formatAgeDuration(detectedAt: Date, clearedAt?: Date): string {
  const endDate = clearedAt ? new Date(clearedAt) : new Date();
  const diffHours = differenceInHours(endDate, detectedAt);
  const diffDays = differenceInDays(endDate, detectedAt);
  
  if (diffHours < 1) return '<1 hour';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours % 24}h`;
  return `${diffDays} days`;
}

// Tab button component
function TabButton({ 
  id, 
  label, 
  icon: Icon, 
  isActive, 
  onClick,
  badge 
}: { 
  id: TabId; 
  label: string; 
  icon: React.ElementType; 
  isActive: boolean; 
  onClick: () => void;
  badge?: number;
}) {
  // Suppress unused id warning - id is used for type safety
  void id;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
        isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`px-1.5 py-0.5 text-xs rounded-full ${
          isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

export function AOGDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('timeline');

  // Fetch data
  const { data: aogEvent, isLoading: eventLoading, refetch: refetchEvent } = useAOGEventById(id || null);
  const { data: statusHistory, refetch: refetchHistory } = useAOGStatusHistory(id || null);
  const { data: aircraftData } = useAircraft();

  const aircraft = aircraftData?.data || [];
  const aircraftMap = new Map<string, Aircraft>();
  aircraft.forEach((a) => {
    const aircraftId = a._id || a.id;
    if (aircraftId) {
      aircraftMap.set(aircraftId, a);
    }
  });

  const eventAircraft = aogEvent ? aircraftMap.get(String(aogEvent.aircraftId)) : undefined;

  // Handle refresh after mutations
  const handleRefresh = () => {
    refetchEvent();
    refetchHistory();
  };

  // Loading state
  if (eventLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading AOG event...</span>
        </div>
      </div>
    );
  }

  // Not found state
  if (!aogEvent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Event Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested AOG event could not be found.</p>
        <Button onClick={() => navigate('/aog/list')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      </div>
    );
  }

  const currentStatus = aogEvent.currentStatus || 'REPORTED';
  const statusColors = getWorkflowStatusColor(currentStatus);
  const isActive = !aogEvent.clearedAt;
  const totalCost = (aogEvent.costLabor || 0) + (aogEvent.costParts || 0) + (aogEvent.costExternal || 0);
  const detectedDate = new Date(aogEvent.detectedAt);
  const clearedDate = aogEvent.clearedAt ? new Date(aogEvent.clearedAt) : undefined;
  
  // Get the event ID (backend returns 'id' not '_id')
  const eventId = (aogEvent as unknown as { id?: string }).id || aogEvent._id;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'AOG Events', path: '/aog/list' },
          { label: eventAircraft?.registration || 'Event Details' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Back button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/aog/list')}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          {/* Title and status */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-foreground flex items-center gap-2"
              >
                <Plane className="w-6 h-6 text-primary" />
                {eventAircraft?.registration || 'Unknown Aircraft'}
              </motion.h1>
              
              {/* Active/Cleared badge */}
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                isActive 
                  ? 'bg-destructive text-destructive-foreground' 
                  : 'bg-green-500 text-white'
              }`}>
                {isActive ? 'ACTIVE' : 'CLEARED'}
              </span>

              {/* Legacy badge */}
              {aogEvent.isLegacy && (
                <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                  Legacy
                </span>
              )}
            </div>

            {/* Workflow status */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm rounded-full border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                {AOG_WORKFLOW_STATUS_LABELS[currentStatus]}
              </span>
              {aogEvent.blockingReason && (
                <span className="px-2 py-1 text-xs rounded-full bg-amber-500/10 text-amber-600">
                  Blocked: {BLOCKING_REASON_LABELS[aogEvent.blockingReason]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div className="text-sm">
              <span className="text-muted-foreground">Age: </span>
              <span className="font-medium text-foreground">
                {formatAgeDuration(detectedDate, clearedDate)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div className="text-sm">
              <span className="text-muted-foreground">Man-hours: </span>
              <span className="font-medium text-foreground">{aogEvent.manHours}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <div className="text-sm">
              <span className="text-muted-foreground">Cost: </span>
              <span className="font-medium text-foreground">${totalCost.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Event details and tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event summary card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <h3 className="font-semibold text-foreground mb-4">Event Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Category</p>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  aogEvent.category === 'aog'
                    ? 'bg-destructive/10 text-destructive'
                    : aogEvent.category === 'unscheduled'
                    ? 'bg-yellow-500/10 text-yellow-600'
                    : 'bg-blue-500/10 text-blue-600'
                }`}>
                  {aogEvent.category.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Responsible Party</p>
                <p className="text-sm font-medium text-foreground">{aogEvent.responsibleParty}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Detected</p>
                <p className="text-sm font-medium text-foreground">
                  {format(detectedDate, 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cleared</p>
                <p className="text-sm font-medium text-foreground">
                  {clearedDate ? format(clearedDate, 'MMM dd, yyyy HH:mm') : '—'}
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Reason Code</p>
              <p className="text-sm text-foreground">{aogEvent.reasonCode}</p>
            </div>
            
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">Action Taken</p>
              <p className="text-sm text-foreground">{aogEvent.actionTaken}</p>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Tab buttons */}
            <div className="flex flex-wrap gap-2 p-3 border-b border-border bg-muted/30">
              <TabButton
                id="timeline"
                label="Timeline"
                icon={History}
                isActive={activeTab === 'timeline'}
                onClick={() => setActiveTab('timeline')}
                badge={statusHistory?.length}
              />
              <TabButton
                id="parts"
                label="Parts"
                icon={Package}
                isActive={activeTab === 'parts'}
                onClick={() => setActiveTab('parts')}
                badge={aogEvent.partRequests?.length}
              />
              <TabButton
                id="costs"
                label="Costs"
                icon={Wallet}
                isActive={activeTab === 'costs'}
                onClick={() => setActiveTab('costs')}
              />
              <TabButton
                id="attachments"
                label="Attachments"
                icon={Paperclip}
                isActive={activeTab === 'attachments'}
                onClick={() => setActiveTab('attachments')}
                badge={(aogEvent.attachments?.length || 0) + (aogEvent.attachmentsMeta?.length || 0)}
              />
            </div>

            {/* Tab content */}
            <div className="p-5">
              {activeTab === 'timeline' && (
                <StatusTimeline
                  history={statusHistory || []}
                  currentStatus={currentStatus}
                  isLegacy={aogEvent.isLegacy}
                />
              )}
              {activeTab === 'parts' && (
                <PartsTab
                  aogEventId={eventId}
                  partRequests={aogEvent.partRequests || []}
                  onUpdate={handleRefresh}
                />
              )}
              {activeTab === 'costs' && (
                <CostsTab
                  aogEvent={aogEvent}
                  onUpdate={handleRefresh}
                />
              )}
              {activeTab === 'attachments' && (
                <AttachmentsTab
                  aogEventId={eventId}
                  attachments={aogEvent.attachments || []}
                  attachmentsMeta={aogEvent.attachmentsMeta}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right column - Next steps */}
        <div className="space-y-6">
          <NextStepActionPanel
            aogEventId={eventId}
            currentStatus={currentStatus}
            isLegacy={aogEvent.isLegacy}
            onTransitionSuccess={handleRefresh}
          />

          {/* Aircraft info card */}
          {eventAircraft && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-5"
            >
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plane className="w-4 h-4 text-primary" />
                Aircraft
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Registration</span>
                  <span className="text-sm font-medium text-foreground">{eventAircraft.registration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fleet Group</span>
                  <span className="text-sm font-medium text-foreground">{eventAircraft.fleetGroup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="text-sm font-medium text-foreground">{eventAircraft.aircraftType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Owner</span>
                  <span className="text-sm font-medium text-foreground">{eventAircraft.owner}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => navigate(`/aircraft/${eventAircraft._id || eventAircraft.id}`)}
              >
                View Aircraft
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AOGDetailPage;
