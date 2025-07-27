"""
Test Case Management API Endpoints - Simplified Version
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.test_case import TestCase

router = APIRouter()

class TestCaseCreate(BaseModel):
    name: str
    tags: str = ""  # Comma separated tags
    gherkin_content: str = ""
    is_folder: bool = False
    parent_id: int = None
    creator_id: int = 1

class TestCaseUpdate(BaseModel):
    name: str = None
    tags: str = None
    gherkin_content: str = None
    is_folder: bool = None

class TestCaseResponse(BaseModel):
    id: int
    name: str
    tags: str = ""
    gherkin_content: str = ""
    is_folder: bool = False
    parent_id: int = None
    sort_order: int = 0
    creator_id: int
    full_path: str = ""
    children: List['TestCaseResponse'] = []
    files: List[dict] = []  # Include files in response
    created_at: str = None
    updated_at: str = None
    
    class Config:
        from_attributes = True

# Resolve forward references
TestCaseResponse.model_rebuild()

@router.get("/tree")
async def get_test_cases_tree(
    parent_id: Optional[int] = Query(None, description="Parent node ID, null for root nodes"),
    db: Session = Depends(get_db)
):
    """Get test cases tree structure"""
    query = db.query(TestCase)

    if parent_id is None:
        query = query.filter(TestCase.parent_id.is_(None))
    else:
        query = query.filter(TestCase.parent_id == parent_id)

    cases = query.order_by(TestCase.sort_order, TestCase.created_at).all()

    def build_tree_node(case):
        children = db.query(TestCase).filter(
            TestCase.parent_id == case.id
        ).order_by(TestCase.sort_order, TestCase.created_at).all()
        
        # Load files for this test case
        files = []
        if not case.is_folder:
            try:
                from app.models.test_case_file import TestCaseFile
                case_files = db.query(TestCaseFile).filter(TestCaseFile.test_case_id == case.id).all()
                files = [{
                    "id": f.id,
                    "name": f.name,
                    "file_type": f.file_type,
                    "full_name": f.full_name,
                    "content": f.content or ""
                } for f in case_files]
            except:
                files = []

        return {
            "id": case.id,
            "name": case.name,
            "tags": case.tags or "",
            "gherkin_content": case.gherkin_content or "",
            "is_folder": case.is_folder or False,
            "parent_id": case.parent_id,
            "sort_order": case.sort_order or 0,
            "creator_id": case.creator_id,
            "full_path": case.name,  # Simplified for now
            "children": [build_tree_node(child) for child in children],
            "files": files,
            "created_at": case.created_at.isoformat() if case.created_at else None,
            "updated_at": case.updated_at.isoformat() if case.updated_at else None,
        }

    result = []
    for case in cases:
        result.append(build_tree_node(case))

    return result


@router.get("/")
async def get_test_cases(
    is_folder: Optional[bool] = Query(None, description="Whether it's a folder"),
    db: Session = Depends(get_db)
):
    """Get test cases list (flat structure)"""
    query = db.query(TestCase)

    if is_folder is not None:
        query = query.filter(TestCase.is_folder == is_folder)

    cases = query.order_by(TestCase.created_at.desc()).all()

    result = []
    for case in cases:
        case_dict = {
            "id": case.id,
            "name": case.name,
            "tags": case.tags or "",
            "gherkin_content": case.gherkin_content or "",
            "is_folder": bool(case.is_folder) if hasattr(case, 'is_folder') else False,
            "parent_id": case.parent_id if hasattr(case, 'parent_id') else None,
            "sort_order": case.sort_order if hasattr(case, 'sort_order') else 0,
            "creator_id": case.creator_id,
            "full_path": case.name,
            "children": [],
            "files": [],
            "created_at": case.created_at.isoformat() if case.created_at else None,
            "updated_at": case.updated_at.isoformat() if case.updated_at else None,
        }
        result.append(case_dict)

    return result


@router.post("/")
async def create_test_case(case: TestCaseCreate, db: Session = Depends(get_db)):
    """Create new test case"""
    
    # Check for name conflicts at the same level
    existing = db.query(TestCase).filter(
        TestCase.name == case.name,
        TestCase.parent_id == case.parent_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Test case name already exists at this level")

    # Create test case
    db_case = TestCase(
        name=case.name,
        tags=case.tags,
        gherkin_content=case.gherkin_content,
        is_folder=case.is_folder,
        parent_id=case.parent_id,
        creator_id=case.creator_id
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)

    return {
        "id": db_case.id,
        "name": db_case.name,
        "tags": db_case.tags or "",
        "gherkin_content": db_case.gherkin_content or "",
        "is_folder": db_case.is_folder or False,
        "parent_id": db_case.parent_id,
        "sort_order": db_case.sort_order or 0,
        "creator_id": db_case.creator_id,
        "full_path": db_case.name,
        "children": [],
        "files": [],
        "created_at": db_case.created_at.isoformat() if db_case.created_at else None,
        "updated_at": db_case.updated_at.isoformat() if db_case.updated_at else None,
    }


@router.get("/{case_id}")
async def get_test_case(case_id: int, db: Session = Depends(get_db)):
    """Get test case details"""
    case = db.query(TestCase).filter(TestCase.id == case_id).first()
    
    if not case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    return {
        "id": case.id,
        "name": case.name,
        "tags": case.tags or "",
        "gherkin_content": case.gherkin_content or "",
        "is_folder": case.is_folder or False,
        "parent_id": case.parent_id,
        "sort_order": case.sort_order or 0,
        "creator_id": case.creator_id,
        "full_path": case.name,
        "children": [],
        "files": [],
        "created_at": case.created_at.isoformat() if case.created_at else None,
        "updated_at": case.updated_at.isoformat() if case.updated_at else None,
    }


@router.put("/{case_id}")
async def update_test_case(case_id: int, case: TestCaseUpdate, db: Session = Depends(get_db)):
    """Update test case"""
    db_case = db.query(TestCase).filter(TestCase.id == case_id).first()
    
    if not db_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    if case.name is not None:
        # Check for name conflicts
        existing = db.query(TestCase).filter(
            TestCase.name == case.name,
            TestCase.parent_id == db_case.parent_id,
            TestCase.id != case_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Test case name already exists at this level")
        db_case.name = case.name

    if case.tags is not None:
        db_case.tags = case.tags
    if case.gherkin_content is not None:
        db_case.gherkin_content = case.gherkin_content

    if case.is_folder is not None:
        db_case.is_folder = case.is_folder

    db.commit()
    db.refresh(db_case)

    return {
        "id": db_case.id,
        "name": db_case.name,
        "tags": db_case.tags or "",
        "gherkin_content": db_case.gherkin_content or "",
        "is_folder": db_case.is_folder or False,
        "parent_id": db_case.parent_id,
        "sort_order": db_case.sort_order or 0,
        "creator_id": db_case.creator_id,
        "full_path": db_case.name,
        "children": [],
        "files": [],
        "created_at": db_case.created_at.isoformat() if db_case.created_at else None,
        "updated_at": db_case.updated_at.isoformat() if db_case.updated_at else None,
    }


@router.delete("/{case_id}")
async def delete_test_case(case_id: int, db: Session = Depends(get_db)):
    """Delete test case"""
    case = db.query(TestCase).filter(TestCase.id == case_id).first()
    
    if not case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    # Check if has children
    children_count = db.query(TestCase).filter(TestCase.parent_id == case_id).count()
    if children_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete test case with children")
    
    db.delete(case)
    db.commit()
    
    return {"message": "Test case deleted successfully"}
