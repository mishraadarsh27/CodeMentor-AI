from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from backend.schemas.schemas import HistoryResponse
from ..database import get_db
from ..models import Analysis, User
from ..auth import get_current_user

router = APIRouter()

@router.get("/history", response_model=List[HistoryResponse])
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    history = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).all()
    return history
