from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from backend.schemas.schemas import CodeAnalyzeRequest, CodeAnalysisResult
from backend.analyzers.code_analyzer import CodeAnalyzer
from backend.ai_engine.groq_client import groq_client
from ..database import get_db
from ..models import Analysis

router = APIRouter()

@router.post("/analyze", response_model=CodeAnalysisResult)
def analyze_code(request: CodeAnalyzeRequest, db: Session = Depends(get_db)):
    # 1. Basic Analysis
    syntax_errors = CodeAnalyzer.check_syntax(request.code)
    linting_issues = []
    if not syntax_errors:
        linting_issues = CodeAnalyzer.check_linting(request.code)

    # 2. AI Analysis (Now returns a dict with fallbacks handled)
    ai_data = groq_client.analyze_code(request.code, syntax_errors, linting_issues)
    
    result = CodeAnalysisResult(
        score=ai_data.get("score", 0),
        syntax_errors=syntax_errors,
        linting_issues=linting_issues,
        explanation=ai_data.get("explanation", "No explanation provided."),
        corrected_code=ai_data.get("corrected_code", request.code),
        complexity=ai_data.get("complexity", {"time": "Unknown", "space": "Unknown", "explanation": "Not provided"}),
        optimization_suggestions=ai_data.get("optimization_suggestions", []),
        learning_recommendations=ai_data.get("learning_recommendations", [])
    )

    # Save to history
    db_history = Analysis(
        code_content=request.code,
        language=request.language,
        analysis_result=json.dumps(result.dict()),
        score=result.score
    )
    db.add(db_history)
    db.commit()
    
    return result
