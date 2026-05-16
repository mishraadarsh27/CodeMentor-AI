from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from sqlalchemy.sql import func
from backend.database.config import Base

class CodeHistory(Base):
    __tablename__ = "code_history"

    id = Column(Integer, primary_key=True, index=True)
    code_content = Column(Text, nullable=False)
    language = Column(String(50), default="python")
    analysis_result = Column(Text, nullable=True) # Stored as JSON string
    score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
