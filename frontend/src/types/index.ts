export type UserRole = 'APPLICANT' | 'OFFICER' | 'ADMIN';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_FOR_VALIDATION'
  | 'UNDER_REVIEW'
  | 'DOCUMENT_QUERY'
  | 'CLARIFICATION_RECEIVED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Business {
  id?: number;
  legal_name: string;
  trade_name?: string;
  business_name?: string;
  pan: string;
  gst_existing?: string;
  constitution_of_business: string;
  state: string;
  district: string;
  pincode: string;
  business_activity: string;
  reason_for_reg?: string;
  commencement_date?: string;
  primary_activity?: string;
}

export interface Promoter {
  id?: number;
  name: string;
  role: string;
  pan: string;
  aadhaar_masked?: string;
  aadhaar_last4: string;
  mobile: string;
  email: string;
  address: string;
  photo_path?: string;
}

export interface AuthorizedSignatory {
  id?: number;
  name: string;
  designation: string;
  mobile: string;
  email: string;
  pan: string;
  aadhaar_masked?: string;
  aadhaar_last4: string;
  authorization_type?: string;
  address?: string;
  is_same_as_promoter?: boolean;
  photo_path?: string;
}

export interface PrincipalPlace {
  id?: number;
  building_number?: string;
  floor_number?: string;
  premise_name: string;
  road?: string;
  locality: string;
  state: string;
  district: string;
  pincode: string;
  jurisdiction?: string;
  nature_of_possession: 'OWNED' | 'RENTED' | 'LEASED' | 'CONSENTED' | 'OTHER' | string;
  office_email?: string;
  office_mobile?: string;
}

export interface AdditionalPlace {
  id?: number;
  address: string;
  state: string;
  district: string;
  pincode: string;
  nature_of_possession: string;
  business_activity?: string;
}

export interface GoodsService {
  id?: number;
  type: 'GOODS' | 'SERVICES';
  description: string;
  hsn_sac_code: string;
}

export interface DocumentRequirement {
  id: number;
  document_type: string;
  name: string;
  description?: string;
  required: boolean;
  applicable_condition: string;
  allowed_file_types: string;
  max_size_mb: number;
}

export interface DocumentItem {
  id: number;
  application_id: number;
  requirement_id?: number;
  document_type: string;
  filename: string;
  stored_filename: string;
  file_size: number;
  mime_type: string;
  upload_status: 'NOT_UPLOADED' | 'UPLOADED';
  review_status: 'NOT_REVIEWED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'NEEDS_CORRECTION';
  officer_comment?: string;
  uploaded_at: string;
  reviewed_at?: string;
}

export interface QueryItem {
  id: number;
  application_id: number;
  officer_id: number;
  officer_name?: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'RESPONDED' | 'RESOLVED';
  applicant_response?: string;
  response_date?: string;
  created_at: string;
  updated_at: string;
}

export interface StatusHistoryItem {
  id: number;
  old_status?: string;
  new_status: string;
  changed_by: string;
  reason?: string;
  visible_to_applicant: boolean;
  created_at: string;
}

export interface ApplicationSummary {
  id: number;
  application_number: string;
  external_reference_id?: string;
  source_system: string;
  business_name: string;
  trade_name?: string;
  applicant_name: string;
  district: string;
  state: string;
  business_type: string;
  application_type: string;
  status: ApplicationStatus;
  risk_level: string;
  current_step: number;
  submission_date?: string;
  last_status_updated_at: string;
  assigned_officer_name?: string;
  mock_registration_ref?: string;
  created_at: string;
}

export interface ApplicationDetail {
  id: number;
  application_number: string;
  external_reference_id?: string;
  source_system: string;
  application_type?: string;
  applicant: {
    id: number;
    name: string;
    email: string;
    mobile: string;
  };
  business?: Business;
  promoters: Promoter[];
  authorized_signatories: AuthorizedSignatory[];
  principal_place?: PrincipalPlace;
  additional_places: AdditionalPlace[];
  goods_services: GoodsService[];
  documents: DocumentItem[];
  queries: QueryItem[];
  status_history: StatusHistoryItem[];
  status: ApplicationStatus;
  risk_level: string;
  current_step: number;
  submission_date?: string;
  last_status_updated_at: string;
  assigned_officer?: {
    id: number;
    name: string;
    email: string;
  };
  mock_registration_ref?: string;
  approval_remarks?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata_json?: any;
  created_at: string;
}
