import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicantService } from '../../services/applicantService';
import { API_BASE_URL } from '../../services/api';
import { ApplicationDetail, QueryItem, DocumentItem } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrototypeBadge } from '../../components/common/PrototypeBadge';
import { TimelineView } from '../../components/common/TimelineView';
import { 
  ArrowLeft, Building, Users, MapPin, Package, 
  FileText, HelpCircle, CheckCircle, Clock, 
  AlertTriangle, Upload, Send, Download, Eye, CheckCircle2 
} from 'lucide-react';

export const ApplicationView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'queries' | 'timeline'>('details');

  // Query Response State
  const [selectedQuery, setSelectedQuery] = useState<QueryItem | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);
  const [querySuccess, setQuerySuccess] = useState('');
  const [queryError, setQueryError] = useState('');

  // Corrected Document upload state
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await applicantService.getApplication(id);
      setApp(data);
      // Auto-select open query if any
      const openQ = data.queries?.find((q) => q.status === 'OPEN');
      if (openQ) {
        setSelectedQuery(openQ);
        if (data.status === 'DOCUMENT_QUERY') {
          setActiveTab('queries');
        }
      }
    } catch (err) {
      console.error('Failed to load application:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleQueryResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app || !selectedQuery || !responseText.trim()) return;

    setResponding(true);
    setQueryError('');
    setQuerySuccess('');

    try {
      await applicantService.respondToQuery(app.id, selectedQuery.id, responseText.trim());
      setQuerySuccess('Clarification response submitted successfully to reviewing officer!');
      setResponseText('');
      await loadData();
    } catch (err: any) {
      setQueryError(err.response?.data?.detail || 'Failed to submit response.');
    } finally {
      setResponding(false);
    }
  };

  const handleCorrectedDocUpload = async (docType: string, file: File) => {
    if (!app) return;
    setUploadingDoc(true);
    try {
      await applicantService.uploadDocument(app.id, docType, file);
      await loadData();
      alert(`Corrected document '${file.name}' uploaded successfully!`);
    } catch (err) {
      alert('Failed to upload corrected document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm font-medium text-slate-600">Loading Application...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Application Not Found</h2>
          <Link to="/applicant/dashboard" className="text-sm text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Link to="/applicant/dashboard" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-extrabold text-slate-900">
                Application: <span className="font-mono text-blue-700">{app.application_number}</span>
              </h1>
              <StatusBadge status={app.status} size="md" />
            </div>
            <p className="text-xs text-slate-500 mt-1 pl-8">
              Business: <strong>{app.business?.legal_name || 'N/A'}</strong> • Source: {app.source_system} ({app.external_reference_id || 'Direct'})
            </p>
          </div>

          <div className="flex items-center gap-2">
            {app.status === 'APPROVED' && app.mock_registration_ref && (
              <div className="bg-emerald-50 border border-emerald-300 px-3.5 py-1.5 rounded-xl text-right">
                <span className="block text-[10px] text-emerald-700 font-bold uppercase">Mock Registration Ref</span>
                <span className="font-mono font-extrabold text-sm text-emerald-900">{app.mock_registration_ref}</span>
              </div>
            )}

            {app.status === 'DRAFT' && (
              <Link
                to={`/applicant/applications/${app.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 transition-colors"
              >
                Continue Editing Form
              </Link>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-6 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Application Details
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Documents</span>
            <span className="bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">{app.documents?.length || 0}</span>
          </button>

          <button
            onClick={() => setActiveTab('queries')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'queries' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Officer Queries</span>
            {app.queries?.some((q) => q.status === 'OPEN') && (
              <span className="bg-orange-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold animate-pulse">
                Action Required
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'timeline' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Status Timeline</span>
          </button>
        </div>

        {/* TAB 1: DETAILS */}
        {activeTab === 'details' && (
          <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-slate-200 shadow-sm space-y-6">
            {/* Business Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Business & Entity Details</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block">Legal Name:</span>
                  <strong className="text-slate-900">{app.business?.legal_name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Trade Name:</span>
                  <strong className="text-slate-900">{app.business?.trade_name || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">PAN:</span>
                  <strong className="font-mono text-slate-900">{app.business?.pan}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Constitution:</span>
                  <strong className="text-slate-900">{app.business?.constitution_of_business}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Business Activity:</span>
                  <strong className="text-slate-900">{app.business?.business_activity}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Primary Activity:</span>
                  <strong className="text-slate-900">{app.business?.primary_activity}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Commencement Date:</span>
                  <strong className="text-slate-900">{app.business?.commencement_date || '—'}</strong>
                </div>
              </div>
            </div>

            {/* Principal Place */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Principal Place of Business</span>
              </h3>
              <div className="bg-slate-50 p-4 rounded-xl text-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block">Address:</span>
                  <strong className="text-slate-900">
                    {app.principal_place?.premise_name}, {app.principal_place?.locality}, {app.principal_place?.district}, {app.principal_place?.state} - {app.principal_place?.pincode}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Possession Type:</span>
                  <strong className="text-slate-900">{app.principal_place?.nature_of_possession}</strong>
                </div>
              </div>
            </div>

            {/* Promoters */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Promoters / Partners / Directors ({app.promoters?.length || 0})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {app.promoters?.map((p, i) => (
                  <div key={i} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{p.name}</span>
                      <span className="text-blue-600">{p.role}</span>
                    </div>
                    <p className="text-slate-600">PAN: <strong className="font-mono">{p.pan}</strong> • Aadhaar: <strong className="font-mono">{p.aadhaar_masked || 'XXXX-XXXX-1234'}</strong></p>
                    <p className="text-slate-600">Mobile: {p.mobile} • Email: {p.email}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Uploaded Supporting Documents</h3>
            <div className="divide-y divide-slate-100">
              {app.documents?.map((doc) => (
                <div key={doc.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{doc.document_type.replace(/_/g, ' ')}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          doc.review_status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.review_status === 'NEEDS_CORRECTION' || doc.review_status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {doc.review_status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      File: <strong>{doc.filename}</strong> ({(doc.file_size / 1024).toFixed(1)} KB) • Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
                    </p>
                    {doc.officer_comment && (
                      <div className="mt-2 bg-orange-50 border border-orange-200 p-2 rounded text-xs text-orange-900">
                        <strong>Officer Comment:</strong> {doc.officer_comment}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`${API_BASE_URL}/files/${doc.id}/view`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </a>

                    {(doc.review_status === 'NEEDS_CORRECTION' || doc.review_status === 'REJECTED' || app.status === 'DOCUMENT_QUERY') && (
                      <label className="cursor-pointer px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Corrected Copy</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleCorrectedDocUpload(doc.document_type, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: QUERIES */}
        {activeTab === 'queries' && (
          <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Officer Scrutiny Queries</h3>

            {app.queries?.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No officer queries raised on this application.
              </div>
            ) : (
              <div className="space-y-6">
                {app.queries?.map((q) => (
                  <div key={q.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{q.subject}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              q.status === 'OPEN'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {q.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Raised by: <strong>{q.officer_name || 'GST Officer'}</strong> on {new Date(q.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-800">
                      <strong>Officer Message:</strong>
                      <p className="mt-1">{q.message}</p>
                    </div>

                    {q.applicant_response ? (
                      <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900">
                        <strong>Your Submitted Response ({new Date(q.response_date || q.updated_at).toLocaleString()}):</strong>
                        <p className="mt-1">{q.applicant_response}</p>
                      </div>
                    ) : (
                      <form onSubmit={handleQueryResponseSubmit} className="space-y-3 pt-2">
                        {queryError && (
                          <div className="text-xs text-red-600 font-semibold">{queryError}</div>
                        )}
                        {querySuccess && (
                          <div className="text-xs text-emerald-600 font-semibold">{querySuccess}</div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Your Clarification / Response Text *
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="State your clarification or describe the corrected documents uploaded above..."
                            className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={responding}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{responding ? 'Submitting...' : 'Submit Clarification Response'}</span>
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Complete Status Audit Timeline</h3>
            <TimelineView history={app.status_history || []} />
          </div>
        )}
      </div>
    </div>
  );
};
