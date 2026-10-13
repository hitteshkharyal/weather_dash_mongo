import { motion, AnimatePresence } from 'framer-motion';
import SkeletonLoader from './SkeletonLoader';

/**
 * Glassmorphic gauge card with animated SVG circular gauge.
 *
 * Props:
 *  - label: string
 *  - value: number
 *  - unit: string
 *  - min: number
 *  - max: number
 *  - icon: React element
 *  - color: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan'
 *  - precision: number (decimal places)
 */

const COLOR_MAP = {
  blue:   { stroke: '#38BDF8', glow: 'shadow-glow-blue',  bg: 'from-sky-400/15 to-sky-600/5',       text: 'text-sky-300' },
  green:  { stroke: '#38BDF8', glow: 'shadow-glow-blue',  bg: 'from-sky-400/15 to-sky-600/5',       text: 'text-sky-300' },
  amber:  { stroke: '#FB923C', glow: 'shadow-glow-amber', bg: 'from-orange-400/15 to-orange-600/5', text: 'text-orange-300' },
  red:    { stroke: '#FB923C', glow: 'shadow-glow-amber', bg: 'from-orange-400/15 to-orange-600/5', text: 'text-orange-300' },
  purple: { stroke: '#38BDF8', glow: 'shadow-glow-blue',  bg: 'from-sky-400/15 to-sky-600/5',       text: 'text-sky-300' },
  cyan:   { stroke: '#38BDF8', glow: 'shadow-glow-blue',  bg: 'from-sky-400/15 to-sky-600/5',       text: 'text-sky-300' },
  indigo: { stroke: '#FB923C', glow: 'shadow-glow-amber', bg: 'from-orange-400/15 to-orange-600/5', text: 'text-orange-300' },
};

export default function GaugeCard({
  label,
  value,
  unit,
  min = 0,
  max = 100,
  icon,
  color = 'blue',
  precision = 1,
}) {
  const cfg = COLOR_MAP[color] || COLOR_MAP.blue;

  // SVG gauge geometry
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(Math.max(value ?? 0, min), max);
  const percentage = ((clampedValue - min) / (max - min)) * 100;
  const dashOffset = circumference - (percentage / 100) * circumference;

  if (value === null || value === undefined) {
    return <SkeletonLoader type="gauge" />;
  }

  const displayValue = Number(value).toFixed(precision);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-5 flex flex-col items-center relative overflow-hidden group"
    >
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${cfg.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      {/* Label */}
      <div className="relative z-10 flex items-center gap-2 mb-4">
        {icon && <span className={`${cfg.text} opacity-70`}>{icon}</span>}
        <span className="text-xs font-medium text-surface-400 uppercase tracking-wider">
          {label}
        </span>
      </div>

      {/* SVG Gauge */}
      <div className="relative w-32 h-32 z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Background track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(100,116,139,0.15)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Animated value arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={cfg.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="gauge-circle"
            style={{
              filter: `drop-shadow(0 0 6px ${cfg.stroke}40)`,
            }}
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="h-8 overflow-hidden relative w-full flex justify-center items-center">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={displayValue}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-2xl font-display font-bold text-white leading-none absolute"
              >
                {displayValue}
              </motion.span>
            </AnimatePresence>
          </div>
          <span className="text-xs text-surface-500 mt-1">{unit}</span>
        </div>
      </div>

      {/* Percentage bar */}
      <div className="relative z-10 w-full mt-4">
        <div className="h-1 bg-surface-800/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: cfg.stroke }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-surface-600">{min}{unit}</span>
          <span className="text-[10px] text-surface-600">{max}{unit}</span>
        </div>
      </div>
    </motion.div>
  );
}
