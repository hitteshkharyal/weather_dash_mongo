import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MapPin, Plus, Trash2, Edit3, Key, Link2, Shield,
  LogOut, LayoutDashboard, ChevronRight, X, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.2 },
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('sites');

  // Sites state
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [showCreateSite, setShowCreateSite] = useState(false);
  const [newSite, setNewSite] = useState({ name: '', description: '', address: '', latitude: '', longitude: '' });

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'user', assignedSites: [] });

  // Assignment modal
  const [assignModal, setAssignModal] = useState(null); // userId
  const [assignSiteIds, setAssignSiteIds] = useState([]);

  const [message, setMessage] = useState('');

  // Fetch data
  useEffect(() => {
    fetchSites();
    fetchUsers();
  }, []);

  const fetchSites = async () => {
    try {
      const res = await api.get('/admin/sites');
      setSites(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSitesLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  // ─── Site Actions ─────────────────────────────────────────
  const handleCreateSite = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/sites', {
        name: newSite.name,
        description: newSite.description,
        location: {
          address: newSite.address,
          latitude: parseFloat(newSite.latitude) || 0,
          longitude: parseFloat(newSite.longitude) || 0,
        },
      });
      setNewSite({ name: '', description: '', address: '', latitude: '', longitude: '' });
      setShowCreateSite(false);
      fetchSites();
      flash('Site created successfully');
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to create site');
    }
  };

  const handleDeleteSite = async (id) => {
    if (!confirm('Are you sure you want to delete this site?')) return;
    try {
      await api.delete(`/admin/sites/${id}`);
      fetchSites();
      fetchUsers();
      flash('Site deleted');
    } catch (err) {
      flash('Failed to delete site');
    }
  };

  const handleRegenerateKey = async (id) => {
    if (!confirm('Regenerate API key? The old key will stop working.')) return;
    try {
      await api.put(`/admin/sites/${id}/regenerate-key`);
      fetchSites();
      flash('API key regenerated');
    } catch (err) {
      flash('Failed to regenerate key');
    }
  };

  // ─── User Actions ─────────────────────────────────────────
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', newUser);
      setNewUser({ email: '', password: '', name: '', role: 'user', assignedSites: [] });
      setShowCreateUser(false);
      fetchUsers();
      flash('User created successfully');
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
      flash('User deleted');
    } catch (err) {
      flash('Failed to delete user');
    }
  };

  const openAssignModal = (userId) => {
    const u = users.find((u) => u._id === userId);
    setAssignSiteIds(u?.assignedSites?.map((s) => s._id || s) || []);
    setAssignModal(userId);
  };

  const handleAssignSites = async () => {
    try {
      await api.put(`/admin/users/${assignModal}/assign-sites`, {
        siteIds: assignSiteIds,
      });
      setAssignModal(null);
      fetchUsers();
      flash('Sites assigned successfully');
    } catch (err) {
      flash('Failed to assign sites');
    }
  };

  const toggleSiteAssignment = (siteId) => {
    setAssignSiteIds((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-surface-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={22} className="text-brand-400" />
            <h1 className="text-lg font-display font-bold text-white">Admin Console</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary flex items-center gap-2 text-sm py-2"
            >
              <LayoutDashboard size={14} />
              Dashboard
            </button>
            <button onClick={handleLogout} className="btn-danger flex items-center gap-2">
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Flash Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            {...fadeIn}
            className="fixed top-20 right-4 z-50 glass-sm px-5 py-3 text-sm text-brand-300
                       flex items-center gap-2 shadow-glass"
          >
            <Check size={14} />
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-1 glass-sm p-1 w-fit mb-8">
          {[
            { key: 'sites', label: 'Sites', icon: MapPin },
            { key: 'users', label: 'Users', icon: Users },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
                         transition-all duration-200 cursor-pointer
                         ${tab === key
                           ? 'bg-brand-500/20 text-brand-300 shadow-sm'
                           : 'text-surface-400 hover:text-surface-200'
                         }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* ─── Sites Tab ─────────────────────────────────────── */}
        {tab === 'sites' && (
          <motion.div {...fadeIn}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-white">
                IoT Sites ({sites.length})
              </h2>
              <button
                onClick={() => setShowCreateSite(!showCreateSite)}
                className="btn-primary flex items-center gap-2 text-sm py-2.5"
              >
                <Plus size={15} />
                New Site
              </button>
            </div>

            {/* Create Site Form */}
            <AnimatePresence>
              {showCreateSite && (
                <motion.form
                  {...fadeIn}
                  onSubmit={handleCreateSite}
                  className="glass-card p-6 mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Create New Site</h3>
                    <button type="button" onClick={() => setShowCreateSite(false)}
                            className="text-surface-500 hover:text-surface-300 cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      placeholder="Site Name *"
                      value={newSite.name}
                      onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                      required
                      className="glass-input"
                    />
                    <input
                      placeholder="Address"
                      value={newSite.address}
                      onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
                      className="glass-input"
                    />
                    <input
                      placeholder="Description"
                      value={newSite.description}
                      onChange={(e) => setNewSite({ ...newSite, description: e.target.value })}
                      className="glass-input md:col-span-2"
                    />
                    <input
                      placeholder="Latitude"
                      type="number"
                      step="any"
                      value={newSite.latitude}
                      onChange={(e) => setNewSite({ ...newSite, latitude: e.target.value })}
                      className="glass-input"
                    />
                    <input
                      placeholder="Longitude"
                      type="number"
                      step="any"
                      value={newSite.longitude}
                      onChange={(e) => setNewSite({ ...newSite, longitude: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <button type="submit" className="btn-primary mt-4 text-sm py-2.5">
                    Create Site
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Sites List */}
            <div className="grid gap-4">
              {sitesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-card p-5 animate-pulse">
                    <div className="h-5 bg-surface-800 rounded w-1/3 mb-3" />
                    <div className="h-4 bg-surface-800 rounded w-2/3" />
                  </div>
                ))
              ) : sites.length === 0 ? (
                <div className="glass-card p-12 text-center text-surface-500">
                  <MapPin size={40} className="mx-auto mb-3 opacity-50" />
                  <p>No sites created yet</p>
                </div>
              ) : (
                sites.map((site) => (
                  <motion.div
                    key={site._id}
                    layout
                    className="glass-card p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                          <MapPin size={16} className="text-brand-400 flex-shrink-0" />
                          {site.name}
                        </h3>
                        {site.description && (
                          <p className="text-surface-400 text-sm mt-1">{site.description}</p>
                        )}
                        {site.location?.address && (
                          <p className="text-surface-500 text-xs mt-1.5 flex items-center gap-1">
                            📍 {site.location.address}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                          <code className="text-xs font-mono bg-surface-900/50 text-surface-400
                                         px-3 py-1.5 rounded-lg border border-surface-800/50 select-all">
                            API Key: {site.apiKey}
                          </code>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleRegenerateKey(site._id)}
                          className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/10
                                     transition-colors cursor-pointer"
                          title="Regenerate API Key"
                        >
                          <Key size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSite(site._id)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10
                                     transition-colors cursor-pointer"
                          title="Delete Site"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ─── Users Tab ─────────────────────────────────────── */}
        {tab === 'users' && (
          <motion.div {...fadeIn}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-white">
                User Accounts ({users.length})
              </h2>
              <button
                onClick={() => setShowCreateUser(!showCreateUser)}
                className="btn-primary flex items-center gap-2 text-sm py-2.5"
              >
                <Plus size={15} />
                New User
              </button>
            </div>

            {/* Create User Form */}
            <AnimatePresence>
              {showCreateUser && (
                <motion.form
                  {...fadeIn}
                  onSubmit={handleCreateUser}
                  className="glass-card p-6 mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Create New User</h3>
                    <button type="button" onClick={() => setShowCreateUser(false)}
                            className="text-surface-500 hover:text-surface-300 cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      placeholder="Full Name *"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      required
                      className="glass-input"
                    />
                    <input
                      placeholder="Email *"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                      className="glass-input"
                    />
                    <input
                      placeholder="Password *"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                      className="glass-input"
                    />
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="glass-input"
                    >
                      <option value="user">School / Site User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary mt-4 text-sm py-2.5">
                    Create User
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Users List */}
            <div className="grid gap-4">
              {usersLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-card p-5 animate-pulse">
                    <div className="h-5 bg-surface-800 rounded w-1/3 mb-3" />
                    <div className="h-4 bg-surface-800 rounded w-1/2" />
                  </div>
                ))
              ) : (
                users.map((u) => (
                  <motion.div
                    key={u._id}
                    layout
                    className="glass-card p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-white">{u.name}</h3>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-medium
                                       ${u.role === 'admin'
                                         ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                         : 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                                       }`}
                          >
                            {u.role}
                          </span>
                        </div>
                        <p className="text-surface-400 text-sm mt-1">{u.email}</p>
                        {u.assignedSites && u.assignedSites.length > 0 && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Link2 size={12} className="text-surface-500" />
                            {u.assignedSites.map((s) => (
                              <span
                                key={s._id || s}
                                className="text-xs bg-surface-800/50 text-surface-400
                                          px-2 py-0.5 rounded-md border border-surface-700/50"
                              >
                                {s.name || s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAssignModal(u._id)}
                          className="p-2 rounded-lg text-brand-400 hover:bg-brand-500/10
                                     transition-colors cursor-pointer"
                          title="Assign Sites"
                        >
                          <Link2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10
                                     transition-colors cursor-pointer"
                          title="Delete User"
                          disabled={u._id === user._id}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* ─── Site Assignment Modal ────────────────────────────── */}
      <AnimatePresence>
        {assignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setAssignModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-semibold text-white text-lg">
                  Assign Sites
                </h3>
                <button
                  onClick={() => setAssignModal(null)}
                  className="text-surface-500 hover:text-surface-300 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sites.map((site) => (
                  <button
                    key={site._id}
                    onClick={() => toggleSiteAssignment(site._id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl
                               transition-all duration-150 cursor-pointer text-left
                               ${assignSiteIds.includes(site._id)
                                 ? 'bg-brand-500/15 border border-brand-500/30'
                                 : 'bg-surface-900/30 border border-surface-800/50 hover:border-surface-700'
                               }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center
                                 transition-all duration-150
                                 ${assignSiteIds.includes(site._id)
                                   ? 'bg-brand-500 border-brand-500'
                                   : 'border-surface-600'
                                 }`}
                    >
                      {assignSiteIds.includes(site._id) && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                    <span className="text-sm text-surface-200">{site.name}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleAssignSites}
                className="btn-primary w-full mt-5 text-sm"
              >
                Save Assignments ({assignSiteIds.length} sites)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
