from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON, Float
)
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class UserRole(str, enum.Enum):
    APPLICANT = "APPLICANT"
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"

class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    PENDING_FOR_VALIDATION = "PENDING_FOR_VALIDATION"
    UNDER_REVIEW = "UNDER_REVIEW"
    DOCUMENT_QUERY = "DOCUMENT_QUERY"
    CLARIFICATION_RECEIVED = "CLARIFICATION_RECEIVED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"

class GoodsServiceType(str, enum.Enum):
    GOODS = "GOODS"
    SERVICES = "SERVICES"

class DocumentUploadStatus(str, enum.Enum):
    NOT_UPLOADED = "NOT_UPLOADED"
    UPLOADED = "UPLOADED"

class DocumentReviewStatus(str, enum.Enum):
    NOT_REVIEWED = "NOT_REVIEWED"
    UNDER_REVIEW = "UNDER_REVIEW"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    NEEDS_CORRECTION = "NEEDS_CORRECTION"

class QueryStatus(str, enum.Enum):
    OPEN = "OPEN"
    RESPONDED = "RESPONDED"
    RESOLVED = "RESOLVED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    mobile = Column(String(50), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="APPLICANT", nullable=False)  # APPLICANT, OFFICER, ADMIN
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    applicant_profile = relationship("Applicant", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

class Applicant(Base):
    __tablename__ = "applicants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    applicant_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    mobile = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="applicant_profile")
    businesses = relationship("Business", back_populates="applicant")
    applications = relationship("Application", back_populates="applicant")

class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("applicants.id"), nullable=False)
    legal_name = Column(String(255), nullable=False)
    trade_name = Column(String(255), nullable=True)
    business_name = Column(String(255), nullable=True)
    pan = Column(String(20), nullable=False)
    gst_existing = Column(String(100), nullable=True)
    constitution_of_business = Column(String(100), nullable=False)  # Proprietorship, Private Limited, etc.
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    pincode = Column(String(20), nullable=False)
    business_activity = Column(String(100), nullable=False)
    reason_for_reg = Column(String(100), nullable=True)
    commencement_date = Column(String(50), nullable=True)
    primary_activity = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    applicant = relationship("Applicant", back_populates="businesses")
    applications = relationship("Application", back_populates="business")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String(100), unique=True, index=True, nullable=False)
    external_reference_id = Column(String(100), unique=True, index=True, nullable=True)
    source_system = Column(String(100), default="PORTAL_DIRECT")
    applicant_id = Column(Integer, ForeignKey("applicants.id"), nullable=False)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    application_type = Column(String(100), default="NEW_REGISTRATION")
    status = Column(String(50), default="DRAFT", index=True)
    risk_level = Column(String(50), default="LOW")
    current_step = Column(Integer, default=1)
    submission_date = Column(DateTime, nullable=True)
    last_status_updated_at = Column(DateTime, default=datetime.utcnow)
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    mock_registration_ref = Column(String(100), nullable=True)
    approval_remarks = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    applicant = relationship("Applicant", back_populates="applications")
    business = relationship("Business", back_populates="applications")
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id])
    promoters = relationship("Promoter", back_populates="application", cascade="all, delete-orphan")
    authorized_signatories = relationship("AuthorizedSignatory", back_populates="application", cascade="all, delete-orphan")
    principal_places = relationship("PrincipalPlace", back_populates="application", cascade="all, delete-orphan")
    additional_places = relationship("AdditionalPlace", back_populates="application", cascade="all, delete-orphan")
    goods_services = relationship("GoodsService", back_populates="application", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    queries = relationship("Query", back_populates="application", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="application", cascade="all, delete-orphan")
    status_history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationStatusHistory.created_at.desc()")

class Promoter(Base):
    __tablename__ = "promoters"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(100), nullable=False)  # Director, Partner, Proprietor
    pan = Column(String(20), nullable=False)
    aadhaar_last4 = Column(String(10), nullable=False)
    mobile = Column(String(50), nullable=False)
    email = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)
    photo_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="promoters")

