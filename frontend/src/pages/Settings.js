import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put('/api/auth/profile/', formData);
      // Update local storage user data
      const updatedUser = { ...user, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // Require a page reload to fully reflect changes across the app
      toast.success('Profile updated successfully!');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to update profile.');
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you absolutely sure you want to delete your account? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      await api.delete('/api/auth/profile/');
      toast.success('Account deleted successfully.');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to delete account.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Account Settings</h1>
        <p className="text-muted text-sm">Manage your profile details and account security.</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Edit Profile</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">First Name</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Last Name</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" required />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto px-6 py-2">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="card border border-red-500/20 bg-red-500/5">
        <h2 className="text-lg font-semibold text-red-500 mb-2">Danger Zone</h2>
        <p className="text-sm text-muted mb-4">Once you delete your account, there is no going back. Please be certain.</p>
        <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors text-sm font-medium">
          Delete My Account
        </button>
      </div>
    </div>
  );
};

export default Settings;
