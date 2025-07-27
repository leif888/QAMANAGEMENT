"""
项目管理相关API端点
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.core.database import get_db
from app.models.project import Project, ProjectStatus

router = APIRouter()

class ProjectCreate(BaseModel):
    name: str
    description: str = None
    status: str = "active"

class ProjectUpdate(BaseModel):
    name: str = None
    description: str = None
    status: str = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str = None
    status: str
    created_at: str = None
    updated_at: str = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProjectResponse])
async def get_projects(db: Session = Depends(get_db)):
    """Get project list"""
    projects = db.query(Project).all()
    # Convert enum to string for response
    result = []
    for project in projects:
        project_dict = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status.value if project.status else "unknown",
            "created_at": project.created_at.isoformat() if project.created_at else None,
            "updated_at": project.updated_at.isoformat() if project.updated_at else None,
        }
        result.append(project_dict)
    return result

@router.post("/", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """Create new project"""
    # Check if project name already exists
    existing_project = db.query(Project).filter(Project.name == project.name).first()
    if existing_project:
        raise HTTPException(status_code=400, detail="Project name already exists")

    # Create new project
    status_enum = ProjectStatus.ACTIVE
    if project.status == "paused":
        status_enum = ProjectStatus.PAUSED
    elif project.status == "completed":
        status_enum = ProjectStatus.COMPLETED

    db_project = Project(
        name=project.name,
        description=project.description,
        status=status_enum
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # Return formatted response
    return {
        "id": db_project.id,
        "name": db_project.name,
        "description": db_project.description,
        "status": db_project.status.value,
        "created_at": db_project.created_at.isoformat() if db_project.created_at else None,
        "updated_at": db_project.updated_at.isoformat() if db_project.updated_at else None,
    }

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    """获取项目详情"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: int, project: ProjectUpdate, db: Session = Depends(get_db)):
    """更新项目"""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 更新字段
    if project.name is not None:
        # 检查名称是否与其他项目冲突
        existing = db.query(Project).filter(
            Project.name == project.name,
            Project.id != project_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Project name already exists")
        db_project.name = project.name

    if project.description is not None:
        db_project.description = project.description

    if project.status is not None:
        db_project.status = ProjectStatus.ACTIVE if project.status == "active" else ProjectStatus.PAUSED

    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/{project_id}")
async def delete_project(project_id: int, db: Session = Depends(get_db)):
    """删除项目"""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted successfully"}
