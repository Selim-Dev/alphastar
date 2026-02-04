import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { AlertTriangle, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';

interface RiskFactor {
  name: string;
  contribution: number; // percentage
}

interface RiskScoreGaugeProps {
  aircraftId: string;
  registration: string;
  riskScore: number; // 0-100, higher = higher risk
  factors: RiskFactor[];
  isLoading?: boolean;
}

export function RiskScoreGauge({
  registration,
  riskScore,
  factors,
  isLoading,
}: RiskScoreGaugeProps) {
  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading risk score...</div>
      </div>
    );
  }

  // Determine risk level and color
  const getRiskLevel = (score: number) => {
    if (score <= 30) return { level: 'Low Risk', color: '#22c55e', bgColor: '#dcfce7' };
    if (score <= 60) return { level: 'Medium Risk', color: '#f59e0b', bgColor: '#fef3c7' };
    return { level: 'High Risk', color: '#ef4444', bgColor: '#fee2e2' };
  };

  const riskInfo = getRiskLevel(riskScore);

  // Prepare data for radial chart
  const chartData = [
    {
      name: 'Risk Score',
      value: riskScore,
      fill: riskInfo.color,
    },
  ];

  // Get icon for factor type
  const getFactorIcon = (factorName: string) => {
    if (factorName.toLowerCase().includes('frequency')) return AlertTriangle;
    if (factorName.toLowerCase().includes('trend')) return TrendingUp;
    if (factorName.toLowerCase().includes('cost')) return DollarSign;
    return RefreshCw;
  };

  return (
    <div className="w-full">
      {/* Aircraft Header */}
      <div className="mb-4 text-center">
        <h4 className="text-lg font-semibold text-foreground">{registration}</h4>
        <p className="text-sm text-muted-foreground">Aircraft Risk Assessment</p>
      </div>

      {/* Radial Gauge */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            data={chartData}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background
              dataKey="value"
              cornerRadius={10}
              fill={riskInfo.color}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center Score Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-4xl font-bold" style={{ color: riskInfo.color }}>
            {riskScore.toFixed(0)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Risk Score</div>
        </div>
      </div>

      {/* Risk Level Badge */}
      <div className="flex justify-center mb-6">
        <div
          className="px-4 py-2 rounded-full text-sm font-medium"
          style={{
            backgroundColor: riskInfo.bgColor,
            color: riskInfo.color,
          }}
        >
          {riskInfo.level}
        </div>
      </div>

      {/* Risk Factors List */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-foreground mb-3">Risk Factors</h5>
        {factors.map((factor, index) => {
          const Icon = getFactorIcon(factor.name);
          return (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{factor.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${factor.contribution}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {factor.contribution.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Color Zone Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">0-30: Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">31-60: Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">61-100: High</span>
          </div>
        </div>
      </div>
    </div>
  );
}
