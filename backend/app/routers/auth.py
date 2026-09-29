import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    get_current_user
)
from app.models.models import User, Applicant, UserRole, Notification
from app.schemas.schemas import (
    UserRegisterRequest, UserLoginRequest, TokenResponse,
    UserResponse, SendOtpRequest, VerifyOtpRequest, OtpResponse,
    NotificationResponse
)
from app.services.audit_service import create_audit_log, create_notification

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory OTP storage for demo: {mobile: {"otp": str, "expires_at": datetime}}
MOCK_OTP_STORE = {}

@router.post("/send-otp", response_model=OtpResponse)
def send_mock_otp(req: SendOtpRequest):
    otp = settings.MOCK_OTP if settings.MOCK_OTP else str(random.randint(100000, 999999))
    MOCK_OTP_STORE[req.mobile] = {
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=5)
    }
    return {
        "success": True,
        "message": f"Verification code simulated for {req.mobile}. Use {otp} for demo.",
        "mock_otp_hint": otp
    }

@router.post("/verify-otp", response_model=OtpResponse)
def verify_mock_otp(req: VerifyOtpRequest):
    # Allow default fallback mock OTP 123456 anytime for easy prototype testing
    if req.otp == settings.MOCK_OTP or req.otp == "123456":
        return {"success": True, "message": "OTP verified successfully (Demo Mode)", "mock_otp_hint": None}

    stored = MOCK_OTP_STORE.get(req.mobile)
    if not stored:
        raise HTTPException(status_code=400, detail="No OTP requested for this mobile number or it has expired.")
    if datetime.utcnow() > stored["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    if stored["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please enter the correct code.")

    return {"success": True, "message": "OTP verified successfully", "mock_otp_hint": None}

@router.post("/register", response_model=TokenResponse)
def register_applicant(req: UserRegisterRequest, db: Session = Depends(get_db)):
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    # Check existing user
    existing = db.query(User).filter((User.email == req.email.lower()) | (User.mobile == req.mobile)).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email or mobile number already exists.")

    # Validate OTP (if provided or verify default)
    if req.otp and req.otp != "123456" and req.otp != settings.MOCK_OTP:
        stored = MOCK_OTP_STORE.get(req.mobile)
        if not stored or stored["otp"] != req.otp:
            raise HTTPException(status_code=400, detail="Invalid registration OTP.")

    # Create User
    new_user = User(
        name=req.name,
        email=req.email.lower(),
        mobile=req.mobile,
        password_hash=get_password_hash(req.password),
        role=UserRole.APPLICANT,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create Applicant Profile
    applicant = Applicant(
        user_id=new_user.id,
        applicant_name=req.name,
        email=req.email.lower(),
        mobile=req.mobile
    )
    db.add(applicant)
    db.commit()

    create_audit_log(db, "APPLICANT_REGISTERED", "USER", str(new_user.id), new_user.id, {"email": req.email})
    create_notification(db, new_user.id, "Welcome to GST Portal", "Your simulated GST account has been created successfully.", "SUCCESS")

    token = create_access_token({"sub": str(new_user.id), "role": new_user.role, "email": new_user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "mobile": new_user.mobile,
            "role": new_user.role
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        create_audit_log(db, "FAILED_LOGIN_ATTEMPT", "USER", None, None, {"email": req.email})
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated. Please contact admin.")

    create_audit_log(db, "USER_LOGIN", "USER", str(user.id), user.id, {"role": user.role})
    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "mobile": user.mobile,
            "role": user.role
        }
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
