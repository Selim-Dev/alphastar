import { useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number;
  delay?: number;
  /** Enable hover effects on the container (Requirements: 9.8) */
  interactive?: boolean;
  /** Callback when chart is clicked for drill-down (Requirements: 9.8) */
  onDrillDown?: () => void;
  /** Show expand button for drill-down */
  expandable?: boolean;
}

export function ChartContainer({ 
  title, 
  subtitle, 
  children, 
  height = 300, 
  delay = 0,
  interactive = true,
  onDrillDown,
  expandable = false,
}: ChartContainerProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={interactive ? { scale: 1.01, transition: { duration: 0.2 } } : undefined}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      className={`bg-card border border-border rounded-lg p-6 shadow-sm transition-shadow duration-200 ${
        interactive ? 'hover:shadow-md hover:border-primary/20' : ''
      } ${onDrillDown ? 'cursor-pointer' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onDrillDown}
    >
      {title && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.1 }}
          className="mb-4 flex items-center justify-between"
        >
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {/* Expand indicator for drill-down capability (Requirements: 9.8) */}
          {expandable && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0.5 }}
              className="text-muted-foreground"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" 
                />
              </svg>
            </motion.div>
          )}
        </motion.div>
      )}
      <AnimatePresence mode="wait">
        <motion.div 
          key={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, delay: delay + 0.2 }}
          style={{ height }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

interface LineChartData {
  name: string;
  [key: string]: string | number;
}

interface TargetLine {
  value: number;
  label: string;
  color?: string;
  strokeDasharray?: string;
}

interface TrendChartProps {
  data: LineChartData[];
  lines: { dataKey: string; color: string; name?: string }[];
  xAxisKey?: string;
  target?: TargetLine;
  yAxisDomain?: [number | 'auto', number | 'auto'];
}

// Enhanced custom tooltip component (Requirements: 9.8)
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatter?: (value: number, name: string) => string;
}

function EnhancedTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[120px]"
    >
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">
            {formatter ? formatter(entry.value, entry.name) : entry.value?.toFixed(1)}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

export function TrendChart({ data, lines, xAxisKey = 'name', target, yAxisDomain }: TrendChartProps) {
  // Calculate domain to ensure target line is visible
  const calculatedDomain = yAxisDomain || (target ? ['auto', 'auto'] : undefined);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart 
        data={data} 
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        onMouseMove={(e) => {
          if (e.activeTooltipIndex !== undefined && typeof e.activeTooltipIndex === 'number') {
            setActiveIndex(e.activeTooltipIndex);
          }
        }}
        onMouseLeave={() => setActiveIndex(null)}
      >
        <defs>
          {lines.map((line) => (
            <linearGradient key={`gradient-${line.dataKey}`} id={`gradient-${line.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={line.color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={line.color} stopOpacity={0}/>
            </linearGradient>
          ))}
          {/* Glow filter for hover effect */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey={xAxisKey} 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          domain={calculatedDomain}
        />
        <Tooltip
          content={<EnhancedTooltip />}
          cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '5 5', strokeWidth: 1 }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
        />
        {target && (
          <ReferenceLine
            y={target.value}
            stroke={target.color || '#6b7280'}
            strokeDasharray={target.strokeDasharray || '8 4'}
            strokeWidth={2}
            label={{
              value: target.label,
              position: 'right',
              fill: target.color || '#6b7280',
              fontSize: 11,
              fontWeight: 500,
            }}
          />
        )}
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            name={line.name || line.dataKey}
            strokeWidth={2.5}
            dot={(props) => {
              const { cx, cy, index } = props;
              const isActive = index === activeIndex;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={isActive ? 6 : 4}
                  fill={line.color}
                  stroke="#fff"
                  strokeWidth={2}
                  style={{
                    transition: 'r 0.2s ease-out',
                    filter: isActive ? 'url(#glow)' : 'none',
                  }}
                />
              );
            }}
            activeDot={{ r: 8, strokeWidth: 3, stroke: '#fff', filter: 'url(#glow)' }}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// TrendChart with enhanced target line support and gap visualization
interface TrendChartWithTargetProps extends TrendChartProps {
  showGapFill?: boolean;
  gapFillOpacity?: number;
}

