from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.schemas.schemas import ChatRequest, ChatResponse
from backend.ai_engine.groq_client import groq_client
from ..database import get_db
from ..models import ChatMessage

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
def chat_with_mentor(request: ChatRequest, db: Session = Depends(get_db)):
    ai_response = groq_client.chat(request.message, request.context_code)
    
    # Save to history
    db_history = ChatMessage(
        user_message=request.message,
        ai_response=ai_response
    )
    db.add(db_history)
    db.commit()
    
    return ChatResponse(response=ai_response)
