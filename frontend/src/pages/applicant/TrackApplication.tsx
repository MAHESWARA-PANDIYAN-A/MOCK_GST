import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrototypeBadge } from '../../components/common/PrototypeBadge';
import { Search, Building2, Clock, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';

export const TrackApplication: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = async (appNum: string) => {
    if (!appNum.trim()) return;
    setLoading(true);
    setError('');
    setStatusData(null);

    try {
      // Use integration public or direct status check
      const res = await axios.get(`${API_BASE_URL}/integrations/v1/applications/${encodeURIComponent(appNum.trim())}/status`, {
        headers: {
          'X-API-Key': 'gst_sih26130_secret_api_key_mock_2026',
        },
      });
      setStatusData(res.data);
    } catch (err: any) {
      setError('No simulated GST application found matching this reference number.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('query');
    if (q) {
      setQuery(q);
      fetchStatus(q);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(query);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <PrototypeBadge size="sm" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Track GST Application Status</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Enter your simulated Application Number or SIH Reference ID to view live progress.
          </p>
        </div>

        {/* Search Bar Form */}
        <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. GST-MOCK-2026-000123 or SIH-APP-1001"
                className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {/* Quick Demo links */}
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span>Demo numbers:</span>
            <button
              type="button"
              onClick={() => {
                setQuery('GST-MOCK-2026-000123');
                fetchStatus('GST-MOCK-2026-000123');
              }}
              className="text-blue-600 hover:underline font-mono"
            >
              GST-MOCK-2026-000123 (Query)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setQuery('GST-MOCK-2026-000888');
                fetchStatus('GST-MOCK-2026-000888');
              }}
              className="text-blue-600 hover:underline font-mono"
            >
              GST-MOCK-2026-000888 (Approved)
            </button>
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {statusData && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs text-slate-500 block">Application Reference:</span>
                <h3 className="font-mono text-xl font-bold text-slate-900">{statusData.application_number}</h3>
                {statusData.external_reference_id && (
                  <span className="text-xs text-slate-500">External ID: {statusData.external_reference_id}</span>
                )}
              </div>
              <StatusBadge status={statusData.status} size="lg" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Submission Date:</span>
                <strong className="text-slate-900 text-sm">
                  {statusData.submission_date ? new Date(statusData.submission_date).toLocaleDateString() : 'Draft / In Progress'}
                </strong>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Last Status Update:</span>
                <strong className="text-slate-900 text-sm">
                  {new Date(statusData.last_updated_at).toLocaleString()}
                </strong>
              </div>
            </div>

            {statusData.mock_registration_ref && (
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-center space-y-1">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Simulated GST Registration Reference
                </span>
                <p className="font-mono text-xl font-extrabold text-emerald-950">
                  {statusData.mock_registration_ref}
                </p>
              </div>
            )}

            {statusData.pending_actions && statusData.pending_actions.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-orange-900">Pending Actions Required from Applicant:</h4>
                <ul className="space-y-1 text-xs text-orange-800">
                  {statusData.pending_actions.map((pa: any, i: number) => (
                    <li key={i}>• {pa.subject}: {pa.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 text-center">
              <Link
                to="/applicant/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                <span>Login to view full application details or respond to queries</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
