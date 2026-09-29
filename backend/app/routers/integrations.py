import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_api_key, get_password_hash
from app.models.models import (
    User, UserRole, Applicant, Business, Application, ApplicationStatus,
    Promoter, AuthorizedSignatory, PrincipalPlace, AdditionalPlace,
    GoodsService, DocumentRequirement, Document, IntegrationRequest
)
from app.schemas.schemas import (
    PrefillApplicationRequest, PrefillResponse,
    IntegrationStatusResponse, ApplicationDetailResponse,
    HeadlessSubmitRequest, HeadlessSubmitResponse
)
from app.services.application_service import (
    generate_application_number, transition_status,
    validate_application_for_submission
)
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/integrations/v1", tags=["SIH Integration APIs"])

@router.get("/schema")
def get_integration_schema():
    """
    Returns the dynamic input schema for GST registration so that external portals
    can dynamically render the input fields and submit applications programmatically.
    """
    return {
        "portal": "Mock GST Registration Portal (SIH26130)",
        "version": "1.0.0",
        "integration_methods": [
            {
                "method": "METHOD_1_PREFILL_AND_REDIRECT",
                "description": "Prefills draft application via API, then redirects applicant to Mock GST UI to complete documents and submit.",
                "endpoint": "POST /api/integrations/v1/applications/prefill"
            },
            {
                "method": "METHOD_2_HEADLESS_AUTOMATED",
                "description": "100% Automated / Headless submission. Main website takes all inputs dynamically, stores in local DB, submits directly to Mock GST API without requiring user to visit Mock GST UI.",
                "endpoint": "POST /api/integrations/v1/applications/headless-submit"
            }
        ],
        "headers_required": {
            "Content-Type": "application/json",
            "X-API-Key": "gst_sih26130_secret_api_key_mock_2026"
        },
        "sections": [
            {
                "id": "applicant",
                "title": "Primary Applicant / Authorized Person",
                "fields": [
                    {"name": "name", "label": "Full Name", "type": "text", "required": True, "placeholder": "Rahul Kumar"},
                    {"name": "email", "label": "Email Address", "type": "email", "required": True, "placeholder": "rahul@example.com"},
                    {"name": "mobile", "label": "Mobile Number (10 digits)", "type": "tel", "required": True, "placeholder": "9876543210", "pattern": "^[6-9][0-9]{9}$"}
                ]
            },
            {
                "id": "business",
                "title": "Business Entity Details",
                "fields": [
                    {"name": "legal_name", "label": "Legal Name of Business", "type": "text", "required": True, "placeholder": "ABC Foods Private Limited"},
                    {"name": "trade_name", "label": "Trade Name", "type": "text", "required": False, "placeholder": "ABC Foods"},
                    {"name": "pan", "label": "Permanent Account Number (PAN)", "type": "text", "required": True, "placeholder": "ABCDE1234F", "pattern": "^[A-Z]{5}[0-9]{4}[A-Z]{1}$"},
                    {
                        "name": "constitution", "label": "Constitution of Business", "type": "select", "required": True, "default": "PRIVATE_LIMITED",
                        "options": [
                            {"value": "PROPRIETORSHIP", "label": "Proprietorship"},
                            {"value": "PARTNERSHIP", "label": "Partnership"},
                            {"value": "PRIVATE_LIMITED", "label": "Private Limited Company"},
                            {"value": "PUBLIC_LIMITED", "label": "Public Limited Company"},
                            {"value": "LLP", "label": "Limited Liability Partnership (LLP)"},
                            {"value": "SOCIETY_CLUB_TRUST_AOP", "label": "Society / Club / Trust / AOP"}
                        ]
                    },
                    {
                        "name": "business_activity", "label": "Business Activity", "type": "select", "required": True, "default": "MANUFACTURER",
                        "options": [
                            {"value": "MANUFACTURER", "label": "Manufacturer"},
                            {"value": "WHOLESALE_TRADING", "label": "Wholesale Trading"},
                            {"value": "RETAIL_BUSINESS", "label": "Retail Business"},
                            {"value": "SERVICE_PROVISION", "label": "Service Provision"},
                            {"value": "IMPORT_EXPORT", "label": "Export / Import"},
                            {"value": "WAREHOUSING", "label": "Warehouse / Depot"}
                        ]
                    },
                    {"name": "primary_activity", "label": "Primary Activity Description", "type": "text", "required": False, "placeholder": "Food Manufacturing & Processing"},
                    {"name": "state", "label": "State", "type": "text", "required": True, "placeholder": "Tamil Nadu"},
                    {"name": "district", "label": "District", "type": "text", "required": True, "placeholder": "Salem"},
                    {"name": "pincode", "label": "PIN Code", "type": "text", "required": True, "placeholder": "636001", "pattern": "^[1-9][0-9]{5}$"}
                ]
            },
            {
                "id": "principal_place",
                "title": "Principal Place of Business",
                "fields": [
                    {"name": "premise_name", "label": "Building / Premise Name", "type": "text", "required": True, "placeholder": "ABC Food Processing Complex"},
                    {"name": "locality", "label": "Locality / Industrial Area", "type": "text", "required": True, "placeholder": "SIDCO Industrial Estate"},
                    {"name": "state", "label": "State", "type": "text", "required": True, "placeholder": "Tamil Nadu"},
                    {"name": "district", "label": "District", "type": "text", "required": True, "placeholder": "Salem"},
                    {"name": "pincode", "label": "PIN Code", "type": "text", "required": True, "placeholder": "636001", "pattern": "^[1-9][0-9]{5}$"},
                    {
                        "name": "nature_of_possession", "label": "Nature of Possession", "type": "select", "required": True, "default": "RENTED",
                        "options": [
                            {"value": "OWNED", "label": "Owned"},
                            {"value": "RENTED", "label": "Rented"},
                            {"value": "LEASED", "label": "Leased"},
                            {"value": "CONSENTED", "label": "Consent / Shared"}
                        ]
                    }
                ]
            },
            {
                "id": "promoters",
                "title": "Promoters / Partners / Directors",
                "is_array": True,
                "fields": [
                    {"name": "name", "label": "Promoter Full Name", "type": "text", "required": True, "placeholder": "Rahul Kumar"},
                    {"name": "role", "label": "Designation / Role", "type": "text", "required": True, "placeholder": "Director"},
                    {"name": "pan", "label": "Director PAN", "type": "text", "required": True, "placeholder": "ABCDE1234F"},
                    {"name": "aadhaar_last4", "label": "Aadhaar Last 4 Digits", "type": "text", "required": True, "placeholder": "1234", "pattern": "^[0-9]{4}$"},
                    {"name": "mobile", "label": "Mobile Number", "type": "tel", "required": True, "placeholder": "9876543210"},
                    {"name": "email", "label": "Email Address", "type": "email", "required": True, "placeholder": "rahul@example.com"},
                    {"name": "address", "label": "Residential Address", "type": "text", "required": True, "placeholder": "12 Gandhi Nagar, Salem"}
                ]
            },
            {
                "id": "goods_services",
                "title": "Goods & Services (HSN / SAC)",
                "is_array": True,
                "fields": [
                    {
                        "name": "type", "label": "Classification Type", "type": "select", "required": True, "default": "GOODS",
                        "options": [
                            {"value": "GOODS", "label": "Goods (HSN)"},
                            {"value": "SERVICES", "label": "Services (SAC)"}
                        ]
                    },
                    {"name": "description", "label": "Goods / Services Description", "type": "text", "required": True, "placeholder": "Packaged Snack Foods"},
                    {"name": "hsn_sac_code", "label": "HSN / SAC Code", "type": "text", "required": True, "placeholder": "2106"}
                ]
            },
            {
                "id": "documents",
                "title": "Mandatory Supporting Documents",
                "is_array": True,
                "note": "In Method 2 Headless, if files are omitted, mock verified documents are auto-generated so filing succeeds seamlessly.",
                "fields": [
                    {"name": "PAN_CARD", "label": "Company / Applicant PAN Card", "type": "file", "required": False},
                    {"name": "AADHAAR_CARD", "label": "Promoter Aadhaar Card", "type": "file", "required": False},
                    {"name": "PASSPORT_PHOTO", "label": "Promoter Passport Size Photo", "type": "file", "required": False},
                    {"name": "PRINCIPAL_PLACE_PROOF", "label": "Electricity Bill / Rent Agreement", "type": "file", "required": False}
                ]
            }
        ]
    }

