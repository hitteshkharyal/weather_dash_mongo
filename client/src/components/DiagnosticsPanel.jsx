import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, WifiOff, Clock, RefreshCw } from 'lucide-react';
import api from '../api/axios';

/**
 * Real-time sensor diagnostics panel.
 * Shows online/offline status, last ping, and latency for each sensor.
 */

const SENSOR_LABELS = {
  bme280:     { name: 'BME280',      desc: 'Temp / Humidity / Pressure' },
  dht11:      { name: 'DHT11',       desc: 'Temperature / Humidity' },
  dht22:      { name: 'DHT22',       desc: 'Temperature / Humidity' },
  bmp280:     { name: 'BMP280',      desc: 'Temperature / Pressure' },
  scd41:      { name: 'SCD41',       desc: 'CO₂ Monitor' },
  mq2:        { name: 'MQ-2',        desc: 'Combustible gas / smoke' },
  mq3:        { name: 'MQ-3',        desc: 'Alcohol vapour' },
  mq7:        { name: 'MQ-7',        desc: 'Carbon monoxide' },
  mq135:      { name: 'MQ-135',      desc: 'Air quality / gas resistance' },
  ltr390:     { name: 'LTR390',      desc: 'UV / Light Sensor' },
  bh1750:     { name: 'BH1750',      desc: 'Ambient light' },
  anemometer: { name: 'Anemometer',  desc: 'Wind Speed / Direction' },
  windvane:   { name: 'Wind vane',   desc: 'Wind direction' },
  rainsensor: { name: 'Rain-drop sensor', desc: 'Rainfall Intensity' },
  soilmoisture: { name: 'Soil moisture', desc: 'Soil moisture level' },
};

function formatLatency(ms) {
  if (ms === null || ms === undefined) return '--';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ago`;
}

function formatTime(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function DiagnosticsPanel({ siteId }) {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchStatus = async () => {
    if (!siteId) return;
    try {
      const res = await api.get('/sensors/status', { params: { siteId } });
      setSensors(res.data.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch sensor status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [siteId]);

  const onlineCount = sensors.filter((s) => s.status === 'online').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Sensor Diagnostics</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-surface-500">
            {onlineCount}/{sensors.length} online
          </span>
          <button
            onClick={fetchStatus}
            className="p-1.5 rounded-lg hover:bg-surface-800/50 text-surface-500
                       hover:text-surface-300 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-900/30 animate-pulse">
              <div className="w-3 h-3 bg-surface-700 rounded-full" />
              <div className="flex-1">
                <div className="h-3 bg-surface-700 rounded w-20 mb-2" />
                <div className="h-2.5 bg-surface-800 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : sensors.length === 0 ? (
        <div className="text-center py-8 text-surface-600 text-sm">
          <WifiOff size={24} className="mx-auto mb-2 opacity-40" />
          No sensors reporting for this site
        </div>
      ) : (
        <div className="space-y-2">
          {sensors.map((sensor) => {
            const info = SENSOR_LABELS[sensor.sensorType] || {
              name: sensor.sensorType,
              desc: '',
            };
            const isOnline = sensor.status === 'online';
            const hasReported = Boolean(sensor.lastPing);
            const sensorStatus = isOnline ? 'ONLINE' : hasReported ? 'OFFLINE' : 'CONFIGURED';
            const statusClasses = isOnline
              ? 'bg-green-500/20 text-green-400'
              : hasReported
                ? 'bg-red-500/20 text-red-400'
                : 'bg-orange-400/15 text-orange-200';

            return (
              <div
                key={sensor._id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
                           ${isOnline
                             ? 'bg-green-500/5 border-green-500/15'
                             : hasReported
                               ? 'bg-red-500/5 border-red-500/15'
                               : 'bg-orange-400/[0.04] border-orange-300/15'
                           }`}
              >
                {/* Status indicator */}
                <div className="relative">
                  <div
                    className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : hasReported ? 'bg-red-500' : 'bg-orange-400'}`}
                  />
                  {isOnline && (
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-30" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-surface-200">
                      {info.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium
                                 ${statusClasses}`}
                    >
                      {sensorStatus}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">{info.desc}</p>
                </div>

                {/* Latency / Last Ping */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-surface-400">
                    <Clock size={10} />
                    {formatTime(sensor.lastPing)}
                  </div>
                  <p className="text-[10px] text-surface-600 mt-0.5">
                    {formatLatency(sensor.latencyMs)}
                  </p>
                </div>

                {/* Latency bar */}
                <div className="w-12 h-1.5 bg-surface-800/50 rounded-full overflow-hidden flex-shrink-0">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOnline
                        ? sensor.latencyMs < 5000
                          ? 'bg-green-500'
                          : sensor.latencyMs < 30000
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                        : hasReported ? 'bg-red-500/30' : 'bg-orange-400/30'
                    }`}
                    style={{
                      width: isOnline
                        ? `${Math.max(10, Math.min(100, 100 - (sensor.latencyMs / 600) * 100))}%`
                        : '5%',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lastRefresh && (
        <p className="text-[10px] text-surface-600 mt-3 text-right">
          Last refresh: {formatTime(lastRefresh)}
        </p>
      )}
    </motion.div>
  );
}
