import { motion, AnimatePresence } from 'framer-motion';
import SkeletonLoader from './SkeletonLoader';
import {
  Sun, Cloud, CloudRain, CloudLightning, CloudFog, Wind, HelpCircle, Snowflake, Cloudy
} from 'lucide-react';

const CONDITIONS = {
  sunny:     { icon: Sun,             label: 'Sunny',         color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/25' },
  clear:     { icon: Sun,             label: 'Clear',         color: 'text-sky-400',    bg: 'bg-sky-500/15',    border: 'border-sky-500/25' },
  cloudy:    { icon: Cloud,           label: 'Cloudy',        color: 'text-slate-400',  bg: 'bg-slate-500/15',  border: 'border-slate-500/25' },
  rainy:     { icon: CloudRain,       label: 'Rainy',         color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/25' },
  fog:       { icon: CloudFog,        label: 'Fog',           color: 'text-gray-400',   bg: 'bg-gray-500/15',   border: 'border-gray-500/25' },
  mist:      { icon: CloudFog,        label: 'Misty',         color: 'text-gray-300',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20' },
  smog:      { icon: CloudFog,        label: 'Smog',          color: 'text-yellow-500', bg: 'bg-yellow-500/15', border: 'border-yellow-500/25' },
  storm:     { icon: CloudLightning,  label: 'Storm',         color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/25' },
  hailstorm: { icon: CloudLightning,  label: 'Severe Storm',  color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/25' },
  unknown:   { icon: HelpCircle,      label: 'Unknown',       color: 'text-surface-500',bg: 'bg-surface-500/10',border: 'border-surface-500/20' },
};

export default function WeatherConditionBadge({ condition }) {
  if (condition === null || condition === undefined) {
    return <SkeletonLoader type="badge" />;
  }

  const cfg = CONDITIONS[condition] || CONDITIONS.unknown;
  const Icon = cfg.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={condition}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl
                   ${cfg.bg} ${cfg.border} border backdrop-blur-sm`}
      >
        <motion.div
          animate={{ rotate: condition === 'sunny' ? [0, 360] : 0 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <Icon size={24} className={cfg.color} />
        </motion.div>
        <div>
          <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
          <p className="text-[10px] text-surface-500 uppercase tracking-wider">
            Current Condition
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
