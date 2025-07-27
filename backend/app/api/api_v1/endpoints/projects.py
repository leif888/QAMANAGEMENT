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
    """获取项目列表"""
    projects = db.query(Project).all()
    return projects

@router.post("/", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """创建新项目"""
    # 检查项目名称是否已存在
    existing_project = db.query(Project).filter(Project.name == project.name).first()
    if existing_project:
        raise HTTPException(status_code=400, detail="Project name already exists")

    # 创建新项目
    db_project = Project(
        name=project.name,
        description=project.description,
        status=ProjectStatus.ACTIVE if project.status == "active" else ProjectStatus.PAUSED
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

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
