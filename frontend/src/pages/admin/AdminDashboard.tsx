import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { User, AuditLogItem } from '../../types';
import { PrototypeBadge } from '../../components/common/PrototypeBadge';
import { Shield, Users, UserPlus, FileText, Database, Activity, RefreshCw } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [officers, setOfficers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [integrationLogs, setIntegrationLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // New Officer Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [creatingOfficer, setCreatingOfficer] = useState(false);
  const [activeTab, setActiveTab] = useState<'officers' | 'audit' | 'integrations'>('officers');

  const loadData = async () => {
    setLoading(true);
    try {
      const [offData, auditData, intData, statsData] = await Promise.all([
        adminService.getOfficers(),
        adminService.getAuditLogs(50),
        adminService.getIntegrationLogs(50),
        adminService.getStats(),
      ]);
      setOfficers(offData);
      setAuditLogs(auditData);
      setIntegrationLogs(intData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingOfficer(true);
    try {
      await adminService.createOfficer({ name, email, mobile, password });
      alert('Officer account created successfully!');
      setName('');
      setEmail('');
      setMobile('');
      setPassword('');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create officer.');
    } finally {
      setCreatingOfficer(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Banner */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white">System Administrator Console</h1>
                <p className="text-xs text-slate-400">
                  Officer Provisioning, Application Assignments, System Audit & API Logs
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PrototypeBadge size="sm" />
            <button
              onClick={loadData}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 block font-semibold uppercase">Total Users</span>
            <span className="text-2xl font-bold text-white">{stats.total_users || 0}</span>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <span className="text-xs text-amber-400 block font-semibold uppercase">Active Officers</span>
            <span className="text-2xl font-bold text-amber-300">{stats.total_officers || 0}</span>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <span className="text-xs text-blue-400 block font-semibold uppercase">Total Applications</span>
            <span className="text-2xl font-bold text-blue-300">{stats.total_applications || 0}</span>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <span className="text-xs text-emerald-400 block font-semibold uppercase">Integration Requests</span>
            <span className="text-2xl font-bold text-emerald-300">{stats.total_integration_requests || 0}</span>
          </div>
        </div>

        {/* Tab Nav */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="flex border-b border-slate-700 px-4 pt-2 gap-4 bg-slate-850">
            <button
              onClick={() => setActiveTab('officers')}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'officers' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Officer Management</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'audit' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Logs</span>
            </button>

            <button
              onClick={() => setActiveTab('integrations')}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'integrations' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>SIH Integration API Logs</span>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'officers' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Officer Form */}
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 space-y-4">
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-amber-400" />
                    <span>Provision New Officer</span>
                  </h3>

                  <form onSubmit={handleCreateOfficer} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Officer Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Officer Rajesh"
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="officer.rajesh@gstmock.in"
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="9800000003"
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Password *</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={creatingOfficer}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow"
                    >
                      {creatingOfficer ? 'Creating...' : 'Create Officer Account'}
                    </button>
                  </form>
                </div>

                {/* Existing Officers Table */}
                <div className="lg:col-span-2 space-y-3">
                  <h3 className="font-bold text-sm text-white">Active Scrutiny Officers ({officers.length})</h3>
                  <div className="divide-y divide-slate-700 bg-slate-900 rounded-xl border border-slate-700">
                    {officers.map((off) => (
                      <div key={off.id} className="p-3.5 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-white block">{off.name}</span>
                          <span className="text-slate-400 font-mono">{off.email}</span>
                          <span className="text-slate-500 ml-2">Phone: {off.mobile}</span>
                        </div>
                        <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded font-bold">
                          ACTIVE OFFICER
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-700 text-slate-400 font-bold">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Entity</th>
                      <th className="p-3">Target ID</th>
                      <th className="p-3">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 text-slate-300">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-750">
                        <td className="p-3 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-3 font-mono font-bold text-amber-300">{log.action}</td>
                        <td className="p-3 text-slate-400">{log.entity_type}</td>
                        <td className="p-3 font-mono text-slate-300">{log.entity_id || '—'}</td>
                        <td className="p-3 text-slate-300">{log.user_name || 'System / API'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-700 text-slate-400 font-bold">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Source</th>
                      <th className="p-3">Endpoint</th>
                      <th className="p-3">External Ref</th>
                      <th className="p-3">Status Code</th>
                      <th className="p-3">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 text-slate-300">
                    {integrationLogs.map((intLog) => (
                      <tr key={intLog.id} className="hover:bg-slate-750">
                        <td className="p-3 text-slate-400">{new Date(intLog.created_at).toLocaleString()}</td>
                        <td className="p-3 font-bold text-blue-400">{intLog.source_system}</td>
                        <td className="p-3 font-mono text-slate-300">{intLog.endpoint}</td>
                        <td className="p-3 font-mono text-amber-300">{intLog.external_reference_id || '—'}</td>
                        <td className="p-3 font-bold">{intLog.response_code}</td>
                        <td className="p-3 font-mono text-emerald-400">{intLog.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
