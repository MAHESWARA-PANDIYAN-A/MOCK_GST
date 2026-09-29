import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { officerService } from '../../services/officerService';
import { API_BASE_URL } from '../../services/api';
import { ApplicationDetail, DocumentItem, QueryItem } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TimelineView } from '../../components/common/TimelineView';
import { 
  ArrowLeft, Building, Users, MapPin, Package, 
  FileCheck, HelpCircle, CheckCircle2, XCircle, Clock, 
  Send, Shield, AlertTriangle, Eye, Check, X, MessageSquare, AlertCircle 
} from 'lucide-react';

export const OfficerApplicationReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Document Scrutiny State
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'ACCEPTED' | 'REJECTED' | 'NEEDS_CORRECTION'>('ACCEPTED');
  const [officerComment, setOfficerComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Query Raise State
  const [querySubject, setQuerySubject] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [queryDeadline, setQueryDeadline] = useState('');
  const [submittingQuery, setSubmittingQuery] = useState(false);

  // Final Decision State
  const [approvalRemarks, setApprovalRemarks] = useState('All business premises and documents verified successfully.');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);

  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await officerService.getApplication(id);
      setApp(data);
    } catch (err) {
      console.error('Failed to load application:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDocumentReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setActionError('');
    setActionMessage('');
    setSubmittingReview(true);

    try {
      await officerService.reviewDocument(selectedDoc.id, reviewStatus, officerComment);
      setActionMessage(`Document '${selectedDoc.document_type}' marked as ${reviewStatus}`);
      setSelectedDoc(null);
      setOfficerComment('');
      await loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to review document.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRaiseQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app || !querySubject.trim() || !queryMessage.trim()) return;
    setActionError('');
    setActionMessage('');
    setSubmittingQuery(true);

    try {
      await officerService.createQuery(app.id, querySubject.trim(), queryMessage.trim(), queryDeadline || undefined);
      setActionMessage(`Query '${querySubject}' raised successfully. Application status changed to DOCUMENT_QUERY.`);
      setQuerySubject('');
      setQueryMessage('');
      await loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to raise query.');
    } finally {
      setSubmittingQuery(false);
    }
  };

  const handleResolveQuery = async (queryId: number) => {
    try {
      await officerService.resolveQuery(queryId);
      setActionMessage('Query marked as RESOLVED. Application returned to UNDER_REVIEW.');
      await loadData();
    } catch (err: any) {
      setActionError('Failed to resolve query.');
    }
  };

  const handleApprove = async () => {
    if (!app) return;
    setDecisionLoading(true);
    try {
      const res = await officerService.approveApplication(app.id, approvalRemarks);
      setShowApproveModal(false);
      setActionMessage(`Application APPROVED! Mock Registration Ref: ${res.mock_registration_ref}`);
      await loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to approve application.');
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!app || !rejectionReason.trim()) {
      alert('Rejection reason is mandatory.');
      return;
    }
    setDecisionLoading(true);
    try {
      await officerService.rejectApplication(app.id, rejectionReason.trim());
      setShowRejectModal(false);
      setActionMessage('Application has been REJECTED.');
      await loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to reject application.');
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleMoveToReview = async () => {
    if (!app) return;
    try {
      await officerService.updateStatus(app.id, 'UNDER_REVIEW', 'Assigned and taken up for officer scrutiny.');
      await loadData();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300">
        <p className="text-sm">Loading Officer Scrutiny Console...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Application Not Found</h2>
          <Link to="/officer/dashboard" className="text-amber-400 hover:underline text-xs">
            Return to Officer Queue
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'business', label: 'Business' },
    { id: 'promoters', label: 'Promoters' },
    { id: 'signatory', label: 'Authorized Signatory' },
    { id: 'principal', label: 'Principal Place' },
    { id: 'additional', label: 'Additional Places' },
    { id: 'goods', label: 'Goods & Services' },
    { id: 'documents', label: `Documents (${app.documents?.length || 0})` },
    { id: 'queries', label: `Queries (${app.queries?.length || 0})` },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Bar */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Link to="/officer/dashboard" className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-extrabold text-white">
                Scrutiny Console: <span className="font-mono text-amber-400">{app.application_number}</span>
              </h1>
              <StatusBadge status={app.status} size="md" />
            </div>
            <p className="text-xs text-slate-400 mt-1 pl-8">
              Entity: <strong className="text-white">{app.business?.legal_name}</strong> • PAN: <strong className="font-mono text-amber-300">{app.business?.pan}</strong> • District: {app.business?.district}, {app.business?.state}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {app.status === 'SUBMITTED' && (
              <button
                type="button"
                onClick={handleMoveToReview}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Start Scrutiny (Move to Under Review)
              </button>
            )}

            {app.status !== 'APPROVED' && app.status !== 'REJECTED' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  className="px-3.5 py-2 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowApproveModal(true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Registration</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Action feedback alerts */}
        {actionMessage && (
          <div className="bg-emerald-950/60 border border-emerald-700 p-3.5 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {actionError && (
          <div className="bg-red-950/60 border border-red-700 p-3.5 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Tab Header */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="flex border-b border-slate-700 overflow-x-auto px-4 pt-2 gap-2 bg-slate-850">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === t.id
                    ? 'border-amber-400 text-amber-400 bg-slate-800 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Application Identity</span>
                    <p>Number: <strong className="font-mono text-amber-400">{app.application_number}</strong></p>
                    <p>Source System: <strong>{app.source_system}</strong></p>
                    <p>External Ref: <strong className="font-mono">{app.external_reference_id || 'N/A'}</strong></p>
                    <p>Type: <strong>{app.application_type}</strong></p>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Applicant Contact</span>
                    <p>Applicant Name: <strong className="text-white">{app.applicant?.name}</strong></p>
                    <p>Email: <strong className="text-white">{app.applicant?.email}</strong></p>
                    <p>Mobile: <strong className="text-white">{app.applicant?.mobile}</strong></p>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Workflow Status</span>
                    <div className="pt-1"><StatusBadge status={app.status} size="sm" /></div>
                    <p className="pt-1">Submission: <strong>{app.submission_date ? new Date(app.submission_date).toLocaleString() : 'Draft'}</strong></p>
                    {app.mock_registration_ref && (
                      <p className="text-emerald-400 font-mono font-bold">Mock Ref: {app.mock_registration_ref}</p>
                    )}
                  </div>
                </div>

                {/* Quick Scrutiny Checklist */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 space-y-3">
                  <h3 className="font-bold text-white text-sm">Officer Document Verification Summary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {app.documents?.map((d) => (
                      <div key={d.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-1">
                        <div className="flex justify-between items-center font-bold">
                          <span className="truncate">{d.document_type.replace(/_/g, ' ')}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              d.review_status === 'ACCEPTED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                                : d.review_status === 'NEEDS_CORRECTION' || d.review_status === 'REJECTED'
                                ? 'bg-red-950 text-red-400 border border-red-700'
                                : 'bg-amber-950 text-amber-400 border border-amber-700'
                            }`}
                          >
                            {d.review_status}
                          </span>
                        </div>
                        <p className="text-slate-400 truncate text-[11px]">{d.filename}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* BUSINESS TAB */}
            {activeTab === 'business' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">Legal Name of Business:</span>
                  <strong className="text-white text-sm">{app.business?.legal_name}</strong>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">Trade Name:</span>
                  <strong className="text-white text-sm">{app.business?.trade_name || '—'}</strong>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">PAN:</span>
                  <strong className="font-mono text-amber-400 text-sm">{app.business?.pan}</strong>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">Constitution of Business:</span>
                  <strong className="text-white">{app.business?.constitution_of_business}</strong>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">Nature of Business Activity:</span>
                  <strong className="text-white">{app.business?.business_activity}</strong>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">Primary Activity:</span>
                  <strong className="text-white">{app.business?.primary_activity}</strong>
                </div>
              </div>
            )}

            {/* PROMOTERS TAB */}
            {activeTab === 'promoters' && (
              <div className="space-y-4">
                {app.promoters?.map((p, idx) => (
                  <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-xs space-y-2">
                    <div className="flex justify-between items-center font-bold text-sm text-white">
                      <span>{p.name}</span>
                      <span className="text-amber-400 text-xs">{p.role}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300">
                      <p>PAN: <strong className="font-mono text-white">{p.pan}</strong></p>
                      <p>Aadhaar: <strong className="font-mono text-white">{p.aadhaar_masked || 'XXXX-XXXX-1234'}</strong></p>
                      <p>Mobile: <strong className="text-white">{p.mobile}</strong></p>
                      <p>Email: <strong className="text-white">{p.email}</strong></p>
                      <p className="sm:col-span-2">Address: <strong className="text-white">{p.address}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AUTHORIZED SIGNATORY TAB */}
            {activeTab === 'signatory' && (
              <div className="space-y-4 text-xs">
                {app.authorized_signatories?.map((s, idx) => (
                  <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2">
                    <div className="flex justify-between items-center font-bold text-sm text-white">
                      <span>{s.name}</span>
                      <span className="text-amber-400 text-xs">{s.designation}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300">
                      <p>PAN: <strong className="font-mono text-white">{s.pan}</strong></p>
                      <p>Aadhaar: <strong className="font-mono text-white">{s.aadhaar_masked || 'XXXX-XXXX-1234'}</strong></p>
                      <p>Authorization Type: <strong className="text-white">{s.authorization_type}</strong></p>
                      <p>Mobile: <strong className="text-white">{s.mobile}</strong></p>
                      <p>Email: <strong className="text-white">{s.email}</strong></p>
                      <p>Same as Promoter: <strong className="text-white">{s.is_same_as_promoter ? 'YES' : 'NO'}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PRINCIPAL PLACE TAB */}
            {activeTab === 'principal' && (
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 text-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block mb-1">Premises & Street:</span>
                    <strong className="text-white text-sm">
                      {app.principal_place?.premise_name}, {app.principal_place?.road || ''}, {app.principal_place?.locality}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Possession Type:</span>
                    <strong className="text-amber-400 font-bold text-sm">{app.principal_place?.nature_of_possession}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">State & District:</span>
                    <strong className="text-white">{app.principal_place?.district}, {app.principal_place?.state} - {app.principal_place?.pincode}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Jurisdiction:</span>
                    <strong className="text-white">{app.principal_place?.jurisdiction || 'Salem Central Range'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Contact Email / Mobile:</span>
                    <strong className="text-white">{app.principal_place?.office_email} • {app.principal_place?.office_mobile}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* ADDITIONAL PLACES TAB */}
            {activeTab === 'additional' && (
              <div className="space-y-4 text-xs">
                {app.additional_places?.length === 0 ? (
                  <p className="text-slate-500">No additional places of business declared.</p>
                ) : (
                  app.additional_places?.map((ap, idx) => (
                    <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-1">
                      <span className="font-bold text-white">Location #{idx + 1}: {ap.address}</span>
                      <p className="text-slate-400">{ap.district}, {ap.state} - {ap.pincode} • Possession: {ap.nature_of_possession} • Activity: {ap.business_activity}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* GOODS & SERVICES TAB */}
            {activeTab === 'goods' && (
              <div className="space-y-3 text-xs">
                {app.goods_services?.map((gs, idx) => (
                  <div key={idx} className="bg-slate-900 p-3.5 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">{gs.description}</span>
                      <span className="text-slate-400">Classification: {gs.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">{gs.type === 'GOODS' ? 'HSN' : 'SAC'} CODE</span>
                      <strong className="font-mono text-amber-400 text-sm">{gs.hsn_sac_code}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* DOCUMENTS SCRUTINY TAB */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="divide-y divide-slate-700">
                  {app.documents?.map((doc) => (
                    <div key={doc.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{doc.document_type.replace(/_/g, ' ')}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              doc.review_status === 'ACCEPTED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : doc.review_status === 'NEEDS_CORRECTION' || doc.review_status === 'REJECTED'
                                ? 'bg-red-950 text-red-300 border border-red-700'
                                : 'bg-amber-950 text-amber-300 border border-amber-700'
                            }`}
                          >
                            {doc.review_status}
                          </span>
                        </div>
                        <p className="text-slate-400 mt-1">
                          Filename: <strong>{doc.filename}</strong> ({(doc.file_size / 1024).toFixed(1)} KB) • Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
                        </p>
                        {doc.officer_comment && (
                          <div className="mt-2 bg-slate-900 p-2.5 rounded-lg border border-slate-700 text-slate-300">
                            <strong className="text-amber-400">Officer Comment:</strong> {doc.officer_comment}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`${API_BASE_URL}/files/${doc.id}/view`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Doc</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setReviewStatus('ACCEPTED');
                            setOfficerComment('');
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Scrutinize / Review</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Scrutiny Modal / Form */}
                {selectedDoc && (
                  <div className="bg-slate-900 p-5 rounded-2xl border border-amber-500/50 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                      <h4 className="font-bold text-white text-sm">
                        Reviewing: <span className="text-amber-400">{selectedDoc.document_type.replace(/_/g, ' ')}</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setSelectedDoc(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleDocumentReviewSubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Decision</label>
                        <div className="flex gap-4">
                          {(['ACCEPTED', 'NEEDS_CORRECTION', 'REJECTED'] as const).map((st) => (
                            <label key={st} className="inline-flex items-center gap-1.5 cursor-pointer font-bold">
                              <input
                                type="radio"
                                name="docDecision"
                                checked={reviewStatus === st}
                                onChange={() => setReviewStatus(st)}
                                className="text-amber-500 focus:ring-amber-500"
                              />
                              <span className={st === 'ACCEPTED' ? 'text-emerald-400' : 'text-rose-400'}>{st}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Officer Comment {reviewStatus !== 'ACCEPTED' && <span className="text-red-400">* (Mandatory for correction/rejection)</span>}
                        </label>
                        <textarea
                          rows={2}
                          required={reviewStatus !== 'ACCEPTED'}
                          value={officerComment}
                          onChange={(e) => setOfficerComment(e.target.value)}
                          placeholder="e.g. Uploaded rent agreement is unclear. Please re-upload legible page 2."
                          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDoc(null)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow"
                        >
                          {submittingReview ? 'Saving...' : 'Save Decision'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* QUERIES TAB */}
            {activeTab === 'queries' && (
              <div className="space-y-6">
                {/* Raise Query Box */}
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700 space-y-4">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>Raise Clarification Query (RFI) to Applicant</span>
                  </h4>

                  <form onSubmit={handleRaiseQuery} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-300 mb-1">Query Subject *</label>
                        <input
                          type="text"
                          required
                          value={querySubject}
                          onChange={(e) => setQuerySubject(e.target.value)}
                          placeholder="e.g. Address Proof Clarification"
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Response Deadline (Optional)</label>
                        <input
                          type="date"
                          value={queryDeadline}
                          onChange={(e) => setQueryDeadline(e.target.value)}
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Query Description *</label>
                      <textarea
                        rows={2}
                        required
                        value={queryMessage}
                        onChange={(e) => setQueryMessage(e.target.value)}
                        placeholder="State clearly what clarification or corrected document is requested from the applicant..."
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingQuery}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingQuery ? 'Dispatching...' : 'Dispatch Query'}</span>
                    </button>
                  </form>
                </div>

                {/* Existing Queries */}
                <div className="space-y-4">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">Existing Queries Log</h4>
                  {app.queries?.map((q) => (
                    <div key={q.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{q.subject}</span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              q.status === 'OPEN'
                                ? 'bg-orange-950 text-orange-300 border border-orange-700'
                                : q.status === 'RESPONDED'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            }`}
                          >
                            {q.status}
                          </span>
                        </div>
                        {q.status !== 'RESOLVED' && (
                          <button
                            type="button"
                            onClick={() => handleResolveQuery(q.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md text-[11px]"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>

                      <p className="text-slate-300">{q.message}</p>

                      {q.applicant_response && (
                        <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-cyan-300">
                          <strong>Applicant Response ({new Date(q.response_date || q.updated_at).toLocaleString()}):</strong>
                          <p className="mt-1 text-slate-200">{q.applicant_response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TIMELINE TAB */}
            {activeTab === 'timeline' && (
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
                <TimelineView history={app.status_history || []} />
              </div>
            )}
          </div>
        </div>

        {/* APPROVE MODAL */}
        {showApproveModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-xs">
              <div className="flex items-center gap-2.5 text-emerald-400 pb-2 border-b border-slate-700">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="font-extrabold text-base text-white">Approve GST Registration</h3>
              </div>

              <p className="text-slate-300">
                Approving this application will generate a simulated GST Registration Reference (e.g.{' '}
                <span className="font-mono text-emerald-400 font-bold">GST-REG-MOCK-2026-XXXXXX</span>) and notify the SIH Main Portal.
              </p>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Approval Remarks</label>
                <textarea
                  rows={3}
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={decisionLoading}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg shadow"
                >
                  {decisionLoading ? 'Processing...' : 'Confirm Approval'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REJECT MODAL */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-xs">
              <div className="flex items-center gap-2.5 text-rose-400 pb-2 border-b border-slate-700">
                <XCircle className="w-6 h-6" />
                <h3 className="font-extrabold text-base text-white">Reject GST Application</h3>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Rejection Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State the regulatory / document verification reason for rejection..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={decisionLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow"
                >
                  {decisionLoading ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
