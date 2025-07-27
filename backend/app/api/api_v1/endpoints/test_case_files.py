"""
Test Case File Management API Endpoints
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.test_case_file import TestCaseFile, FileType

router = APIRouter()

class TestCaseFileCreate(BaseModel):
    name: str
    file_type: str  # "feature" or "yaml"
    content: str = ""
    test_case_id: int
    project_id: int
    creator_id: int = 1

class TestCaseFileUpdate(BaseModel):
    name: str = None
    content: str = None
    is_active: bool = None

class TestCaseFileResponse(BaseModel):
    id: int
    name: str
    file_type: str
    content: str = ""
    test_case_id: int
    project_id: int
    creator_id: int
    is_active: bool = True
    version: str = "v1.0"
    full_name: str = ""
    file_extension: str = ""
    created_at: str = None
    updated_at: str = None
    
    class Config:
        from_attributes = True


@router.get("/")
async def get_test_case_files(
    test_case_id: Optional[int] = Query(None, description="Test case ID filter"),
    project_id: Optional[int] = Query(None, description="Project ID filter"),
    file_type: Optional[str] = Query(None, description="File type filter"),
    db: Session = Depends(get_db)
):
    """Get test case files"""
    query = db.query(TestCaseFile).filter(TestCaseFile.is_active == True)
    
    if test_case_id:
        query = query.filter(TestCaseFile.test_case_id == test_case_id)
    
    if project_id:
        query = query.filter(TestCaseFile.project_id == project_id)
    
    if file_type:
        query = query.filter(TestCaseFile.file_type == FileType(file_type))
    
    files = query.order_by(TestCaseFile.created_at.desc()).all()
    
    result = []
    for file in files:
        result.append({
            "id": file.id,
            "name": file.name,
            "file_type": file.file_type.value,
            "content": file.content or "",
            "test_case_id": file.test_case_id,
            "project_id": file.project_id,
            "creator_id": file.creator_id,
            "is_active": file.is_active,
            "version": file.version,
            "full_name": file.full_name,
            "file_extension": file.file_extension,
            "created_at": file.created_at.isoformat() if file.created_at else None,
            "updated_at": file.updated_at.isoformat() if file.updated_at else None,
        })
    
    return result


@router.post("/")
async def create_test_case_file(file: TestCaseFileCreate, db: Session = Depends(get_db)):
    """Create new test case file"""
    
    # Check if test case exists
    from app.models.test_case import TestCase
    test_case = db.query(TestCase).filter(TestCase.id == file.test_case_id).first()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    # Check name conflict for same test case and file type
    existing = db.query(TestCaseFile).filter(
        TestCaseFile.name == file.name,
        TestCaseFile.test_case_id == file.test_case_id,
        TestCaseFile.file_type == FileType(file.file_type),
        TestCaseFile.is_active == True
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="File name already exists for this test case")
    
    # Create file
    db_file = TestCaseFile(
        name=file.name,
        file_type=FileType(file.file_type),
        content=file.content,
        test_case_id=file.test_case_id,
        project_id=file.project_id,
        creator_id=file.creator_id,
    )
    
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return {
        "id": db_file.id,
        "name": db_file.name,
        "file_type": db_file.file_type.value,
        "content": db_file.content or "",
        "test_case_id": db_file.test_case_id,
        "project_id": db_file.project_id,
        "creator_id": db_file.creator_id,
        "is_active": db_file.is_active,
        "version": db_file.version,
        "full_name": db_file.full_name,
        "file_extension": db_file.file_extension,
        "created_at": db_file.created_at.isoformat() if db_file.created_at else None,
        "updated_at": db_file.updated_at.isoformat() if db_file.updated_at else None,
    }


@router.get("/{file_id}")
async def get_test_case_file(file_id: int, db: Session = Depends(get_db)):
    """Get test case file details"""
    file = db.query(TestCaseFile).filter(TestCaseFile.id == file_id).first()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {
        "id": file.id,
        "name": file.name,
        "file_type": file.file_type.value,
        "content": file.content or "",
        "test_case_id": file.test_case_id,
        "project_id": file.project_id,
        "creator_id": file.creator_id,
        "is_active": file.is_active,
        "version": file.version,
        "full_name": file.full_name,
        "file_extension": file.file_extension,
        "created_at": file.created_at.isoformat() if file.created_at else None,
        "updated_at": file.updated_at.isoformat() if file.updated_at else None,
    }


@router.put("/{file_id}")
async def update_test_case_file(file_id: int, file: TestCaseFileUpdate, db: Session = Depends(get_db)):
    """Update test case file"""
    db_file = db.query(TestCaseFile).filter(TestCaseFile.id == file_id).first()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check name conflict if name is being updated
    if file.name and file.name != db_file.name:
        existing = db.query(TestCaseFile).filter(
            TestCaseFile.name == file.name,
            TestCaseFile.test_case_id == db_file.test_case_id,
            TestCaseFile.file_type == db_file.file_type,
            TestCaseFile.id != file_id,
            TestCaseFile.is_active == True
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="File name already exists for this test case")
    
    # Update fields
    if file.name is not None:
        db_file.name = file.name
    if file.content is not None:
        db_file.content = file.content
    if file.is_active is not None:
        db_file.is_active = file.is_active
    
    db.commit()
    db.refresh(db_file)
    
    return {
        "id": db_file.id,
        "name": db_file.name,
        "file_type": db_file.file_type.value,
        "content": db_file.content or "",
        "test_case_id": db_file.test_case_id,
        "project_id": db_file.project_id,
        "creator_id": db_file.creator_id,
        "is_active": db_file.is_active,
        "version": db_file.version,
        "full_name": db_file.full_name,
        "file_extension": db_file.file_extension,
        "created_at": db_file.created_at.isoformat() if db_file.created_at else None,
        "updated_at": db_file.updated_at.isoformat() if db_file.updated_at else None,
    }


@router.delete("/{file_id}")
async def delete_test_case_file(file_id: int, db: Session = Depends(get_db)):
    """Delete test case file"""
    file = db.query(TestCaseFile).filter(TestCaseFile.id == file_id).first()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Soft delete
    file.is_active = False
    db.commit()
    
    return {"message": "File deleted successfully"}


@router.post("/{file_id}/validate")
async def validate_file_content(file_id: int, db: Session = Depends(get_db)):
    """Validate file content based on file type"""
    file = db.query(TestCaseFile).filter(TestCaseFile.id == file_id).first()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    validation_result = {"valid": True, "errors": []}
    
    if file.file_type == FileType.FEATURE:
        # Basic Gherkin validation
        content = file.content or ""
        lines = content.split('\n')
        
        has_feature = any(line.strip().startswith('Feature:') for line in lines)
        if not has_feature:
            validation_result["valid"] = False
            validation_result["errors"].append("Feature file must contain a 'Feature:' declaration")
        
        has_scenario = any(line.strip().startswith('Scenario:') for line in lines)
        if not has_scenario:
            validation_result["valid"] = False
            validation_result["errors"].append("Feature file should contain at least one 'Scenario:'")
    
    elif file.file_type == FileType.YAML:
        # Basic YAML validation
        try:
            import yaml
            yaml.safe_load(file.content or "")
        except yaml.YAMLError as e:
            validation_result["valid"] = False
            validation_result["errors"].append(f"Invalid YAML syntax: {str(e)}")
    
    return validation_result
