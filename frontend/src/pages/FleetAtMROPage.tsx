import { Wrench } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ComingSoon } from '@/components/ui/ComingSoon';

/**
 * FleetAtMROPage Component
 * Coming Soon - Fleet MRO (Maintenance, Repair, and Overhaul) tracking with beautiful visuals
 */
export function FleetAtMROPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Home', path: '/' },
          { label: 'Fleet at MRO' },
        ]}
      />

      {/* Coming Soon Overlay */}
      <ComingSoon
        icon={Wrench}
        title="Fleet at MRO"
        description="Comprehensive tracking and management of aircraft undergoing maintenance, repair, and overhaul operations"
        features={[
          'Real-time MRO status tracking for all aircraft with live updates',
          'Detailed work scope and progress monitoring with milestone tracking',
          'Estimated return-to-service dates with intelligent alerts',
          'MRO vendor performance analytics and comparison',
          'Cost tracking and budget management per aircraft',
          'Historical MRO records with trend analysis',
          'Automated notifications for critical milestones',
          'Integration with maintenance task scheduling',
        ]}
        estimatedRelease="Q2 2026"
      />
    </div>
  );
}

export default FleetAtMROPage;
