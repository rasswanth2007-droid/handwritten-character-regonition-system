import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import toast from 'react-hot-toast';
import { PenLine, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', password2: '',
    first_name: '', last_name: '', role: 'user',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { register, verifyOTP } = useAuth();
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
    if (formData.password !== formData.password2) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    const recaptchaToken = await executeRecaptcha('register');
    const result = await register({ ...formData, recaptcha_token: recaptchaToken });
    if (result.success && result.require_otp) {
      toast.success('Check your email for the verification code!');
      setRegisteredEmail(result.email || formData.email);
      setShowOtpModal(true);
    } else if (result.success) {
      // Fallback if OTP is disabled for some reason
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } else {
      toast.error(result.error || 'Registration failed');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await verifyOTP(registeredEmail, otp);
    if (result.success) {
      toast.success(result.message);
      setShowOtpModal(false);
      navigate('/login');
    } else {
      toast.error(result.error || 'Invalid OTP');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <PenLine className="h-6 w-6 text-accent" />
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
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password}
                  onChange={handleChange} className="input-field pr-10" required />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-accent transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} name="password2" value={formData.password2}
                  onChange={handleChange} className="input-field pr-10" required />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-accent transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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

      {/* OTP Modal Overlay */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
            <h2 className="text-xl font-bold text-white mb-2 text-center">Verify Email</h2>
            <p className="text-sm text-muted text-center mb-6">
              We sent a 6-digit code to <span className="text-white font-medium">{registeredEmail}</span>
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="------"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
