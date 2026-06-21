import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', password2: '',
    first_name: '', last_name: '', role: 'user',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password2) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    const result = await register(formData);
    if (result.success) {
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } else {
      toast.error(result.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <span className="text-accent font-mono font-bold text-lg">H</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight leading-tight px-2">
            Handwritten Digit and Alphabet Recognition System
          </h1>
          <p className="text-muted text-sm mt-3">Join the platform</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">First Name</label>
                <input type="text" name="first_name" value={formData.first_name}
                  onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Last Name</label>
                <input type="text" name="last_name" value={formData.last_name}
                  onChange={handleChange} className="input-field" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Username</label>
              <input type="text" name="username" value={formData.username}
                onChange={handleChange} className="input-field" required />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Email</label>
              <input type="email" name="email" value={formData.email}
                onChange={handleChange} className="input-field" required />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Password</label>
              <input type="password" name="password" value={formData.password}
                onChange={handleChange} className="input-field" required />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Confirm Password</label>
              <input type="password" name="password2" value={formData.password2}
                onChange={handleChange} className="input-field" required />
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-muted text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-accent hover:text-accent-hover transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
