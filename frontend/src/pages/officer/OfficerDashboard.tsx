import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { officerService, OfficerDashboardData } from '../../services/officerService';
import { ApplicationSummary } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrototypeBadge } from '../../components/common/PrototypeBadge';
import { 
  Shield, Search, Filter, RefreshCw, Eye, 
  FileCheck, HelpCircle, CheckCircle2, XCircle, Clock, Send, Users 
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<OfficerDashboardData | null>(null);
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [constitutionFilter, setConstitutionFilter] = useState('ALL');
  const [activityFilter, setActivityFilter] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, apps] = await Promise.all([
        officerService.getDashboard(),
        officerService.getApplications({
          search: search.trim() || undefined,
          status_filter: statusFilter !== 'ALL' ? statusFilter : undefined,
          district_filter: districtFilter !== 'ALL' ? districtFilter : undefined,
          constitution_filter: constitutionFilter !== 'ALL' ? constitutionFilter : undefined,
          activity_filter: activityFilter !== 'ALL' ? activityFilter : undefined,
        }),
      ]);
      setDashboardData(dash);
      setApplications(apps);
    } catch (err) {
      console.error('Error loading officer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, districtFilter, constitutionFilter, activityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const metrics = dashboardData?.metrics || {
    total_applications: 0,
    new_submitted: 0,
    pending_validation: 0,
    under_review: 0,
    document_queries: 0,
    approved: 0,
    rejected: 0,
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Officer Banner */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white">GST Officer Scrutiny Workspace</h1>
                <p className="text-xs text-slate-400">
                  Verification, Document Scrutiny, Query Management & Simulated Approvals
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
              Simulation Environment
            </span>
            <button
              onClick={loadData}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition-colors"
              title="Refresh Queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div
            onClick={() => setStatusFilter('ALL')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'ALL' ? 'bg-slate-700 border-amber-400 shadow-md' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total</span>
            <span className="text-xl font-extrabold text-white">{metrics.total_applications}</span>
          </div>

          <div
            onClick={() => setStatusFilter('SUBMITTED')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'SUBMITTED' ? 'bg-blue-950/60 border-blue-400 shadow-md' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <span className="text-[10px] font-bold text-blue-400 uppercase block">New Submitted</span>
            <span className="text-xl font-extrabold text-blue-300">{metrics.new_submitted}</span>
          </div>

          <div
            onClick={() => setStatusFilter('PENDING_FOR_VALIDATION')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'PENDING_FOR_VALIDATION' ? 'bg-indigo-950/60 border-indigo-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <span className="text-[10px] font-bold text-indigo-400 uppercase block">Pending Val.</span>
            <span className="text-xl font-extrabold text-indigo-300">{metrics.pending_validation}</span>
          </div>

          <div
            onClick={() => setStatusFilter('UNDER_REVIEW')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'UNDER_REVIEW' ? 'bg-amber-950/60 border-amber-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <span className="text-[10px] font-bold text-amber-400 uppercase block">Under Review</span>
            <span className="text-xl font-extrabold text-amber-300">{metrics.under_review}</span>
          </div>

          <div
            onClick={() => setStatusFilter('DOCUMENT_QUERY')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'DOCUMENT_QUERY' ? 'bg-orange-950/60 border-orange-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <span className="text-[10px] font-bold text-orange-400 uppercase block">Doc Queries</span>
            <span className="text-xl font-extrabold text-orange-300">{metrics.document_queries}</span>
          </div>

          <div
            onClick={() => setStatusFilter('APPROVED')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'APPROVED' ? 'bg-emerald-950/60 border-emerald-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <span className="text-[10px] font-bold text-emerald-400 uppercase block">Approved</span>
            <span className="text-xl font-extrabold text-emerald-300">{metrics.approved}</span>
          </div>

          <div
            onClick={() => setStatusFilter('REJECTED')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'REJECTED' ? 'bg-rose-950/60 border-rose-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <span className="text-[10px] font-bold text-rose-400 uppercase block">Rejected</span>
            <span className="text-xl font-extrabold text-rose-300">{metrics.rejected}</span>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-md">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Application / Business / Applicant..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="PENDING_FOR_VALIDATION">PENDING_FOR_VALIDATION</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="DOCUMENT_QUERY">DOCUMENT_QUERY</option>
                <option value="CLARIFICATION_RECEIVED">CLARIFICATION_RECEIVED</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            {/* District Filter */}
            <div>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="ALL">All Districts</option>
                <option value="Salem">Salem</option>
                <option value="Chennai">Chennai</option>
                <option value="Coimbatore">Coimbatore</option>
                <option value="Bengaluru">Bengaluru</option>
              </select>
            </div>

            {/* Constitution Filter */}
            <div>
              <select
                value={constitutionFilter}
                onChange={(e) => setConstitutionFilter(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="ALL">All Constitutions</option>
                <option value="Private Limited">Private Limited</option>
                <option value="Proprietorship">Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="LLP">LLP</option>
              </select>
            </div>

            {/* Submit Filter */}
            <button
              type="submit"
              className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apply Filters</span>
            </button>
          </form>
        </div>

        {/* Applications Table */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-sm font-bold text-white">
              Application Scrutiny Queue ({applications.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Loading scrutiny queue...
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No applications match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-700 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Application Number</th>
                    <th className="py-3 px-4">Business Name</th>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">District / State</th>
                    <th className="py-3 px-4">Constitution</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-xs text-slate-300">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-750 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {app.application_number}
                        {app.source_system !== 'PORTAL_DIRECT' && (
                          <span className="block text-[10px] text-slate-400 font-sans font-normal">
                            via {app.source_system} ({app.external_reference_id})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block">{app.business_name}</span>
                        {app.trade_name && <span className="text-[11px] text-slate-400">Trade: {app.trade_name}</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {app.applicant_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {app.district}, {app.state}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {app.business_type}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {app.submission_date ? new Date(app.submission_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={app.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/officer/applications/${app.id}/review`}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors inline-flex items-center gap-1 shadow"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </Link>
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
