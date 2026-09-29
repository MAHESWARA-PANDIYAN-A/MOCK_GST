import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { applicantService } from '../../services/applicantService';
import { ApplicationSummary, NotificationItem } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrototypeBadge } from '../../components/common/PrototypeBadge';
import { 
  Plus, FileText, Send, Clock, HelpCircle, CheckCircle2, 
  XCircle, ArrowRight, Eye, Edit3, Bell, RefreshCw, AlertTriangle, Search
} from 'lucide-react';

export const ApplicantDashboard: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [stats, setStats] = useState<any>({});
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsData, statsData, notifsData] = await Promise.all([
        applicantService.getApplications(),
        applicantService.getStats(),
        applicantService.getNotifications(),
      ]);
      setApplications(appsData);
      setStats(statsData);
      setNotifications(notifsData);
    } catch (err) {
      console.error('Failed to load applicant dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = async () => {
    setCreating(true);
    try {
      const res = await applicantService.createApplication();
      navigate(`/applicant/applications/${res.application_id}/edit`);
    } catch (err) {
      console.error('Error creating application:', err);
      alert('Failed to initialize application.');
    } finally {
      setCreating(false);
    }
  };

  const filteredApps = applications.filter((a) => {
    const term = search.toLowerCase();
    return (
      a.application_number.toLowerCase().includes(term) ||
      a.business_name.toLowerCase().includes(term) ||
      (a.trade_name && a.trade_name.toLowerCase().includes(term)) ||
      a.status.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header Banner */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900">Applicant Dashboard</h1>
              <PrototypeBadge size="sm" />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back, <strong className="text-slate-800">{user?.name}</strong>. Manage your GST registration applications and responses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleCreateNew}
              disabled={creating}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? 'Initializing...' : 'New GST Application'}</span>
            </button>
          </div>
        </div>

        {/* Status Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Drafts</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-2">{stats.DRAFT || 0}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600 uppercase">Submitted</span>
              <Send className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-2">{stats.SUBMITTED || 0}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 uppercase">Under Review</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-900 mt-2">
              {(stats.UNDER_REVIEW || 0) + (stats.PENDING_FOR_VALIDATION || 0)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-orange-200 bg-orange-50/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-700 uppercase">Queries</span>
              <HelpCircle className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-900 mt-2">
              {(stats.DOCUMENT_QUERY || 0) + (stats.CLARIFICATION_RECEIVED || 0)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 uppercase">Approved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-900 mt-2">{stats.APPROVED || 0}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 uppercase">Rejected</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-900 mt-2">{stats.REJECTED || 0}</p>
          </div>
        </div>

        {/* Notifications Alert Bar (if any unread queries) */}
        {notifications.some((n) => !n.is_read) && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-orange-900">Officer Queries Awaiting Your Action</h4>
              <p className="text-xs text-orange-700 mt-0.5">
                The GST reviewing officer has raised clarification queries for one or more documents. Check your applications below to submit corrected proofs.
              </p>
            </div>
          </div>
        )}

        {/* Applications List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My GST Applications</h2>
              <p className="text-xs text-slate-500">All registered applications filed or pre-filled from SIH Portal</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search applications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Loading applications...
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No applications found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                You have not created any GST registration applications yet, or your search query did not match.
              </p>
              <button
                onClick={handleCreateNew}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Application
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Application Number</th>
                    <th className="py-3 px-4">Business Name</th>
                    <th className="py-3 px-4">Type / Constitution</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Updated</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {app.application_number}
                        {app.source_system !== 'PORTAL_DIRECT' && (
                          <span className="block text-[10px] text-slate-500 font-sans font-normal">
                            via {app.source_system} ({app.external_reference_id})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{app.business_name}</div>
                        {app.trade_name && app.trade_name !== app.business_name && (
                          <div className="text-[11px] text-slate-500">Trade: {app.trade_name}</div>
                        )}
                        <div className="text-[10px] text-slate-600">{app.district}, {app.state}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {app.business_type}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {app.submission_date ? new Date(app.submission_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={app.status} size="sm" />
                        {app.status === 'APPROVED' && app.mock_registration_ref && (
                          <div className="mt-1 font-mono text-[10px] text-emerald-700 font-bold">
                            Ref: {app.mock_registration_ref}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(app.last_status_updated_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/applicant/applications/${app.id}`}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Link>

                          {app.status === 'DRAFT' && (
                            <Link
                              to={`/applicant/applications/${app.id}/edit`}
                              className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Continue</span>
                            </Link>
                          )}

                          {app.status === 'DOCUMENT_QUERY' && (
                            <Link
                              to={`/applicant/applications/${app.id}`}
                              className="px-2.5 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-1 animate-pulse"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Respond to Query</span>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
