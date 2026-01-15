import { motion } from 'framer-motion';
import { Wrench, Calendar, Sparkles, ArrowRight } from 'lucide-react';

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
  gradient: string;
  iconBg: string;
  accentColor: string;
}

const comingSoonFeatures: ComingSoonTile[] = [
  {
    title: 'Aircraft at MRO',
    description: 'Track aircraft currently at Maintenance, Repair & Overhaul facilities',
    icon: <Wrench className="w-5 h-5" />,
    gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    accentColor: 'blue',
  },
  {
    title: 'Vacation Plan',
    description: 'View team vacation schedules and overlap detection',
    icon: <Calendar className="w-5 h-5" />,
    gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    accentColor: 'emerald',
  },
];

export function ComingSoonSection({ className = '' }: ComingSoonSectionProps) {
  return (
    <div className={className}>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Coming Soon</h3>
          <p className="text-xs text-muted-foreground">New features in development</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {comingSoonFeatures.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15, duration: 0.4, ease: 'easeOut' }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="group relative overflow-hidden bg-card border border-border/60 rounded-2xl p-6 shadow-theme-sm hover:shadow-theme-md hover:border-border transition-all duration-300 cursor-default"
          >
            {/* Animated gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
            
            {/* Decorative corner accent */}
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/10 blur-2xl group-hover:scale-150 transition-transform duration-700" />
            
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }} />
            
            <div className="relative flex items-start gap-4">
              {/* Icon with gradient background */}
              <motion.div 
                className={`flex-shrink-0 w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center text-white shadow-lg`}
                whileHover={{ scale: 1.05, rotate: 3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {feature.icon}
              </motion.div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-2">
                  <h4 className="text-base font-semibold text-foreground">
                    {feature.title}
                  </h4>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                    </span>
                    Soon
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Hover indicator */}
                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60 group-hover:text-muted-foreground transition-colors duration-300">
                  <span>Stay tuned</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default ComingSoonSection;
