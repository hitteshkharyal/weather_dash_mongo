import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Thermometer, Droplets, Wind, Sun, Gauge, Cloud,
  LogOut, Shield, Wifi, WifiOff, Clock, CloudRain, Maximize2, Minimize2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import useFullscreen from '../hooks/useFullscreen';
import AnimatedBackground from '../components/AnimatedBackground';
import HumidityAnimation from '../components/HumidityAnimation';
import CO2LevelAnimation from '../components/CO2LevelAnimation';
import SiteSelector from '../components/SiteSelector';
import GaugeCard from '../components/GaugeCard';
import WeatherConditionBadge from '../components/WeatherConditionBadge';
import DiagnosticsPanel from '../components/DiagnosticsPanel';
import TimeSeriesChart from '../components/TimeSeriesChart';
import api from '../api/axios';

export default function WeatherDashboard() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [latestReading, setLatestReading] = useState(null);
  const [condition, setCondition] = useState('unknown');

  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen();

  // Socket.io real-time connection
  const { connected, latestData, lastUpdate } = useSocket(selectedSiteId);

  // Update display when new real-time data arrives
  useEffect(() => {
    if (latestData) {
      setLatestReading(latestData);
      if (latestData.inferredCondition) {
        setCondition(latestData.inferredCondition);
      }
    }
  }, [latestData]);

  // Fetch most recent reading on site change
  useEffect(() => {
    const fetchLatest = async () => {
      if (!selectedSiteId) return;
      try {
        const res = await api.get('/sensors/readings', {
          params: { siteId: selectedSiteId, limit: 1 },
        });
        if (res.data.data.length > 0) {
          const reading = res.data.data[0];
          setLatestReading(reading.data);
          setCondition(reading.inferredCondition || 'unknown');
        } else {
          setLatestReading(null);
          setCondition('unknown');
        }
      } catch (err) {
        console.error('Failed to fetch latest reading:', err);
      }
    };
    fetchLatest();
  }, [selectedSiteId]);

  const onSelectSite = useCallback((siteId) => {
    setSelectedSiteId(siteId);
    setLatestReading(null);
    setCondition('unknown');
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const r = latestReading || {};
  const extraMeasurements = [
    ['mq2Level', 'MQ-2 gas signal', 'raw ADC'],
    ['mq3Level', 'MQ-3 gas signal', 'raw ADC'],
    ['mq7Level', 'MQ-7 gas signal', 'raw ADC'],
    ['mq135Level', 'MQ-135 air signal', 'raw ADC'],
    ['soilMoisture', 'Soil moisture', '%'],
  ].filter(([key]) => r[key] !== undefined);

  return (
    <div className="min-h-screen relative">
      {/* Dynamic weather background */}
      <AnimatedBackground condition={condition} />

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-surface-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Cloud size={22} className="text-brand-400" />
              <h1 className="text-lg font-display font-bold text-white hidden sm:block">
                Weather Dashboard
              </h1>
            </div>
            <div className="h-6 w-px bg-surface-800 hidden sm:block" />
            <SiteSelector
              selectedSiteId={selectedSiteId}
              onSelectSite={onSelectSite}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Connection status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-900/30 border border-surface-800/50">
              {connected ? (
                <Wifi size={13} className="text-green-400" />
              ) : (
                <WifiOff size={13} className="text-red-400" />
              )}
              <span className="text-[11px] text-surface-400 hidden sm:inline">
                {connected ? 'Live' : 'Disconnected'}
              </span>
            </div>

            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="btn-secondary flex items-center gap-2 text-sm py-2"
              >
                <Shield size={14} />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            <button onClick={toggleFullscreen} className="btn-secondary flex items-center gap-2 py-2">
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>

            <button onClick={handleLogout} className="btn-danger flex items-center gap-2">
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Overlays */}
      <HumidityAnimation humidity={r.humidity} />
      <CO2LevelAnimation co2={r.co2} />

      {/* Main Content */}
      <main className={`relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 transition-all duration-500
                       ${isFullscreen ? 'max-w-[95%] xl:max-w-[1600px] mt-4 scale-[1.02]' : 'max-w-7xl'}`}>
        {/* Weather Condition & Last Update */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4"
        >
          <WeatherConditionBadge condition={condition} />
          {lastUpdate && (
            <div className="flex items-center gap-2 text-xs text-surface-500">
              <Clock size={12} />
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </motion.div>

        {/* Gauge Cards Grid */}
        <div className={`grid gap-4 ${isFullscreen ? 'grid-cols-3 lg:grid-cols-4 xl:grid-cols-7' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
          <GaugeCard
            label="Temperature"
            value={r.temperature}
            unit="°C"
            min={-10}
            max={50}
            icon={<Thermometer size={14} />}
            color="red"
            precision={1}
          />
          <GaugeCard
            label="Humidity"
            value={r.humidity}
            unit="%"
            min={0}
            max={100}
            icon={<Droplets size={14} />}
            color="blue"
            precision={1}
          />
          <GaugeCard
            label="Pressure"
            value={r.pressure}
            unit="hPa"
            min={950}
            max={1050}
            icon={<Gauge size={14} />}
            color="green"
            precision={1}
          />
          <GaugeCard
            label="CO₂"
            value={r.co2}
            unit="ppm"
            min={300}
            max={2000}
            icon={<Cloud size={14} />}
            color="purple"
            precision={0}
          />
          <GaugeCard
            label="UV Index"
            value={r.uvIndex}
            unit=""
            min={0}
            max={12}
            icon={<Sun size={14} />}
            color="amber"
            precision={1}
          />
          <GaugeCard
            label="Wind Speed"
            value={r.windSpeed}
            unit="km/h"
            min={0}
            max={120}
            icon={<Wind size={14} />}
            color="cyan"
            precision={1}
          />
          <GaugeCard
            label="Rainfall"
            value={r.rainIntensity}
            unit="%"
            min={0}
            max={100}
            icon={<CloudRain size={14} />}
            color="indigo"
            precision={0}
          />
        </div>

        {/* Charts & Diagnostics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Time-series chart (2/3 width) */}
          <div className="lg:col-span-2">
            <TimeSeriesChart siteId={selectedSiteId} realtimeData={latestData} />
          </div>

          {/* Diagnostics panel (1/3 width) */}
          <div>
            <DiagnosticsPanel siteId={selectedSiteId} />
          </div>
        </div>

        {/* Additional data cards */}
        {latestReading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {r.ambientLight !== undefined && (
              <div className="glass-card p-4 text-center">
                <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Ambient Light</p>
                <p className="text-2xl font-display font-bold text-white">
                  {Math.round(r.ambientLight).toLocaleString()}
                </p>
                <p className="text-xs text-surface-500 mt-0.5">lux</p>
              </div>
            )}
            {r.windDirection !== undefined && (
              <div className="glass-card p-4 text-center">
                <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Wind Direction</p>
                <p className="text-2xl font-display font-bold text-white">
                  {Math.round(r.windDirection)}°
                </p>
                <p className="text-xs text-surface-500 mt-0.5">
                  {getCompassDirection(r.windDirection)}
                </p>
              </div>
            )}
            {extraMeasurements.map(([key, label, unit]) => (
              <div key={key} className="glass-card p-4 text-center">
                <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-2xl font-display font-bold text-white">
                  {Number(r[key]).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </p>
                <p className="text-xs text-surface-500 mt-0.5">{unit}</p>
              </div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Fixed Fullscreen Exit Button */}
      {isFullscreen && (
        <motion.button
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          onClick={exitFullscreen}
          className="fixed bottom-6 right-6 z-50 glass-card px-6 py-3 flex items-center gap-3 text-white font-medium hover:bg-white/10"
        >
          <Minimize2 size={18} />
          Exit Fullscreen
        </motion.button>
      )}

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-t border-surface-800/50 pt-4 text-center">
          <p className="text-xs text-surface-600">
            IoT Weather Dashboard • Logged in as{' '}
            <span className="text-surface-400">{user?.name}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

// Helper: convert degrees to compass direction
function getCompassDirection(deg) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(deg / 22.5) % 16;
  return directions[idx];
}
