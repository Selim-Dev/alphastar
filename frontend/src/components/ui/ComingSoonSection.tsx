import { motion } from 'framer-motion';
import { Wrench, Calendar, Clock } from 'lucide-react';

/**
 * ComingSoonSection Component
 * 
 * Displays placeholder tiles for upcoming features on the dashboard.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 * - Display "Coming Soon" section with two placeholder tiles
 * - "Aircraft at MRO" and "Vacation Plan" tiles
 * - Consistent card styling with existing dashboard components
 * - No backend API calls required
 */

interface ComingSoonSectionProps {
  className?: string;
}

interface ComingSoonTile {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const comingSoonFeatures: ComingSoonTile[] = [
  {
    title: 'Aircraft at MRO',
    description: 'Track aircraft currently at Maintenance, Repair & Overhaul facilities',
    icon: <Wrench className="w-6 h-6" />,
  },
  {
    title: 'Vacation Plan',
    description: 'View team vacation schedules and overlap detection',
    icon: <Calendar className="w-6 h-6" />,
  },
];

export function ComingSoonSection({ className = '' }: ComingSoonSectionProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Coming Soon</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {comingSoonFeatures.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="relative overflow-hidden bg-card border border-border border-dashed rounded-xl p-5 shadow-theme-sm"
          >
            {/* Gradient overlay for "coming soon" effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/10 pointer-events-none" />
            
            <div className="relative flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                {feature.icon}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-medium text-foreground">
                    {feature.title}
                  </h4>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Soon
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default ComingSoonSection;
