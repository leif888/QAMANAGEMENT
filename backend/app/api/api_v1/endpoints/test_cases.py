"""
测试用例管理相关API端点 - 支持树形结构
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models.test_case import TestCase, Priority, TestCaseStatus

router = APIRouter()

class TestCaseCreate(BaseModel):
    name: str
    description: str = None
    priority: str = "MEDIUM"  # "HIGH", "MEDIUM", "LOW"
    gherkin_content: str = None
    is_automated: bool = False
    is_folder: bool = False
    parent_id: int = None
    project_id: int
    creator_id: int = 1

class TestCaseUpdate(BaseModel):
    name: str = None
    description: str = None
    priority: str = None
    gherkin_content: str = None
    is_automated: bool = None
    is_folder: bool = None

class TestCaseResponse(BaseModel):
    id: int
    name: str
    description: str = None
    priority: str
    status: str
    gherkin_content: str = None
    is_automated: bool = False
    is_folder: bool = False
    parent_id: int = None
    sort_order: int = 0
    project_id: int
    creator_id: int
    full_path: str = None
    children: List['TestCaseResponse'] = []
    created_at: str = None
    updated_at: str = None

    class Config:
        from_attributes = True

# 解决前向引用问题
TestCaseResponse.model_rebuild()

@router.get("/tree", response_model=List[TestCaseResponse])
async def get_test_cases_tree(
    project_id: Optional[int] = Query(None, description="项目ID过滤"),
    parent_id: Optional[int] = Query(None, description="父节点ID，null获取根节点"),
    db: Session = Depends(get_db)
):
    """获取测试用例树形结构"""
    query = db.query(TestCase)

    if project_id:
        query = query.filter(TestCase.project_id == project_id)

    if parent_id is None:
        query = query.filter(TestCase.parent_id.is_(None))
    else:
        query = query.filter(TestCase.parent_id == parent_id)

    cases = query.order_by(TestCase.sort_order, TestCase.created_at).all()

    # Helper function to convert case to dict
    def case_to_dict(case):
        return {
            "id": case.id,
            "name": case.name,
            "description": case.description,
            "priority": case.priority.value if case.priority else "medium",
            "status": case.status.value if case.status else "draft",
            "gherkin_content": case.gherkin_content,
            "is_automated": case.is_automated or False,
            "is_folder": case.is_folder or False,
            "parent_id": case.parent_id,
            "sort_order": case.sort_order or 0,
            "project_id": case.project_id,
            "creator_id": case.creator_id,
            "full_path": case.name,  # Simplified for now
            "created_at": case.created_at.isoformat() if case.created_at else None,
            "updated_at": case.updated_at.isoformat() if case.updated_at else None,
        }

    # Recursively load children
    def load_children(case):
        children = db.query(TestCase).filter(
            TestCase.parent_id == case.id
        ).order_by(TestCase.sort_order, TestCase.created_at).all()

        result = []
        for child in children:
            child_dict = case_to_dict(child)
            child_dict['children'] = load_children(child)
            result.append(child_dict)
        return result

    result = []
    for case in cases:
        case_dict = case_to_dict(case)
        case_dict['children'] = load_children(case)
        result.append(case_dict)

    return result

@router.get("/")
async def get_test_cases(
    project_id: Optional[int] = Query(None, description="项目ID过滤"),
    is_folder: Optional[bool] = Query(None, description="是否为文件夹"),
    db: Session = Depends(get_db)
):
    """获取测试用例列表（平铺结构）"""
    query = db.query(TestCase)

    if project_id:
        query = query.filter(TestCase.project_id == project_id)

    if is_folder is not None:
        query = query.filter(TestCase.is_folder == is_folder)

    cases = query.order_by(TestCase.created_at.desc()).all()

    # Convert to simple dict format
    result = []
    for case in cases:
        case_dict = {
            "id": case.id,
            "name": case.name,
            "description": case.description or "",
            "priority": case.priority.value if case.priority else "medium",
            "status": case.status.value if case.status else "draft",
            "gherkin_content": case.gherkin_content or "",
            "is_automated": bool(case.is_automated) if hasattr(case, 'is_automated') else False,
            "is_folder": bool(case.is_folder) if hasattr(case, 'is_folder') else False,
            "parent_id": case.parent_id if hasattr(case, 'parent_id') else None,
            "sort_order": case.sort_order if hasattr(case, 'sort_order') else 0,
            "project_id": case.project_id,
            "creator_id": case.creator_id,
            "full_path": case.name,
            "children": [],
            "created_at": case.created_at.isoformat() if case.created_at else None,
            "updated_at": case.updated_at.isoformat() if case.updated_at else None,
        }
        result.append(case_dict)
    return result

@router.post("/", response_model=TestCaseResponse)
async def create_test_case(case: TestCaseCreate, db: Session = Depends(get_db)):
    """创建测试用例"""
    # 验证优先级
    try:
        priority_enum = Priority(case.priority)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid priority")

    # 验证父节点存在性
    if case.parent_id:
        parent = db.query(TestCase).filter(TestCase.id == case.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent case not found")
        if not parent.is_folder:
            raise HTTPException(status_code=400, detail="Parent must be a folder")

    # 检查同级名称冲突
    existing = db.query(TestCase).filter(
        TestCase.name == case.name,
        TestCase.parent_id == case.parent_id,
        TestCase.project_id == case.project_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Test case name already exists at this level")

    # 创建测试用例
    db_case = TestCase(
        name=case.name,
        description=case.description,
        priority=priority_enum,
        gherkin_content=case.gherkin_content,
        is_automated=case.is_automated,
        is_folder=case.is_folder,
        parent_id=case.parent_id,
        project_id=case.project_id,
        creator_id=case.creator_id
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)

    response = TestCaseResponse.from_orm(db_case)
    response.full_path = db_case.full_path
    return response

@router.get("/{case_id}", response_model=TestCaseResponse)
async def get_test_case(case_id: int, db: Session = Depends(get_db)):
    """获取测试用例详情"""
    case = db.query(TestCase).filter(TestCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Test case not found")

    response = TestCaseResponse.from_orm(case)
    response.full_path = case.full_path
    return response

@router.put("/{case_id}", response_model=TestCaseResponse)
async def update_test_case(case_id: int, case: TestCaseUpdate, db: Session = Depends(get_db)):
    """更新测试用例"""
    db_case = db.query(TestCase).filter(TestCase.id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    # 更新字段
    if case.name is not None:
        # 检查名称冲突
        existing = db.query(TestCase).filter(
            TestCase.name == case.name,
            TestCase.parent_id == db_case.parent_id,
            TestCase.project_id == db_case.project_id,
            TestCase.id != case_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Test case name already exists at this level")
        db_case.name = case.name

    if case.description is not None:
        db_case.description = case.description

    if case.priority is not None:
        try:
            db_case.priority = Priority(case.priority)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid priority")

    if case.gherkin_content is not None:
        db_case.gherkin_content = case.gherkin_content

    if case.is_automated is not None:
        db_case.is_automated = case.is_automated

    if case.is_folder is not None:
        db_case.is_folder = case.is_folder

    db.commit()
    db.refresh(db_case)

    response = TestCaseResponse.from_orm(db_case)
    response.full_path = db_case.full_path
    return response

@router.delete("/{case_id}")
async def delete_test_case(case_id: int, db: Session = Depends(get_db)):
    """删除测试用例"""
    db_case = db.query(TestCase).filter(TestCase.id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    # 检查是否有子用例
    children = db.query(TestCase).filter(TestCase.parent_id == case_id).count()
    if children > 0:
        raise HTTPException(status_code=400, detail="Cannot delete test case with children")

    db.delete(db_case)
    db.commit()
    return {"message": "Test case deleted successfully"}
