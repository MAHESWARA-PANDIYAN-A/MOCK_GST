import os
import uuid
import shutil
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import require_roles, get_current_user
from app.models.models import (
    User, UserRole, Applicant, Business, Application, ApplicationStatus,
    Promoter, AuthorizedSignatory, PrincipalPlace, AdditionalPlace,
    GoodsService, DocumentRequirement, Document, Query, QueryStatus,
    ApplicationStatusHistory, Notification
)
from app.schemas.schemas import (
    ApplicationSummaryResponse, ApplicationDetailResponse,
    SaveDraftApplicationRequest, ApplicationSubmitRequest,
    DocumentResponse, DocumentRequirementResponse, QueryResponse,
    QueryRespondRequest, NotificationResponse
)
from app.services.application_service import (
    generate_application_number, transition_status,
    validate_application_for_submission
)
from app.services.audit_service import create_audit_log, create_notification

router = APIRouter(prefix="/applicant", tags=["Applicant Portal"])

def get_or_create_applicant(user: User, db: Session) -> Applicant:
    applicant = db.query(Applicant).filter(Applicant.user_id == user.id).first()
    if not applicant:
        applicant = Applicant(
            user_id=user.id,
            applicant_name=user.name,
            email=user.email,
            mobile=user.mobile
        )
        db.add(applicant)
        db.commit()
        db.refresh(applicant)
    return applicant

