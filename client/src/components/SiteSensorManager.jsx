import { useEffect, useState } from 'react';
import { Check, LoaderCircle, X } from 'lucide-react';
import api from '../api/axios';

export default function SiteSensorManager({ site, onClose, onSaved }) {
  const [catalog, setCatalog] = useState([]);
  const [selected, setSelected] = useState(
    () => site.sensors?.map((sensor) => sensor.sensorType) || []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/sensors/catalog')
      .then((response) => setCatalog(response.data.data))
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Could not load the sensor catalog.');
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleSensor = (type) => {
    setSelected((current) => (
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    ));
  };

  const saveAssignments = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/sites/${site._id}/sensors`, { sensorTypes: selected });
      await onSaved();
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save sensor assignments.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="sensor-manager-title"
        className="glass w-full max-w-2xl p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">Site setup</p>
            <h2 id="sensor-manager-title" className="mt-1 font-display text-xl font-semibold text-white">
              Sensors · {site.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-surface-400 hover:bg-white/10 hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <p className="mb-4 text-sm text-surface-400">
          Select the sensors physically connected to this site. Only assigned sensors are accepted from its device.
        </p>

        {error && <p role="alert" className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-surface-300">
            <LoaderCircle className="animate-spin" size={18} /> Loading sensor catalog
          </div>
        ) : (
          <div className="grid max-h-[55vh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {catalog.map((sensor) => {
              const checked = selected.includes(sensor.type);
              return (
                <button
                  key={sensor.type}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => toggleSensor(sensor.type)}
                  className={`flex min-h-20 items-start gap-3 rounded-xl border p-3 text-left transition ${
                    checked
                      ? 'border-sky-300/40 bg-sky-300/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-orange-300/30'
                  }`}
                >
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    checked ? 'border-orange-300 bg-orange-400 text-slate-950' : 'border-surface-500'
                  }`}>
                    {checked && <Check size={13} />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{sensor.name}</span>
                    <span className="mt-1 block text-xs leading-5 text-surface-400">{sensor.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <footer className="mt-5 flex items-center justify-between gap-3">
          <span className="text-sm text-surface-400">{selected.length} sensors selected</span>
          <button
            type="button"
            onClick={saveAssignments}
            disabled={loading || saving}
            className="btn-primary flex items-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <LoaderCircle className="animate-spin" size={15} />}
            Save sensor list
          </button>
        </footer>
      </section>
    </div>
  );
}
