import { useMemo, useState } from 'react';
import { Download, X } from 'lucide-react';
import firmwareSketch from '../../../firmware/weather_station.ino?raw';
import api from '../api/axios';
import { buildFirmwareConfig } from '../utils/firmwareConfig';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const DEFAULT_SERVER_URL = `${new URL(API_URL, window.location.origin).origin}/api/v1/sensors/data`;

function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function FirmwareGeneratorModal({ site, onClose }) {
  const assignedTypes = useMemo(
    () => new Set(site.sensors?.map((sensor) => sensor.sensorType) || []),
    [site.sensors]
  );
  const [board, setBoard] = useState('ESP32');
  const [apiKey, setApiKey] = useState(site.apiKey || '');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [rootCertificate, setRootCertificate] = useState('');
  const [error, setError] = useState('');

  const selectedAnalogTypes = ['mq2', 'mq3', 'mq7', 'mq135', 'rainsensor', 'soilmoisture', 'windvane']
    .filter((type) => assignedTypes.has(type));
  const needsAdcWarning = (board === 'ESP8266' && selectedAnalogTypes.length > 1)
    || (board === 'ESP32' && selectedAnalogTypes.length > 6);
  const isHttps = serverUrl.trim().toLowerCase().startsWith('https://');

  const generate = async () => {
    setError('');
    if (!apiKey.trim()) {
      setError('Enter the device API key for this site.');
      return;
    }
    if (!wifiSsid.trim() || !wifiPassword) {
      setError('Enter the Wi-Fi name and password to generate the configuration.');
      return;
    }
    if (!serverUrl.trim() || !/^https?:\/\//i.test(serverUrl.trim())) {
      setError('The API URL must start with http:// or https://.');
      return;
    }
    if (isHttps && !/^-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----$/.test(rootCertificate.trim())) {
      setError('For HTTPS, provide a complete server CA certificate in PEM format so the device can verify the API securely.');
      return;
    }

    try {
      const response = await api.get('/admin/sensors/catalog');
      const config = buildFirmwareConfig({
        board,
        wifiSsid: wifiSsid.trim(),
        wifiPassword,
        serverUrl: serverUrl.trim(),
        siteId: site._id,
        apiKey: apiKey.trim(),
        rootCertificate: rootCertificate.trim(),
        sensorCatalog: response.data.data,
        assignedTypes,
      });

      downloadText('config.h', config);
      downloadText('weather_station.ino', firmwareSketch);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load sensor settings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="firmware-title"
        className="glass my-6 w-full max-w-2xl p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">Firmware builder</p>
            <h2 id="firmware-title" className="mt-1 font-display text-xl font-semibold text-white">{site.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-surface-400 hover:bg-white/10 hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <p className="mb-5 text-sm text-surface-400">
          The generated config enables only sensors assigned to this site. The site API key and Wi-Fi credentials are embedded in the downloaded config; keep it private.
        </p>

        <div className="mb-5 rounded-xl border border-orange-300/20 bg-orange-300/[0.05] p-4">
          <p className="text-sm font-semibold text-white">Device credentials</p>
          <p className="mt-1 text-xs text-surface-400">
            The key is pre-filled from this site. Use the same key shown in Admin Console.
          </p>
          <label className="mt-4 block text-sm text-surface-300">
            Site device API key
            <input
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              className="glass-input mt-2 w-full font-mono text-xs"
              autoComplete="off"
              spellCheck="false"
            />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-surface-300">
              Wi-Fi name (SSID)
              <input
                value={wifiSsid}
                onChange={(event) => setWifiSsid(event.target.value)}
                className="glass-input mt-2 w-full"
                autoComplete="off"
              />
            </label>
            <label className="text-sm text-surface-300">
              Wi-Fi password
              <input
                type="password"
                value={wifiPassword}
                onChange={(event) => setWifiPassword(event.target.value)}
                className="glass-input mt-2 w-full"
                autoComplete="new-password"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-surface-300">
            Board
            <select value={board} onChange={(event) => setBoard(event.target.value)} className="glass-input mt-2 w-full">
              <option value="ESP32">ESP32</option>
              <option value="ESP8266">ESP8266 / NodeMCU</option>
            </select>
          </label>
          <label className="text-sm text-surface-300 sm:col-span-2">
            Sensor API URL
            <input value={serverUrl} onChange={(event) => setServerUrl(event.target.value)} className="glass-input mt-2 w-full font-mono text-xs" />
          </label>
          {isHttps && (
            <label className="text-sm text-surface-300 sm:col-span-2">
              Server root CA certificate (PEM)
              <textarea
                value={rootCertificate}
                onChange={(event) => setRootCertificate(event.target.value)}
                rows={5}
                placeholder="-----BEGIN CERTIFICATE-----"
                className="glass-input mt-2 w-full font-mono text-xs"
              />
              <span className="mt-1 block text-xs text-surface-500">Required for verified HTTPS connections. The generator never disables TLS certificate checks.</span>
            </label>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-sky-300/15 bg-sky-300/[0.06] p-4">
          <p className="text-sm font-semibold text-white">Included sensors ({assignedTypes.size})</p>
          <p className="mt-1 text-xs leading-5 text-surface-400">
            {site.sensors?.length ? site.sensors.map((sensor) => sensor.label || sensor.sensorType).join(' · ') : 'No sensors assigned yet. Assign sensors before generating firmware.'}
          </p>
          {needsAdcWarning && (
            <p className="mt-2 text-xs text-orange-200">
              {board === 'ESP8266'
                ? 'ESP8266 has one analog input (A0). Multiple selected analog sensors require an external analog multiplexer and matching pin configuration.'
                : 'ESP32 boards provide at most six ADC1 inputs that work reliably with Wi-Fi. More selected analog sensors require an external analog multiplexer and matching pin configuration.'}
            </p>
          )}
          {board === 'ESP32' && assignedTypes.has('windvane') && (
            <p className="mt-2 text-xs text-orange-200">
              The default wind-vane pin (GPIO25) is an ADC2 pin and may not work while Wi-Fi is active. Move it to an available ADC1 pin and avoid pin conflicts in config.h.
            </p>
          )}
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}

        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-surface-500">Downloads `config.h` and `weather_station.ino`.</span>
          <button type="button" onClick={generate} disabled={!assignedTypes.size} className="btn-primary flex items-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-50">
            <Download size={15} /> Generate firmware files
          </button>
        </footer>
      </section>
    </div>
  );
}