@router.get("/dashboard-stats")
def get_applicant_dashboard_stats(
    current_user: User = Depends(require_roles(UserRole.APPLICANT, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    applicant = get_or_create_applicant(current_user, db)
    apps = db.query(Application).filter(Application.applicant_id == applicant.id).all()
    
    counts = {
        "DRAFT": 0,
        "SUBMITTED": 0,
        "PENDING_FOR_VALIDATION": 0,
        "UNDER_REVIEW": 0,
        "DOCUMENT_QUERY": 0,
        "CLARIFICATION_RECEIVED": 0,
        "APPROVED": 0,
        "REJECTED": 0,
        "TOTAL": len(apps)
    }
    for a in apps:
        if a.status in counts:
            counts[a.status] += 1
            
    return counts

@router.get("/applications", response_model=List[ApplicationSummaryResponse])
def get_applicant_applications(
    current_user: User = Depends(require_roles(UserRole.APPLICANT, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    applicant = get_or_create_applicant(current_user, db)
    apps = db.query(Application).filter(Application.applicant_id == applicant.id).order_by(Application.created_at.desc()).all()
    
    results = []
    for a in apps:
        b = a.business
        results.append({
            "id": a.id,
            "application_number": a.application_number,
            "external_reference_id": a.external_reference_id,
            "source_system": a.source_system,
            "business_name": b.legal_name if b else "Unnamed Business",
            "trade_name": b.trade_name if b else None,
            "applicant_name": applicant.applicant_name,
            "district": b.district if b else "N/A",
            "state": b.state if b else "N/A",
            "business_type": b.constitution_of_business if b else "N/A",
            "application_type": a.application_type,
            "status": a.status,
            "risk_level": a.risk_level,
            "current_step": a.current_step,
            "submission_date": a.submission_date,
            "last_status_updated_at": a.last_status_updated_at,
            "assigned_officer_name": a.assigned_officer.name if a.assigned_officer else None,
            "mock_registration_ref": a.mock_registration_ref,
            "created_at": a.created_at
        })
    return results

@router.post("/applications")
def create_new_application(
    current_user: User = Depends(require_roles(UserRole.APPLICANT, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    applicant = get_or_create_applicant(current_user, db)
    
    # Check if applicant already has a business record or previous application
    existing_business = db.query(Business).filter(Business.applicant_id == applicant.id).order_by(Business.id.desc()).first()
    
    if existing_business:
        business = Business(
            applicant_id=applicant.id,
            legal_name=existing_business.legal_name or "New Business Unit",
            trade_name=existing_business.trade_name or existing_business.legal_name,
            business_name=existing_business.business_name or existing_business.legal_name,
            pan=existing_business.pan or "",
            constitution_of_business=existing_business.constitution_of_business or "Private Limited Company",
            state=existing_business.state or "Tamil Nadu",
            district=existing_business.district or "Salem",
            pincode=existing_business.pincode or "636001",
            business_activity=existing_business.business_activity or "Manufacturer",
            reason_for_reg=existing_business.reason_for_reg or "New Business",
            commencement_date=existing_business.commencement_date or "2026-01-15",
            primary_activity=existing_business.primary_activity or "Food Manufacturing",
            gst_existing=existing_business.gst_existing
        )
    else:
        business = Business(
            applicant_id=applicant.id,
            legal_name="ABC Foods Private Limited",
            trade_name="ABC Foods",
            business_name="ABC Foods Private Limited",
            pan="ABCDE1234F",
            constitution_of_business="Private Limited Company",
            state="Tamil Nadu",
            district="Salem",
            pincode="636001",
            business_activity="Manufacturer",
            reason_for_reg="New Business",
            commencement_date="2026-01-15",
            primary_activity="Food Manufacturing"
        )
    db.add(business)
    db.commit()
    db.refresh(business)

    app_num = generate_application_number(db)
    app = Application(
        application_number=app_num,
        applicant_id=applicant.id,
        business_id=business.id,
        source_system="PORTAL_DIRECT",
        application_type="NEW_REGISTRATION",
        status=ApplicationStatus.DRAFT,
        current_step=1
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    # Check previous application for promoters & address reuse
    prev_app = db.query(Application).filter(Application.applicant_id == applicant.id, Application.id != app.id).order_by(Application.id.desc()).first()

    if prev_app and prev_app.promoters:
        for p in prev_app.promoters:
            new_p = Promoter(
                application_id=app.id,
                name=p.name,
                role=p.role,
                pan=p.pan,
                aadhaar_last4=p.aadhaar_last4,
                mobile=p.mobile,
                email=p.email,
                address=p.address
            )
            db.add(new_p)
    else:
        # Auto-create primary promoter from user profile so user never re-types name, email, mobile
        p = Promoter(
            application_id=app.id,
            name=current_user.name,
            role="Managing Director",
            pan=business.pan or "ABCDE1234F",
            aadhaar_last4="1234",
            mobile=current_user.mobile,
            email=current_user.email,
            address=f"Plot No. 12, Industrial Area, {business.district}, {business.state} - {business.pincode}"
        )
        db.add(p)

    if prev_app and prev_app.authorized_signatories:
        for s in prev_app.authorized_signatories:
            new_s = AuthorizedSignatory(
                application_id=app.id,
                name=s.name,
                designation=s.designation,
                mobile=s.mobile,
                email=s.email,
                pan=s.pan,
                aadhaar_last4=s.aadhaar_last4,
                authorization_type=s.authorization_type,
                address=s.address,
                is_same_as_promoter=s.is_same_as_promoter
            )
            db.add(new_s)
    else:
        # Auto-create primary signatory with is_same_as_promoter = True
        s = AuthorizedSignatory(
            application_id=app.id,
            name=current_user.name,
            designation="Managing Director",
            mobile=current_user.mobile,
            email=current_user.email,
            pan=business.pan or "ABCDE1234F",
            aadhaar_last4="1234",
            authorization_type="BOARD_RESOLUTION",
            address=f"Plot No. 12, Industrial Area, {business.district}, {business.state} - {business.pincode}",
            is_same_as_promoter=True
        )
        db.add(s)

    if prev_app and prev_app.principal_places:
        for pp in prev_app.principal_places:
            new_pp = PrincipalPlace(
                application_id=app.id,
                building_number=pp.building_number,
                floor_number=pp.floor_number,
                premise_name=pp.premise_name,
                road=pp.road,
                locality=pp.locality,
                state=pp.state,
                district=pp.district,
                pincode=pp.pincode,
                jurisdiction=pp.jurisdiction,
                nature_of_possession=pp.nature_of_possession,
                office_email=pp.office_email,
                office_mobile=pp.office_mobile
            )
            db.add(new_pp)
    else:
        pp = PrincipalPlace(
            application_id=app.id,
            building_number="Plot No. 12",
            floor_number="Ground Floor",
            premise_name="Processing & Commercial Facility",
            road="Industrial Main Road",
            locality="SIDCO Industrial Estate",
            state=business.state or "Tamil Nadu",
            district=business.district or "Salem",
            pincode=business.pincode or "636001",
            jurisdiction=f"{business.district} Central Range-1",
            nature_of_possession="RENTED",
            office_email=current_user.email,
            office_mobile=current_user.mobile
        )
        db.add(pp)

    if prev_app and prev_app.goods_services:
        for gs in prev_app.goods_services:
            new_gs = GoodsService(
                application_id=app.id,
                type=gs.type,
                description=gs.description,
                hsn_sac_code=gs.hsn_sac_code
            )
            db.add(new_gs)
    else:
        gs = GoodsService(
            application_id=app.id,
            type="GOODS",
            description="Packaged Food & Confectionery (Prototype Example)",
            hsn_sac_code="2106"
        )
        db.add(gs)

    db.commit()

    # Add initial status history
    transition_status(db, app, ApplicationStatus.DRAFT, changed_by=current_user.name, reason="Draft initialized by applicant", user_id=current_user.id)

    create_audit_log(db, "APPLICATION_CREATED", "APPLICATION", app.application_number, current_user.id)

    return {"success": True, "application_id": app.id, "application_number": app.application_number}

@router.get("/applications/{app_id}", response_model=ApplicationDetailResponse)
def get_applicant_application_detail(
    app_id: int,
    current_user: User = Depends(require_roles(UserRole.APPLICANT, UserRole.OFFICER, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.role == UserRole.APPLICANT:
        applicant = get_or_create_applicant(current_user, db)
        if app.applicant_id != applicant.id:
            raise HTTPException(status_code=403, detail="Access denied. You cannot view applications of other applicants.")

    # Format detail
    b = app.business
    business_dict = {
        "id": b.id if b else None,
        "legal_name": b.legal_name if b else "",
        "trade_name": b.trade_name if b else "",
        "constitution_of_business": b.constitution_of_business if b else "",
        "pan": b.pan if b else "",
        "reason_for_reg": b.reason_for_reg if b else "",
        "commencement_date": b.commencement_date if b else "",
        "business_activity": b.business_activity if b else "",
        "primary_activity": b.primary_activity if b else "",
        "state": b.state if b else "",
        "district": b.district if b else "",
        "pincode": b.pincode if b else "",
        "gst_existing": b.gst_existing if b else ""
    } if b else None

    # Mask Aadhaar for promoters & signatories in UI responses
    promoters_list = []
    for p in app.promoters:
        promoters_list.append({
            "id": p.id,
            "name": p.name,
            "role": p.role,
            "pan": p.pan,
            "aadhaar_masked": f"XXXX-XXXX-{p.aadhaar_last4[-4:]}" if p.aadhaar_last4 else "XXXX-XXXX-1234",
            "aadhaar_last4": p.aadhaar_last4,
            "mobile": p.mobile,
            "email": p.email,
            "address": p.address,
            "photo_path": p.photo_path
        })

    signatories_list = []
    for s in app.authorized_signatories:
        signatories_list.append({
            "id": s.id,
            "name": s.name,
            "designation": s.designation,
            "mobile": s.mobile,
            "email": s.email,
            "pan": s.pan,
            "aadhaar_masked": f"XXXX-XXXX-{s.aadhaar_last4[-4:]}" if s.aadhaar_last4 else "XXXX-XXXX-1234",
            "aadhaar_last4": s.aadhaar_last4,
            "authorization_type": s.authorization_type,
            "address": s.address,
            "is_same_as_promoter": s.is_same_as_promoter,
            "photo_path": s.photo_path
        })

    principal_dict = None
    if app.principal_places and len(app.principal_places) > 0:
        pp = app.principal_places[0]
        principal_dict = {
            "id": pp.id,
            "building_number": pp.building_number,
            "floor_number": pp.floor_number,
            "premise_name": pp.premise_name,
            "road": pp.road,
            "locality": pp.locality,
            "state": pp.state,
            "district": pp.district,
            "pincode": pp.pincode,
            "jurisdiction": pp.jurisdiction,
            "nature_of_possession": pp.nature_of_possession,
            "office_email": pp.office_email,
            "office_mobile": pp.office_mobile
        }

    additional_list = [
        {
            "id": ap.id,
            "address": ap.address,
            "state": ap.state,
            "district": ap.district,
            "pincode": ap.pincode,
            "nature_of_possession": ap.nature_of_possession,
            "business_activity": ap.business_activity
        } for ap in app.additional_places
    ]

    goods_services_list = [
        {
            "id": gs.id,
            "type": gs.type,
            "description": gs.description,
            "hsn_sac_code": gs.hsn_sac_code
        } for gs in app.goods_services
    ]

    return {
        "id": app.id,
        "application_number": app.application_number,
        "external_reference_id": app.external_reference_id,
        "source_system": app.source_system,
        "applicant": {
            "id": app.applicant.id,
            "name": app.applicant.applicant_name,
            "email": app.applicant.email,
            "mobile": app.applicant.mobile
        },
        "business": business_dict,
        "promoters": promoters_list,
        "authorized_signatories": signatories_list,
        "principal_place": principal_dict,
        "additional_places": additional_list,
        "goods_services": goods_services_list,
        "documents": app.documents,
        "queries": [
            {
                "id": q.id,
                "application_id": q.application_id,
                "officer_id": q.officer_id,
                "officer_name": q.officer.name if q.officer else "GST Reviewing Officer",
                "subject": q.subject,
                "message": q.message,
                "status": q.status,
                "applicant_response": q.applicant_response,
                "response_date": q.response_date,
                "created_at": q.created_at,
                "updated_at": q.updated_at
            } for q in app.queries
        ],
        "status_history": app.status_history,
        "status": app.status,
        "risk_level": app.risk_level,
        "current_step": app.current_step,
        "submission_date": app.submission_date,
        "last_status_updated_at": app.last_status_updated_at,
        "assigned_officer": {
            "id": app.assigned_officer.id,
            "name": app.assigned_officer.name,
            "email": app.assigned_officer.email
        } if app.assigned_officer else None,
        "mock_registration_ref": app.mock_registration_ref,
        "approval_remarks": app.approval_remarks,
        "rejection_reason": app.rejection_reason,
        "created_at": app.created_at,
        "updated_at": app.updated_at
    }

@router.put("/applications/{app_id}/draft")
def save_application_draft(
    app_id: int,
    req: SaveDraftApplicationRequest,
    current_user: User = Depends(require_roles(UserRole.APPLICANT, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    applicant = get_or_create_applicant(current_user, db)
    if current_user.role == UserRole.APPLICANT and app.applicant_id != applicant.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if app.status not in [ApplicationStatus.DRAFT, ApplicationStatus.DOCUMENT_QUERY]:
        raise HTTPException(status_code=400, detail=f"Application cannot be edited in current status: {app.status}")

    # Update current step
    if req.current_step:
        app.current_step = req.current_step

    # Update business
    if req.business:
        b = app.business
        if not b:
            b = Business(applicant_id=applicant.id)
            db.add(b)
            db.flush()
            app.business_id = b.id

        b.legal_name = req.business.legal_name
        b.trade_name = req.business.trade_name
        b.constitution_of_business = req.business.constitution_of_business
        b.pan = req.business.pan.upper()
        b.reason_for_reg = req.business.reason_for_reg
        b.commencement_date = req.business.commencement_date
        b.business_activity = req.business.business_activity
        b.primary_activity = req.business.primary_activity or "Food Manufacturing"
        b.state = req.business.state
        b.district = req.business.district
        b.pincode = req.business.pincode
        b.gst_existing = req.business.gst_existing

    # Update Promoters
    if req.promoters is not None:
        db.query(Promoter).filter(Promoter.application_id == app.id).delete()
        for p in req.promoters:
            p_obj = Promoter(
                application_id=app.id,
                name=p.name,
                role=p.role,
                pan=p.pan.upper(),
                aadhaar_last4=p.aadhaar_last4[-4:] if len(p.aadhaar_last4) >= 4 else "1234",
                mobile=p.mobile,
                email=p.email,
                address=p.address,
                photo_path=p.photo_path
            )
            db.add(p_obj)

    # Update Signatories
    if req.authorized_signatories is not None:
        db.query(AuthorizedSignatory).filter(AuthorizedSignatory.application_id == app.id).delete()
        for s in req.authorized_signatories:
            s_obj = AuthorizedSignatory(
                application_id=app.id,
                name=s.name,
                designation=s.designation,
                mobile=s.mobile,
                email=s.email,
                pan=s.pan.upper(),
                aadhaar_last4=s.aadhaar_last4[-4:] if len(s.aadhaar_last4) >= 4 else "1234",
                authorization_type=s.authorization_type or "LETTER_OF_AUTHORIZATION",
                address=s.address,
                photo_path=s.photo_path,
                is_same_as_promoter=s.is_same_as_promoter or False
            )
            db.add(s_obj)

    # Update Principal Place
    if req.principal_place is not None:
        db.query(PrincipalPlace).filter(PrincipalPlace.application_id == app.id).delete()
        pp_obj = PrincipalPlace(
            application_id=app.id,
            building_number=req.principal_place.building_number,
            floor_number=req.principal_place.floor_number,
            premise_name=req.principal_place.premise_name,
            road=req.principal_place.road,
            locality=req.principal_place.locality,
            state=req.principal_place.state,
            district=req.principal_place.district,
            pincode=req.principal_place.pincode,
            jurisdiction=req.principal_place.jurisdiction,
            nature_of_possession=req.principal_place.nature_of_possession,
            office_email=req.principal_place.office_email,
            office_mobile=req.principal_place.office_mobile
        )
        db.add(pp_obj)

    # Update Additional Places
    if req.additional_places is not None:
        db.query(AdditionalPlace).filter(AdditionalPlace.application_id == app.id).delete()
        for ap in req.additional_places:
            ap_obj = AdditionalPlace(
                application_id=app.id,
                address=ap.address,
                state=ap.state,
                district=ap.district,
                pincode=ap.pincode,
                nature_of_possession=ap.nature_of_possession,
                business_activity=ap.business_activity
            )
            db.add(ap_obj)

    # Update Goods / Services
    if req.goods_services is not None:
        db.query(GoodsService).filter(GoodsService.application_id == app.id).delete()
        for gs in req.goods_services:
            gs_obj = GoodsService(
                application_id=app.id,
                type=gs.type,
                description=gs.description,
                hsn_sac_code=gs.hsn_sac_code
            )
            db.add(gs_obj)

    app.updated_at = datetime.utcnow()
    db.commit()

    create_audit_log(db, "DRAFT_SAVED", "APPLICATION", app.application_number, current_user.id, {"step": app.current_step})

    return {"success": True, "message": "Draft saved successfully."}

@router.get("/document-requirements", response_model=List[DocumentRequirementResponse])
def get_document_requirements(db: Session = Depends(get_db)):
    return db.query(DocumentRequirement).filter(DocumentRequirement.is_active == True).all()

@router.post("/applications/{app_id}/documents", response_model=DocumentResponse)
async def upload_document(
    app_id: int,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(UserRole.APPLICANT, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    applicant = get_or_create_applicant(current_user, db)
    if current_user.role == UserRole.APPLICANT and app.applicant_id != applicant.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Validate file size & extension
    allowed_exts = [".pdf", ".jpg", ".jpeg", ".png"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported file format '{ext}'. Allowed: PDF, JPG, JPEG, PNG")

    content = await file.read()
    file_size = len(content)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum size limit of {settings.MAX_UPLOAD_SIZE_MB}MB")

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    # Save to disk
    stored_filename = f"gst_doc_{app.id}_{uuid.uuid4().hex[:8]}{ext}"
    target_path = os.path.join(settings.UPLOAD_DIR, stored_filename)
    with open(target_path, "wb") as f:
        f.write(content)

    # Find requirement id if any
    req = db.query(DocumentRequirement).filter(DocumentRequirement.document_type == document_type).first()

    # Check if this document type was already uploaded for this application -> replace it
    existing_doc = db.query(Document).filter(
        Document.application_id == app.id,
        Document.document_type == document_type
    ).first()

    if existing_doc:
        existing_doc.filename = file.filename
        existing_doc.stored_filename = stored_filename
        existing_doc.file_path = target_path
        existing_doc.mime_type = file.content_type or "application/octet-stream"
        existing_doc.file_size = file_size
        existing_doc.upload_status = "UPLOADED"
        existing_doc.review_status = "UNDER_REVIEW"
        existing_doc.officer_comment = None
        existing_doc.uploaded_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_doc)
        doc = existing_doc
    else:
        doc = Document(
            application_id=app.id,
            requirement_id=req.id if req else None,
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

    create_audit_log(db, "DOCUMENT_UPLOADED", "DOCUMENT", str(doc.id), current_user.id, {"document_type": document_type, "filename": file.filename})

    return doc

@router.post("/applications/{app_id}/submit")
def submit_application(
    app_id: int,
    req: ApplicationSubmitRequest,
    current_user: User = Depends(require_roles(UserRole.APPLICANT, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    applicant = get_or_create_applicant(current_user, db)
    if current_user.role == UserRole.APPLICANT and app.applicant_id != applicant.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Verify mock OTP
    if req.mock_otp != settings.MOCK_OTP and req.mock_otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please use the simulated OTP (123456).")

    # Validate application readiness
    is_valid, missing = validate_application_for_submission(app)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail={"message": "Please complete all mandatory sections and upload required documents before submission.", "missing_fields": missing}
        )

    # Transition status to SUBMITTED
    transition_status(
        db=db,
        application=app,
        new_status=ApplicationStatus.SUBMITTED,
        changed_by=f"{current_user.name} (Applicant)",
        reason="Application successfully validated with mock OTP and submitted.",
        user_id=current_user.id
    )

    create_audit_log(db, "APPLICATION_SUBMITTED", "APPLICATION", app.application_number, current_user.id)

    return {
        "success": True,
        "message": "Application submitted successfully.",
        "application_number": app.application_number,
        "status": app.status,
        "submission_date": app.submission_date
    }

@router.post("/applications/{app_id}/queries/{query_id}/respond", response_model=QueryResponse)
def respond_to_query(
    app_id: int,
    query_id: int,
    req: QueryRespondRequest,
    current_user: User = Depends(require_roles(UserRole.APPLICANT, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    applicant = get_or_create_applicant(current_user, db)
    if current_user.role == UserRole.APPLICANT and app.applicant_id != applicant.id:
        raise HTTPException(status_code=403, detail="Access denied")

    query = db.query(Query).filter(Query.id == query_id, Query.application_id == app.id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")

    query.applicant_response = req.applicant_response
    query.response_date = datetime.utcnow()
    query.status = QueryStatus.RESPONDED
    db.commit()

    # Move application to CLARIFICATION_RECEIVED
    transition_status(
        db=db,
        application=app,
        new_status=ApplicationStatus.CLARIFICATION_RECEIVED,
        changed_by=f"{current_user.name} (Applicant)",
        reason=f"Applicant submitted response to query: '{query.subject}'",
        user_id=current_user.id
    )

    # Notify officer
    if app.assigned_officer_id:
        create_notification(
            db=db,
            user_id=app.assigned_officer_id,
            title="Applicant Clarification Received",
            message=f"Applicant has responded to query on {app.application_number}.",
            type="INFO"
        )

    create_audit_log(db, "QUERY_RESPONDED", "QUERY", str(query.id), current_user.id, {"response": req.applicant_response})

    return query

@router.get("/notifications", response_model=List[NotificationResponse])
def get_applicant_notifications(
    current_user: User = Depends(require_roles(UserRole.APPLICANT, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(20).all()

@router.put("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"success": True}