def record_integration_request(
    db: Session,
    endpoint: str,
    source_system: str,
    ext_id: Optional[str],
    code: int,
    status_str: str,
    req_id: Optional[str] = None
):
    try:
        req = IntegrationRequest(
            source_system=source_system,
            endpoint=endpoint,
            request_id=req_id,
            external_reference_id=ext_id,
            response_code=code,
            status=status_str
        )
        db.add(req)
        db.commit()
    except Exception as e:
        print(f"Error logging integration request: {e}")
        db.rollback()

@router.post("/applications/prefill", response_model=PrefillResponse)
def prefill_application(
    req: PrefillApplicationRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    # 1. Check idempotency / existing application by external_reference_id
    existing_app = db.query(Application).filter(Application.external_reference_id == req.external_reference_id).first()
    if existing_app:
        record_integration_request(
            db, "/applications/prefill", req.source_system or "SIH26130",
            req.external_reference_id, 200, "IDEMPOTENT_HIT", idempotency_key
        )
        is_valid, missing = validate_application_for_submission(existing_app)
        return {
            "success": True,
            "application_number": existing_app.application_number,
            "external_reference_id": existing_app.external_reference_id,
            "status": existing_app.status,
            "prefilled_fields": 15,
            "missing_fields": missing,
            "message": "Existing application retrieved via external_reference_id idempotency."
        }

    # 2. Get or create Applicant User
    user = db.query(User).filter(User.email == req.applicant.email.lower()).first()
    if not user:
        user = User(
            name=req.applicant.name,
            email=req.applicant.email.lower(),
            mobile=req.applicant.mobile,
            password_hash=get_password_hash("Applicant@123"),  # Default password for pre-filled user
            role=UserRole.APPLICANT,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    applicant = db.query(Applicant).filter(Applicant.user_id == user.id).first()
    if not applicant:
        applicant = Applicant(
            user_id=user.id,
            applicant_name=req.applicant.name,
            email=req.applicant.email.lower(),
            mobile=req.applicant.mobile
        )
        db.add(applicant)
        db.commit()
        db.refresh(applicant)

    # 3. Create Business Record
    business = Business(
        applicant_id=applicant.id,
        legal_name=req.business.legal_name,
        trade_name=req.business.trade_name or req.business.legal_name,
        business_name=req.business.legal_name,
        pan=req.business.pan.upper(),
        constitution_of_business=req.business.constitution or "Private Limited Company",
        state=req.business.state,
        district=req.business.district,
        pincode=req.business.pincode,
        business_activity=req.business.business_activity or "Manufacturer",
        reason_for_reg=req.business.reason_for_reg or "New Business",
        primary_activity=req.business.primary_activity or "Food Manufacturing"
    )
    db.add(business)
    db.commit()
    db.refresh(business)

    # 4. Create Application in DRAFT status
    app_num = generate_application_number(db)
    app = Application(
        application_number=app_num,
        external_reference_id=req.external_reference_id,
        source_system=req.source_system or "SIH26130",
        applicant_id=applicant.id,
        business_id=business.id,
        application_type="NEW_REGISTRATION",
        status=ApplicationStatus.DRAFT,
        current_step=4
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    prefilled_count = 8

    # 5. Add Principal Place if supplied
    if req.principal_place:
        pp = PrincipalPlace(
            application_id=app.id,
            building_number="Plot 12",
            premise_name=req.principal_place.premise_name or req.principal_place.address or "Main Facility",
            locality=req.principal_place.locality or "Industrial Area",
            state=req.principal_place.state,
            district=req.principal_place.district,
            pincode=req.principal_place.pincode,
            nature_of_possession=req.principal_place.nature_of_possession or "RENTED",
            office_email=req.applicant.email,
            office_mobile=req.applicant.mobile
        )
        db.add(pp)
        prefilled_count += 5

    # 6. Add Promoters if supplied
    if req.promoters:
        for p in req.promoters:
            p_obj = Promoter(
                application_id=app.id,
                name=p.name,
                role=p.role,
                pan=p.pan.upper(),
                aadhaar_last4=p.aadhaar_last4[-4:] if len(p.aadhaar_last4) >= 4 else "1234",
                mobile=p.mobile,
                email=p.email,
                address=p.address
            )
            db.add(p_obj)
            prefilled_count += 4

    # 7. Add Goods/Services if supplied
    if req.goods_services:
        for gs in req.goods_services:
            gs_obj = GoodsService(
                application_id=app.id,
                type=gs.type,
                description=gs.description,
                hsn_sac_code=gs.hsn_sac_code
            )
            db.add(gs_obj)
            prefilled_count += 2

    # 8. Ensure Authorized Signatory exists
    if req.promoters and len(req.promoters) > 0:
        first_p = req.promoters[0]
        sig = AuthorizedSignatory(
            application_id=app.id,
            name=first_p.name,
            designation="Director / Authorized Signatory",
            mobile=first_p.mobile,
            email=first_p.email,
            pan=first_p.pan.upper(),
            aadhaar_last4=first_p.aadhaar_last4[-4:] if len(first_p.aadhaar_last4) >= 4 else "1234",
            authorization_type="BOARD_RESOLUTION",
            address=req.principal_place.premise_name if req.principal_place else "Main Premises",
            is_same_as_promoter=True
        )
        db.add(sig)
        prefilled_count += 3
    else:
        sig = AuthorizedSignatory(
            application_id=app.id,
            name=req.applicant.name,
            designation="Proprietor / Authorized Signatory",
            mobile=req.applicant.mobile,
            email=req.applicant.email,
            pan=req.business.pan.upper(),
            aadhaar_last4="1234",
            authorization_type="LETTER_OF_AUTHORIZATION",
            address=req.principal_place.premise_name if req.principal_place else "Main Premises",
            is_same_as_promoter=True
        )
        db.add(sig)
        prefilled_count += 3

    db.commit()

    # Initial status history & audit log
    transition_status(
        db=db,
        application=app,
        new_status=ApplicationStatus.DRAFT,
        changed_by=f"SIH API ({req.source_system})",
        reason=f"Application pre-filled automatically via external reference {req.external_reference_id}."
    )

    record_integration_request(
        db, "/applications/prefill", req.source_system or "SIH26130",
        req.external_reference_id, 201, "CREATED", idempotency_key
    )

    is_valid, missing = validate_application_for_submission(app)

    return {
        "success": True,
        "application_number": app.application_number,
        "external_reference_id": app.external_reference_id,
        "status": app.status,
        "prefilled_fields": prefilled_count,
        "missing_fields": missing,
        "message": "GST registration application prefilled successfully from SIH Portal."
    }

@router.post("/applications/headless-submit", response_model=HeadlessSubmitResponse)
def headless_submit_application(
    req: HeadlessSubmitRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """
    Method 2: 100% Automated / Headless Submission.
    Takes inputs dynamically from the external/main portal, creates full application,
    creates applicant, business, principal place, promoters, goods/services, and verified docs,
    persists into database, and marks directly as SUBMITTED for Officer Scrutiny.
    """
    # 1. Check idempotency / existing application by external_reference_id
    existing_app = db.query(Application).filter(Application.external_reference_id == req.external_reference_id).first()
    if existing_app:
        record_integration_request(
            db, "/applications/headless-submit", req.source_system or "SIH26130",
            req.external_reference_id, 200, "IDEMPOTENT_HIT", idempotency_key
        )
        return {
            "success": True,
            "application_number": existing_app.application_number,
            "external_reference_id": existing_app.external_reference_id,
            "status": existing_app.status,
            "submission_date": existing_app.submission_date,
            "message": "Existing application retrieved via external_reference_id idempotency.",
            "tracking_url": f"/api/integrations/v1/applications/{existing_app.application_number}/status"
        }

    # 2. Get or create Applicant User
    user = db.query(User).filter(User.email == req.applicant.email.lower()).first()
    if not user:
        user = User(
            name=req.applicant.name,
            email=req.applicant.email.lower(),
            mobile=req.applicant.mobile,
            password_hash=get_password_hash("Applicant@123"),
            role=UserRole.APPLICANT,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    applicant = db.query(Applicant).filter(Applicant.user_id == user.id).first()
    if not applicant:
        applicant = Applicant(
            user_id=user.id,
            applicant_name=req.applicant.name,
            email=req.applicant.email.lower(),
            mobile=req.applicant.mobile
        )
        db.add(applicant)
        db.commit()
        db.refresh(applicant)

    # 3. Create Business Record
    business = Business(
        applicant_id=applicant.id,
        legal_name=req.business.legal_name,
        trade_name=req.business.trade_name or req.business.legal_name,
        business_name=req.business.legal_name,
        pan=req.business.pan.upper(),
        constitution_of_business=req.business.constitution or "Private Limited Company",
        state=req.business.state,
        district=req.business.district,
        pincode=req.business.pincode,
        business_activity=req.business.business_activity or "Manufacturer",
        reason_for_reg=req.business.reason_for_reg or "New Business",
        primary_activity=req.business.primary_activity or "Food Manufacturing"
    )
    db.add(business)
    db.commit()
    db.refresh(business)

    # 4. Create Application directly in SUBMITTED status
    app_num = generate_application_number(db)
    submission_now = datetime.utcnow()
    app = Application(
        application_number=app_num,
        external_reference_id=req.external_reference_id,
        source_system=req.source_system or "SIH26130",
        applicant_id=applicant.id,
        business_id=business.id,
        application_type="NEW_REGISTRATION",
        status=ApplicationStatus.SUBMITTED,
        current_step=11,
        submission_date=submission_now,
        risk_level="LOW"
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    # 5. Principal Place
    if req.principal_place:
        pp = PrincipalPlace(
            application_id=app.id,
            building_number="Plot 12",
            premise_name=req.principal_place.premise_name or req.principal_place.address or "Main Facility",
            locality=req.principal_place.locality or "Industrial Area",
            state=req.principal_place.state,
            district=req.principal_place.district,
            pincode=req.principal_place.pincode,
            nature_of_possession=req.principal_place.nature_of_possession or "RENTED",
            office_email=req.applicant.email,
            office_mobile=req.applicant.mobile
        )
        db.add(pp)

    # 6. Promoters & Authorized Signatory
    first_promoter = None
    if req.promoters:
        for p in req.promoters:
            p_obj = Promoter(
                application_id=app.id,
                name=p.name,
                role=p.role,
                pan=p.pan.upper(),
                aadhaar_last4=p.aadhaar_last4[-4:] if len(p.aadhaar_last4) >= 4 else "1234",
                mobile=p.mobile,
                email=p.email,
                address=p.address
            )
            db.add(p_obj)
            if not first_promoter:
                first_promoter = p

    sig_name = first_promoter.name if first_promoter else req.applicant.name
    sig_pan = first_promoter.pan if first_promoter else req.business.pan
    sig_mobile = first_promoter.mobile if first_promoter else req.applicant.mobile
    sig_email = first_promoter.email if first_promoter else req.applicant.email
    sig_aadhaar = first_promoter.aadhaar_last4 if first_promoter else "1234"

    signatory = AuthorizedSignatory(
        application_id=app.id,
        name=sig_name,
        designation="Managing Director / Authorized Signatory",
        mobile=sig_mobile,
        email=sig_email,
        pan=sig_pan,
        aadhaar_last4=sig_aadhaar,
        authorization_type="BOARD_RESOLUTION",
        address=req.principal_place.premise_name if req.principal_place else "Main Premises",
        is_same_as_promoter=True
    )
    db.add(signatory)

    # 7. Goods/Services
    if req.goods_services:
        for gs in req.goods_services:
            gs_obj = GoodsService(
                application_id=app.id,
                type=gs.type,
                description=gs.description,
                hsn_sac_code=gs.hsn_sac_code
            )
            db.add(gs_obj)
    else:
        db.add(GoodsService(
            application_id=app.id,
            type="GOODS",
            description="Industrial Manufactured Products",
            hsn_sac_code="2106"
        ))

    # 8. Mandatory Documents handling
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    required_types = ["PAN_CARD", "AADHAAR_CARD", "PASSPORT_PHOTO", "PRINCIPAL_PLACE_PROOF"]
    uploaded_types = set()

    if req.documents:
        for doc_item in req.documents:
            doc_type = doc_item.document_type
            stored_filename = f"headless_{app.id}_{uuid.uuid4().hex[:8]}.pdf"
            target_path = os.path.join(settings.UPLOAD_DIR, stored_filename)
            with open(target_path, "wb") as f:
                if doc_item.file_content_base64:
                    import base64
                    try:
                        f.write(base64.b64decode(doc_item.file_content_base64))
                    except Exception:
                        f.write(b"%PDF-1.4 Mock Uploaded Document from Main Portal")
                else:
                    f.write(b"%PDF-1.4 Mock Uploaded Document from Main Portal")

            d_obj = Document(
                application_id=app.id,
                document_type=doc_type,
                filename=doc_item.filename or f"{doc_type.lower()}.pdf",
                stored_filename=stored_filename,
                file_path=target_path,
                mime_type="application/pdf",
                file_size=1024,
                upload_status="UPLOADED",
                review_status="UNDER_REVIEW",
                uploaded_at=submission_now
            )
            db.add(d_obj)
            uploaded_types.add(doc_type)

    if req.auto_generate_mock_documents:
        for r_type in required_types:
            if r_type not in uploaded_types:
                stored_filename = f"mock_{app.id}_{r_type.lower()}.pdf"
                target_path = os.path.join(settings.UPLOAD_DIR, stored_filename)
                with open(target_path, "wb") as f:
                    f.write(f"%PDF-1.4 Mock Document for {r_type} generated automatically via Headless API".encode("utf-8"))

                d_obj = Document(
                    application_id=app.id,
                    document_type=r_type,
                    filename=f"{r_type.lower()}_verified.pdf",
                    stored_filename=stored_filename,
                    file_path=target_path,
                    mime_type="application/pdf",
                    file_size=2048,
                    upload_status="UPLOADED",
                    review_status="UNDER_REVIEW",
                    uploaded_at=submission_now
                )
                db.add(d_obj)

    db.commit()

    # Initial status history & audit log
    transition_status(
        db=db,
        application=app,
        new_status=ApplicationStatus.SUBMITTED,
        changed_by=f"SIH Headless API ({req.source_system})",
        reason=f"100% Automated Headless submission from Main Portal (Ref: {req.external_reference_id})."
    )

    record_integration_request(
        db, "/applications/headless-submit", req.source_system or "SIH26130",
        req.external_reference_id, 201, "SUBMITTED_HEADLESS", idempotency_key
    )

    return {
        "success": True,
        "application_number": app.application_number,
        "external_reference_id": app.external_reference_id,
        "status": app.status,
        "submission_date": app.submission_date,
        "message": "GST Registration application submitted 100% headlessly and routed to Officer Scrutiny queue.",
        "tracking_url": f"/api/integrations/v1/applications/{app.application_number}/status"
    }

@router.post("/applications/{application_number}/documents")
async def upload_integration_document(
    application_number: str,
    document_type: str = Form(...),
    external_document_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.application_number == application_number).first()
    if not app:
        raise HTTPException(status_code=404, detail=f"Application {application_number} not found")

    allowed_types = ["PAN_CARD", "AADHAAR_CARD", "PASSPORT_PHOTO", "BANK_PROOF", "PRINCIPAL_PLACE_PROOF", "SUPPORTING_DOCUMENT"]
    if document_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid document_type '{document_type}'. Allowed: {', '.join(allowed_types)}")

    ext = os.path.splitext(file.filename)[1].lower()
    content = await file.read()
    file_size = len(content)

    stored_filename = f"int_doc_{app.id}_{uuid.uuid4().hex[:8]}{ext}"
    target_path = os.path.join(settings.UPLOAD_DIR, stored_filename)
    with open(target_path, "wb") as f:
        f.write(content)

    existing = db.query(Document).filter(
        Document.application_id == app.id,
        Document.document_type == document_type
    ).first()

    if existing:
        existing.filename = file.filename
        existing.stored_filename = stored_filename
        existing.file_path = target_path
        existing.mime_type = file.content_type or "application/octet-stream"
        existing.file_size = file_size
        existing.upload_status = "UPLOADED"
        existing.review_status = "UNDER_REVIEW"
        existing.uploaded_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        doc = existing
    else:
        doc = Document(
            application_id=app.id,
            document_type=document_type,
            filename=file.filename,
            stored_filename=stored_filename,
            file_path=target_path,
            mime_type=file.content_type or "application/octet-stream",
            file_size=file_size,
            upload_status="UPLOADED",
            review_status="UNDER_REVIEW",
            uploaded_at=datetime.utcnow()
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

    record_integration_request(
        db, f"/applications/{application_number}/documents", app.source_system,
        app.external_reference_id, 200, "DOC_UPLOADED"
    )

    return {
        "success": True,
        "document_id": doc.id,
        "document_type": doc.document_type,
        "filename": doc.filename,
        "external_document_id": external_document_id,
        "upload_status": doc.upload_status
    }

@router.post("/applications/{application_number}/submit")
def submit_integration_application(
    application_number: str,
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.application_number == application_number).first()
    if not app:
        raise HTTPException(status_code=404, detail=f"Application {application_number} not found")

    is_valid, missing = validate_application_for_submission(app)
    if not is_valid:
        record_integration_request(
            db, f"/applications/{application_number}/submit", app.source_system,
            app.external_reference_id, 400, "VALIDATION_FAILED"
        )
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "message": "Cannot submit incomplete application through API.",
                "missing_fields": missing
            }
        )

    transition_status(
        db=db,
        application=app,
        new_status=ApplicationStatus.SUBMITTED,
        changed_by=f"SIH API ({app.source_system})",
        reason="Application submitted programmatically through SIH Integration API."
    )

    record_integration_request(
        db, f"/applications/{application_number}/submit", app.source_system,
        app.external_reference_id, 200, "SUBMITTED"
    )

    return {
        "success": True,
        "message": "GST Application submitted successfully via Integration API.",
        "application_number": app.application_number,
        "external_reference_id": app.external_reference_id,
        "status": app.status,
        "submission_date": app.submission_date
    }

@router.get("/applications/{application_number}/status", response_model=IntegrationStatusResponse)
def get_integration_application_status(
    application_number: str,
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        (Application.application_number == application_number) | (Application.external_reference_id == application_number)
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail=f"Application '{application_number}' not found")

    pending_actions = []
    if app.status == ApplicationStatus.DOCUMENT_QUERY:
        open_queries = db.query(Query).filter(Query.application_id == app.id, Query.status == "OPEN").all()
        for q in open_queries:
            pending_actions.append({
                "type": "DOCUMENT_QUERY",
                "query_id": q.id,
                "subject": q.subject,
                "message": q.message
            })

    return {
        "application_number": app.application_number,
        "external_reference_id": app.external_reference_id,
        "status": app.status,
        "submission_date": app.submission_date,
        "last_updated_at": app.last_status_updated_at,
        "mock_registration_ref": app.mock_registration_ref,
        "pending_actions": pending_actions
    }

@router.get("/applications/{application_number}")
def get_complete_integration_application(
    application_number: str,
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        (Application.application_number == application_number) | (Application.external_reference_id == application_number)
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail=f"Application '{application_number}' not found")

    b = app.business
    return {
        "application_number": app.application_number,
        "external_reference_id": app.external_reference_id,
        "source_system": app.source_system,
        "status": app.status,
        "risk_level": app.risk_level,
        "submission_date": app.submission_date,
        "last_updated_at": app.last_status_updated_at,
        "mock_registration_ref": app.mock_registration_ref,
        "approval_remarks": app.approval_remarks,
        "rejection_reason": app.rejection_reason,
        "applicant": {
            "name": app.applicant.applicant_name,
            "email": app.applicant.email,
            "mobile": app.applicant.mobile
        },
        "business": {
            "legal_name": b.legal_name if b else "",
            "trade_name": b.trade_name if b else "",
            "pan": b.pan if b else "",
            "constitution": b.constitution_of_business if b else "",
            "business_activity": b.business_activity if b else "",
            "state": b.state if b else "",
            "district": b.district if b else "",
            "pincode": b.pincode if b else ""
        } if b else None,
        "promoters": [
            {"name": p.name, "role": p.role, "pan": p.pan, "mobile": p.mobile, "email": p.email} for p in app.promoters
        ],
        "authorized_signatories": [
            {"name": s.name, "designation": s.designation, "mobile": s.mobile, "email": s.email, "pan": s.pan} for s in app.authorized_signatories
        ],
        "principal_place": {
            "premise_name": app.principal_places[0].premise_name,
            "locality": app.principal_places[0].locality,
            "state": app.principal_places[0].state,
            "district": app.principal_places[0].district,
            "pincode": app.principal_places[0].pincode,
            "nature_of_possession": app.principal_places[0].nature_of_possession
        } if app.principal_places else None,
        "goods_services": [
            {"type": gs.type, "description": gs.description, "hsn_sac_code": gs.hsn_sac_code} for gs in app.goods_services
        ],
        "documents": [
            {"id": d.id, "document_type": d.document_type, "filename": d.filename, "upload_status": d.upload_status, "review_status": d.review_status, "officer_comment": d.officer_comment} for d in app.documents
        ],
        "queries": [
            {"id": q.id, "subject": q.subject, "message": q.message, "status": q.status, "applicant_response": q.applicant_response} for q in app.queries
        ],
        "timeline": [
            {"old_status": h.old_status, "new_status": h.new_status, "changed_by": h.changed_by, "reason": h.reason, "created_at": h.created_at} for h in app.status_history
        ]
    }
