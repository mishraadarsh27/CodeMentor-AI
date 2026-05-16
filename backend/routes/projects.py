from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Project, File, User
from ..schemas.schemas import ProjectCreate, ProjectResponse, FileCreate, FileResponse
from ..auth import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])

# --- Project Endpoints ---
@router.post("/", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_project = Project(**project.dict(), user_id=current_user.id)
    db.add(db_project)
    
    # Update user stats
    current_user.total_projects += 1
    
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Project).filter(Project.user_id == current_user.id).all()

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}

# --- File Endpoints ---
@router.post("/{project_id}/files", response_model=FileResponse)
def create_file(project_id: int, file: FileCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify project ownership
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_file = File(**file.dict())
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

@router.put("/files/{file_id}", response_model=FileResponse)
def update_file(file_id: int, file_update: FileCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_file = db.query(File).join(Project).filter(File.id == file_id, Project.user_id == current_user.id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    db_file.name = file_update.name
    db_file.content = file_update.content
    db_file.language = file_update.language
    
    db.commit()
    db.refresh(db_file)
    return db_file
