import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, Trophy, AlertTriangle } from 'lucide-react';
import type { FleetComparisonResponse, AircraftPerformance } from '@/types';

interface FleetComparisonProps {
  data?: FleetComparisonResponse;
  isLoading?: boolean;
}

function PerformerCard({ 
  aircraft, 
  rank, 
  isTop 
}: { 
  aircraft: AircraftPerformance; 
  rank: number; 
  isTop: boolean;
}) {
  const navigate = useNavigate();
  
  const TrendIcon = aircraft.trend === 'up' ? TrendingUp : aircraft.trend === 'down' ? TrendingDown : Minus;
  const trendColor = aircraft.trend === 'up' ? 'text-green-500' : aircraft.trend === 'down' ? 'text-red-500' : 'text-muted-foreground';
  
  const bgColor = isTop 
    ? rank === 1 ? 'bg-green-500/10 border-green-500/30' : 'bg-green-500/5 border-green-500/20'
    : 'bg-red-500/5 border-red-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, x: isTop ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      onClick={() => navigate(`/aircraft/${aircraft.aircraftId}`)}
      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${bgColor}`}
    >
      <div className="flex items-center gap-3">
        <span className={`text-lg font-bold ${isTop ? 'text-green-600' : 'text-red-500'}`}>
          #{rank}
        </span>
        <div>
          <p className="font-semibold text-foreground">{aircraft.registration}</p>
          <p className="text-xs text-muted-foreground">{aircraft.fleetGroup}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-lg font-bold ${isTop ? 'text-green-600' : 'text-red-500'}`}>
          {aircraft.availabilityPercentage.toFixed(1)}%
        </span>
        <TrendIcon className={`w-4 h-4 ${trendColor}`} />
      </div>
    </motion.div>
  );
}

export function FleetComparison({ data, isLoading }: FleetComparisonProps) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="animate-pulse bg-muted h-5 w-40 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-muted h-16 rounded-lg" />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-muted h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const topPerformers = data?.topPerformers || [];
  const bottomPerformers = data?.bottomPerformers || [];
  const fleetAverage = data?.fleetAverage || 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Fleet Performance Comparison</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Fleet Avg:</span>
          <span className="font-semibold text-foreground">{fleetAverage.toFixed(1)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-green-600 uppercase tracking-wider">Top Performers</span>
          </div>
          <div className="space-y-2">
            {topPerformers.length > 0 ? (
              topPerformers.map((aircraft, index) => (
                <PerformerCard key={aircraft.aircraftId} aircraft={aircraft} rank={index + 1} isTop />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            )}
          </div>
        </div>

        {/* Bottom Performers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium text-red-500 uppercase tracking-wider">Needs Attention</span>
          </div>
          <div className="space-y-2">
            {bottomPerformers.length > 0 ? (
              bottomPerformers.map((aircraft, index) => (
                <PerformerCard key={aircraft.aircraftId} aircraft={aircraft} rank={index + 1} isTop={false} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
