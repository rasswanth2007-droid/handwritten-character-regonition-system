import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import CanvasDraw from './pages/CanvasDraw';
import ImageUpload from './pages/ImageUpload';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

function App() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.REACT_APP_RECAPTCHA_SITE_KEY || "dummy_key_to_prevent_crash_during_dev"}>
      <AuthProvider>
        <Router>
        <div className="min-h-screen bg-surface pb-20 sm:pb-0">
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#18181f',
                color: '#e4e4ed',
                border: '1px solid #2a2a36',
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Navbar />
                <CanvasDraw />
              </ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute>
                <Navbar />
                <ImageUpload />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Navbar />
                <div className="pt-8 px-4">
                  <Settings />
                </div>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
    </GoogleReCaptchaProvider>
  );
}

export default App;
