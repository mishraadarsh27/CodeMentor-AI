from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Analysis & Chat ---
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

# --- Project & IDE ---
class FileBase(BaseModel):
    name: str
    content: str = ""
    language: str = "python"
    parent_folder_id: Optional[int] = None

class FileCreate(FileBase):
    project_id: int

class FileResponse(FileBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    files: List[FileResponse] = []

    class Config:
        from_attributes = True

# --- Execution ---
class ExecutionRequest(BaseModel):
    code: str
    language: str
    stdin: Optional[str] = ""

class ExecutionResponse(BaseModel):
    stdout: str
    stderr: str
    output: str
    exit_code: int
    signal: Optional[str]
    language: str
    version: str

# --- User & Stats ---
class UserStats(BaseModel):
    current_streak: int
    max_streak: int
    total_analyses: int
    total_projects: int
