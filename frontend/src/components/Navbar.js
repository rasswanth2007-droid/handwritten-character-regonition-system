import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PenTool, Upload, LogOut, PenLine } from 'lucide-react';

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Top Navbar (Desktop + Mobile Header) */}
      <nav className="border-b border-surface-border bg-surface-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group" title="Home">
              <div className="w-8 h-8 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-all duration-200">
                <PenLine className="h-4 w-4 text-accent" />
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden sm:flex items-center space-x-1">
              <Link
                to="/"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive('/') 
                    ? 'bg-accent/10 text-accent border border-accent/20' 
                    : 'text-muted hover:text-white hover:bg-surface-hover'
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>Draw</span>
              </Link>

              <Link
                to="/upload"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive('/upload') 
                    ? 'bg-accent/10 text-accent border border-accent/20' 
                    : 'text-muted hover:text-white hover:bg-surface-hover'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload</span>
              </Link>
            </div>

            {/* Logout (Desktop & Mobile) */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 text-muted hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-200 text-sm"
              title="Logout"
            >
              <LogOut className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-surface-border bg-surface-card/90 backdrop-blur-lg z-50 px-6 py-2.5 flex justify-around items-center pb-safe">
        <Link
          to="/"
          className={`flex flex-col items-center space-y-1 transition-colors ${
            isActive('/') ? 'text-accent' : 'text-muted hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${isActive('/') ? 'bg-accent/10' : ''}`}>
            <PenTool className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium">Draw</span>
        </Link>
        <Link
          to="/upload"
          className={`flex flex-col items-center space-y-1 transition-colors ${
            isActive('/upload') ? 'text-accent' : 'text-muted hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${isActive('/upload') ? 'bg-accent/10' : ''}`}>
            <Upload className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium">Upload</span>
        </Link>
      </nav>
    </>
  );
};

export default Navbar;
