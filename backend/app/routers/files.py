import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Document, User

router = APIRouter(prefix="/files", tags=["File Access"])

@router.get("/{doc_id}/download")
def download_file(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Requested file not found on server")

    return FileResponse(
        path=doc.file_path,
        filename=doc.filename,
        media_type=doc.mime_type
    )

@router.get("/{doc_id}/view")
def view_file(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Requested file not found on server")

    return FileResponse(
        path=doc.file_path,
        media_type=doc.mime_type,
        content_disposition_type="inline"
    )
