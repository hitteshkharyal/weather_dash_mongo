import { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Immersive weather-themed animated background.
 * Adapts to the inferred weather condition.
 */

function SunEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Sun glow orb */}
      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,200,50,0.4), transparent 70%)',
          top: '5%',
          right: '15%',
          filter: 'blur(10px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Inner core */}
      <motion.div
        className="absolute w-32 h-32 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,200,0.8), transparent 70%)',
          top: '12%',
          right: '18%',
          filter: 'blur(5px)',
        }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Lens flares / sun rays */}
      <div className="absolute inset-0 origin-top-right animate-sun-rays opacity-50" 
           style={{ background: 'conic-gradient(from 0deg at 80% 20%, transparent 0deg, rgba(255,200,50,0.1) 15deg, transparent 30deg, transparent 180deg, rgba(255,200,50,0.1) 195deg, transparent 210deg)' }} />
    </div>
  );
}

function ClearNightEffect() {
  const stars = useMemo(() => Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: 2 + Math.random() * 4,
    delay: Math.random() * 2,
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute bg-white rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            filter: 'blur(0.5px)',
          }}
          animate={{ opacity: [0.1, 0.8, 0.1], scale: [1, 1.2, 1] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function CloudEffect({ condition }) {
  const isDark = condition === 'storm' || condition === 'hailstorm';
  const color = isDark ? 'rgba(50, 60, 70,' : 'rgba(180, 190, 210,';
  
  const clouds = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    top: Math.random() * 40 - 10,
    size: 200 + Math.random() * 300,
    duration: 30 + Math.random() * 50,
    delay: Math.random() * -50,
    opacity: 0.1 + Math.random() * 0.15,
    zIndex: i % 3,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {clouds.map((c) => (
        <motion.div
          key={c.id}
          className="absolute rounded-full"
          style={{
            width: `${c.size}px`,
            height: `${c.size * 0.6}px`,
            top: `${c.top}%`,
            background: `radial-gradient(ellipse, ${color}${c.opacity}), transparent 70%)`,
            filter: 'blur(20px)',
            zIndex: c.zIndex,
          }}
          animate={{ x: ['-50vw', '120vw'] }}
          transition={{ duration: c.duration, repeat: Infinity, delay: c.delay, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

function RainDrops({ heavy = false }) {
  const count = heavy ? 100 : 40;
  const drops = useMemo(() => Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: Math.random() * 120 - 10, // Wider spread for angle
    delay: Math.random() * 1.5,
    duration: heavy ? 0.3 + Math.random() * 0.2 : 0.6 + Math.random() * 0.4,
    height: heavy ? 40 + Math.random() * 30 : 20 + Math.random() * 20,
    opacity: heavy ? 0.4 + Math.random() * 0.3 : 0.2 + Math.random() * 0.3,
  })), [count, heavy]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {drops.map((d) => (
        <div
          key={d.id}
          className="absolute bg-gradient-to-b from-transparent to-blue-300/60 w-px origin-bottom animate-rain"
          style={{
            left: `${d.left}%`,
            top: '-10%',
            height: `${d.height}px`,
            opacity: d.opacity,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
            transform: 'rotate(15deg)', // Wind angle
          }}
        />
      ))}
      {/* Splash ripples at bottom */}
      {heavy && <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-100/5 to-transparent animate-pulse-slow" />}
    </div>
  );
}

function HailEffect() {
  const pellets = useMemo(() => Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1,
    duration: 0.4 + Math.random() * 0.3,
    size: 2 + Math.random() * 4,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
      {pellets.map((p) => (
        <div
          key={p.id}
          className="absolute bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)] animate-hail"
          style={{
            left: `${p.left}%`,
            top: '-5%',
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function FogEffect({ smog = false }) {
  const color = smog ? 'rgba(150, 130, 80,' : 'rgba(200, 210, 220,';
  
  const banks = useMemo(() => Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    top: 20 + Math.random() * 60,
    duration: 15 + Math.random() * 20,
    delay: Math.random() * -20,
    opacity: smog ? 0.15 + Math.random() * 0.1 : 0.2 + Math.random() * 0.15,
    scale: 1 + Math.random() * 1,
  })), [smog]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
      {banks.map((b, i) => (
        <motion.div
          key={b.id}
          className="absolute w-[200%] h-64 left-[-50%] rounded-[100%]"
          style={{
            top: `${b.top}%`,
            background: `radial-gradient(ellipse at center, ${color}${b.opacity}) 0%, transparent 70%)`,
            filter: 'blur(30px)',
          }}
          animate={{ 
            x: ['-10%', '10%', '-10%'],
            scale: [b.scale, b.scale * 1.1, b.scale],
            opacity: [b.opacity * 0.8, b.opacity, b.opacity * 0.8]
          }}
          transition={{ duration: b.duration, repeat: Infinity, delay: b.delay, ease: 'easeInOut' }}
        />
      ))}
      <div className={`absolute inset-0 ${smog ? 'bg-yellow-900/10' : 'bg-slate-200/5'}`} />
    </div>
  );
}

function LightningEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div className="absolute inset-0 bg-white/10 opacity-0 animate-lightning" />
      <div className="absolute inset-0 bg-indigo-200/5 opacity-0 animate-lightning" style={{ animationDelay: '2.5s' }} />
    </div>
  );
}

export default function AnimatedBackground({ condition = 'unknown' }) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-[2000ms]" data-weather={condition}>
      
      {/* The base dynamic gradient is handled by CSS variables based on data-weather on root */}
      <div className="absolute inset-0 theme-bg-gradient transition-all duration-[2000ms]" />

      <AnimatePresence mode="popLayout">
        {(condition === 'sunny' || condition === 'clear') && (
          <motion.div key="sun" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}>
            {condition === 'sunny' ? <SunEffect /> : <ClearNightEffect />}
          </motion.div>
        )}

        {(condition === 'cloudy' || condition === 'rainy' || condition === 'storm' || condition === 'hailstorm') && (
          <motion.div key="clouds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}>
            <CloudEffect condition={condition} />
          </motion.div>
        )}

        {(condition === 'rainy' || condition === 'storm' || condition === 'hailstorm') && (
          <motion.div key="rain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
            <RainDrops heavy={condition === 'storm' || condition === 'hailstorm'} />
          </motion.div>
        )}

        {(condition === 'storm' || condition === 'hailstorm') && (
          <motion.div key="lightning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
            <LightningEffect />
          </motion.div>
        )}

        {condition === 'hailstorm' && (
          <motion.div key="hail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
            <HailEffect />
          </motion.div>
        )}

        {(condition === 'fog' || condition === 'mist' || condition === 'smog') && (
          <motion.div key="fog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}>
            <FogEffect smog={condition === 'smog'} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle ambient grain overlay for texture - Removed due to visual issues */}
    </div>
  );
}
