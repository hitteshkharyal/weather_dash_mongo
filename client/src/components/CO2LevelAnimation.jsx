import { motion, AnimatePresence } from 'framer-motion';

/**
 * Overlay effect responding to CO2 levels.
 * Good (<600): Occasional green leaves or fresh particles.
 * High (>1000): Red/orange smoke rising.
 * Critical (>1500): Red haze, warning border.
 */
export default function CO2LevelAnimation({ co2 }) {
  if (co2 === null || co2 === undefined) return null;

  const isGood = co2 < 600;
  const isHigh = co2 >= 1000;
  const isCritical = co2 >= 1500;

  return (
    <AnimatePresence>
      {isGood && (
        <motion.div
          key="good-co2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className="fixed inset-0 pointer-events-none z-10"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-green-400/20 rounded-full blur-[1px]"
              style={{
                width: Math.random() * 6 + 4,
                height: Math.random() * 6 + 4,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: ['-10vh', '110vh'],
                x: ['-5vw', '5vw'],
                rotate: [0, 360],
              }}
              transition={{
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                ease: 'linear',
                delay: Math.random() * -20,
              }}
            />
          ))}
        </motion.div>
      )}

      {isHigh && (
        <motion.div
          key="high-co2"
          initial={{ opacity: 0 }}
          animate={{ opacity: isCritical ? 0.6 : 0.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3 }}
          className="fixed inset-0 pointer-events-none z-10"
        >
          {/* Edge warning glow */}
          {isCritical && (
            <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(239,68,68,0.4)] animate-pulse" />
          )}
          
          {/* Rising smog/smoke */}
          {Array.from({ length: isCritical ? 20 : 10 }).map((_, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full blur-xl ${isCritical ? 'bg-red-500/20' : 'bg-orange-500/10'}`}
              style={{
                width: Math.random() * 150 + 100,
                height: Math.random() * 150 + 100,
                left: `${Math.random() * 100}%`,
                bottom: '-20%',
              }}
              animate={{
                y: ['0vh', '-120vh'],
                x: [0, Math.random() * 100 - 50],
                scale: [1, 2],
              }}
              transition={{
                duration: 20 + Math.random() * 20,
                repeat: Infinity,
                ease: 'linear',
                delay: Math.random() * -30,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
