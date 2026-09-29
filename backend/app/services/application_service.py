import random
from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import (
    Application, Business, Applicant, Promoter, AuthorizedSignatory,
    PrincipalPlace, AdditionalPlace, GoodsService, Document,
    ApplicationStatusHistory, ApplicationStatus
)
from app.services.audit_service import create_audit_log, create_notification
from app.services.webhook_service import dispatch_webhook

def generate_application_number(db: Session) -> str:
    while True:
        num = f"GST-MOCK-2026-{random.randint(100000, 999999)}"
        exists = db.query(Application).filter(Application.application_number == num).first()
        if not exists:
            return num

def generate_mock_registration_ref(db: Session) -> str:
    return f"GST-REG-MOCK-2026-{random.randint(100000, 999999)}"

def transition_status(
    db: Session,
    application: Application,
    new_status: str,
    changed_by: str = "SYSTEM",
    reason: Optional[str] = None,
    visible_to_applicant: bool = True,
    user_id: Optional[int] = None
):
    old_status = application.status
    if old_status == new_status:
        return

    application.status = new_status
    application.last_status_updated_at = datetime.utcnow()

    # If submitted, update submission date
    if new_status == ApplicationStatus.SUBMITTED and not application.submission_date:
        application.submission_date = datetime.utcnow()

    # Record status history
    history = ApplicationStatusHistory(
        application_id=application.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
        reason=reason,
        visible_to_applicant=visible_to_applicant,
        created_at=datetime.utcnow()
    )
    db.add(history)
    db.commit()
    db.refresh(application)

    # Audit log
    create_audit_log(
        db=db,
        action=f"STATUS_CHANGED_TO_{new_status}",
        entity_type="APPLICATION",
        entity_id=application.application_number,
        user_id=user_id,
        metadata_json={
            "old_status": old_status,
            "new_status": new_status,
            "changed_by": changed_by,
            "reason": reason
        }
    )

    # Notify applicant
    if application.applicant and application.applicant.user_id:
        create_notification(
            db=db,
            user_id=application.applicant.user_id,
            title=f"GST Application Status Update: {new_status}",
            message=f"Your application {application.application_number} status has changed to {new_status}. {reason or ''}",
            type="SUCCESS" if new_status == ApplicationStatus.APPROVED else "INFO"
        )

    # Webhook dispatch
    try:
        import asyncio
        asyncio.create_task(dispatch_webhook(
            event_name="APPLICATION_STATUS_CHANGED",
            payload={
                "application_number": application.application_number,
                "external_reference_id": application.external_reference_id,
                "old_status": old_status,
                "new_status": new_status,
                "reason": reason,
                "mock_registration_ref": application.mock_registration_ref
            }
        ))
    except Exception:
        pass

def validate_application_for_submission(application: Application) -> Tuple[bool, List[str]]:
    missing = []
    
    # Check business
    if not application.business:
        missing.append("Business details are missing")
    else:
        b = application.business
        if not b.legal_name: missing.append("Business legal name is required")
        if not b.pan: missing.append("Business PAN is required")
        if not b.constitution_of_business: missing.append("Constitution of business is required")
        if not b.state or not b.district or not b.pincode: missing.append("Business location (state/district/pincode) is required")

    # Check promoter
    if not application.promoters or len(application.promoters) == 0:
        missing.append("At least one Promoter / Director details are required")

    # Check authorized signatory
    if not application.authorized_signatories or len(application.authorized_signatories) == 0:
        missing.append("Authorized Signatory details are required")

    # Check principal place
    if not application.principal_places or len(application.principal_places) == 0:
        missing.append("Principal Place of Business address is required")
    else:
        p = application.principal_places[0]
        if not p.premise_name or not p.locality or not p.state or not p.district or not p.pincode:
            missing.append("Principal place address details are incomplete")
        if not p.nature_of_possession:
            missing.append("Nature of possession for principal place is required")

    # Check goods and services
    if not application.goods_services or len(application.goods_services) == 0:
        missing.append("At least one Goods or Services classification is required")

    # Check mandatory documents
    docs_uploaded = {doc.document_type for doc in application.documents if doc.upload_status == "UPLOADED"}
    
    # Mandatory docs in prototype: PAN_CARD, AADHAAR_CARD, PASSPORT_PHOTO, PRINCIPAL_PLACE_PROOF
    required_doc_types = ["PAN_CARD", "AADHAAR_CARD", "PASSPORT_PHOTO", "PRINCIPAL_PLACE_PROOF"]
    for dt in required_doc_types:
        if dt not in docs_uploaded:
            missing.append(f"Required document is missing: {dt.replace('_', ' ').title()}")

    return (len(missing) == 0, missing)
