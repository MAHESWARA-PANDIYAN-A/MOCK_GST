import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../services/api';
import { PrototypeBadge } from '../../components/common/PrototypeBadge';
import { 
  Terminal, Play, CheckCircle2, AlertCircle, Copy, 
  ExternalLink, ArrowRight, RefreshCw, Key, Send, FileCode 
} from 'lucide-react';

export const IntegrationSandbox: React.FC = () => {
  const [apiKey, setApiKey] = useState('gst_sih26130_secret_api_key_mock_2026');
  const [extRefId, setExtRefId] = useState(`SIH-APP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [appNumber, setAppNumber] = useState('GST-MOCK-2026-000123');

  // Payload for Prefill
  const [prefillPayload, setPrefillPayload] = useState(
    JSON.stringify(
      {
        external_reference_id: extRefId,
        source_system: 'SIH26130',
        applicant: {
          name: 'Rahul Kumar',
          mobile: '9876543210',
          email: 'rahul@example.com',
        },
        business: {
          legal_name: 'ABC Foods Private Limited',
          trade_name: 'ABC Foods',
          pan: 'ABCDE1234F',
          constitution: 'PRIVATE_LIMITED',
          business_activity: 'MANUFACTURER',
          state: 'Tamil Nadu',
          district: 'Salem',
          pincode: '636001',
          primary_activity: 'Food Manufacturing',
        },
        principal_place: {
          premise_name: 'ABC Processing Facility',
          locality: 'SIDCO Industrial Estate',
          state: 'Tamil Nadu',
          district: 'Salem',
          pincode: '636001',
          nature_of_possession: 'RENTED',
        },
        goods_services: [
          {
            type: 'GOODS',
            description: 'Packaged Snacks (Prototype Example)',
            hsn_sac_code: '2106',
          },
        ],
      },
      null,
      2
    )
  );

  const [activeTest, setActiveTest] = useState<'prefill' | 'headless' | 'schema' | 'status' | 'complete'>('headless');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Payload for Method 2 Headless Submit
  const [headlessPayload, setHeadlessPayload] = useState(
    JSON.stringify(
      {
        external_reference_id: extRefId,
        source_system: 'SIH26130_MAIN_PORTAL',
        applicant: {
          name: 'Rahul Kumar',
          mobile: '9876543210',
          email: 'rahul@example.com',
        },
        business: {
          legal_name: 'ABC Foods Private Limited',
          trade_name: 'ABC Foods',
          pan: 'ABCDE1234F',
          constitution: 'PRIVATE_LIMITED',
          business_activity: 'MANUFACTURER',
          primary_activity: 'Food Manufacturing & Packaged Snacks',
          state: 'Tamil Nadu',
          district: 'Salem',
          pincode: '636001',
          reason_for_reg: 'New Business',
        },
        principal_place: {
          premise_name: 'ABC Food Processing Complex',
          locality: 'SIDCO Industrial Estate',
          state: 'Tamil Nadu',
          district: 'Salem',
          pincode: '636001',
          nature_of_possession: 'RENTED',
        },
        promoters: [
          {
            name: 'Rahul Kumar',
            role: 'Director',
            pan: 'ABCDE1234F',
            aadhaar_last4: '1234',
            mobile: '9876543210',
            email: 'rahul@example.com',
            address: '12 SIDCO Industrial Estate, Salem',
          },
        ],
        goods_services: [
          {
            type: 'GOODS',
            description: 'Packaged Snacks and Processed Foods',
            hsn_sac_code: '2106',
          },
        ],
        auto_generate_mock_documents: true,
      },
      null,
      2
    )
  );

  const executeHeadlessSubmit = async () => {
    setLoading(true);
    setErrorMsg('');
    setResponseBody(null);
    setResponseStatus(null);

    try {
      const parsed = JSON.parse(headlessPayload);
      const res = await axios.post(`${API_BASE_URL}/integrations/v1/applications/headless-submit`, parsed, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
      });
      setResponseStatus(res.status);
      setResponseBody(res.data);
      if (res.data.application_number) {
        setAppNumber(res.data.application_number);
      }
    } catch (err: any) {
      setResponseStatus(err.response?.status || 500);
      setResponseBody(err.response?.data || { error: err.message });
      setErrorMsg(err.response?.data?.detail || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const executeGetSchema = async () => {
    setLoading(true);
    setErrorMsg('');
    setResponseBody(null);
    setResponseStatus(null);

    try {
      const res = await axios.get(`${API_BASE_URL}/integrations/v1/schema`);
      setResponseStatus(res.status);
      setResponseBody(res.data);
    } catch (err: any) {
      setResponseStatus(err.response?.status || 500);
      setResponseBody(err.response?.data || { error: err.message });
      setErrorMsg(err.response?.data?.detail || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const executePrefill = async () => {
    setLoading(true);
    setErrorMsg('');
    setResponseBody(null);
    setResponseStatus(null);

    try {
      const parsed = JSON.parse(prefillPayload);
      const res = await axios.post(`${API_BASE_URL}/integrations/v1/applications/prefill`, parsed, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
      });
      setResponseStatus(res.status);
      setResponseBody(res.data);
      if (res.data.application_number) {
        setAppNumber(res.data.application_number);
      }
    } catch (err: any) {
      setResponseStatus(err.response?.status || 500);
      setResponseBody(err.response?.data || { error: err.message });
      setErrorMsg(err.response?.data?.detail || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const executeGetStatus = async () => {
    setLoading(true);
    setErrorMsg('');
    setResponseBody(null);
    setResponseStatus(null);

    try {
      const res = await axios.get(`${API_BASE_URL}/integrations/v1/applications/${appNumber}/status`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });
      setResponseStatus(res.status);
      setResponseBody(res.data);
    } catch (err: any) {
      setResponseStatus(err.response?.status || 500);
      setResponseBody(err.response?.data || { error: err.message });
      setErrorMsg(err.response?.data?.detail || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const executeGetComplete = async () => {
    setLoading(true);
    setErrorMsg('');
    setResponseBody(null);
    setResponseStatus(null);

    try {
      const res = await axios.get(`${API_BASE_URL}/integrations/v1/applications/${appNumber}`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });
      setResponseStatus(res.status);
      setResponseBody(res.data);
    } catch (err: any) {
      setResponseStatus(err.response?.status || 500);
      setResponseBody(err.response?.data || { error: err.message });
      setErrorMsg(err.response?.data?.detail || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white">SIH26130 Integration Sandbox</h1>
                <p className="text-xs text-slate-400">
                  Simulate direct REST API calls between your Main SIH Portal and the Mock GST Portal
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PrototypeBadge size="sm" />
            <a
              href="http://localhost:8003/docs"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold text-blue-400 flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Swagger /docs</span>
            </a>
          </div>
        </div>

        {/* Integration Architecture Diagram / Summary Box */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 text-xs space-y-3">
          <h3 className="font-bold text-white text-sm">Target SIH Flow Architecture</h3>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] bg-slate-900 p-3 rounded-xl border border-slate-700">
            <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded">MAIN SIH PORTAL</span>
            <span className="text-slate-500">→</span>
            <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded">SIH BACKEND</span>
            <span className="text-amber-400">→ [X-API-Key] →</span>
            <span className="bg-amber-950 text-amber-300 px-2 py-1 rounded">POST /api/integrations/v1/applications/prefill</span>
            <span className="text-slate-500">→</span>
            <span className="bg-emerald-950 text-emerald-300 px-2 py-1 rounded">CREATE DRAFT</span>
            <span className="text-slate-500">→</span>
            <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded">OFFICER APPROVES</span>
            <span className="text-slate-500">→</span>
            <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded">GET /status (APPROVED)</span>
          </div>
        </div>

        {/* Key Configuration Bar */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>MOCK_GST_API_KEY (X-API-Key Header)</span>
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Target Application Number</label>
            <input
              type="text"
              value={appNumber}
              onChange={(e) => setAppNumber(e.target.value)}
              placeholder="GST-MOCK-2026-000123"
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-amber-300 text-[11px]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                const newId = `SIH-APP-${Math.floor(1000 + Math.random() * 9000)}`;
                setExtRefId(newId);
                const parsed = JSON.parse(prefillPayload);
                parsed.external_reference_id = newId;
                setPrefillPayload(JSON.stringify(parsed, null, 2));
              }}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-200 font-semibold flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Generate New External Reference ID</span>
            </button>
          </div>
        </div>

        {/* API Action Buttons & Tester Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Request Tester */}
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-700">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTest('headless')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                    activeTest === 'headless' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  <span>📦 Method 2: Headless Submit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTest('schema')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                    activeTest === 'schema' ? 'bg-purple-500 text-white shadow-md' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  <span>⚡ GET /schema</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTest('prefill')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    activeTest === 'prefill' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  POST /prefill
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTest('status')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    activeTest === 'status' ? 'bg-blue-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  GET /status
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTest('complete')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    activeTest === 'complete' ? 'bg-blue-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  GET /app
                </button>
              </div>
            </div>

            {activeTest === 'headless' && (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Endpoint: <strong className="font-mono text-emerald-400">POST /api/integrations/v1/applications/headless-submit</strong></span>
                  <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-800">100% Automated</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Takes all dynamic input fields, creates the application and business directly in <span className="text-emerald-400 font-bold">SUBMITTED</span> status, creates mock documents, and updates databases for both portals!
                </p>
                <textarea
                  rows={13}
                  value={headlessPayload}
                  onChange={(e) => setHeadlessPayload(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl font-mono text-[11px] text-emerald-200"
                />
                <button
                  type="button"
                  onClick={executeHeadlessSubmit}
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{loading ? 'Submitting Headless Application...' : 'Submit Headless Application (Method 2)'}</span>
                </button>
              </div>
            )}

            {activeTest === 'schema' && (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Endpoint: <strong className="font-mono text-purple-400">GET /api/integrations/v1/schema</strong></span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Fetch all dynamic sections, fields, types, options, validation patterns, and document requirements for rendering dynamically in your Main SIH Website.
                </p>
                <button
                  type="button"
                  onClick={executeGetSchema}
                  disabled={loading}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{loading ? 'Fetching Dynamic Schema...' : 'Fetch Dynamic Fields Schema'}</span>
                </button>
              </div>
            )}

            {activeTest === 'prefill' && (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Endpoint: <strong className="font-mono text-emerald-400">POST /api/integrations/v1/applications/prefill</strong></span>
                </div>
                <textarea
                  rows={14}
                  value={prefillPayload}
                  onChange={(e) => setPrefillPayload(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl font-mono text-[11px] text-amber-200"
                />
                <button
                  type="button"
                  onClick={executePrefill}
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{loading ? 'Sending API Request...' : 'Send Prefill Request'}</span>
                </button>
              </div>
            )}

            {activeTest === 'status' && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2">
                  <span className="text-slate-400 block">Target URL:</span>
                  <p className="font-mono text-emerald-400 text-[11px]">
                    GET /api/integrations/v1/applications/{appNumber}/status
                  </p>
                </div>
                <button
                  type="button"
                  onClick={executeGetStatus}
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{loading ? 'Fetching Status...' : 'Query Application Status'}</span>
                </button>
              </div>
            )}

            {activeTest === 'complete' && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2">
                  <span className="text-slate-400 block">Target URL:</span>
                  <p className="font-mono text-emerald-400 text-[11px]">
                    GET /api/integrations/v1/applications/{appNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={executeGetComplete}
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{loading ? 'Fetching Object...' : 'Get Full Application Hierarchy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Live Response Inspector */}
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-4 flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-700">
              <span className="font-bold text-white text-xs uppercase tracking-wider">Live API Response Inspector</span>
              {responseStatus && (
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    responseStatus >= 200 && responseStatus < 300
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                      : 'bg-red-950 text-red-400 border border-red-700'
                  }`}
                >
                  HTTP {responseStatus}
                </span>
              )}
            </div>

            <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-700 overflow-auto min-h-[350px]">
              {responseBody ? (
                <pre className="font-mono text-[11px] text-emerald-300 leading-relaxed">
                  {JSON.stringify(responseBody, null, 2)}
                </pre>
              ) : (
                <div className="text-center text-slate-500 text-xs h-full flex items-center justify-center">
                  Execute an integration request on the left to inspect the live response.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
