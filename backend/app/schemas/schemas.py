from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field

# ----------------- AUTH SCHEMAS -----------------
class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: str
    mobile: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)
    otp: Optional[str] = "123456"

class UserLoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    mobile: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SendOtpRequest(BaseModel):
    mobile: str
    purpose: str = "REGISTRATION"

class VerifyOtpRequest(BaseModel):
    mobile: str
    otp: str
    purpose: str = "REGISTRATION"

class OtpResponse(BaseModel):
    success: bool
    message: str
    mock_otp_hint: Optional[str] = None

# ----------------- SECTION SCHEMAS -----------------
class BusinessSchema(BaseModel):
    legal_name: str
    trade_name: Optional[str] = None
    constitution_of_business: str
    pan: str
    reason_for_reg: Optional[str] = None
    commencement_date: Optional[str] = None
    business_activity: str
    primary_activity: Optional[str] = None
    state: str
    district: str
    pincode: str
    gst_existing: Optional[str] = None

class PromoterSchema(BaseModel):
    id: Optional[int] = None
    name: str
    role: str
    pan: str
    aadhaar_last4: str
    mobile: str
    email: str
    address: str
    photo_path: Optional[str] = None

class AuthorizedSignatorySchema(BaseModel):
    id: Optional[int] = None
    name: str
    designation: str
    mobile: str
    email: str
    pan: str
    aadhaar_last4: str
    authorization_type: Optional[str] = "LETTER_OF_AUTHORIZATION"
    address: Optional[str] = None
    photo_path: Optional[str] = None
    is_same_as_promoter: Optional[bool] = False

class PrincipalPlaceSchema(BaseModel):
    building_number: Optional[str] = None
    floor_number: Optional[str] = None
    premise_name: str
    road: Optional[str] = None
    locality: str
    state: str
    district: str
    pincode: str
    jurisdiction: Optional[str] = None
    nature_of_possession: str  # OWNED, RENTED, LEASED, CONSENTED, OTHER
    office_email: Optional[str] = None
    office_mobile: Optional[str] = None

class AdditionalPlaceSchema(BaseModel):
    id: Optional[int] = None
    address: str
    state: str
    district: str
    pincode: str
    nature_of_possession: str
    business_activity: Optional[str] = None

class GoodsServiceSchema(BaseModel):
    id: Optional[int] = None
    type: str  # GOODS, SERVICES
    description: str
    hsn_sac_code: str

# ----------------- DOCUMENT SCHEMAS -----------------
class DocumentResponse(BaseModel):
    id: int
    application_id: int
    requirement_id: Optional[int] = None
    document_type: str
    filename: str
    stored_filename: str
    file_size: int
    mime_type: str
    upload_status: str
    review_status: str
    officer_comment: Optional[str] = None
    uploaded_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DocumentRequirementResponse(BaseModel):
    id: int
    document_type: str
    name: str
    description: Optional[str] = None
    required: bool
    applicable_condition: str
    allowed_file_types: str
    max_size_mb: int

    class Config:
        from_attributes = True

class DocumentReviewRequest(BaseModel):
    review_status: str  # ACCEPTED, REJECTED, NEEDS_CORRECTION
    officer_comment: Optional[str] = None

# ----------------- QUERY SCHEMAS -----------------
class QueryCreateRequest(BaseModel):
    subject: str
    message: str
    response_deadline: Optional[str] = None

class QueryRespondRequest(BaseModel):
    applicant_response: str

class QueryResponse(BaseModel):
    id: int
    application_id: int
    officer_id: int
    officer_name: Optional[str] = None
    subject: str
    message: str
    status: str
    applicant_response: Optional[str] = None
    response_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ----------------- APPLICATION SCHEMAS -----------------
class StatusHistoryResponse(BaseModel):
    id: int
    old_status: Optional[str] = None
    new_status: str
    changed_by: str
    reason: Optional[str] = None
    visible_to_applicant: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SaveDraftApplicationRequest(BaseModel):
    current_step: Optional[int] = 1
    business: Optional[BusinessSchema] = None
    promoters: Optional[List[PromoterSchema]] = None
    authorized_signatories: Optional[List[AuthorizedSignatorySchema]] = None
    principal_place: Optional[PrincipalPlaceSchema] = None
    has_additional_places: Optional[bool] = False
    additional_places: Optional[List[AdditionalPlaceSchema]] = None
    supply_type: Optional[str] = "GOODS"  # GOODS, SERVICES, BOTH
    goods_services: Optional[List[GoodsServiceSchema]] = None

class ApplicationSubmitRequest(BaseModel):
    mock_otp: str = "123456"

class ApplicationApprovalRequest(BaseModel):
    remarks: Optional[str] = "Approved after thorough document and jurisdiction verification."

class ApplicationRejectionRequest(BaseModel):
    reason: str

