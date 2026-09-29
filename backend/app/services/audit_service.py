from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import AuditLog, Notification

def create_audit_log(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    user_id: Optional[int] = None,
    metadata_json: Optional[Dict[str, Any]] = None
):
    try:
        log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            metadata_json=metadata_json or {}
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Error creating audit log: {e}")
        db.rollback()

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: str = "INFO"
):
    try:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            is_read=False
        )
        db.add(notif)
        db.commit()
    except Exception as e:
        print(f"Error creating notification: {e}")
        db.rollback()
