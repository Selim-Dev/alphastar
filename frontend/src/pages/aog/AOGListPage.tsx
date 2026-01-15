import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths, differenceInHours, differenceInDays } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import { 
  X, 
  AlertTriangle, 
  Clock, 
  Users, 
  DollarSign, 
  Plane, 
  Calendar,
  CheckCircle2,
  XCircle,
  Wrench,
  Building2,
  FileText,
  TrendingUp,
  Pause
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Form';
import { ExportButton } from '@/components/ui/ExportButton';
import { AircraftSelect } from '@/components/ui/AircraftSelect';
import { GlossaryTerm } from '@/components/ui/GlossaryTooltip';
import {
  useAOGEvents,
  useAOGEventById,
} from '@/hooks/useAOGEvents';
import { useAircraft } from '@/hooks/useAircraft';
import type { AOGEvent, Aircraft, AOGWorkflowStatus, BlockingReason } from '@/types';
import { AOG_WORKFLOW_STATUS_LABELS, BLOCKING_REASON_LABELS, BLOCKING_STATUSES, TERMINAL_STATUSES } from '@/types';

// Helper to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffHours = differenceInHours(now, date);
  const diffDays = differenceInDays(now, date);
  
  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return format(date, 'MMM dd, yyyy');
}

// Helper to format age duration (time since detected)
function formatAgeDuration(detectedAt: Date, clearedAt?: Date): string {
  const endDate = clearedAt ? new Date(clearedAt) : new Date();
  const diffHours = differenceInHours(endDate, detectedAt);
  const diffDays = differenceInDays(endDate, detectedAt);
  
  if (diffHours < 1) return '<1h';
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d ${diffHours % 24}h`;
  return `${diffDays}d`;
}

// Get workflow status color based on status category
function getWorkflowStatusColor(status: AOGWorkflowStatus): { bg: string; text: string; border: string } {
  // Terminal statuses - green
  if (TERMINAL_STATUSES.includes(status)) {
    return { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/30' };
  }
  // Blocking statuses - amber/orange
  if (BLOCKING_STATUSES.includes(status)) {
    return { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/30' };
  }
  // Initial status - red
  if (status === 'REPORTED') {
    return { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30' };
  }
  // In-progress statuses - blue
  return { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30' };
}

// Get blocking reason color
function getBlockingReasonColor(reason: BlockingReason): { bg: string; text: string } {
  switch (reason) {
    case 'Finance':
      return { bg: 'bg-purple-500/15', text: 'text-purple-600' };
    case 'Port':
      return { bg: 'bg-orange-500/15', text: 'text-orange-600' };
    case 'Customs':
      return { bg: 'bg-yellow-500/15', text: 'text-yellow-700' };
    case 'Vendor':
      return { bg: 'bg-cyan-500/15', text: 'text-cyan-600' };
    case 'Ops':
      return { bg: 'bg-indigo-500/15', text: 'text-indigo-600' };
    default:
      return { bg: 'bg-gray-500/15', text: 'text-gray-600' };
  }
}

type DatePreset = 'allTime' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

interface DateRange {
  startDate?: string;
  endDate?: string;
}

function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const today = new Date();
  switch (preset) {
    case 'allTime':
      return {
        startDate: undefined,
        endDate: undefined,
      };
    case 'last7days':
      return {
        startDate: format(subDays(today, 7), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
    case 'last30days':
      return {
        startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
    case 'thisMonth':
      return {
        startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
      };
    case 'lastMonth':
      const lastMonth = subMonths(today, 1);
      return {
        startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
      };
    default:
      return {
        startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
  }
}

const RESPONSIBLE_PARTY_OPTIONS = [
  { value: 'Internal', label: 'Internal' },
  { value: 'OEM', label: 'OEM' },
  { value: 'Customs', label: 'Customs' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Other', label: 'Other' },
];

// Workflow status options for filter (Requirements: 8.1)
const WORKFLOW_STATUS_OPTIONS: { value: AOGWorkflowStatus; label: string }[] = [
  { value: 'REPORTED', label: 'Reported' },
  { value: 'TROUBLESHOOTING', label: 'Troubleshooting' },
  { value: 'ISSUE_IDENTIFIED', label: 'Issue Identified' },
  { value: 'RESOLVED_NO_PARTS', label: 'Resolved (No Parts)' },
  { value: 'PART_REQUIRED', label: 'Part Required' },
  { value: 'PROCUREMENT_REQUESTED', label: 'Procurement Requested' },
  { value: 'FINANCE_APPROVAL_PENDING', label: 'Finance Approval Pending' },
  { value: 'ORDER_PLACED', label: 'Order Placed' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'AT_PORT', label: 'At Port' },
  { value: 'CUSTOMS_CLEARANCE', label: 'Customs Clearance' },
  { value: 'RECEIVED_IN_STORES', label: 'Received in Stores' },
  { value: 'ISSUED_TO_MAINTENANCE', label: 'Issued to Maintenance' },
  { value: 'INSTALLED_AND_TESTED', label: 'Installed & Tested' },
  { value: 'ENGINE_RUN_REQUESTED', label: 'Engine Run Requested' },
  { value: 'ENGINE_RUN_COMPLETED', label: 'Engine Run Completed' },
  { value: 'BACK_IN_SERVICE', label: 'Back in Service' },
  { value: 'CLOSED', label: 'Closed' },
];

// Blocking reason options for filter (Requirements: 8.1)
const BLOCKING_REASON_OPTIONS: { value: BlockingReason; label: string }[] = [
  { value: 'Finance', label: 'Finance' },
  { value: 'Port', label: 'Port' },
  { value: 'Customs', label: 'Customs' },
  { value: 'Vendor', label: 'Vendor' },
  { value: 'Ops', label: 'Operations' },
  { value: 'Other', label: 'Other' },
];

const RESPONSIBILITY_COLORS: Record<string, string> = {
  Internal: '#3b82f6',
  OEM: '#ef4444',
  Customs: '#f59e0b',
  Finance: '#10b981',
  Other: '#8b5cf6',
};

// Get responsibility icon
function getResponsibilityIcon(party: string) {
  switch (party) {
    case 'Internal':
      return <Wrench className="w-4 h-4" />;
    case 'OEM':
      return <Building2 className="w-4 h-4" />;
    case 'Customs':
      return <FileText className="w-4 h-4" />;
    case 'Finance':
      return <DollarSign className="w-4 h-4" />;
    default:
      return <AlertTriangle className="w-4 h-4" />;
  }
}

// Event Detail Modal Component - Enhanced Beautiful Version
function EventDetailModal({
  event,
  aircraft,
  onClose,
  isLoading,
}: {
  event: (AOGEvent & { downtimeHours?: number }) | null;
  aircraft?: Aircraft;
  onClose: () => void;
  isLoading?: boolean;
}) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border border-border rounded-2xl shadow-2xl p-8"
          style={{ opacity: 1, backgroundColor: 'hsl(var(--card))' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">Loading event details...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border border-border rounded-2xl shadow-2xl p-8 max-w-md"
          style={{ opacity: 1, backgroundColor: 'hsl(var(--card))' }}
        >
          <div className="text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Event Not Found</h3>
            <p className="text-muted-foreground mb-4">The requested AOG event could not be found.</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const totalCost = (event.costLabor || 0) + (event.costParts || 0) + (event.costExternal || 0);
  const isActive = !event.clearedAt;
  const detectedDate = new Date(event.detectedAt);
  const timeAgo = formatTimeAgo(detectedDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="border border-border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ opacity: 1, backgroundColor: 'hsl(var(--card))' }}
        >
          {/* Header with gradient */}
          <div className={`relative px-6 py-5 ${
            isActive 
              ? 'bg-gradient-to-r from-destructive/20 via-destructive/10 to-transparent' 
              : 'bg-gradient-to-r from-green-500/20 via-green-500/10 to-transparent'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Aircraft Icon */}
                <div className={`p-3 rounded-xl ${
                  isActive ? 'bg-destructive/20' : 'bg-green-500/20'
                }`}>
                  <Plane className={`w-6 h-6 ${
                    isActive ? 'text-destructive' : 'text-green-600'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-foreground">
                      {aircraft?.registration || 'Unknown Aircraft'}
                    </h2>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wide ${
                      event.category === 'aog'
                        ? 'bg-destructive text-destructive-foreground'
                        : event.category === 'unscheduled'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {event.category}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Detected {timeAgo}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Status Badge */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  isActive 
                    ? 'bg-destructive text-destructive-foreground' 
                    : 'bg-green-500 text-white'
                }`}>
                  {isActive ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      <span className="font-semibold text-sm">ACTIVE</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-semibold text-sm">CLEARED</span>
                    </>
                  )}
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Responsibility Badge - Prominent */}
            <div className="flex items-center gap-3">
              <div 
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: `${RESPONSIBILITY_COLORS[event.responsibleParty]}15`,
                  border: `1px solid ${RESPONSIBILITY_COLORS[event.responsibleParty]}40`,
                }}
              >
                {getResponsibilityIcon(event.responsibleParty)}
                <span 
                  className="font-semibold"
                  style={{ color: RESPONSIBILITY_COLORS[event.responsibleParty] }}
                >
                  {event.responsibleParty}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">Responsible Party</span>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Downtime</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {event.downtimeHours?.toFixed(1) || '—'}
                  <span className="text-sm font-normal text-muted-foreground ml-1">hrs</span>
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Man-Hours</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {event.manHours.toFixed(1)}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Manpower</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {event.manpowerCount}
                  <span className="text-sm font-normal text-muted-foreground ml-1">people</span>
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Total Cost</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  ${totalCost.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-muted/30 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Timeline
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Detected</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {format(detectedDate, 'MMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(detectedDate, 'HH:mm')}
                  </p>
                </div>
                
                <div className="flex-1 flex items-center justify-center">
                  <div className={`h-0.5 w-full ${isActive ? 'bg-gradient-to-r from-destructive to-muted' : 'bg-gradient-to-r from-destructive to-green-500'}`} />
                </div>
                
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cleared</span>
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-muted border-2 border-dashed border-muted-foreground' : 'bg-green-500'}`} />
                  </div>
                  {event.clearedAt ? (
                    <>
                      <p className="text-sm font-semibold text-foreground">
                        {format(new Date(event.clearedAt), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.clearedAt), 'HH:mm')}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Pending...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Reason & Action */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  Reason Code
                </h3>
                <p className="text-foreground">{event.reasonCode}</p>
              </div>
              
              <div className="bg-muted/30 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-500" />
                  Action Taken
                </h3>
                <p className="text-foreground">{event.actionTaken}</p>
              </div>
            </div>

            {/* Cost Breakdown */}
            {totalCost > 0 && (
              <div className="bg-muted/30 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Cost Breakdown
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Labor</p>
                    <p className="text-lg font-semibold text-foreground">
                      ${(event.costLabor || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Parts</p>
                    <p className="text-lg font-semibold text-foreground">
                      ${(event.costParts || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">External</p>
                    <p className="text-lg font-semibold text-foreground">
                      ${(event.costExternal || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Aircraft Info */}
            {aircraft && (
              <div className="bg-muted/30 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-primary" />
                  Aircraft Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Registration</p>
                    <p className="font-semibold text-foreground">{aircraft.registration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Fleet Group</p>
                    <p className="font-semibold text-foreground">{aircraft.fleetGroup}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <p className="font-semibold text-foreground">{aircraft.aircraftType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Owner</p>
                    <p className="font-semibold text-foreground">{aircraft.owner}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-4 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">Event ID: {event._id}</p>
            <div className="flex items-center gap-2">
              {aircraft && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onClose();
                    navigate(`/aircraft/${aircraft._id || aircraft.id}`);
                  }}
                >
                  View Aircraft
                </Button>
              )}
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </motion.div>
      </div>
  );
}

export function AOGListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlEventId = searchParams.get('eventId');
  const urlStatus = searchParams.get('status'); // For deep linking from alerts (Requirements: 3.1)
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('allTime');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: undefined,
    endDate: undefined,
  });
  const [aircraftFilter, setAircraftFilter] = useState<string>('');
  const [responsiblePartyFilter, setResponsiblePartyFilter] = useState<string>('');
  const [currentStatusFilter, setCurrentStatusFilter] = useState<string>('');
  const [blockingReasonFilter, setBlockingReasonFilter] = useState<string>('');
  const [showActiveOnly, setShowActiveOnly] = useState(urlStatus === 'active');

  // Set selectedEventId from URL on mount or when URL changes
  useEffect(() => {
    if (urlEventId) {
      setSelectedEventId(urlEventId);
    }
  }, [urlEventId]);

  // Handle status URL param for deep linking from alerts
  useEffect(() => {
    if (urlStatus === 'active') {
      setShowActiveOnly(true);
      // Clear the URL params after reading them
      setSearchParams({}, { replace: true });
    }
  }, [urlStatus, setSearchParams]);

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return customRange;
    }
    return getDateRangeFromPreset(datePreset);
  }, [datePreset, customRange]);

  // Data fetching - no date filter by default, sort by createdAt descending (backend handles this)
  const { data: aircraftData } = useAircraft();
  const { data: eventsData, isLoading: eventsLoading } = useAOGEvents({
    // Only include date filters if not "All Time"
    ...(datePreset !== 'allTime' ? dateRange : {}),
    aircraftId: aircraftFilter || undefined,
    responsibleParty: responsiblePartyFilter || undefined,
    currentStatus: currentStatusFilter as AOGWorkflowStatus || undefined,
    blockingReason: blockingReasonFilter as BlockingReason || undefined,
  });
  
  // Fetch single event when selectedEventId is set (for URL navigation)
  const { data: singleEventData, isLoading: singleEventLoading } = useAOGEventById(selectedEventId);

  const aircraft = aircraftData?.data || [];
  const events = (eventsData || []) as (AOGEvent & { downtimeHours?: number })[];

  // Filter events based on active filter (for deep linking from alerts)
  // Backend already sorts by createdAt descending, so no need to sort here
  const filteredEvents = useMemo(() => {
    return showActiveOnly 
      ? events.filter((e) => !e.clearedAt)
      : events;
  }, [events, showActiveOnly]);

  // Create aircraft map for lookups
  const aircraftMap = useMemo(() => {
    const map = new Map<string, Aircraft>();
    aircraft.forEach((a) => {
      const aircraftId = a._id || a.id;
      if (aircraftId) {
        map.set(aircraftId, a);
      }
    });
    return map;
  }, [aircraft]);

  // Handle modal close - clear URL param
  const handleCloseModal = () => {
    setSelectedEventId(null);
    // Remove eventId from URL without navigation
    if (urlEventId) {
      searchParams.delete('eventId');
      setSearchParams(searchParams, { replace: true });
    }
  };

  // Handle row click - navigate to detail page
  const handleRowClick = (row: AOGEvent & { downtimeHours?: number }) => {
    const eventId = row._id || (row as unknown as { id?: string }).id;
    if (!eventId) {
      console.error('No event ID found for row:', row);
      return;
    }
    navigate(`/aog/${eventId}`);
  };

  // Get the selected event - either from list or from single fetch
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    
    // First try to find in the current list
    const fromList = events.find((e) => e._id === selectedEventId);
    if (fromList) return fromList;
    
    // Otherwise use the single event fetch result
    return singleEventData as (AOGEvent & { downtimeHours?: number }) | null;
  }, [selectedEventId, events, singleEventData]);

  // Get aircraft for selected event
  const selectedEventAircraft = useMemo(() => {
    if (!selectedEvent) return undefined;
    return aircraftMap.get(String(selectedEvent.aircraftId));
  }, [selectedEvent, aircraftMap]);

  // Table columns - Updated with workflow status, blocking reason, age, and cost columns (Requirements: 8.1)
  const columns: ColumnDef<AOGEvent & { downtimeHours?: number }, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => {
          const createdAt = row.original.createdAt;
          if (!createdAt) return <span className="text-muted-foreground text-xs">—</span>;
          return format(new Date(createdAt), 'MMM dd, yyyy HH:mm');
        },
      },
      {
        accessorKey: 'detectedAt',
        header: 'Detected',
        cell: ({ row }) => format(new Date(row.original.detectedAt), 'MMM dd, yyyy HH:mm'),
      },
      {
        accessorKey: 'aircraftId',
        header: 'Aircraft',
        cell: ({ row }) =>
          aircraftMap.get(String(row.original.aircraftId))?.registration || 'Unknown',
      },
      {
        accessorKey: 'currentStatus',
        header: 'Workflow Status',
        cell: ({ row }) => {
          const status = row.original.currentStatus || 'REPORTED';
          const colors = getWorkflowStatusColor(status);
          const isLegacy = row.original.isLegacy;
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 text-xs rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
              >
                {AOG_WORKFLOW_STATUS_LABELS[status] || status}
              </span>
              {isLegacy && (
                <span className="text-xs text-muted-foreground italic">(Legacy)</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'blockingReason',
        header: 'Blocking',
        cell: ({ row }) => {
          const reason = row.original.blockingReason;
          if (!reason) return <span className="text-muted-foreground text-xs">—</span>;
          const colors = getBlockingReasonColor(reason);
          return (
            <div className="flex items-center gap-1.5">
              <Pause className="w-3 h-3 text-amber-500" />
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${colors.bg} ${colors.text}`}
              >
                {BLOCKING_REASON_LABELS[reason] || reason}
              </span>
            </div>
          );
        },
      },
      {
        id: 'age',
        header: 'Age',
        cell: ({ row }) => {
          const detectedAt = new Date(row.original.detectedAt);
          const clearedAt = row.original.clearedAt ? new Date(row.original.clearedAt) : undefined;
          const isActive = !clearedAt;
          const ageStr = formatAgeDuration(detectedAt, clearedAt);
          return (
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <span className={isActive ? 'font-medium text-amber-600' : 'text-muted-foreground'}>
                {ageStr}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              row.original.category === 'aog'
                ? 'bg-destructive/10 text-destructive'
                : row.original.category === 'unscheduled'
                ? 'bg-yellow-500/10 text-yellow-600'
                : 'bg-blue-500/10 text-blue-600'
            }`}
          >
            {row.original.category.toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: 'responsibleParty',
        header: 'Responsibility',
        cell: ({ row }) => (
          <span
            className="px-2 py-0.5 text-xs rounded-full"
            style={{
              backgroundColor: `${RESPONSIBILITY_COLORS[row.original.responsibleParty]}20`,
              color: RESPONSIBILITY_COLORS[row.original.responsibleParty],
            }}
          >
            {row.original.responsibleParty}
          </span>
        ),
      },
      {
        id: 'costToDate',
        header: 'Cost to Date',
        cell: ({ row }) => {
          const costLabor = row.original.costLabor || 0;
          const costParts = row.original.costParts || 0;
          const costExternal = row.original.costExternal || 0;
          const totalCost = costLabor + costParts + costExternal;
          
          if (totalCost === 0) {
            return <span className="text-muted-foreground text-xs">—</span>;
          }
          
          return (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-green-600" />
              <span className="font-medium text-foreground">
                {totalCost.toLocaleString()}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'downtimeHours',
        header: 'Downtime',
        cell: ({ row }) =>
          row.original.downtimeHours !== undefined
            ? `${row.original.downtimeHours.toFixed(1)} hrs`
            : '-',
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.clearedAt ? (
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-600">
              Cleared
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
              Active
            </span>
          ),
      },
    ],
    [aircraftMap]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-foreground"
          >
            <GlossaryTerm term="AOG" /> Events List
          </motion.h1>
          <p className="text-sm text-muted-foreground mt-1">
            Showing all events sorted by creation date (newest first)
          </p>
        </div>

        <ExportButton
          exportType="aog-events"
          filters={{ 
            ...(datePreset !== 'allTime' ? dateRange : {}),
            aircraftId: aircraftFilter || undefined, 
            responsibleParty: responsiblePartyFilter || undefined,
            currentStatus: currentStatusFilter || undefined,
            blockingReason: blockingReasonFilter || undefined,
          }}
          filename={`aog-events-${datePreset === 'allTime' ? 'all-time' : `${dateRange.startDate}-to-${dateRange.endDate}`}.xlsx`}
          label="Export"
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4 space-y-4"
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Preset Buttons */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              Filter by Detected Date (Optional)
            </label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(['allTime', 'last7days', 'last30days', 'thisMonth', 'lastMonth'] as DatePreset[]).map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => setDatePreset(preset)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      datePreset === preset
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {preset === 'allTime' && 'All Time'}
                    {preset === 'last7days' && '7 Days'}
                    {preset === 'last30days' && '30 Days'}
                    {preset === 'thisMonth' && 'This Month'}
                    {preset === 'lastMonth' && 'Last Month'}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Custom Date Range */}
          {datePreset !== 'allTime' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Custom Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={datePreset === 'custom' ? (customRange.startDate || '') : (dateRange.startDate || '')}
                  onChange={(e) => {
                    setDatePreset('custom');
                    setCustomRange((prev) => ({ ...prev, startDate: e.target.value }));
                  }}
                  className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={datePreset === 'custom' ? (customRange.endDate || '') : (dateRange.endDate || '')}
                  onChange={(e) => {
                    setDatePreset('custom');
                    setCustomRange((prev) => ({ ...prev, endDate: e.target.value }));
                  }}
                  className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
                />
              </div>
            </div>
          )}

          {/* Aircraft Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Aircraft</label>
            <AircraftSelect
              value={aircraftFilter}
              onChange={setAircraftFilter}
              includeAll
              allLabel="All Aircraft"
            />
          </div>

          {/* Responsible Party Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Responsibility</label>
            <select
              value={responsiblePartyFilter}
              onChange={(e) => setResponsiblePartyFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground min-w-[140px]"
            >
              <option value="">All</option>
              {RESPONSIBLE_PARTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Workflow Status Filter (Requirements: 8.1) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Workflow Status</label>
            <select
              value={currentStatusFilter}
              onChange={(e) => setCurrentStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground min-w-[180px]"
            >
              <option value="">All Statuses</option>
              {WORKFLOW_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Blocking Reason Filter (Requirements: 8.1) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Blocking Reason</label>
            <select
              value={blockingReasonFilter}
              onChange={(e) => setBlockingReasonFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground min-w-[140px]"
            >
              <option value="">All</option>
              {BLOCKING_REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active Only Toggle - for deep linking from alerts */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activeOnly"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="activeOnly" className="text-sm font-medium text-muted-foreground">
              Active Only
            </label>
          </div>
        </div>
      </motion.div>

      {/* Data Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {eventsLoading ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            Loading AOG events...
          </div>
        ) : (
          <DataTable
            data={filteredEvents}
            columns={columns}
            searchPlaceholder="Search events..."
            searchColumn="reasonCode"
            pageSize={15}
            onRowClick={handleRowClick}
          />
        )}
      </motion.div>

      {/* Event Detail Modal */}
      {selectedEventId && (
        <EventDetailModal
          event={selectedEvent}
          aircraft={selectedEventAircraft}
          onClose={handleCloseModal}
          isLoading={(singleEventLoading || eventsLoading) && !selectedEvent}
        />
      )}
    </div>
  );
}
