import { motion, AnimatePresence } from 'framer-motion';

/**
 * Overlay effect responding to humidity levels.
 * High humidity (>80%) creates condensation/mist at the edges.
 * Low humidity (<30%) creates a subtle dry/shimmer effect.
 */
export default function HumidityAnimation({ humidity }) {
  if (humidity === null || humidity === undefined) return null;

  const isHigh = humidity >= 80;
  const isLow = humidity <= 30;

  return (
    <AnimatePresence>
      {isHigh && (
        <motion.div
          key="high-humidity"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3 }}
          className="fixed inset-0 pointer-events-none z-10"
        >
          {/* Condensation blur at edges */}
          <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(255,255,255,0.2)] mix-blend-overlay backdrop-blur-[2px]" />
          {/* Floating water particles */}
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-blue-100/30 rounded-full blur-[2px]"
              style={{
                width: Math.random() * 40 + 20,
                height: Math.random() * 40 + 20,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </motion.div>
      )}

      {isLow && (
        <motion.div
          key="low-humidity"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3 }}
          className="fixed inset-0 pointer-events-none z-10 bg-amber-900/5 mix-blend-color-burn"
        >
           {/* Heat wave distortion simulation */}
           <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent animate-pulse-slow" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
