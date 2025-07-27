"""
测试步骤管理相关API端点
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models.test_step import TestStep, StepType

router = APIRouter()

class TestStepCreate(BaseModel):
    name: str
    description: str = None
    type: str  # "action", "verification", "setup"
    parameters: List[dict] = []
    decorator: str = None  # "@given", "@when", "@then"
    usage_example: str = None
    function_name: str = None
    project_id: int
    creator_id: int = 1  # 默认创建者

class TestStepUpdate(BaseModel):
    name: str = None
    description: str = None
    type: str = None
    parameters: List[dict] = None
    decorator: str = None
    usage_example: str = None
    function_name: str = None

class TestStepResponse(BaseModel):
    id: int
    name: str
    description: str = None
    type: str
    parameters: List[dict] = []
    usage_count: int = 0
    decorator: str = None
    usage_example: str = None
    function_name: str = None
    project_id: int
    creator_id: int = None
    created_at: str = None
    updated_at: str = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[TestStepResponse])
async def get_test_steps(
    project_id: Optional[int] = Query(None, description="项目ID过滤"),
    step_type: Optional[str] = Query(None, description="步骤类型过滤"),
    db: Session = Depends(get_db)
):
    """获取测试步骤列表"""
    query = db.query(TestStep)

    if project_id:
        query = query.filter(TestStep.project_id == project_id)

    if step_type:
        try:
            step_type_enum = StepType(step_type)
            query = query.filter(TestStep.type == step_type_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid step type")

    steps = query.order_by(TestStep.usage_count.desc()).all()
    # Convert enum to string for response
    result = []
    for step in steps:
        # Handle parameters - convert string array to dict array if needed
        parameters = step.parameters or []
        if parameters and isinstance(parameters[0], str):
            # Convert string array to dict array for compatibility
            parameters = [{"name": param, "type": "string"} for param in parameters]

        step_dict = {
            "id": step.id,
            "name": step.name,
            "description": step.description or "",
            "type": step.type.value if step.type else "unknown",
            "parameters": parameters,
            "usage_count": step.usage_count or 0,
            "decorator": step.decorator or "",
            "usage_example": step.usage_example or "",
            "function_name": step.function_name or "",
            "project_id": step.project_id,
            "creator_id": step.creator_id or 1,
            "created_at": step.created_at.isoformat() if step.created_at else None,
            "updated_at": step.updated_at.isoformat() if step.updated_at else None,
        }
        result.append(step_dict)
    return result

@router.post("/", response_model=TestStepResponse)
async def create_test_step(step: TestStepCreate, db: Session = Depends(get_db)):
    """创建测试步骤"""
    # 验证步骤类型
    try:
        step_type_enum = StepType(step.type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid step type")

    # 检查同项目下是否有重名步骤
    existing_step = db.query(TestStep).filter(
        TestStep.name == step.name,
        TestStep.project_id == step.project_id
    ).first()
    if existing_step:
        raise HTTPException(status_code=400, detail="Step name already exists in this project")

    # 创建新步骤
    db_step = TestStep(
        name=step.name,
        description=step.description,
        type=step_type_enum,
        parameters=step.parameters,
        decorator=step.decorator,
        usage_example=step.usage_example,
        function_name=step.function_name,
        project_id=step.project_id,
        creator_id=step.creator_id
    )
    db.add(db_step)
    db.commit()
    db.refresh(db_step)

    # Return formatted response
    return {
        "id": db_step.id,
        "name": db_step.name,
        "description": db_step.description or "",
        "type": db_step.type.value,
        "parameters": db_step.parameters or [],
        "usage_count": db_step.usage_count or 0,
        "decorator": db_step.decorator or "",
        "usage_example": db_step.usage_example or "",
        "function_name": db_step.function_name or "",
        "project_id": db_step.project_id,
        "creator_id": db_step.creator_id or 1,
        "created_at": db_step.created_at.isoformat() if db_step.created_at else None,
        "updated_at": db_step.updated_at.isoformat() if db_step.updated_at else None,
    }

@router.get("/{step_id}", response_model=TestStepResponse)
async def get_test_step(step_id: int, db: Session = Depends(get_db)):
    """获取测试步骤详情"""
    step = db.query(TestStep).filter(TestStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Test step not found")
    return step

@router.put("/{step_id}", response_model=TestStepResponse)
async def update_test_step(step_id: int, step: TestStepUpdate, db: Session = Depends(get_db)):
    """更新测试步骤"""
    db_step = db.query(TestStep).filter(TestStep.id == step_id).first()
    if not db_step:
        raise HTTPException(status_code=404, detail="Test step not found")

    # 更新字段
    if step.name is not None:
        # 检查名称冲突
        existing = db.query(TestStep).filter(
            TestStep.name == step.name,
            TestStep.project_id == db_step.project_id,
            TestStep.id != step_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Step name already exists in this project")
        db_step.name = step.name

    if step.description is not None:
        db_step.description = step.description

    if step.type is not None:
        try:
            db_step.type = StepType(step.type)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid step type")

    if step.parameters is not None:
        db_step.parameters = step.parameters

    if step.decorator is not None:
        db_step.decorator = step.decorator

    if step.usage_example is not None:
        db_step.usage_example = step.usage_example

    if step.function_name is not None:
        db_step.function_name = step.function_name

    db.commit()
    db.refresh(db_step)
    return db_step

@router.delete("/{step_id}")
async def delete_test_step(step_id: int, db: Session = Depends(get_db)):
    """删除测试步骤"""
    db_step = db.query(TestStep).filter(TestStep.id == step_id).first()
    if not db_step:
        raise HTTPException(status_code=404, detail="Test step not found")

    db.delete(db_step)
    db.commit()
    return {"message": "Test step deleted successfully"}