class AuthorizedSignatory(Base):
    __tablename__ = "authorized_signatories"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    name = Column(String(255), nullable=False)
    designation = Column(String(100), nullable=False)
    mobile = Column(String(50), nullable=False)
    email = Column(String(255), nullable=False)
    pan = Column(String(20), nullable=False)
    aadhaar_last4 = Column(String(10), nullable=False)
    authorization_type = Column(String(100), default="LETTER_OF_AUTHORIZATION")
    address = Column(Text, nullable=True)
    photo_path = Column(String(255), nullable=True)
    is_same_as_promoter = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="authorized_signatories")

class PrincipalPlace(Base):
    __tablename__ = "principal_places"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    building_number = Column(String(100), nullable=True)
    floor_number = Column(String(50), nullable=True)
    premise_name = Column(String(255), nullable=False)
    road = Column(String(255), nullable=True)
    locality = Column(String(255), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    pincode = Column(String(20), nullable=False)
    jurisdiction = Column(String(100), nullable=True)
    nature_of_possession = Column(String(50), nullable=False)  # OWNED, RENTED, LEASED, CONSENTED, OTHER
    office_email = Column(String(255), nullable=True)
    office_mobile = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="principal_places")

class AdditionalPlace(Base):
    __tablename__ = "additional_places"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    address = Column(Text, nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    pincode = Column(String(20), nullable=False)
    nature_of_possession = Column(String(50), nullable=False)
    business_activity = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="additional_places")

class GoodsService(Base):
    __tablename__ = "goods_services"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    type = Column(String(20), nullable=False)  # GOODS, SERVICES
    description = Column(String(255), nullable=False)
    hsn_sac_code = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="goods_services")

class DocumentRequirement(Base):
    __tablename__ = "document_requirements"

    id = Column(Integer, primary_key=True, index=True)
    document_type = Column(String(100), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    required = Column(Boolean, default=True)
    applicable_condition = Column(String(100), default="ALL")  # ALL, OWNED, RENTED, LEASED, CONSENTED, OPTIONAL
    allowed_file_types = Column(String(100), default="PDF,JPG,JPEG,PNG")
    max_size_mb = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    requirement_id = Column(Integer, ForeignKey("document_requirements.id"), nullable=True)
    document_type = Column(String(100), nullable=False)  # PAN_CARD, AADHAAR_CARD, PASSPORT_PHOTO, BANK_PROOF, PRINCIPAL_PLACE_PROOF
    filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    upload_status = Column(String(50), default="UPLOADED")  # NOT_UPLOADED, UPLOADED
    review_status = Column(String(50), default="NOT_REVIEWED")  # NOT_REVIEWED, UNDER_REVIEW, ACCEPTED, REJECTED, NEEDS_CORRECTION
    officer_comment = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    application = relationship("Application", back_populates="documents")
    requirement = relationship("DocumentRequirement")

class Query(Base):
    __tablename__ = "queries"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(50), default="OPEN")  # OPEN, RESPONDED, RESOLVED
    applicant_response = Column(Text, nullable=True)
    response_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="queries")
    officer = relationship("User", foreign_keys=[officer_id])

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    inspection_required = Column(Boolean, default=False)
    inspection_date = Column(String(50), nullable=True)
    inspection_time = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    status = Column(String(50), default="SCHEDULED")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="inspections")

class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by = Column(String(100), default="SYSTEM")
    reason = Column(Text, nullable=True)
    visible_to_applicant = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="status_history")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="INFO")  # INFO, SUCCESS, WARNING, ERROR
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

class IntegrationRequest(Base):
    __tablename__ = "integration_requests"

    id = Column(Integer, primary_key=True, index=True)
    source_system = Column(String(100), nullable=False)
    endpoint = Column(String(255), nullable=False)
    request_id = Column(String(100), nullable=True)
    external_reference_id = Column(String(100), nullable=True)
    response_code = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
