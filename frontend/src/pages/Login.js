import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import toast from 'react-hot-toast';
import { PenLine, Eye, EyeOff, Shield, User } from 'lucide-react';

const Login = () => {
  const [loginMode, setLoginMode] = useState('user'); // 'user' or 'admin'
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!executeRecaptcha) {
      toast.error('reCAPTCHA not loaded yet');
      return;
    }
    setLoading(true);
    const recaptchaToken = await executeRecaptcha('login');
    const result = await login(formData.email, formData.password, recaptchaToken);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const switchMode = (mode) => {
    setLoginMode(mode);
    setFormData({ email: '', password: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <PenLine className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-xl font-bold tracking-tight leading-tight px-2">
            Handwritten Digit and Alphabet Recognition System
          </h1>
          <p className="text-muted text-sm mt-3">Sign in to your account</p>
        </div>

        {/* Login Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => switchMode('user')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              loginMode === 'user'
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'bg-surface-card text-muted border border-surface-border hover:text-white hover:bg-surface-hover'
            }`}
          >
            <User className="h-4 w-4" />
            User Login
          </button>
          <button
            type="button"
            onClick={() => switchMode('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              loginMode === 'admin'
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-surface-card text-muted border border-surface-border hover:text-white hover:bg-surface-hover'
            }`}
          >
            <Shield className="h-4 w-4" />
            Admin Login
          </button>
        </div>

        {/* Form */}
        <div className="card">
          {loginMode === 'admin' && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
              <Shield className="h-4 w-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400/80">Admin access — use your registered admin email</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder={loginMode === 'admin' ? 'Enter your admin email' : 'Enter your registered email'}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-accent transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full font-medium py-2.5 px-5 rounded-xl transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                loginMode === 'admin'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'btn-primary'
              }`}
            >
              {loading ? 'Signing in...' : loginMode === 'admin' ? 'Sign In as Admin' : 'Sign In'}
            </button>
          </form>

          {loginMode === 'user' && (
            <div className="mt-5 text-center">
              <p className="text-muted text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-accent hover:text-accent-hover transition-colors">
                  Register
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
