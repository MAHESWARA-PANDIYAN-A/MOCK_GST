import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PrototypeBadge } from '../components/common/PrototypeBadge';
import { 
  Building2, ArrowRight, CheckCircle2, Shield, FileCheck, 
  Search, FileText, Send, Zap, Server, ChevronRight 
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [trackQuery, setTrackQuery] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackQuery.trim()) {
      navigate(`/track?query=${encodeURIComponent(trackQuery.trim())}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white py-16 lg:py-24">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex justify-center">
              <PrototypeBadge size="lg" className="bg-amber-400/10 border-amber-400/30 text-amber-300" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              GST Registration Application
            </h1>

            <p className="text-lg sm:text-xl text-blue-100 font-light leading-relaxed">
              Submit your business information, upload supporting documents, and track your simulated registration application.
            </p>

            {/* Disclaimer Callout */}
            <div className="bg-amber-500/15 border border-amber-400/30 rounded-xl p-3.5 text-xs sm:text-sm text-amber-200 text-center max-w-2xl mx-auto">
              <strong>Notice:</strong> This is a prototype simulation and is not an official GST Portal. No legal taxes or official government registrations are processed here.
            </div>

            {/* Quick Actions */}
            <div className="pt-4 flex flex-wrap justify-center items-center gap-4">
              <Link
                to="/applicant/login"
                className="px-6 py-3.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 text-base"
              >
                <span>Apply for GST</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/track"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl border border-white/20 backdrop-blur-sm transition-all flex items-center gap-2 text-base"
              >
                <Search className="w-5 h-5 text-blue-300" />
                <span>Track Application</span>
              </Link>
            </div>

            {/* Quick Track Input Bar */}
            <div className="pt-6 max-w-md mx-auto">
              <form onSubmit={handleTrack} className="flex gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20 backdrop-blur-md">
                <input
                  type="text"
                  placeholder="Enter Application No. (e.g. GST-MOCK-2026-000123)"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  className="w-full bg-transparent px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow transition-colors flex items-center gap-1"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Credentials Helper Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 z-10 w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">Pre-seeded Hackathon Demo Credentials</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-blue-950">Applicant (Rahul Kumar)</span>
                <span className="text-[10px] bg-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded">APPLICANT</span>
              </div>
              <p className="text-xs text-slate-600 font-mono">Email: rahul@example.com</p>
              <p className="text-xs text-slate-600 font-mono">Password: Applicant@123</p>
              <p className="text-[11px] text-blue-800 mt-2">Pre-seeded with ABC Foods Pvt Ltd applications (Query & Approved).</p>
              <Link to="/applicant/login" className="inline-flex items-center gap-1 text-xs text-blue-700 font-semibold mt-2 hover:underline">
                Login as Applicant <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900">Officer (Officer Priya)</span>
                <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded">OFFICER</span>
              </div>
              <p className="text-xs text-slate-600 font-mono">Email: officer.priya@gstmock.in</p>
              <p className="text-xs text-slate-600 font-mono">Password: Officer@123</p>
              <p className="text-[11px] text-slate-600 mt-2">Can review docs, raise/resolve queries, and approve applications.</p>
              <Link to="/officer/login" className="inline-flex items-center gap-1 text-xs text-slate-800 font-semibold mt-2 hover:underline">
                Login as Officer <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-amber-950">SIH Portal Integration</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded">REST API</span>
              </div>
              <p className="text-xs text-slate-600 font-mono">X-API-Key: gst_sih26130_secret_api_key_mock_2026</p>
              <p className="text-xs text-slate-600 font-mono">Endpoint: /api/integrations/v1/applications/prefill</p>
              <p className="text-[11px] text-amber-800 mt-2">Test automatic pre-fill from Main SIH portal in real-time.</p>
              <Link to="/integrations/sandbox" className="inline-flex items-center gap-1 text-xs text-amber-700 font-semibold mt-2 hover:underline">
                Open Sandbox <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How The Simulated GST Workflow Works
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            End-to-end integration designed for applicant filing and SIH26130 automated approval simulation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg mb-4">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">SIH Pre-fill or Register</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Applicant can sign up directly or receive a pre-filled draft from the Main SIH Portal API.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg mb-4">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">11-Step Form & Uploads</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Fill business, promoter, and address details, upload PAN/Aadhaar/Premises proof, and verify with mock OTP.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg mb-4">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Officer Review & Queries</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              GST Officer inspects uploaded documents, accepts or raises queries for corrections, and logs decisions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Approval & Ref Generated</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Officer approves application, simulated GST reference number is issued, and SIH portal syncs status.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