export function TrendChartWithTarget({ 
  data, 
  lines, 
  xAxisKey = 'name', 
  target,
  yAxisDomain,
  showGapFill = false,
  gapFillOpacity = 0.1,
}: TrendChartWithTargetProps) {
  // Add target value to data for gap visualization
  const enhancedData = target && showGapFill 
    ? data.map(item => ({ ...item, _target: target.value }))
    : data;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={enhancedData} margin={{ top: 5, right: 50, left: 20, bottom: 5 }}>
        <defs>
          {lines.map((line) => (
            <linearGradient key={`gradient-${line.dataKey}`} id={`gradient-${line.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={line.color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={line.color} stopOpacity={0}/>
            </linearGradient>
          ))}
          {/* Gap fill gradient */}
          <linearGradient id="gapFillGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={gapFillOpacity}/>
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey={xAxisKey} 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          domain={yAxisDomain}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '5 5' }}
          formatter={(value, name) => {
            if (name === '_target') return null;
            return [typeof value === 'number' ? value.toFixed(1) : String(value), name];
          }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => value === '_target' ? null : value}
        />
        {target && (
          <ReferenceLine
            y={target.value}
            stroke={target.color || '#6b7280'}
            strokeDasharray={target.strokeDasharray || '8 4'}
            strokeWidth={2}
            label={{
              value: `${target.label} (${target.value}${typeof target.value === 'number' && target.value <= 100 ? '%' : ''})`,
              position: 'right',
              fill: target.color || '#6b7280',
              fontSize: 11,
              fontWeight: 500,
            }}
          />
        )}
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            name={line.name || line.dataKey}
            strokeWidth={2.5}
            dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
            animationDuration={1000}
            animationEasing="ease-in-out"
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Area chart variant for filled trend visualization
interface AreaTrendChartProps {
  data: LineChartData[];
  areas: { dataKey: string; color: string; name?: string }[];
  xAxisKey?: string;
}

export function AreaTrendChart({ data, areas, xAxisKey = 'name' }: AreaTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          {areas.map((area) => (
            <linearGradient key={`gradient-${area.dataKey}`} id={`areaGradient-${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={area.color} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={area.color} stopOpacity={0.05}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey={xAxisKey} 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12}
          tickLine={false}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        {areas.map((area) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            stroke={area.color}
            fill={`url(#areaGradient-${area.dataKey})`}
            name={area.name || area.dataKey}
            strokeWidth={2}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}


interface BarChartData {
  name: string;
  [key: string]: string | number;
}

interface BarChartWrapperProps {
  data: BarChartData[];
  bars: { dataKey: string; color: string; name?: string }[];
  xAxisKey?: string;
  layout?: 'horizontal' | 'vertical';
}

export function BarChartWrapper({
  data,
  bars,
  xAxisKey = 'name',
  layout = 'horizontal',
}: BarChartWrapperProps) {
  const [activeBar, setActiveBar] = useState<string | null>(null);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        onMouseLeave={() => setActiveBar(null)}
      >
        <defs>
          {bars.map((bar) => (
            <linearGradient key={`barGradient-${bar.dataKey}`} id={`barGradient-${bar.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={bar.color} stopOpacity={1}/>
              <stop offset="100%" stopColor={bar.color} stopOpacity={0.7}/>
            </linearGradient>
          ))}
          {/* Hover gradient with brighter colors */}
          {bars.map((bar) => (
            <linearGradient key={`barGradientHover-${bar.dataKey}`} id={`barGradientHover-${bar.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={bar.color} stopOpacity={1}/>
              <stop offset="100%" stopColor={bar.color} stopOpacity={0.85}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        {layout === 'horizontal' ? (
          <>
            <XAxis 
              dataKey={xAxisKey} 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
          </>
        ) : (
          <>
            <XAxis 
              type="number" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              dataKey={xAxisKey} 
              type="category" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
          </>
        )}
        <Tooltip
          content={<EnhancedTooltip />}
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        {bars.map((bar, index) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            fill={`url(#barGradient-${bar.dataKey})`}
            name={bar.name || bar.dataKey}
            radius={[4, 4, 0, 0]}
            animationDuration={800}
            animationBegin={index * 100}
            animationEasing="ease-out"
            onMouseEnter={() => setActiveBar(bar.dataKey)}
            onMouseLeave={() => setActiveBar(null)}
            style={{
              filter: activeBar === bar.dataKey ? 'brightness(1.1)' : 'none',
              transition: 'filter 0.2s ease-out',
            }}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface PieChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface PieChartWrapperProps {
  data: PieChartData[];
  innerRadius?: number;
  outerRadius?: number;
}

export function PieChartWrapper({
  data,
  innerRadius = 60,
  outerRadius = 80,
}: PieChartWrapperProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  // Use colors from data if provided, otherwise use default COLORS
  const getColor = (entry: PieChartData, index: number) => {
    return (entry as { color?: string }).color || COLORS[index % COLORS.length];
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={activeIndex !== null ? outerRadius + 5 : outerRadius}
          paddingAngle={5}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          onMouseEnter={onPieEnter}
          onMouseLeave={onPieLeave}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={getColor(entry, index)}
              style={{
                filter: activeIndex === index ? 'brightness(1.15)' : 'none',
                transition: 'filter 0.2s ease-out',
                cursor: 'pointer',
              }}
              stroke={activeIndex === index ? 'hsl(var(--background))' : 'none'}
              strokeWidth={activeIndex === index ? 2 : 0}
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const entry = payload[0];
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border rounded-lg shadow-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.payload?.fill || entry.color }}
                  />
                  <span className="text-sm font-medium text-foreground">{entry.name}</span>
                </div>
                <p className="text-lg font-bold text-foreground mt-1">
                  {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                </p>
              </motion.div>
            );
          }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '10px' }}
          formatter={(value) => (
            <span className="text-sm text-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
