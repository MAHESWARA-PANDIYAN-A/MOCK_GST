import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { applicantService } from '../../services/applicantService';
import { 
  ApplicationDetail, Business, Promoter, AuthorizedSignatory, 
  PrincipalPlace, AdditionalPlace, GoodsService, DocumentItem, DocumentRequirement 
} from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrototypeBadge } from '../../components/common/PrototypeBadge';
import { 
  Building, Users, UserCheck, MapPin, Plus, Trash2, 
  Package, FileUp, CheckCircle, ShieldCheck, FileText, 
  Save, ArrowLeft, ArrowRight, Upload, AlertCircle, 
  Download, Eye, RefreshCw, Sparkles, CheckCircle2 
} from 'lucide-react';

export const ApplicationStepper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  
  // Current Step (1 to 11)
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Business Form State
  const [business, setBusiness] = useState<Business>({
    legal_name: '',
    trade_name: '',
    constitution_of_business: 'Private Limited Company',
    pan: '',
    reason_for_reg: 'New Business',
    commencement_date: '2026-01-15',
    business_activity: 'Manufacturer',
    primary_activity: 'Food Manufacturing',
    state: 'Tamil Nadu',
    district: 'Salem',
    pincode: '636001',
    gst_existing: '',
  });

  // Step 2: Promoters Form State
  const [promoters, setPromoters] = useState<Promoter[]>([
    {
      name: '',
      role: 'Director',
      pan: '',
      aadhaar_last4: '1234',
      mobile: '',
      email: '',
      address: '',
    },
  ]);

  // Step 3: Authorized Signatory Form State
  const [signatories, setSignatories] = useState<AuthorizedSignatory[]>([
    {
      name: '',
      designation: 'Managing Director',
      mobile: '',
      email: '',
      pan: '',
      aadhaar_last4: '1234',
      authorization_type: 'BOARD_RESOLUTION',
      address: '',
      is_same_as_promoter: false,
    },
  ]);

  // Step 4: Principal Place Form State
  const [principalPlace, setPrincipalPlace] = useState<PrincipalPlace>({
    building_number: 'Plot 12',
    floor_number: 'Ground',
    premise_name: 'Industrial Processing Unit',
    road: 'Main Road',
    locality: 'SIDCO Industrial Estate',
    state: 'Tamil Nadu',
    district: 'Salem',
    pincode: '636001',
    jurisdiction: 'Salem Central Range-1',
    nature_of_possession: 'RENTED',
    office_email: 'office@abcfoods.local',
    office_mobile: '9876543210',
  });

  // Step 5: Additional Places Form State
  const [hasAdditionalPlaces, setHasAdditionalPlaces] = useState(false);
  const [additionalPlaces, setAdditionalPlaces] = useState<AdditionalPlace[]>([]);

  // Step 6: Goods and Services Form State
  const [supplyType, setSupplyType] = useState<'GOODS' | 'SERVICES' | 'BOTH'>('GOODS');
  const [goodsServices, setGoodsServices] = useState<GoodsService[]>([
    {
      type: 'GOODS',
      description: 'Packaged Snacks and Confectionery (Prototype Example)',
      hsn_sac_code: '2106',
    },
  ]);

  // Step 7: Documents State
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  // Step 8: Aadhaar Verification State
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarVerifying, setAadhaarVerifying] = useState(false);

  // Step 10: Final Mock OTP State
  const [finalOtp, setFinalOtp] = useState('123456');
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Load Application Data
  const loadApplication = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [appData, reqsData] = await Promise.all([
        applicantService.getApplication(id),
        applicantService.getDocumentRequirements(),
      ]);

      setApp(appData);
      setRequirements(reqsData);
      setCurrentStep(appData.current_step || 1);

      if (appData.business) {
        setBusiness({
          legal_name: appData.business.legal_name || '',
          trade_name: appData.business.trade_name || '',
          constitution_of_business: appData.business.constitution_of_business || 'Private Limited Company',
          pan: appData.business.pan || '',
          reason_for_reg: appData.business.reason_for_reg || 'New Business',
          commencement_date: appData.business.commencement_date || '',
          business_activity: appData.business.business_activity || 'Manufacturer',
          primary_activity: appData.business.primary_activity || 'Food Manufacturing',
          state: appData.business.state || 'Tamil Nadu',
          district: appData.business.district || 'Salem',
          pincode: appData.business.pincode || '636001',
          gst_existing: appData.business.gst_existing || '',
        });
      }

      if (appData.promoters && appData.promoters.length > 0) {
        setPromoters(appData.promoters);
      } else if (appData.applicant) {
        setPromoters([
          {
            name: appData.applicant.name || 'Rahul Kumar',
            role: 'Managing Director',
            pan: appData.business?.pan || 'ABCDE1234F',
            aadhaar_last4: '1234',
            mobile: appData.applicant.mobile || '9876543210',
            email: appData.applicant.email || 'rahul@example.com',
            address: `Plot No. 12, Industrial Area, ${appData.business?.district || 'Salem'}, ${appData.business?.state || 'Tamil Nadu'} - ${appData.business?.pincode || '636001'}`,
          },
        ]);
      }

      if (appData.authorized_signatories && appData.authorized_signatories.length > 0) {
        setSignatories(appData.authorized_signatories);
      } else {
        // Auto-link signatory to primary promoter
        const primaryPromoter = (appData.promoters && appData.promoters[0]) || {
          name: appData.applicant?.name || 'Rahul Kumar',
          mobile: appData.applicant?.mobile || '9876543210',
          email: appData.applicant?.email || 'rahul@example.com',
          pan: appData.business?.pan || 'ABCDE1234F',
          aadhaar_last4: '1234',
          address: `Plot No. 12, Industrial Area, ${appData.business?.district || 'Salem'}, ${appData.business?.state || 'Tamil Nadu'} - ${appData.business?.pincode || '636001'}`,
        };
        setSignatories([
          {
            name: primaryPromoter.name,
            designation: 'Managing Director',
            mobile: primaryPromoter.mobile,
            email: primaryPromoter.email,
            pan: primaryPromoter.pan,
            aadhaar_last4: primaryPromoter.aadhaar_last4,
            authorization_type: 'BOARD_RESOLUTION',
            address: primaryPromoter.address,
            is_same_as_promoter: true,
          },
        ]);
      }

      if (appData.principal_place) {
        setPrincipalPlace(appData.principal_place as PrincipalPlace);
      }

      if (appData.additional_places && appData.additional_places.length > 0) {
        setHasAdditionalPlaces(true);
        setAdditionalPlaces(appData.additional_places);
      }

      if (appData.goods_services && appData.goods_services.length > 0) {
        setGoodsServices(appData.goods_services);
      }
    } catch (err) {
      console.error('Error loading application:', err);
      setErrorMsg('Failed to load application data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [id]);

  // Auto-sync signatory with promoter whenever promoter 0 changes and is_same_as_promoter is true
  const updatePromoterField = (index: number, field: keyof Promoter, value: string) => {
    const updated = [...promoters];
    updated[index] = { ...updated[index], [field]: value };
    setPromoters(updated);

    if (index === 0 && signatories[0]?.is_same_as_promoter) {
      const updatedSig = [...signatories];
      if (field === 'name') updatedSig[0].name = value;
      if (field === 'mobile') updatedSig[0].mobile = value;
      if (field === 'email') updatedSig[0].email = value;
      if (field === 'pan') updatedSig[0].pan = value;
      if (field === 'aadhaar_last4') updatedSig[0].aadhaar_last4 = value;
      if (field === 'address') updatedSig[0].address = value;
      setSignatories(updatedSig);
    }
  };

  // Helper to autofill from profile
  const autoFillFromProfile = () => {
    if (!app) return;
    const applicantName = app.applicant?.name || 'Rahul Kumar';
    const applicantEmail = app.applicant?.email || 'rahul@example.com';
    const applicantMobile = app.applicant?.mobile || '9876543210';
    const defaultPan = business.pan || 'ABCDE1234F';

    // Update promoter 0
    const updatedPromoter: Promoter = {
      name: applicantName,
      role: 'Managing Director',
      pan: defaultPan,
      aadhaar_last4: '1234',
      mobile: applicantMobile,
      email: applicantEmail,
      address: `Plot No. 12, Industrial Area, ${business.district || 'Salem'}, ${business.state || 'Tamil Nadu'} - ${business.pincode || '636001'}`,
    };
    setPromoters([updatedPromoter]);

    // Update signatory
    setSignatories([
      {
        name: applicantName,
        designation: 'Managing Director',
        mobile: applicantMobile,
        email: applicantEmail,
        pan: defaultPan,
        aadhaar_last4: '1234',
        authorization_type: 'BOARD_RESOLUTION',
        address: updatedPromoter.address,
        is_same_as_promoter: true,
      },
    ]);

    // Update principal place contacts
    setPrincipalPlace({
      ...principalPlace,
      state: business.state || principalPlace.state,
      district: business.district || principalPlace.district,
      pincode: business.pincode || principalPlace.pincode,
      office_email: applicantEmail,
      office_mobile: applicantMobile,
    });

    setSuccessMsg('All repeated fields (Name, Email, Mobile, PAN, Address) auto-filled from your profile!');
  };

  // Save Draft API Call
  const handleSaveDraft = async (targetStep?: number) => {
    if (!id) return;
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Pre-populate any missing signatory from promoter before saving
    let currentSignatories = [...signatories];
    if (currentSignatories.length === 0 || !currentSignatories[0].name) {
      const p = promoters[0] || { name: 'Rahul Kumar', mobile: '9876543210', email: 'rahul@example.com', pan: business.pan };
      currentSignatories = [
        {
          name: p.name,
          designation: 'Managing Director',
          mobile: p.mobile,
          email: p.email,
          pan: p.pan,
          aadhaar_last4: p.aadhaar_last4 || '1234',
          authorization_type: 'BOARD_RESOLUTION',
          address: p.address,
          is_same_as_promoter: true,
        },
      ];
      setSignatories(currentSignatories);
    }

    try {
      const payload = {
        current_step: targetStep || currentStep,
        business,
        promoters,
        authorized_signatories: currentSignatories,
        principal_place: principalPlace,
        has_additional_places: hasAdditionalPlaces,
        additional_places: hasAdditionalPlaces ? additionalPlaces : [],
        supply_type: supplyType,
        goods_services: goodsServices,
      };

      await applicantService.saveDraft(id, payload);
      setSuccessMsg('Draft saved successfully!');
      if (targetStep) {
        setCurrentStep(targetStep);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  // Promoter Helpers
  const addPromoter = () => {
    setPromoters([
      ...promoters,
      {
        name: '',
        role: 'Partner',
        pan: '',
        aadhaar_last4: '1234',
        mobile: '',
        email: '',
        address: '',
      },
    ]);
  };

  const removePromoter = (index: number) => {
    if (promoters.length > 1) {
      setPromoters(promoters.filter((_, i) => i !== index));
    }
  };

  // Signatory Helpers
  const handleSameAsPromoter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (checked && promoters.length > 0) {
      const p = promoters[0];
      setSignatories([
        {
          name: p.name,
          designation: 'Managing Director / Authorized Representative',
          mobile: p.mobile,
          email: p.email,
          pan: p.pan,
          aadhaar_last4: p.aadhaar_last4,
          authorization_type: 'BOARD_RESOLUTION',
          address: p.address,
          is_same_as_promoter: true,
        },
      ]);
    } else {
      setSignatories([
        {
          name: '',
          designation: 'Authorized Representative',
          mobile: '',
          email: '',
          pan: '',
          aadhaar_last4: '1234',
          authorization_type: 'LETTER_OF_AUTHORIZATION',
          address: '',
          is_same_as_promoter: false,
        },
      ]);
    }
  };

  // Additional Places Helpers
  const addAdditionalPlace = () => {
    setAdditionalPlaces([
      ...additionalPlaces,
      {
        address: '',
        state: 'Tamil Nadu',
        district: 'Salem',
        pincode: '636001',
        nature_of_possession: 'RENTED',
        business_activity: 'Warehouse',
      },
    ]);
  };

  const removeAdditionalPlace = (index: number) => {
    setAdditionalPlaces(additionalPlaces.filter((_, i) => i !== index));
  };

  // Goods/Services Helpers
  const addGoodsService = () => {
    setGoodsServices([
      ...goodsServices,
      {
        type: 'GOODS',
        description: '',
        hsn_sac_code: 'DEMO',
      },
    ]);
  };

  const removeGoodsService = (index: number) => {
    if (goodsServices.length > 1) {
      setGoodsServices(goodsServices.filter((_, i) => i !== index));
    }
  };

  // Document Upload Helper
  const handleFileUpload = async (docType: string, file: File) => {
    if (!id) return;
    setUploadingDocType(docType);
    setErrorMsg('');

    try {
      await applicantService.uploadDocument(id, docType, file);
      // Reload application to refresh documents list
      await loadApplication();
      setSuccessMsg(`Document uploaded successfully: ${file.name}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setUploadingDocType(null);
    }
  };

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    if (!id) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await applicantService.submitApplication(id, finalOtp || '123456');
      setSubmissionResult(res);
      setCurrentStep(11); // Step 11: Acknowledgement
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object' && detail.missing_fields) {
        setErrorMsg(`Cannot submit incomplete application. Missing: ${detail.missing_fields.join(', ')}`);
      } else {
        setErrorMsg(detail || 'Failed to submit application.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [
    'Business Details',
    'Promoters / Directors',
    'Authorized Signatory',
    'Principal Place of Business',
    'Additional Places',
    'Goods & Services',
    'Document Upload',
    'Aadhaar / Identity Verification',
    'Application Review',
    'Mock OTP Verification',
    'Submit & Acknowledgement',
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading GST Application Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Title Bar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Link to="/applicant/dashboard" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-extrabold text-slate-900">
                GST Application: <span className="font-mono text-blue-700">{app?.application_number}</span>
              </h1>
              <StatusBadge status={app?.status || 'DRAFT'} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-1 pl-8">
              Step {currentStep} of 11: <strong>{stepTitles[currentStep - 1]}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {currentStep < 11 && (
              <button
                type="button"
                onClick={() => handleSaveDraft()}
                disabled={saving}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 11-Step Progress Stepper Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[750px] px-2">
            {stepTitles.map((title, idx) => {
              const stepNum = idx + 1;
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;

              return (
                <div
                  key={stepNum}
                  onClick={() => stepNum <= (app?.status === 'DRAFT' ? 10 : currentStep) && setCurrentStep(stepNum)}
                  className={`flex flex-col items-center group cursor-pointer ${
                    isCurrent ? 'text-blue-600 font-bold' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                  </div>
                  <span className="text-[10px] mt-1.5 text-center max-w-[65px] truncate leading-tight">
                    {title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-emerald-700">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: BUSINESS DETAILS */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 1 — Business & Entity Details</h3>
                <p className="text-xs text-slate-500">Provide legal entity identifiers and primary nature of trade.</p>
              </div>
              <Building className="w-5 h-5 text-blue-600" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Legal Name of Business *</label>
                <input
                  type="text"
                  required
                  value={business.legal_name}
                  onChange={(e) => setBusiness({ ...business, legal_name: e.target.value })}
                  placeholder="e.g. ABC Foods Private Limited"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trade Name</label>
                <input
                  type="text"
                  value={business.trade_name}
                  onChange={(e) => setBusiness({ ...business, trade_name: e.target.value })}
                  placeholder="e.g. ABC Foods"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Constitution *</label>
                <select
                  value={business.constitution_of_business}
                  onChange={(e) => setBusiness({ ...business, constitution_of_business: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="LLP">LLP</option>
                  <option value="Private Limited Company">Private Limited Company</option>
                  <option value="Public Limited Company">Public Limited Company</option>
                  <option value="Society">Society</option>
                  <option value="Trust">Trust</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Permanent Account Number (PAN) *</label>
                <input
                  type="text"
                  maxLength={10}
                  required
                  value={business.pan}
                  onChange={(e) => setBusiness({ ...business, pan: e.target.value.toUpperCase() })}
                  placeholder="ABCDE1234F"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Registration</label>
                <select
                  value={business.reason_for_reg}
                  onChange={(e) => setBusiness({ ...business, reason_for_reg: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="New Business">New Business</option>
                  <option value="Liability to Register">Liability to Register</option>
                  <option value="Voluntary Registration">Voluntary Registration</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Commencement of Business</label>
                <input
                  type="date"
                  value={business.commencement_date}
                  onChange={(e) => setBusiness({ ...business, commencement_date: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nature of Business Activity *</label>
                <select
                  value={business.business_activity}
                  onChange={(e) => setBusiness({ ...business, business_activity: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Trader">Trader</option>
                  <option value="Service Provider">Service Provider</option>
                  <option value="Manufacturer and Trader">Manufacturer and Trader</option>
                  <option value="Service Provider and Trader">Service Provider and Trader</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Business Activity (Prototype)</label>
                <input
                  type="text"
                  value={business.primary_activity}
                  onChange={(e) => setBusiness({ ...business, primary_activity: e.target.value })}
                  placeholder="Food Manufacturing"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PROMOTERS / DIRECTORS */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 2 — Promoter / Proprietor / Partner / Director</h3>
                <p className="text-xs text-slate-500">Sensitive Aadhaar displays are masked (XXXX-XXXX-1234). Syncs automatically with Authorized Signatory.</p>
              </div>
              <button
                type="button"
                onClick={autoFillFromProfile}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg border border-blue-200 text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Auto-fill from Profile</span>
              </button>
            </div>

            <div className="space-y-6">
              {promoters.map((p, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-bold text-xs text-slate-800">Person #{idx + 1}</span>
                    {promoters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePromoter(idx)}
                        className="text-red-600 hover:text-red-700 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={p.name}
                        onChange={(e) => updatePromoterField(idx, 'name', e.target.value)}
                        placeholder="e.g. Rahul Kumar"
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Role / Designation *</label>
                      <input
                        type="text"
                        required
                        value={p.role}
                        onChange={(e) => updatePromoterField(idx, 'role', e.target.value)}
                        placeholder="Director / Partner / Proprietor"
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Individual PAN *</label>
                      <input
                        type="text"
                        maxLength={10}
                        required
                        value={p.pan}
                        onChange={(e) => updatePromoterField(idx, 'pan', e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Aadhaar (Last 4 digits) *</label>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-xs">XXXX-XXXX-</span>
                        <input
                          type="text"
                          maxLength={4}
                          required
                          value={p.aadhaar_last4}
                          onChange={(e) => updatePromoterField(idx, 'aadhaar_last4', e.target.value)}
                          placeholder="1234"
                          className="w-20 p-2 border border-slate-300 rounded-lg font-mono text-center bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={p.mobile}
                        onChange={(e) => updatePromoterField(idx, 'mobile', e.target.value)}
                        placeholder="9876543210"
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={p.email}
                        onChange={(e) => updatePromoterField(idx, 'email', e.target.value)}
                        placeholder="rahul@example.com"
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Residential Address *</label>
                      <input
                        type="text"
                        required
                        value={p.address}
                        onChange={(e) => updatePromoterField(idx, 'address', e.target.value)}
                        placeholder="Plot No. 12, Industrial Area, Salem, Tamil Nadu - 636001"
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addPromoter}
                className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Promoter / Director</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: AUTHORIZED SIGNATORY */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 3 — Authorized Signatory</h3>
                <p className="text-xs text-slate-500">Designated person authorized to sign and file returns.</p>
              </div>
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>

            <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl flex items-center gap-2 text-xs text-blue-900">
              <input
                type="checkbox"
                id="sameAsPromoter"
                checked={signatories[0]?.is_same_as_promoter || false}
                onChange={handleSameAsPromoter}
                className="w-4 h-4 text-blue-600 rounded border-blue-300 focus:ring-blue-500"
              />
              <label htmlFor="sameAsPromoter" className="font-semibold cursor-pointer">
                Primary Authorized Signatory is Same as Primary Promoter / Director
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={signatories[0]?.name || ''}
                  onChange={(e) => {
                    const updated = [...signatories];
                    updated[0].name = e.target.value;
                    setSignatories(updated);
                  }}
                  placeholder="e.g. Rahul Kumar"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designation *</label>
                <input
                  type="text"
                  required
                  value={signatories[0]?.designation || ''}
                  onChange={(e) => {
                    const updated = [...signatories];
                    updated[0].designation = e.target.value;
                    setSignatories(updated);
                  }}
                  placeholder="Managing Director"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PAN *</label>
                <input
                  type="text"
                  maxLength={10}
                  required
                  value={signatories[0]?.pan || ''}
                  onChange={(e) => {
                    const updated = [...signatories];
                    updated[0].pan = e.target.value.toUpperCase();
                    setSignatories(updated);
                  }}
                  placeholder="ABCDE1234F"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={signatories[0]?.mobile || ''}
                  onChange={(e) => {
                    const updated = [...signatories];
                    updated[0].mobile = e.target.value;
                    setSignatories(updated);
                  }}
                  placeholder="9876543210"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={signatories[0]?.email || ''}
                  onChange={(e) => {
                    const updated = [...signatories];
                    updated[0].email = e.target.value;
                    setSignatories(updated);
                  }}
                  placeholder="rahul@example.com"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Authorization Type</label>
                <select
                  value={signatories[0]?.authorization_type || 'LETTER_OF_AUTHORIZATION'}
                  onChange={(e) => {
                    const updated = [...signatories];
                    updated[0].authorization_type = e.target.value;
                    setSignatories(updated);
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="BOARD_RESOLUTION">Board Resolution</option>
                  <option value="LETTER_OF_AUTHORIZATION">Letter of Authorization</option>
                  <option value="PARTNERSHIP_DEED">Partnership Deed Authorization</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PRINCIPAL PLACE OF BUSINESS */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 4 — Principal Place of Business</h3>
                <p className="text-xs text-slate-500">Address where primary business operations take place.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPrincipalPlace({
                    ...principalPlace,
                    state: business.state || 'Tamil Nadu',
                    district: business.district || 'Salem',
                    pincode: business.pincode || '636001',
                    jurisdiction: `${business.district || 'Salem'} Central Range-1`,
                    office_email: promoters[0]?.email || 'rahul@example.com',
                    office_mobile: promoters[0]?.mobile || '9876543210',
                  });
                  setSuccessMsg('Address location, state, district, PIN and contacts synced from Business & Promoter details!');
                }}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg border border-blue-200 text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Sync Location from Business</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Building / Plot Number</label>
                <input
                  type="text"
                  value={principalPlace.building_number || ''}
                  onChange={(e) => setPrincipalPlace({ ...principalPlace, building_number: e.target.value })}
                  placeholder="Plot No. 12"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Floor Number</label>
                <input
                  type="text"
                  value={principalPlace.floor_number || ''}
                  onChange={(e) => setPrincipalPlace({ ...principalPlace, floor_number: e.target.value })}
                  placeholder="Ground Floor"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Premises / Building Name *</label>
                <input
                  type="text"
                  required
                  value={principalPlace.premise_name}
                  onChange={(e) => setPrincipalPlace({ ...principalPlace, premise_name: e.target.value })}
                  placeholder="ABC Processing Complex"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Road / Street</label>
                <input
                  type="text"
                  value={principalPlace.road || ''}
                  onChange={(e) => setPrincipalPlace({ ...principalPlace, road: e.target.value })}
                  placeholder="Industrial Main Road"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Locality / Village *</label>
                <input
                  type="text"
                  required
                  value={principalPlace.locality}
                  onChange={(e) => setPrincipalPlace({ ...principalPlace, locality: e.target.value })}
                  placeholder="SIDCO Industrial Area"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={principalPlace.state}
                  onChange={(e) => setPrincipalPlace({ ...principalPlace, state: e.target.value })}
                  placeholder="Tamil Nadu"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">District *</label>
                <input
                  type="text"
                  required
                  value={principalPlace.district}
                  onChange={(e) => setPrincipalPlace({ ...principalPlace, district: e.target.value })}
                  placeholder="Salem"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PIN Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={principalPlace.pincode}
                  onChange={(e) => setPrincipalPlace({ ...principalPlace, pincode: e.target.value })}
                  placeholder="636001"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nature of Possession *</label>
                <select
                  value={principalPlace.nature_of_possession}
                  onChange={(e) => setPrincipalPlace({ ...principalPlace, nature_of_possession: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900"
                >
                  <option value="OWNED">OWNED</option>
                  <option value="RENTED">RENTED</option>
                  <option value="LEASED">LEASED</option>
                  <option value="CONSENTED">CONSENTED</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
            </div>

            {/* Dynamic Document Requirement Guide for Possession */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
              <span className="font-bold">Dynamic Premises Proof Requirement Guide:</span>
              {principalPlace.nature_of_possession === 'OWNED' && (
                <p className="mt-1">
                  For <strong>OWNED</strong> premises: Upload Property Tax Receipt, Electricity Bill, or Municipal Khata extract in Step 7.
                </p>
              )}
              {(principalPlace.nature_of_possession === 'RENTED' || principalPlace.nature_of_possession === 'LEASED') && (
                <p className="mt-1">
                  For <strong>{principalPlace.nature_of_possession}</strong> premises: Upload Valid Rent / Lease Agreement along with Landlord Electricity Bill / Ownership Proof in Step 7.
                </p>
              )}
              {principalPlace.nature_of_possession === 'CONSENTED' && (
                <p className="mt-1">
                  For <strong>CONSENTED</strong> premises: Upload Consent Letter / NOC along with Property Ownership Document in Step 7.
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: ADDITIONAL PLACE OF BUSINESS */}
        {currentStep === 5 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 5 — Additional Place of Business</h3>
                <p className="text-xs text-slate-500">Warehouses, godowns, branch offices, or retail outlets.</p>
              </div>
              <Building className="w-5 h-5 text-blue-600" />
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800">Do you have any additional place of business?</span>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="hasAdditional"
                    checked={hasAdditionalPlaces}
                    onChange={() => {
                      setHasAdditionalPlaces(true);
                      if (additionalPlaces.length === 0) addAdditionalPlace();
                    }}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>YES</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="hasAdditional"
                    checked={!hasAdditionalPlaces}
                    onChange={() => setHasAdditionalPlaces(false)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>NO</span>
                </label>
              </div>
            </div>

            {hasAdditionalPlaces && (
              <div className="space-y-4">
                {additionalPlaces.map((ap, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="font-bold text-slate-800">Additional Location #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeAdditionalPlace(idx)}
                        className="text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">Complete Address *</label>
                        <input
                          type="text"
                          required
                          value={ap.address}
                          onChange={(e) => {
                            const updated = [...additionalPlaces];
                            updated[idx].address = e.target.value;
                            setAdditionalPlaces(updated);
                          }}
                          placeholder="Warehouse Plot 44, SIPCOT, Salem"
                          className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Nature of Possession</label>
                        <select
                          value={ap.nature_of_possession}
                          onChange={(e) => {
                            const updated = [...additionalPlaces];
                            updated[idx].nature_of_possession = e.target.value;
                            setAdditionalPlaces(updated);
                          }}
                          className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="OWNED">OWNED</option>
                          <option value="RENTED">RENTED</option>
                          <option value="LEASED">LEASED</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Activity</label>
                        <input
                          type="text"
                          value={ap.business_activity || ''}
                          onChange={(e) => {
                            const updated = [...additionalPlaces];
                            updated[idx].business_activity = e.target.value;
                            setAdditionalPlaces(updated);
                          }}
                          placeholder="Warehouse / Godown"
                          className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addAdditionalPlace}
                  className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Additional Location</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: GOODS AND SERVICES */}
        {currentStep === 6 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 6 — Goods and Services Classification</h3>
                <p className="text-xs text-slate-500">Provide HSN (for Goods) or SAC (for Services) descriptions.</p>
              </div>
              <Package className="w-5 h-5 text-blue-600" />
            </div>

            <div className="flex items-center gap-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800">What does your business supply?</span>
              <div className="flex items-center gap-4">
                {(['GOODS', 'SERVICES', 'BOTH'] as const).map((t) => (
                  <label key={t} className="inline-flex items-center gap-1.5 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="supplyType"
                      checked={supplyType === t}
                      onChange={() => setSupplyType(t)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {goodsServices.map((gs, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-center">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Type</label>
                    <select
                      value={gs.type}
                      onChange={(e) => {
                        const updated = [...goodsServices];
                        updated[idx].type = e.target.value as 'GOODS' | 'SERVICES';
                        setGoodsServices(updated);
                      }}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="GOODS">GOODS (HSN)</option>
                      <option value="SERVICES">SERVICES (SAC)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Item Description *</label>
                    <input
                      type="text"
                      required
                      value={gs.description}
                      onChange={(e) => {
                        const updated = [...goodsServices];
                        updated[idx].description = e.target.value;
                        setGoodsServices(updated);
                      }}
                      placeholder="e.g. Packaged Snacks (Prototype Example)"
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-semibold text-slate-700">
                        {gs.type === 'GOODS' ? 'HSN Code' : 'SAC Code'} *
                      </label>
                      {goodsServices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGoodsService(idx)}
                          className="text-red-500 hover:text-red-700 text-[11px]"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={gs.hsn_sac_code}
                      onChange={(e) => {
                        const updated = [...goodsServices];
                        updated[idx].hsn_sac_code = e.target.value;
                        setGoodsServices(updated);
                      }}
                      placeholder="2106"
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono bg-white"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addGoodsService}
                className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: DOCUMENT UPLOAD */}
        {currentStep === 7 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 7 — Document Upload Checklist</h3>
                <p className="text-xs text-slate-500">Upload PDF, JPG, or PNG files (Max 5 MB each).</p>
              </div>
              <div className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1 rounded-full">
                Documents Uploaded:{' '}
                {app?.documents?.filter((d) => d.upload_status === 'UPLOADED').length || 0} /{' '}
                {requirements.length}
              </div>
            </div>

            <div className="space-y-4">
              {requirements.map((req) => {
                const uploadedDoc = app?.documents?.find((d) => d.document_type === req.document_type);
                const isUploaded = uploadedDoc && uploadedDoc.upload_status === 'UPLOADED';

                return (
                  <div
                    key={req.document_type}
                    className={`p-4 rounded-xl border transition-all ${
                      isUploaded ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{req.name}</span>
                          {req.required ? (
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                              REQUIRED
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                              OPTIONAL
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{req.description}</p>
                      </div>

                      {/* Status / Action */}
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {isUploaded ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-md flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{uploadedDoc.filename}</span>
                            </span>

                            <label className="cursor-pointer px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">
                              <span>Replace</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleFileUpload(req.document_type, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="cursor-pointer px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {uploadingDocType === req.document_type ? 'Uploading...' : 'Upload File'}
                            </span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileUpload(req.document_type, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 8: AADHAAR / CONTACT VERIFICATION */}
        {currentStep === 8 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 8 — Identity & Aadhaar Verification</h3>
                <p className="text-xs text-slate-500">Biometric / OTP simulated verification of authorized signatory.</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>

            <div className="max-w-md mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Simulated Aadhaar e-Sign & Authentication</h4>
                <p className="text-xs text-slate-500">
                  Authentication token for {promoters[0]?.name || 'Rahul Kumar'} (XXXX-XXXX-{promoters[0]?.aadhaar_last4 || '1234'})
                </p>
              </div>

              {!aadhaarVerified ? (
                <div className="space-y-3 pt-2">
                  <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-xs text-blue-800 text-center font-mono">
                    Development OTP: 123456
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Enter Aadhaar OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={aadhaarOtp}
                      onChange={(e) => setAadhaarOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center text-lg font-mono tracking-widest p-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (aadhaarOtp === '123456' || aadhaarOtp.length === 6 || aadhaarOtp === '') {
                        setAadhaarVerified(true);
                        setSuccessMsg('Aadhaar / Identity authenticated successfully.');
                      } else {
                        setErrorMsg('Invalid simulated OTP. Please enter 123456.');
                      }
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Verify Identity Token
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h5 className="font-bold text-xs text-emerald-900">Identity Verification Successful</h5>
                  <p className="text-[11px] text-emerald-700 font-mono">
                    Simulated Reference: UIDAI-MOCK-EKYC-{Date.now().toString().slice(-6)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 9: APPLICATION REVIEW */}
        {currentStep === 9 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 9 — Application Review Before Submission</h3>
                <p className="text-xs text-slate-500">Verify all mandatory sections and uploaded documents.</p>
              </div>
              <FileText className="w-5 h-5 text-blue-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Business Check */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">1. Business Details</span>
                  {business.legal_name && business.pan ? (
                    <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded text-[10px]">
                      ✓ COMPLETE
                    </span>
                  ) : (
                    <span className="text-red-700 bg-red-100 font-bold px-2 py-0.5 rounded text-[10px]">
                      ⚠ INCOMPLETE
                    </span>
                  )}
                </div>
                <p className="text-slate-600">Legal Name: <strong>{business.legal_name || 'Missing'}</strong></p>
                <p className="text-slate-600">PAN: <strong>{business.pan || 'Missing'}</strong></p>
                <p className="text-slate-600">Constitution: <strong>{business.constitution_of_business}</strong></p>
              </div>

              {/* Promoters Check */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">2. Promoter / Directors</span>
                  {promoters.length > 0 && promoters[0].name ? (
                    <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded text-[10px]">
                      ✓ COMPLETE ({promoters.length})
                    </span>
                  ) : (
                    <span className="text-red-700 bg-red-100 font-bold px-2 py-0.5 rounded text-[10px]">
                      ⚠ INCOMPLETE
                    </span>
                  )}
                </div>
                <p className="text-slate-600">Primary: <strong>{promoters[0]?.name || 'Missing'}</strong> ({promoters[0]?.role})</p>
                <p className="text-slate-600">Mobile: <strong>{promoters[0]?.mobile}</strong></p>
              </div>

              {/* Principal Place Check */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">3. Principal Place Address</span>
                  {principalPlace.premise_name && principalPlace.pincode ? (
                    <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded text-[10px]">
                      ✓ COMPLETE
                    </span>
                  ) : (
                    <span className="text-red-700 bg-red-100 font-bold px-2 py-0.5 rounded text-[10px]">
                      ⚠ INCOMPLETE
                    </span>
                  )}
                </div>
                <p className="text-slate-600">Premises: <strong>{principalPlace.premise_name}</strong></p>
                <p className="text-slate-600">Location: <strong>{principalPlace.district}, {principalPlace.state} - {principalPlace.pincode}</strong></p>
                <p className="text-slate-600">Possession: <strong>{principalPlace.nature_of_possession}</strong></p>
              </div>

              {/* Documents Check */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">4. Uploaded Documents</span>
                  {app?.documents && app.documents.length >= 3 ? (
                    <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded text-[10px]">
                      ✓ COMPLETE ({app.documents.length})
                    </span>
                  ) : (
                    <span className="text-orange-700 bg-orange-100 font-bold px-2 py-0.5 rounded text-[10px]">
                      ⚠ {app?.documents?.length || 0} / 4 Uploaded
                    </span>
                  )}
                </div>
                <ul className="space-y-1 text-slate-600">
                  {['PAN_CARD', 'AADHAAR_CARD', 'PASSPORT_PHOTO', 'PRINCIPAL_PLACE_PROOF'].map((dt) => {
                    const hasDoc = app?.documents?.some((d) => d.document_type === dt && d.upload_status === 'UPLOADED');
                    return (
                      <li key={dt} className="flex items-center gap-1.5">
                        {hasDoc ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                        <span>{dt.replace(/_/g, ' ')}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* STEP 10: FINAL MOCK OTP VERIFICATION */}
        {currentStep === 10 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 10 — Final Mock OTP Submission Verification</h3>
                <p className="text-xs text-slate-500">Simulate OTP dispatch to registered mobile before locking application.</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center space-y-2 text-xs text-blue-900">
                <p>A verification code has been simulated for your registered number:</p>
                <strong className="block text-sm font-mono">+91 {promoters[0]?.mobile || '9876543210'}</strong>
                <div className="mt-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 inline-block font-mono font-bold text-blue-700">
                  Default Mock OTP: 123456
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Enter 6-Digit Submission Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={finalOtp}
                  onChange={(e) => setFinalOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center text-xl font-mono tracking-widest p-2.5 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{submitting ? 'Submitting Application...' : 'Confirm & Submit Application'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 11: SUBMISSION ACKNOWLEDGEMENT */}
        {currentStep === 11 && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Application Submitted Successfully!</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your simulated GST registration application has been received and transitioned to <strong>SUBMITTED</strong> status.
              </p>
            </div>

            <div className="max-w-lg mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Application Number:</span>
                <strong className="text-blue-700">{app?.application_number}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Business Name:</span>
                <span className="font-bold text-slate-800">{business.legal_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Submission Timestamp:</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Simulated Status:</span>
                <span className="text-blue-600 font-bold">SUBMITTED (Pending Officer Scrutiny)</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
              <Link
                to={`/applicant/applications/${app?.id}`}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <Eye className="w-4 h-4" />
                <span>View Full Application & Timeline</span>
              </Link>

              <button
                type="button"
                onClick={() => alert(`Simulated Acknowledgement Receipt Downloaded for ${app?.application_number}`)}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Acknowledgement</span>
              </button>

              <Link
                to="/applicant/dashboard"
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Stepper Navigation Buttons Bottom */}
        {currentStep < 11 && (
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSaveDraft()}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSaveDraft(currentStep + 1);
                }}
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
