import React from 'react';
import { PrototypeBadge } from './PrototypeBadge';
import { ShieldCheck, Terminal, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                GST
              </div>
              <span className="font-bold text-white text-lg">GST Registration Portal</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              A high-fidelity simulation and approval workflow module built for the <strong>SIH26130</strong> Smart India Hackathon prototype.
            </p>
            <div className="pt-2">
              <PrototypeBadge size="sm" />
            </div>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3 tracking-wider uppercase">Portal Navigation</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/applicant/login" className="hover:text-white transition-colors">Applicant Login</Link></li>
              <li><Link to="/officer/login" className="hover:text-white transition-colors">GST Officer Portal</Link></li>
              <li><Link to="/track" className="hover:text-white transition-colors">Track Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3 tracking-wider uppercase">Developer & Integrations</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/integrations/sandbox" className="hover:text-amber-400 flex items-center gap-1.5 transition-colors">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>SIH Integration Sandbox</span>
                </Link>
              </li>
              <li>
                <a href="http://localhost:8003/docs" target="_blank" rel="noreferrer" className="hover:text-blue-400 flex items-center gap-1.5 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>FastAPI Swagger Docs</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p>© 2026 SIH26130 Prototype. All mock data strictly simulated for hackathon evaluation.</p>
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Simulated Environment • No official government affiliation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
