import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PrototypeBadge } from './PrototypeBadge';
import { 
  Building2, User as UserIcon, LogOut, Shield, FileText, 
  Terminal, Home, CheckSquare, Bell 
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, isAuthenticated, isApplicant, isOfficer, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      {/* Top Prototype Alert Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded text-[10px] uppercase tracking-wider">
              Simulation Notice
            </span>
            <span>This is a prototype GST portal for SIH26130. It does NOT claim to be an official Government of India system.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link to="/integrations/sandbox" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>SIH Integration Sandbox</span>
            </Link>
            <a href="http://localhost:8003/docs" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">
              Swagger API Docs
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Portal Branding */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:bg-blue-800 transition-colors">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
                  GST Registration Portal
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Goods & Services Tax Simulator
                </div>
              </div>
            </Link>
            <div className="hidden lg:block ml-2">
              <PrototypeBadge size="sm" />
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive('/') ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Home
            </Link>

            <Link
              to="/track"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive('/track') ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Track Status
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-slate-200">
                {isApplicant && (
                  <Link
                    to="/applicant/dashboard"
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      location.pathname.startsWith('/applicant')
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>My Applications</span>
                  </Link>
                )}

                {isOfficer && (
                  <Link
                    to="/officer/dashboard"
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      location.pathname.startsWith('/officer')
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Officer Portal</span>
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-xs font-medium text-slate-700">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="max-w-[120px] truncate">{user?.name}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase">
                    {user?.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  to="/applicant/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                >
                  Applicant Login
                </Link>
                <Link
                  to="/officer/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Officer Portal</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
