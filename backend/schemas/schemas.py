from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class CodeAnalyzeRequest(BaseModel):
    code: str
    language: str = "python"

class Complexity(BaseModel):
    time: str
    space: str
    explanation: str

class CodeAnalysisResult(BaseModel):
    score: int
    syntax_errors: List[str]
    linting_issues: List[str]
    explanation: str
    corrected_code: str
    complexity: Complexity
    optimization_suggestions: List[str]
    learning_recommendations: List[str]

class ChatRequest(BaseModel):
    message: str
    context_code: Optional[str] = None

class ChatResponse(BaseModel):
    response: str

class HistoryResponse(BaseModel):
    id: int
    code_content: str
    language: str
    score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True
