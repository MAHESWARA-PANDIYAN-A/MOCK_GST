from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query as FastQuery, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.security import require_roles
from app.models.models import (
    User, UserRole, Applicant, Business, Application, ApplicationStatus,
    Document, Query, QueryStatus, ApplicationStatusHistory, DocumentReviewStatus
)
from app.schemas.schemas import (
    ApplicationSummaryResponse, ApplicationDetailResponse,
    DocumentReviewRequest, DocumentResponse, QueryCreateRequest,
    QueryResponse, ApplicationApprovalRequest, ApplicationRejectionRequest,
    ApplicationStatusUpdateRequest
)
from app.services.application_service import (
    transition_status, generate_mock_registration_ref
)
from app.services.audit_service import create_audit_log, create_notification

router = APIRouter(prefix="/officer", tags=["Officer Portal"])

@router.get("/dashboard")
def get_officer_dashboard_metrics(
    current_user: User = Depends(require_roles(UserRole.OFFICER, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    apps = db.query(Application).all()
    
    total = len(apps)
    new_sub = sum(1 for a in apps if a.status == ApplicationStatus.SUBMITTED)
    pending_val = sum(1 for a in apps if a.status == ApplicationStatus.PENDING_FOR_VALIDATION)
    under_rev = sum(1 for a in apps if a.status == ApplicationStatus.UNDER_REVIEW)
    queries = sum(1 for a in apps if a.status in [ApplicationStatus.DOCUMENT_QUERY, ApplicationStatus.CLARIFICATION_RECEIVED])
    approved = sum(1 for a in apps if a.status == ApplicationStatus.APPROVED)
    rejected = sum(1 for a in apps if a.status == ApplicationStatus.REJECTED)

    # Breakdown by business constitution
    constitution_breakdown = {}
    district_breakdown = {}
    for a in apps:
        if a.business:
            c = a.business.constitution_of_business or "Other"
            constitution_breakdown[c] = constitution_breakdown.get(c, 0) + 1
            d = a.business.district or "Unknown"
            district_breakdown[d] = district_breakdown.get(d, 0) + 1

    return {
        "metrics": {
            "total_applications": total,
            "new_submitted": new_sub,
            "pending_validation": pending_val,
            "under_review": under_rev,
            "document_queries": queries,
            "approved": approved,
            "rejected": rejected
        },
        "constitution_breakdown": constitution_breakdown,
        "district_breakdown": district_breakdown
    }

@router.get("/applications", response_model=List[ApplicationSummaryResponse])
def get_officer_applications(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    district_filter: Optional[str] = None,
    constitution_filter: Optional[str] = None,
    activity_filter: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.OFFICER, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    q = db.query(Application).join(Business, Application.business_id == Business.id, isouter=True)\
                             .join(Applicant, Application.applicant_id == Applicant.id, isouter=True)

    if status_filter and status_filter != "ALL":
        q = q.filter(Application.status == status_filter)

    if district_filter and district_filter != "ALL":
        q = q.filter(Business.district.ilike(f"%{district_filter}%"))

    if constitution_filter and constitution_filter != "ALL":
        q = q.filter(Business.constitution_of_business.ilike(f"%{constitution_filter}%"))

    if activity_filter and activity_filter != "ALL":
        q = q.filter(Business.business_activity.ilike(f"%{activity_filter}%"))

    if search:
        term = f"%{search.strip()}%"
        q = q.filter(
            or_(
                Application.application_number.ilike(term),
                Application.external_reference_id.ilike(term),
                Business.legal_name.ilike(term),
                Business.trade_name.ilike(term),
                Applicant.applicant_name.ilike(term)
            )
        )

    apps = q.order_by(Application.created_at.desc()).all()
    
    results = []
    for a in apps:
        b = a.business
        results.append({
            "id": a.id,
            "application_number": a.application_number,
            "external_reference_id": a.external_reference_id,
            "source_system": a.source_system,
            "business_name": b.legal_name if b else "N/A",
            "trade_name": b.trade_name if b else None,
            "applicant_name": a.applicant.applicant_name if a.applicant else "N/A",
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

@router.put("/applications/{app_id}/status")
def update_application_status(
    app_id: int,
    req: ApplicationStatusUpdateRequest,
    current_user: User = Depends(require_roles(UserRole.OFFICER, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # If assigning to current officer
    if not app.assigned_officer_id:
        app.assigned_officer_id = current_user.id

    transition_status(
        db=db,
        application=app,
        new_status=req.status,
        changed_by=f"{current_user.name} (Officer)",
        reason=req.reason or f"Status updated to {req.status} by officer",
        user_id=current_user.id
    )

    create_audit_log(db, "OFFICER_STATUS_UPDATE", "APPLICATION", app.application_number, current_user.id, {"status": req.status, "reason": req.reason})

    return {"success": True, "message": f"Application status updated to {req.status}", "status": app.status}

@router.put("/documents/{doc_id}/review", response_model=DocumentResponse)
def review_document(
    doc_id: int,
    req: DocumentReviewRequest,
    current_user: User = Depends(require_roles(UserRole.OFFICER, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if req.review_status in [DocumentReviewStatus.REJECTED, DocumentReviewStatus.NEEDS_CORRECTION]:
        if not req.officer_comment or not req.officer_comment.strip():
            raise HTTPException(status_code=400, detail="Officer comment is mandatory when rejecting or requesting correction for a document.")

    doc.review_status = req.review_status
    doc.officer_comment = req.officer_comment
    doc.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)

    create_audit_log(
        db=db,
        action=f"DOCUMENT_{req.review_status}",
        entity_type="DOCUMENT",
        entity_id=str(doc.id),
        user_id=current_user.id,
        metadata_json={"document_type": doc.document_type, "comment": req.officer_comment}
    )

    # Notify applicant if correction needed
    if doc.application and doc.application.applicant and doc.application.applicant.user_id:
        create_notification(
            db=db,
            user_id=doc.application.applicant.user_id,
            title=f"Document Update: {doc.document_type.replace('_', ' ').title()}",
            message=f"Document marked as {req.review_status}. Comment: {req.officer_comment or 'None'}",
            type="WARNING" if req.review_status in ["REJECTED", "NEEDS_CORRECTION"] else "SUCCESS"
        )

    return doc

@router.post("/applications/{app_id}/queries", response_model=QueryResponse)
def create_application_query(
    app_id: int,
    req: QueryCreateRequest,
    current_user: User = Depends(require_roles(UserRole.OFFICER, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    new_query = Query(
        application_id=app.id,
        officer_id=current_user.id,
        subject=req.subject,
        message=req.message,
        status=QueryStatus.OPEN,
        created_at=datetime.utcnow()
    )
    db.add(new_query)
    db.commit()
    db.refresh(new_query)

    # Transition application to DOCUMENT_QUERY
    transition_status(
        db=db,
        application=app,
        new_status=ApplicationStatus.DOCUMENT_QUERY,
        changed_by=f"{current_user.name} (Officer)",
        reason=f"Officer query raised: '{req.subject}'",
        user_id=current_user.id
    )

    create_audit_log(db, "QUERY_CREATED", "QUERY", str(new_query.id), current_user.id, {"subject": req.subject})

    return {
        "id": new_query.id,
        "application_id": new_query.application_id,
        "officer_id": new_query.officer_id,
        "officer_name": current_user.name,
        "subject": new_query.subject,
        "message": new_query.message,
        "status": new_query.status,
        "applicant_response": new_query.applicant_response,
        "response_date": new_query.response_date,
        "created_at": new_query.created_at,
        "updated_at": new_query.updated_at
    }

@router.put("/queries/{query_id}/resolve", response_model=QueryResponse)
def resolve_query(
    query_id: int,
    current_user: User = Depends(require_roles(UserRole.OFFICER, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    q = db.query(Query).filter(Query.id == query_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")

    q.status = QueryStatus.RESOLVED
    db.commit()
    db.refresh(q)

    # Move application back to UNDER_REVIEW
    if q.application:
        transition_status(
            db=db,
            application=q.application,
            new_status=ApplicationStatus.UNDER_REVIEW,
            changed_by=f"{current_user.name} (Officer)",
            reason=f"Query '{q.subject}' marked as resolved.",
            user_id=current_user.id
        )

    create_audit_log(db, "QUERY_RESOLVED", "QUERY", str(q.id), current_user.id)

    return {
        "id": q.id,
        "application_id": q.application_id,
        "officer_id": q.officer_id,
        "officer_name": q.officer.name if q.officer else "Officer",
        "subject": q.subject,
        "message": q.message,
        "status": q.status,
        "applicant_response": q.applicant_response,
        "response_date": q.response_date,
        "created_at": q.created_at,
        "updated_at": q.updated_at
    }

@router.post("/applications/{app_id}/approve")
def approve_application(
    app_id: int,
    req: ApplicationApprovalRequest,
    current_user: User = Depends(require_roles(UserRole.OFFICER, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Generate Mock Registration Reference
    mock_reg = generate_mock_registration_ref(db)
    app.mock_registration_ref = mock_reg
    app.approval_remarks = req.remarks or "Simulated GST registration approved after verification."
    app.assigned_officer_id = current_user.id
    db.commit()

    transition_status(
        db=db,
        application=app,
        new_status=ApplicationStatus.APPROVED,
        changed_by=f"{current_user.name} (Officer)",
        reason=f"Approved with simulated reference {mock_reg}. Remarks: {app.approval_remarks}",
        user_id=current_user.id
    )

    create_audit_log(db, "APPLICATION_APPROVED", "APPLICATION", app.application_number, current_user.id, {"mock_ref": mock_reg})

    return {
        "success": True,
        "message": "Application approved successfully.",
        "status": app.status,
        "mock_registration_ref": app.mock_registration_ref,
        "approval_remarks": app.approval_remarks
    }

@router.post("/applications/{app_id}/reject")
def reject_application(
    app_id: int,
    req: ApplicationRejectionRequest,
    current_user: User = Depends(require_roles(UserRole.OFFICER, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if not req.reason or not req.reason.strip():
        raise HTTPException(status_code=400, detail="Rejection reason is mandatory.")

    app.rejection_reason = req.reason
    app.assigned_officer_id = current_user.id
    db.commit()

    transition_status(
        db=db,
        application=app,
        new_status=ApplicationStatus.REJECTED,
        changed_by=f"{current_user.name} (Officer)",
        reason=f"Rejected: {req.reason}",
        user_id=current_user.id
    )

    create_audit_log(db, "APPLICATION_REJECTED", "APPLICATION", app.application_number, current_user.id, {"reason": req.reason})

    return {
        "success": True,
        "message": "Application rejected.",
        "status": app.status,
        "rejection_reason": app.rejection_reason
    }
