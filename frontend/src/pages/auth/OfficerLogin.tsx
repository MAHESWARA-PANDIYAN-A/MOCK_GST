import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PrototypeBadge } from '../../components/common/PrototypeBadge';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Sparkles, UserCheck } from 'lucide-react';

export const OfficerLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email.trim(), password);
      if (res.user.role === 'OFFICER') {
        navigate('/officer/dashboard');
      } else if (res.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/applicant/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid officer credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillOfficerPriya = () => {
    setEmail('officer.priya@gstmock.in');
    setPassword('Officer@123');
  };

  const fillAdmin = () => {
    setEmail('admin@gstmock.in');
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xl shadow-lg">
            <Shield className="w-7 h-7" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-white">
          GST Officer Portal
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          Verification, Scrutiny & Approval Workflow
        </p>
        <div className="flex justify-center mt-2">
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
            Simulation Environment
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-700">
          {error && (
            <div className="mb-4 bg-red-950/60 border border-red-800 rounded-xl p-3 flex items-start gap-2.5 text-sm text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-300">Officer Email</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer.priya@gstmock.in"
                  className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-amber-500 focus:border-amber-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-amber-500 focus:border-amber-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Authenticating...' : 'Sign in as GST Officer'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-4 border-t border-slate-700 space-y-2">
            <p className="text-xs text-slate-400 font-medium mb-1">Quick Demo Logins:</p>
            <button
              type="button"
              onClick={fillOfficerPriya}
              className="w-full flex items-center justify-between py-2 px-3 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 rounded-lg border border-amber-800/60 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Officer Priya (Reviewer)</span>
              </span>
              <span className="text-[10px] text-slate-400">Auto-fill</span>
            </button>

            <button
              type="button"
              onClick={fillAdmin}
              className="w-full flex items-center justify-between py-2 px-3 text-xs font-semibold text-blue-300 bg-blue-950/40 hover:bg-blue-950/70 rounded-lg border border-blue-800/60 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>System Admin (Administrator)</span>
              </span>
              <span className="text-[10px] text-slate-400">Auto-fill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
