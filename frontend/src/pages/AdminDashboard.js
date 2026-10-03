import React, { useEffect, useState, useCallback } from 'react';
import { authAPI, recognitionAPI, analyticsAPI } from '../services/api';
import api from '../services/api';
import {
  Users, Shield, Trash2, Plus, Edit3, X, Check, Search,
  Clock, BarChart3, ChevronRight, UserPlus, RefreshCw,
  Activity, Zap, TrendingUp, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Tab Button ──────────────────────────────────────────────────────
const TabButton = ({ active, icon: Icon, label, count, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-accent/15 text-accent border border-accent/30 shadow-lg shadow-accent/5'
        : 'text-muted hover:text-white hover:bg-surface-hover border border-transparent'
    }`}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
    {count !== undefined && (
      <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
        active ? 'bg-accent/20 text-accent' : 'bg-surface-hover text-muted'
      }`}>
        {count}
      </span>
    )}
  </button>
);

// ─── Stat Card ───────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="card group hover:border-accent/20 transition-all duration-300">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm text-muted font-medium">{label}</span>
    </div>
    <p className="text-3xl font-bold tracking-tight">{value}</p>
    {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
  </div>
);

// ═════════════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD
// ═════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [modelComparison, setModelComparison] = useState([]);
  const [loading, setLoading] = useState(true);

  // User CRUD state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [createForm, setCreateForm] = useState({
    email: '', password: '', first_name: '', last_name: '', role: 'user'
  });
  const [editForm, setEditForm] = useState({});

  // Prediction state
  const [predNextPage, setPredNextPage] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predSearch, setPredSearch] = useState('');

  // ── Data fetching ────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      const res = await authAPI.getUsers();
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to fetch users');
    }
  }, []);

  const fetchPredictions = useCallback(async (url, append = false) => {
    setPredLoading(true);
    try {
      const path = url.startsWith('http') ? new URL(url).pathname + new URL(url).search : url;
      const res = await api.get(path);
      const items = res.data.results || res.data;
      if (append) {
        setPredictions(prev => [...prev, ...items]);
      } else {
        setPredictions(items);
      }
      setPredNextPage(res.data.next || null);
    } catch (err) {
      toast.error('Failed to fetch predictions');
    } finally {
      setPredLoading(false);
    }
  }, []);

  const fetchModelComparison = useCallback(async () => {
    try {
      const res = await analyticsAPI.getModelAccuracyComparison();
      setModelComparison(res.data.models || []);
    } catch (err) {
      // Silently handle if no models exist yet
      setModelComparison([]);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchUsers(),
        fetchPredictions('/api/recognition/admin/predictions/'),
        fetchModelComparison(),
      ]);
      setLoading(false);
    };
    loadAll();
  }, [fetchUsers, fetchPredictions, fetchModelComparison]);

  // ── User CRUD handlers ──────────────────────────────────────────
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await authAPI.createUser(createForm);
      toast.success('User created successfully');
      setShowCreateForm(false);
      setCreateForm({ email: '', password: '', first_name: '', last_name: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data;
      if (typeof msg === 'object') {
        const firstKey = Object.keys(msg)[0];
        const errMsg = Array.isArray(msg[firstKey]) ? msg[firstKey][0] : msg[firstKey];
        toast.error(`${firstKey}: ${errMsg}`);
      } else {
        toast.error('Failed to create user');
      }
    }
  };

  const handleEditStart = (user) => {
    setEditingUser(user.id);
    setEditForm({

      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role,
      is_active: user.is_active !== undefined ? user.is_active : true,
      raw_password: user.raw_password || '',
    });
  };

  const handleUpdateUser = async (userId) => {
    try {
      await authAPI.updateUser(userId, editForm);
      toast.success('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data;
      if (typeof msg === 'object') {
        const firstKey = Object.keys(msg)[0];
        const errMsg = Array.isArray(msg[firstKey]) ? msg[firstKey][0] : msg[firstKey];
        toast.error(`${firstKey}: ${errMsg}`);
      } else {
        toast.error('Failed to update user');
      }
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Delete user "${email}"? This action cannot be undone.`)) return;
    try {
      await authAPI.deleteUser(userId);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    }
  };

  // ── Prediction handlers ─────────────────────────────────────────
  const handleDeletePrediction = async (id) => {
    if (!window.confirm('Delete this prediction record?')) return;
    try {
      await recognitionAPI.deletePrediction(id);
      toast.success('Prediction deleted');
      setPredictions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error('Failed to delete prediction');
    }
  };

  const handleSearchPredictions = () => {
    const params = predSearch ? `?email=${encodeURIComponent(predSearch)}` : '';
    fetchPredictions(`/api/recognition/admin/predictions/${params}`);
  };

  // ── Loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent mx-auto"></div>
          <p className="text-muted text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up pb-24">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-purple-600 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted text-sm">Manage users, view predictions, and compare models</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={users.length} color="bg-blue-500/10 text-blue-400" />
        <StatCard icon={Activity} label="Active Users" value={users.filter(u => u.is_active).length} color="bg-emerald-500/10 text-emerald-400" />
        <StatCard icon={Zap} label="Total Predictions" value={predictions.length}  color="bg-amber-500/10 text-amber-400" sub="All users combined" />
        <StatCard icon={TrendingUp} label="Models" value={modelComparison.length} color="bg-purple-500/10 text-purple-400" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-surface-border pb-4">
        <TabButton active={activeTab === 'users'} icon={Users} label="Users CRUD" count={users.length} onClick={() => setActiveTab('users')} />
        <TabButton active={activeTab === 'history'} icon={Clock} label="Prediction History" count={predictions.length} onClick={() => setActiveTab('history')} />
        <TabButton active={activeTab === 'models'} icon={BarChart3} label="Model Comparison" count={modelComparison.length} onClick={() => setActiveTab('models')} />
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* TAB 1 — USERS CRUD                                         */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Create User Form */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold">
                  {showCreateForm ? 'Create New User' : 'User Management'}
                </h2>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  showCreateForm
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                    : 'bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20'
                }`}
              >
                {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showCreateForm ? 'Cancel' : 'Add User'}
              </button>
            </div>

            {showCreateForm && (
              <form onSubmit={handleCreateUser} className="animate-slide-up">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Email *</label>
                    <input type="email" required className="input-field" placeholder="john@example.com"
                      value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Password *</label>
                    <input type="password" required className="input-field" placeholder="••••••••"
                      value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">First Name</label>
                    <input type="text" className="input-field" placeholder="John"
                      value={createForm.first_name} onChange={e => setCreateForm({...createForm, first_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Last Name</label>
                    <input type="text" className="input-field" placeholder="Doe"
                      value={createForm.last_name} onChange={e => setCreateForm({...createForm, last_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Role</label>
                    <select className="input-field" value={createForm.role}
                      onChange={e => setCreateForm({...createForm, role: e.target.value})}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                </div>
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create User
                </button>
              </form>
            )}
          </div>

          {/* Users Table */}
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border bg-surface/50">
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider">Name</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider">Email</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider">Role</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider">Password</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider">Created</th>
                    <th className="text-right py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-surface-hover/50 transition-colors">
                      {editingUser === user.id ? (
                        /* ── Inline Edit Row ─────────── */
                        <>
                          <td className="py-3 px-5">
                            <input type="text" className="input-field py-1.5 text-sm" value={editForm.first_name} placeholder="First Name"
                              onChange={e => setEditForm({...editForm, first_name: e.target.value})} />
                            <input type="text" className="input-field py-1.5 text-sm mt-1" value={editForm.last_name} placeholder="Last Name"
                              onChange={e => setEditForm({...editForm, last_name: e.target.value})} />
                          </td>
                          <td className="py-3 px-5">
                            <input type="email" className="input-field py-1.5 text-sm" value={editForm.email}
                              onChange={e => setEditForm({...editForm, email: e.target.value})} />
                          </td>
                          <td className="py-3 px-5">
                            <select className="input-field py-1.5 text-sm" value={editForm.role}
                              onChange={e => setEditForm({...editForm, role: e.target.value})}>
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="py-3 px-5">
                            <select className="input-field py-1.5 text-sm" value={editForm.is_active ? 'true' : 'false'}
                              onChange={e => setEditForm({...editForm, is_active: e.target.value === 'true'})}>
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          </td>
                          <td className="py-3 px-5">
                            <input type="text" className="input-field py-1.5 text-sm" value={editForm.raw_password || ''}
                              onChange={e => setEditForm({...editForm, raw_password: e.target.value})} placeholder="New password" />
                          </td>
                          <td className="py-3 px-5 text-sm text-muted">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-5">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleUpdateUser(user.id)}
                                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Save">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => setEditingUser(null)}
                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Cancel">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        /* ── Display Row ──────────────── */
                        <>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-sm font-bold">
                                {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">
                                  {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : '—'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-sm text-muted">{user.email}</td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              user.role === 'admin' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                              'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              user.is_active ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-xs font-mono text-muted">
                            {user.raw_password || '—'}
                          </td>
                          <td className="py-3.5 px-5 text-sm text-muted">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => handleEditStart(user)}
                                className="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors" title="Edit">
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDeleteUser(user.id, user.email)}
                                className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="text-center py-12 text-muted">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No users found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* TAB 2 — PREDICTION HISTORY (all users)                     */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  className="input-field pl-10"
                  placeholder="Search by email..."
                  value={predSearch}
                  onChange={e => setPredSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchPredictions()}
                />
              </div>
              <button onClick={handleSearchPredictions} className="btn-primary flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </button>
              <button onClick={() => { setPredSearch(''); fetchPredictions('/api/recognition/admin/predictions/'); }}
                className="btn-secondary flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Predictions Table */}
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border bg-surface/50">
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider">User</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider">Image</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider">Prediction</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider">Confidence</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider">Method</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider">Verified</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
                    <th className="text-right py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {predictions.map(pred => (
                    <tr key={pred.id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-bold">
                            {pred.user_email?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="text-sm font-medium">{pred.user_email || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="w-10 h-10 bg-white rounded-lg overflow-hidden flex items-center justify-center border border-surface-border">
                          <img
                            src={pred.image?.startsWith('/') ? `${process.env.REACT_APP_API_URL || 'https://rass76-hcr-backend.hf.space'}${pred.image}` : pred.image}
                            alt="pred"
                            className="max-w-full max-h-full object-contain filter invert"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span className="text-xl font-bold text-white">{pred.predicted_character}</span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${
                              pred.confidence_score >= 0.8 ? 'bg-emerald-400' :
                              pred.confidence_score >= 0.5 ? 'bg-amber-400' : 'bg-red-400'
                            }`} style={{ width: `${pred.confidence_score * 100}%` }}></div>
                          </div>
                          <span className="text-xs text-muted font-mono">{(pred.confidence_score * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span className="text-xs px-2 py-1 bg-surface-hover rounded-md text-muted capitalize">{pred.input_method}</span>
                      </td>
                      <td className="py-3 px-5">
                        {pred.is_correct === true ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><Check className="h-3 w-3" /> Yes</span>
                        ) : pred.is_correct === false ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400"><Edit3 className="h-3 w-3" /> Corrected</span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-xs text-muted">
                        {new Date(pred.created_at).toLocaleDateString()}<br />
                        <span className="text-muted/70">{new Date(pred.created_at).toLocaleTimeString()}</span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button onClick={() => handleDeletePrediction(pred.id)}
                          className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {predictions.length === 0 && (
              <div className="text-center py-12 text-muted">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No predictions found</p>
              </div>
            )}
          </div>

          {/* Load More */}
          {predNextPage && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchPredictions(predNextPage, true)}
                disabled={predLoading}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                {predLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {predLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* TAB 3 — MODEL COMPARISON                                   */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold">Model Accuracy Comparison — V1 vs V2</h2>
            </div>

            {modelComparison.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">Model</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">Version</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">Type</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">Training Acc</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">Realtime Acc</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">Precision</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">Recall</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">F1 Score</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {modelComparison.map(model => (
                      <tr key={model.id} className={`transition-colors ${model.is_deployed ? 'bg-accent/5' : 'hover:bg-surface-hover/50'}`}>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${model.is_deployed ? 'bg-emerald-400 animate-pulse' : 'bg-surface-border'}`}></div>
                            <span className="font-semibold text-sm">{model.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-mono bg-surface-hover px-2 py-1 rounded-md">{model.version}</span>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-muted capitalize">{model.model_type}</td>
                        <td className="py-3.5 px-4 text-center">
                          <MetricBadge value={model.training_accuracy} suffix="%" />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <MetricBadge value={model.realtime_accuracy} suffix="%" highlight />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <MetricBadge value={model.precision} suffix="%" />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <MetricBadge value={model.recall} suffix="%" />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <MetricBadge value={model.f1_score} suffix="%" />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {model.is_deployed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-lg border border-emerald-400/20">
                              <Zap className="h-3 w-3" /> Deployed
                            </span>
                          ) : model.is_active ? (
                            <span className="inline-flex items-center text-xs font-medium text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs text-muted">Inactive</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted">
                <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="mb-1">No models registered yet</p>
                <p className="text-xs text-muted/70">Models will appear here once trained and registered in the system.</p>
              </div>
            )}
          </div>

          {/* Training Details Cards */}
          {modelComparison.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modelComparison.map(model => (
                <div key={model.id} className={`card ${model.is_deployed ? 'border-accent/30' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{model.name} <span className="text-xs text-muted font-mono">v{model.version}</span></h3>
                    {model.is_deployed && (
                      <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">Live</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-surface rounded-xl p-3">
                      <p className="text-xs text-muted mb-1">Epochs</p>
                      <p className="text-lg font-bold">{model.epochs || '—'}</p>
                    </div>
                    <div className="bg-surface rounded-xl p-3">
                      <p className="text-xs text-muted mb-1">Batch Size</p>
                      <p className="text-lg font-bold">{model.batch_size || '—'}</p>
                    </div>
                    <div className="bg-surface rounded-xl p-3">
                      <p className="text-xs text-muted mb-1">Learn Rate</p>
                      <p className="text-lg font-bold">{model.learning_rate || '—'}</p>
                    </div>
                  </div>
                  {(model.training_loss || model.validation_loss) && (
                    <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                      <div className="bg-surface rounded-xl p-3">
                        <p className="text-xs text-muted mb-1">Training Loss</p>
                        <p className="text-lg font-bold text-amber-400">{model.training_loss?.toFixed(4) || '—'}</p>
                      </div>
                      <div className="bg-surface rounded-xl p-3">
                        <p className="text-xs text-muted mb-1">Validation Loss</p>
                        <p className="text-lg font-bold text-blue-400">{model.validation_loss?.toFixed(4) || '—'}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted mt-3">
                    Feedback count: <span className="font-semibold text-white">{model.total_feedback_count}</span> predictions rated by users
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Metric Badge sub-component ──────────────────────────────────────
const MetricBadge = ({ value, suffix = '', highlight = false }) => {
  if (value === null || value === undefined) {
    return <span className="text-xs text-muted">—</span>;
  }
  const color = value >= 90 ? 'text-emerald-400' : value >= 70 ? 'text-amber-400' : 'text-red-400';
  return (
    <span className={`text-sm font-semibold ${highlight ? color : 'text-white'} ${highlight ? `bg-surface-hover px-2 py-0.5 rounded-md` : ''}`}>
      {value}{suffix}
    </span>
  );
};

export default AdminDashboard;
