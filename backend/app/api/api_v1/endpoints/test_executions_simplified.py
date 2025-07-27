"""
Test Execution Management API Endpoints - Simplified Version
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.test_execution import TestExecution

router = APIRouter()

class TestExecutionCreate(BaseModel):
    name: str
    description: str = ""
    test_case_ids: List[int] = []
    environment: str = "test"
    browser: str = "chromium"
    headless: bool = True
    executor: str = "system"
    status: str = "pending"
    notes: str = ""

class TestExecutionResponse(BaseModel):
    id: int
    name: str
    description: str = ""
    test_case_ids: List[int] = []
    status: str
    progress: int = 0
    pass_rate: int = 0
    environment: str
    browser: str
    headless: bool
    executor: str
    executed_at: str = None
    created_at: str = None
    updated_at: str = None
    
    class Config:
        from_attributes = True


@router.get("/")
async def get_test_executions(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get test execution records list"""
    query = db.query(TestExecution)

    if status:
        query = query.filter(TestExecution.status == status)

    executions = query.order_by(TestExecution.created_at.desc()).all()

    result = []
    for execution in executions:
        execution_dict = {
            "id": execution.id,
            "name": execution.name,
            "description": execution.description or "",
            "test_case_ids": [],  # Simplified for now
            "status": execution.status.value if hasattr(execution.status, 'value') else str(execution.status),
            "progress": execution.progress or 0,
            "pass_rate": 0,  # Calculate this based on results
            "environment": execution.environment or "test",
            "browser": execution.browser or "chromium",
            "headless": execution.headless if hasattr(execution, 'headless') else True,
            "executor": "system",  # Simplified
            "executed_at": execution.created_at.isoformat() if execution.created_at else None,
            "created_at": execution.created_at.isoformat() if execution.created_at else None,
            "updated_at": execution.updated_at.isoformat() if execution.updated_at else None,
        }
        result.append(execution_dict)

    return result


@router.post("/")
async def create_test_execution(
    execution: TestExecutionCreate,
    db: Session = Depends(get_db)
):
    """Create test execution task"""
    
    # Create simple execution record
    db_execution = TestExecution(
        name=execution.name,
        description=execution.description,
        test_case_id=execution.test_case_ids[0] if execution.test_case_ids else None,
        status=execution.status,
        progress=0,
        environment=execution.environment,
        browser=execution.browser,
        headless=execution.headless,
        executor_id=1,  # Default executor
        notes=execution.notes,
    )
    
    db.add(db_execution)
    db.commit()
    db.refresh(db_execution)
    
    return {
        "id": db_execution.id,
        "name": db_execution.name,
        "description": db_execution.description or "",
        "test_case_ids": execution.test_case_ids,
        "status": db_execution.status.value if hasattr(db_execution.status, 'value') else str(db_execution.status),
        "progress": db_execution.progress or 0,
        "pass_rate": 0,
        "environment": db_execution.environment or "test",
        "browser": db_execution.browser or "chromium",
        "headless": db_execution.headless if hasattr(db_execution, 'headless') else True,
        "executor": execution.executor,
        "executed_at": db_execution.created_at.isoformat() if db_execution.created_at else None,
        "created_at": db_execution.created_at.isoformat() if db_execution.created_at else None,
        "updated_at": db_execution.updated_at.isoformat() if db_execution.updated_at else None,
    }


@router.get("/{execution_id}")
async def get_test_execution(execution_id: int, db: Session = Depends(get_db)):
    """Get test execution details"""
    execution = db.query(TestExecution).filter(TestExecution.id == execution_id).first()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Test execution not found")
    
    return {
        "id": execution.id,
        "name": execution.name,
        "description": execution.description or "",
        "test_case_ids": [],
        "status": execution.status.value if hasattr(execution.status, 'value') else str(execution.status),
        "progress": execution.progress or 0,
        "pass_rate": 0,
        "environment": execution.environment or "test",
        "browser": execution.browser or "chromium",
        "headless": execution.headless if hasattr(execution, 'headless') else True,
        "executor": "system",
        "executed_at": execution.created_at.isoformat() if execution.created_at else None,
        "created_at": execution.created_at.isoformat() if execution.created_at else None,
        "updated_at": execution.updated_at.isoformat() if execution.updated_at else None,
    }


@router.put("/{execution_id}")
async def update_test_execution(
    execution_id: int,
    execution: TestExecutionCreate,
    db: Session = Depends(get_db)
):
    """Update test execution"""
    db_execution = db.query(TestExecution).filter(TestExecution.id == execution_id).first()
    
    if not db_execution:
        raise HTTPException(status_code=404, detail="Test execution not found")
    
    # Update fields
    db_execution.name = execution.name
    db_execution.description = execution.description
    db_execution.status = execution.status
    db_execution.environment = execution.environment
    db_execution.browser = execution.browser
    db_execution.headless = execution.headless
    db_execution.notes = execution.notes
    
    db.commit()
    db.refresh(db_execution)
    
    return {
        "id": db_execution.id,
        "name": db_execution.name,
        "description": db_execution.description or "",
        "test_case_ids": execution.test_case_ids,
        "status": db_execution.status.value if hasattr(db_execution.status, 'value') else str(db_execution.status),
        "progress": db_execution.progress or 0,
        "pass_rate": 0,
        "environment": db_execution.environment or "test",
        "browser": db_execution.browser or "chromium",
        "headless": db_execution.headless if hasattr(db_execution, 'headless') else True,
        "executor": execution.executor,
        "executed_at": db_execution.created_at.isoformat() if db_execution.created_at else None,
        "created_at": db_execution.created_at.isoformat() if db_execution.created_at else None,
        "updated_at": db_execution.updated_at.isoformat() if db_execution.updated_at else None,
    }


@router.delete("/{execution_id}")
async def delete_test_execution(execution_id: int, db: Session = Depends(get_db)):
    """Delete test execution"""
    execution = db.query(TestExecution).filter(TestExecution.id == execution_id).first()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Test execution not found")
    
    db.delete(execution)
    db.commit()
    
    return {"message": "Test execution deleted successfully"}