class ApplicationStatusUpdateRequest(BaseModel):
    status: str
    reason: Optional[str] = None

class ApplicationSummaryResponse(BaseModel):
    id: int
    application_number: str
    external_reference_id: Optional[str] = None
    source_system: str
    business_name: str
    trade_name: Optional[str] = None
    applicant_name: str
    district: str
    state: str
    business_type: str
    application_type: str
    status: str
    risk_level: str
    current_step: int
    submission_date: Optional[datetime] = None
    last_status_updated_at: datetime
    assigned_officer_name: Optional[str] = None
    mock_registration_ref: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationDetailResponse(BaseModel):
    id: int
    application_number: str
    external_reference_id: Optional[str] = None
    source_system: str
    applicant: Dict[str, Any]
    business: Optional[Dict[str, Any]] = None
    promoters: List[Dict[str, Any]] = []
    authorized_signatories: List[Dict[str, Any]] = []
    principal_place: Optional[Dict[str, Any]] = None
    additional_places: List[Dict[str, Any]] = []
    goods_services: List[Dict[str, Any]] = []
    documents: List[DocumentResponse] = []
    queries: List[QueryResponse] = []
    status_history: List[StatusHistoryResponse] = []
    status: str
    risk_level: str
    current_step: int
    submission_date: Optional[datetime] = None
    last_status_updated_at: datetime
    assigned_officer: Optional[Dict[str, Any]] = None
    mock_registration_ref: Optional[str] = None
    approval_remarks: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ----------------- INTEGRATION SCHEMAS (SIH PORTAL) -----------------
class IntegrationApplicantPayload(BaseModel):
    name: str
    mobile: str
    email: str

class IntegrationBusinessPayload(BaseModel):
    legal_name: str
    trade_name: Optional[str] = None
    pan: str
    constitution: Optional[str] = "PRIVATE_LIMITED"
    business_activity: Optional[str] = "MANUFACTURER"
    state: str
    district: str
    pincode: str
    reason_for_reg: Optional[str] = "New Business"
    primary_activity: Optional[str] = None

class IntegrationPrincipalPlacePayload(BaseModel):
    address: Optional[str] = None
    premise_name: Optional[str] = None
    locality: Optional[str] = None
    state: str
    district: str
    pincode: str
    nature_of_possession: Optional[str] = "RENTED"

class IntegrationGoodsServicePayload(BaseModel):
    type: str = "GOODS"
    description: str
    hsn_sac_code: str = "DEMO"

class IntegrationPromoterPayload(BaseModel):
    name: str
    role: str = "Director"
    pan: str
    aadhaar_last4: str = "1234"
    mobile: str
    email: str
    address: str

class PrefillApplicationRequest(BaseModel):
    external_reference_id: str
    source_system: Optional[str] = "SIH26130"
    applicant: IntegrationApplicantPayload
    business: IntegrationBusinessPayload
    principal_place: Optional[IntegrationPrincipalPlacePayload] = None
    promoters: Optional[List[IntegrationPromoterPayload]] = None
    goods_services: Optional[List[IntegrationGoodsServicePayload]] = None

class PrefillResponse(BaseModel):
    success: bool
    application_number: str
    external_reference_id: str
    status: str
    prefilled_fields: int
    missing_fields: List[str]
    message: str

class IntegrationStatusResponse(BaseModel):
    application_number: str
    external_reference_id: Optional[str] = None
    status: str
    submission_date: Optional[datetime] = None
    last_updated_at: datetime
    mock_registration_ref: Optional[str] = None
    pending_actions: List[Dict[str, Any]] = []

class HeadlessDocumentPayload(BaseModel):
    document_type: str  # PAN_CARD, AADHAAR_CARD, PASSPORT_PHOTO, PRINCIPAL_PLACE_PROOF, etc.
    filename: Optional[str] = "document.pdf"
    file_content_base64: Optional[str] = None
    file_url: Optional[str] = None

class HeadlessSubmitRequest(BaseModel):
    external_reference_id: str
    source_system: Optional[str] = "SIH26130"
    applicant: IntegrationApplicantPayload
    business: IntegrationBusinessPayload
    principal_place: Optional[IntegrationPrincipalPlacePayload] = None
    promoters: Optional[List[IntegrationPromoterPayload]] = None
    goods_services: Optional[List[IntegrationGoodsServicePayload]] = None
    documents: Optional[List[HeadlessDocumentPayload]] = None
    auto_generate_mock_documents: Optional[bool] = True

class HeadlessSubmitResponse(BaseModel):
    success: bool
    application_number: str
    external_reference_id: str
    status: str
    submission_date: Optional[datetime] = None
    message: str
    tracking_url: str

# ----------------- AUDIT & NOTIFICATION SCHEMAS -----------------
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
