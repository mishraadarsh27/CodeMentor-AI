from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from backend.schemas.schemas import HistoryResponse
from backend.database.config import get_db
from backend.models.models import CodeHistory

router = APIRouter()

@router.get("/history", response_model=List[HistoryResponse])
def get_history(db: Session = Depends(get_db)):
    history = db.query(CodeHistory).order_by(CodeHistory.created_at.desc()).all()
    return history
