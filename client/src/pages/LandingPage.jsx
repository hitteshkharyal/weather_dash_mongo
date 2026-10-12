import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cloud, Wind, Droplets, Shield, Activity, ArrowRight } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Reusing our beautiful AnimatedBackground, let's set it to 'clear' for a nice twilight vibe */}
      <AnimatedBackground condition="clear" />

      {/* Header */}
      <header className="relative z-10 py-6 px-8 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <Cloud className="text-brand-400" size={32} />
          <span className="text-2xl font-display font-bold text-white tracking-tight">
            Weather<span className="text-brand-400">Dash</span>
          </span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="btn-primary px-6 py-2 rounded-full font-medium shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all"
        >
          Sign In
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center pt-10 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Real-time IoT Environmental Monitoring
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white leading-tight tracking-tight">
            Visualize your climate <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">
              in stunning detail.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-surface-300 max-w-2xl mx-auto leading-relaxed">
            Connect your ESP32 sensor arrays to our real-time platform. Monitor temperature, humidity, rainfall, CO₂, and more with cinematic, data-driven animations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/login')}
              className="btn-primary px-8 py-4 rounded-xl font-medium text-lg flex items-center gap-2 group w-full sm:w-auto justify-center"
            >
              Enter Dashboard
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full mt-24"
        >
          <FeatureCard 
            icon={<Activity className="text-rose-400" size={28} />}
            title="Real-time Telemetry"
            description="Ultra-low latency Socket.io connections stream live data from your hardware to your screen."
          />
          <FeatureCard 
            icon={<Wind className="text-cyan-400" size={28} />}
            title="Immersive UX"
            description="The interface dynamically transforms with the weather, utilizing cinematic animations and glassmorphism."
          />
          <FeatureCard 
            icon={<Shield className="text-emerald-400" size={28} />}
            title="Secure & Scalable"
            description="Role-based access control, secure HTTP-only cookies, and encrypted multi-site management."
          />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-surface-500 text-sm border-t border-white/5 bg-surface-950/50 backdrop-blur-md">
        <p>© {new Date().getFullYear()} WeatherDash IoT Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="glass-card p-8 rounded-2xl text-left hover:scale-[1.02] transition-transform duration-300">
      <div className="w-14 h-14 rounded-xl bg-surface-800/50 flex items-center justify-center mb-6 border border-white/5">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-surface-400 leading-relaxed">{description}</p>
    </div>
  );
}
