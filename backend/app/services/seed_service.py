import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.models import (
    User, UserRole, Applicant, Business, Application, ApplicationStatus,
    Promoter, AuthorizedSignatory, PrincipalPlace, AdditionalPlace,
    GoodsService, DocumentRequirement, Document, Query, QueryStatus,
    ApplicationStatusHistory, Notification, AuditLog
)
from app.core.config import settings

def seed_database(db: Session):
    # 1. Seed Document Requirements
    default_reqs = [
        {
            "document_type": "PAN_CARD",
            "name": "Permanent Account Number (PAN) Card",
            "description": "Copy of PAN card of the Business Entity / Proprietor / Key Person",
            "required": True,
            "applicable_condition": "ALL",
            "allowed_file_types": "PDF,JPG,JPEG,PNG",
            "max_size_mb": 5
        },
        {
            "document_type": "AADHAAR_CARD",
            "name": "Aadhaar Card / Identity Proof",
            "description": "Aadhaar / Passport / Voter ID of the primary promoter / signatory",
            "required": True,
            "applicable_condition": "ALL",
            "allowed_file_types": "PDF,JPG,JPEG,PNG",
            "max_size_mb": 5
        },
        {
            "document_type": "PASSPORT_PHOTO",
            "name": "Passport-size Photograph",
            "description": "Recent colored photograph of Authorized Signatory / Promoter",
            "required": True,
            "applicable_condition": "ALL",
            "allowed_file_types": "JPG,JPEG,PNG",
            "max_size_mb": 5
        },
        {
            "document_type": "BANK_PROOF",
            "name": "Bank Proof (Optional in Initial Prototype)",
            "description": "Cancelled Cheque, Bank Statement, or First Page of Bank Passbook",
            "required": False,
            "applicable_condition": "OPTIONAL",
            "allowed_file_types": "PDF,JPG,JPEG,PNG",
            "max_size_mb": 5
        },
        {
            "document_type": "PRINCIPAL_PLACE_PROOF",
            "name": "Principal Place of Business Proof",
            "description": "Electricity Bill / Property Tax Receipt (Owned) or Rent Agreement / Consent Letter (Rented/Consented)",
            "required": True,
            "applicable_condition": "ALL",
            "allowed_file_types": "PDF,JPG,JPEG,PNG",
            "max_size_mb": 5
        }
    ]

    for req_data in default_reqs:
        existing = db.query(DocumentRequirement).filter(DocumentRequirement.document_type == req_data["document_type"]).first()
        if not existing:
            req = DocumentRequirement(**req_data)
            db.add(req)
    db.commit()

    # 2. Seed Admin User
    admin_user = db.query(User).filter((User.email == "admin@gstmock.in") | (User.email == "admin@gstmock.local")).first()
    if not admin_user:
        admin_user = User(
            name="System Administrator",
            email="admin@gstmock.in",
            mobile="9900000001",
            password_hash=get_password_hash("Admin@123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
    else:
        admin_user.email = "admin@gstmock.in"
        db.commit()

    # 3. Seed Officer Priya
    officer_user = db.query(User).filter((User.email == "officer.priya@gstmock.in") | (User.email == "officer.priya@gstmock.local")).first()
    if not officer_user:
        officer_user = User(
            name="Officer Priya",
            email="officer.priya@gstmock.in",
            mobile="9800000002",
            password_hash=get_password_hash("Officer@123"),
            role=UserRole.OFFICER,
            is_active=True
        )
        db.add(officer_user)
        db.commit()
        db.refresh(officer_user)
    else:
        officer_user.email = "officer.priya@gstmock.in"
        db.commit()

    # 4. Seed Applicant Rahul Kumar
    applicant_user = db.query(User).filter(User.email == "rahul@example.com").first()
    if not applicant_user:
        applicant_user = User(
            name="Rahul Kumar",
            email="rahul@example.com",
            mobile="9876543210",
            password_hash=get_password_hash("Applicant@123"),
            role=UserRole.APPLICANT,
            is_active=True
        )
        db.add(applicant_user)
        db.commit()
        db.refresh(applicant_user)

        applicant_profile = Applicant(
            user_id=applicant_user.id,
            applicant_name="Rahul Kumar",
            email="rahul@example.com",
            mobile="9876543210"
        )
        db.add(applicant_profile)
        db.commit()
        db.refresh(applicant_profile)

        # Seed Business ABC Foods
        business = Business(
            applicant_id=applicant_profile.id,
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

        # Create Sample Application 1: DRAFT (Pre-filled from SIH scenario)
        app1 = Application(
            application_number="GST-MOCK-2026-000123",
            external_reference_id="SIH-APP-1001",
            source_system="SIH26130",
            applicant_id=applicant_profile.id,
            business_id=business.id,
            application_type="NEW_REGISTRATION",
            status=ApplicationStatus.DOCUMENT_QUERY,
            risk_level="LOW",
            current_step=7,
            submission_date=datetime.utcnow() - timedelta(days=2),
            last_status_updated_at=datetime.utcnow() - timedelta(hours=4),
            assigned_officer_id=officer_user.id
        )
        db.add(app1)
        db.commit()
        db.refresh(app1)

        # Promoters for App1
        p1 = Promoter(
            application_id=app1.id,
            name="Rahul Kumar",
            role="Director",
            pan="ABCDE1234F",
            aadhaar_last4="1234",
            mobile="9876543210",
            email="rahul@example.com",
            address="Plot No. 12, SIDCO Industrial Estate, Salem, Tamil Nadu - 636001"
        )
        db.add(p1)

        # Signatory for App1
        s1 = AuthorizedSignatory(
            application_id=app1.id,
            name="Rahul Kumar",
            designation="Managing Director",
            mobile="9876543210",
            email="rahul@example.com",
            pan="ABCDE1234F",
            aadhaar_last4="1234",
            authorization_type="BOARD_RESOLUTION",
            address="Plot No. 12, SIDCO Industrial Estate, Salem, Tamil Nadu - 636001",
            is_same_as_promoter=True
        )
        db.add(s1)

        # Principal Place for App1
        pp1 = PrincipalPlace(
            application_id=app1.id,
            building_number="Plot 12",
            floor_number="Ground",
            premise_name="ABC Food Processing Complex",
            road="Industrial Main Road",
            locality="SIDCO Industrial Estate",
            state="Tamil Nadu",
            district="Salem",
            pincode="636001",
            jurisdiction="Salem Central Range-1",
            nature_of_possession="RENTED",
            office_email="contact@abcfoods.local",
            office_mobile="9876543210"
        )
        db.add(pp1)

        # Goods / Services for App1
        gs1 = GoodsService(
            application_id=app1.id,
            type="GOODS",
            description="Packaged Snacks and Confectionery (Prototype Example)",
            hsn_sac_code="2106"
        )
        db.add(gs1)

        # Sample Documents for App1
        dummy_file_path = os.path.join(settings.UPLOAD_DIR, "demo_pan_card.pdf")
        if not os.path.exists(dummy_file_path):
            with open(dummy_file_path, "wb") as f:
                f.write(b"%PDF-1.4 Demo PAN Card Document for SIH Prototype\n")

        doc1 = Document(
            application_id=app1.id,
            document_type="PAN_CARD",
            filename="pan_card_abc_foods.pdf",
            stored_filename="demo_pan_card.pdf",
            file_path=dummy_file_path,
            mime_type="application/pdf",
            file_size=1024,
            upload_status="UPLOADED",
            review_status="ACCEPTED",
            officer_comment="PAN verified successfully.",
            uploaded_at=datetime.utcnow() - timedelta(days=2),
            reviewed_at=datetime.utcnow() - timedelta(days=1)
        )
        doc2 = Document(
            application_id=app1.id,
            document_type="AADHAAR_CARD",
            filename="aadhaar_rahul.pdf",
            stored_filename="demo_pan_card.pdf",
            file_path=dummy_file_path,
            mime_type="application/pdf",
            file_size=1024,
            upload_status="UPLOADED",
            review_status="ACCEPTED",
            officer_comment="Identity proof verified.",
            uploaded_at=datetime.utcnow() - timedelta(days=2),
            reviewed_at=datetime.utcnow() - timedelta(days=1)
        )
        doc3 = Document(
            application_id=app1.id,
            document_type="PASSPORT_PHOTO",
            filename="rahul_photo.png",
            stored_filename="demo_pan_card.pdf",
            file_path=dummy_file_path,
            mime_type="image/png",
            file_size=1024,
            upload_status="UPLOADED",
            review_status="ACCEPTED",
            officer_comment="Photo verified.",
            uploaded_at=datetime.utcnow() - timedelta(days=2),
            reviewed_at=datetime.utcnow() - timedelta(days=1)
        )
        doc4 = Document(
            application_id=app1.id,
            document_type="PRINCIPAL_PLACE_PROOF",
            filename="rent_agreement_scan.pdf",
            stored_filename="demo_pan_card.pdf",
            file_path=dummy_file_path,
            mime_type="application/pdf",
            file_size=1024,
            upload_status="UPLOADED",
            review_status="NEEDS_CORRECTION",
            officer_comment="Uploaded rent agreement page 2 is blurred. Please upload a clearer copy.",
            uploaded_at=datetime.utcnow() - timedelta(days=2),
            reviewed_at=datetime.utcnow() - timedelta(hours=4)
        )
        db.add_all([doc1, doc2, doc3, doc4])

        # Query for App1
        query1 = Query(
            application_id=app1.id,
            officer_id=officer_user.id,
            subject="Address Proof Clarification",
            message="Please upload a clearer principal place premises document. The agreement lease dates are partially illegible.",
            status=QueryStatus.OPEN,
            created_at=datetime.utcnow() - timedelta(hours=4)
        )
        db.add(query1)

        # Status History for App1
        h1 = ApplicationStatusHistory(
            application_id=app1.id,
            old_status="DRAFT",
            new_status="SUBMITTED",
            changed_by="Rahul Kumar (Applicant)",
            reason="Application submitted after mock OTP verification.",
            created_at=datetime.utcnow() - timedelta(days=2)
        )
        h2 = ApplicationStatusHistory(
            application_id=app1.id,
            old_status="SUBMITTED",
            new_status="PENDING_FOR_VALIDATION",
            changed_by="SYSTEM",
            reason="Automated checks queued for verification.",
            created_at=datetime.utcnow() - timedelta(days=2, hours=-1)
        )
        h3 = ApplicationStatusHistory(
            application_id=app1.id,
            old_status="PENDING_FOR_VALIDATION",
            new_status="UNDER_REVIEW",
            changed_by="Officer Priya",
            reason="Assigned to Officer Priya for document review.",
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        h4 = ApplicationStatusHistory(
            application_id=app1.id,
            old_status="UNDER_REVIEW",
            new_status="DOCUMENT_QUERY",
            changed_by="Officer Priya",
            reason="Clarification raised for premises document.",
            created_at=datetime.utcnow() - timedelta(hours=4)
        )
        db.add_all([h1, h2, h3, h4])

        # Create Sample Application 2: APPROVED (Demonstrating complete approval cycle)
        app2 = Application(
            application_number="GST-MOCK-2026-000888",
            external_reference_id="SIH-APP-1002",
            source_system="SIH26130",
            applicant_id=applicant_profile.id,
            business_id=business.id,
            application_type="NEW_REGISTRATION",
            status=ApplicationStatus.APPROVED,
            risk_level="LOW",
            current_step=11,
            submission_date=datetime.utcnow() - timedelta(days=10),
            last_status_updated_at=datetime.utcnow() - timedelta(days=8),
            assigned_officer_id=officer_user.id,
            mock_registration_ref="GST-REG-MOCK-2026-000888",
            approval_remarks="Simulated GST registration approved successfully after verification."
        )
        db.add(app2)
        db.commit()
        db.refresh(app2)

        # Status History for App2
        ha1 = ApplicationStatusHistory(
            application_id=app2.id,
            old_status="DRAFT",
            new_status="SUBMITTED",
            changed_by="Applicant",
            reason="Submitted",
            created_at=datetime.utcnow() - timedelta(days=10)
        )
        ha2 = ApplicationStatusHistory(
            application_id=app2.id,
            old_status="SUBMITTED",
            new_status="UNDER_REVIEW",
            changed_by="Officer Priya",
            reason="Review initiated",
            created_at=datetime.utcnow() - timedelta(days=9)
        )
        ha3 = ApplicationStatusHistory(
            application_id=app2.id,
            old_status="UNDER_REVIEW",
            new_status="APPROVED",
            changed_by="Officer Priya",
            reason="All documents and address verified.",
            created_at=datetime.utcnow() - timedelta(days=8)
        )
        db.add_all([ha1, ha2, ha3])

        # Notifications
        n1 = Notification(
            user_id=applicant_user.id,
            title="Clarification Required",
            message="Officer Priya has requested clarification regarding your Principal Place of Business proof for GST-MOCK-2026-000123.",
            type="WARNING",
            is_read=False
        )
        db.add(n1)

        db.commit()
        print("Database seeded successfully with demo users, documents, and sample applications.")
