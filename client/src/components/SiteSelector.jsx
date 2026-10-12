import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Radio } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function SiteSelector({ selectedSiteId, onSelectSite }) {
  const { user, isAdmin } = useAuth();
  const [sites, setSites] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        if (isAdmin) {
          const res = await api.get('/admin/sites');
          setSites(res.data.data);
        } else {
          // Non-admin users only see their assigned sites
          setSites(user?.assignedSites || []);
        }
      } catch (err) {
        console.error('Failed to fetch sites:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [isAdmin, user]);

  // Auto-select first site if none selected
  useEffect(() => {
    if (!selectedSiteId && sites.length > 0) {
      onSelectSite(sites[0]._id);
    }
  }, [sites, selectedSiteId, onSelectSite]);

  const selectedSite = sites.find((s) => s._id === selectedSiteId);

  if (loading) {
    return (
      <div className="glass-sm px-4 py-3 flex items-center gap-2 animate-pulse">
        <div className="w-4 h-4 bg-surface-700 rounded" />
        <div className="w-32 h-4 bg-surface-700 rounded" />
      </div>
    );
  }

  return (
    <div className="relative" id="site-selector">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-sm px-4 py-2.5 flex items-center gap-3 cursor-pointer
                   hover:border-brand-500/30 transition-all duration-200 min-w-[220px]"
      >
        <MapPin size={16} className="text-brand-400" />
        <span className="text-sm font-medium text-surface-200 truncate flex-1 text-left">
          {selectedSite ? selectedSite.name : 'Select a site'}
        </span>
        <ChevronDown
          size={14}
          className={`text-surface-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-full min-w-[260px] glass z-50 overflow-hidden"
          >
            {sites.length === 0 ? (
              <div className="px-4 py-6 text-center text-surface-500 text-sm">
                No sites assigned
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {sites.map((site) => (
                  <button
                    key={site._id}
                    onClick={() => {
                      setIsOpen(false);
                      if (debounceRef.current) clearTimeout(debounceRef.current);
                      debounceRef.current = setTimeout(() => {
                        onSelectSite(site._id);
                      }, 300);
                    }}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left
                               transition-all duration-150 cursor-pointer
                               ${site._id === selectedSiteId
                                 ? 'bg-brand-500/15 text-brand-300'
                                 : 'hover:bg-surface-800/50 text-surface-300'
                               }`}
                  >
                    <Radio
                      size={14}
                      className={site._id === selectedSiteId ? 'text-brand-400' : 'text-surface-600'}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{site.name}</p>
                      {site.location?.address && (
                        <p className="text-xs text-surface-500 truncate mt-0.5">
                          {site.location.address}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close dropdown on outside click */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
