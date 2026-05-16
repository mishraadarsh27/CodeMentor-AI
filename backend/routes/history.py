from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from backend.schemas.schemas import HistoryResponse
from ..database import get_db
from ..models import Analysis

router = APIRouter()

@router.get("/history", response_model=List[HistoryResponse])
def get_history(db: Session = Depends(get_db)):
    history = db.query(Analysis).order_by(Analysis.created_at.desc()).all()
    return history
