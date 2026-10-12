import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import SkeletonLoader from './SkeletonLoader';
import { TrendingUp, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../api/axios';

const METRICS = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#EF4444', checked: true },
  { key: 'humidity',    label: 'Humidity',    unit: '%',  color: '#3B82F6', checked: true },
  { key: 'co2',         label: 'CO₂',         unit: 'ppm',color: '#A855F7', checked: false },
  { key: 'uvIndex',     label: 'UV Index',    unit: '',   color: '#F59E0B', checked: false },
  { key: 'windSpeed',   label: 'Wind Speed',  unit: 'km/h',color: '#06B6D4', checked: false },
  { key: 'pressure',    label: 'Pressure',    unit: 'hPa',color: '#22C55E', checked: false },
  { key: 'rainIntensity', label: 'Rain',      unit: '%',  color: '#6366F1', checked: false },
];

const TIME_RANGES = [
  { key: '1h',  label: '1H',  hours: 1 },
  { key: '6h',  label: '6H',  hours: 6 },
  { key: '24h', label: '24H', hours: 24 },
  { key: '7d',  label: '7D',  hours: 168 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-sm p-3 shadow-glass text-xs">
      <p className="text-surface-400 mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-surface-300">{entry.name}:</span>
          <span className="text-white font-medium">
            {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TimeSeriesChart({ siteId, realtimeData }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');
  const [activeMetrics, setActiveMetrics] = useState(
    METRICS.reduce((acc, m) => ({ ...acc, [m.key]: m.checked }), {})
  );

  // Fetch historical data
  useEffect(() => {
    const fetchReadings = async () => {
      if (!siteId) return;
      setLoading(true);
      try {
        const range = TIME_RANGES.find((r) => r.key === timeRange);
        const from = new Date(Date.now() - range.hours * 3600 * 1000).toISOString();
        const res = await api.get('/sensors/readings', {
          params: { siteId, from, limit: 500 },
        });

        const formatted = res.data.data
          .reverse()
          .map((r) => ({
            time: new Date(r.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            ...r.data,
          }));

        setReadings(formatted);
      } catch (err) {
        console.error('Failed to fetch readings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReadings();
  }, [siteId, timeRange]);

  // Append realtime data
  useEffect(() => {
    if (!realtimeData) return;
    setReadings((prev) => {
      const newPoint = {
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        ...realtimeData,
      };
      const updated = [...prev, newPoint];
      // Keep last 500 points
      return updated.slice(-500);
    });
  }, [realtimeData]);

  const toggleMetric = (key) => {
    setActiveMetrics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleMetrics = METRICS.filter((m) => activeMetrics[m.key]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Sensor Trends</h3>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 glass-sm p-0.5">
          {TIME_RANGES.map((range) => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                         ${timeRange === range.key
                           ? 'bg-brand-500/20 text-brand-300'
                           : 'text-surface-500 hover:text-surface-300'
                         }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Toggles */}
      <div className="flex flex-wrap gap-2 mb-4">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer
                       ${activeMetrics[m.key]
                         ? 'border-opacity-50 text-white'
                         : 'border-surface-800 text-surface-600 hover:text-surface-400'
                       }`}
            style={
              activeMetrics[m.key]
                ? { borderColor: m.color, backgroundColor: `${m.color}20`, color: m.color }
                : {}
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-72">
        {loading ? (
          <SkeletonLoader type="chart" className="h-64 mt-4" />
        ) : readings.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-surface-500 text-sm">
            No data available for this period.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={readings} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                {METRICS.map((m) => (
                  <linearGradient key={m.key} id={`gradient-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={m.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={m.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(100,116,139,0.15)' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {visibleMetrics.map((m) => (
                <Area
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={`${m.label}${m.unit ? ` (${m.unit})` : ''}`}
                  stroke={m.color}
                  strokeWidth={2}
                  fill={`url(#gradient-${m.key})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}
