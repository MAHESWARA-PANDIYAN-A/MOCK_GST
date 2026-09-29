from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_roles, get_password_hash
from app.models.models import (
    User, UserRole, Application, AuditLog, IntegrationRequest
)
from app.schemas.schemas import AuditLogResponse, UserResponse
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

class CreateOfficerRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    mobile: str = Field(..., min_length=10)
    password: str = Field(..., min_length=6)

class AssignOfficerRequest(BaseModel):
    officer_id: int

@router.get("/officers", response_model=List[UserResponse])
def get_officers(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    return db.query(User).filter(User.role == UserRole.OFFICER).all()

@router.post("/officers", response_model=UserResponse)
def create_officer(
    req: CreateOfficerRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter((User.email == req.email.lower()) | (User.mobile == req.mobile)).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email or mobile already exists.")

    officer = User(
        name=req.name,
        email=req.email.lower(),
        mobile=req.mobile,
        password_hash=get_password_hash(req.password),
        role=UserRole.OFFICER,
        is_active=True
    )
    db.add(officer)
    db.commit()
    db.refresh(officer)

    create_audit_log(db, "OFFICER_CREATED", "USER", str(officer.id), current_user.id, {"email": officer.email})
    return officer

@router.put("/applications/{app_id}/assign")
def assign_application(
    app_id: int,
    req: AssignOfficerRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    officer = db.query(User).filter(User.id == req.officer_id, User.role == UserRole.OFFICER).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    app.assigned_officer_id = officer.id
    db.commit()

    create_audit_log(db, "APPLICATION_ASSIGNED", "APPLICATION", app.application_number, current_user.id, {"officer": officer.name})
    return {"success": True, "message": f"Application assigned to {officer.name}"}

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = 100,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "user_id": l.user_id,
            "user_name": l.user.name if l.user else "Anonymous / System",
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "metadata_json": l.metadata_json,
            "created_at": l.created_at
        })
    return results

@router.get("/integration-logs")
def get_integration_logs(
    limit: int = 100,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    return db.query(IntegrationRequest).order_by(IntegrationRequest.created_at.desc()).limit(limit).all()

@router.get("/stats")
def get_system_stats(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    return {
        "total_users": db.query(User).count(),
        "total_officers": db.query(User).filter(User.role == UserRole.OFFICER).count(),
        "total_applications": db.query(Application).count(),
        "total_integration_requests": db.query(IntegrationRequest).count(),
        "total_audit_logs": db.query(AuditLog).count()
    }
