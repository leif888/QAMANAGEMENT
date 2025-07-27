"""
测试数据管理相关API端点 - 支持树形结构和Jinja2模板
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.core.database import get_db
from app.models.test_data import TestDataNode, DataNodeType

router = APIRouter()

class TestDataNodeCreate(BaseModel):
    name: str
    description: str = None
    node_type: str  # "folder", "template", "data"
    parent_id: int = None
    data_content: Dict[str, Any] = {}
    jinja2_template: str = None
    template_variables: Dict[str, Any] = {}
    project_id: int
    creator_id: int = 1

class TestDataNodeUpdate(BaseModel):
    name: str = None
    description: str = None
    node_type: str = None
    data_content: Dict[str, Any] = None
    jinja2_template: str = None
    template_variables: Dict[str, Any] = None
    is_active: bool = None

class TestDataNodeResponse(BaseModel):
    id: int
    name: str
    description: str = None
    node_type: str
    parent_id: int = None
    sort_order: int = 0
    data_content: Dict[str, Any] = {}
    jinja2_template: str = None
    template_variables: Dict[str, Any] = {}
    is_active: bool = True
    version: str = "v1.0"
    project_id: int
    creator_id: int = None
    full_path: str = None
    children: List['TestDataNodeResponse'] = []
    created_at: str = None
    updated_at: str = None

    class Config:
        from_attributes = True

# 解决前向引用问题
TestDataNodeResponse.model_rebuild()

@router.get("/tree", response_model=List[TestDataNodeResponse])
async def get_test_data_tree(
    project_id: Optional[int] = Query(None, description="项目ID过滤"),
    parent_id: Optional[int] = Query(None, description="父节点ID，null获取根节点"),
    db: Session = Depends(get_db)
):
    """获取测试数据树形结构"""
    query = db.query(TestDataNode)

    if project_id:
        query = query.filter(TestDataNode.project_id == project_id)

    if parent_id is None:
        query = query.filter(TestDataNode.parent_id.is_(None))
    else:
        query = query.filter(TestDataNode.parent_id == parent_id)

    nodes = query.filter(TestDataNode.is_active == True).order_by(TestDataNode.sort_order).all()

    # 递归加载子节点
    def load_children(node):
        children = db.query(TestDataNode).filter(
            TestDataNode.parent_id == node.id,
            TestDataNode.is_active == True
        ).order_by(TestDataNode.sort_order).all()

        result = []
        for child in children:
            child_dict = TestDataNodeResponse.from_orm(child).dict()
            child_dict['full_path'] = child.full_path
            child_dict['children'] = load_children(child)
            result.append(child_dict)
        return result

    result = []
    for node in nodes:
        node_dict = TestDataNodeResponse.from_orm(node).dict()
        node_dict['full_path'] = node.full_path
        node_dict['children'] = load_children(node)
        result.append(node_dict)

    return result

@router.post("/nodes", response_model=TestDataNodeResponse)
async def create_test_data_node(node: TestDataNodeCreate, db: Session = Depends(get_db)):
    """创建测试数据节点"""
    # 验证节点类型
    if node.node_type not in ["folder", "template", "data"]:
        raise HTTPException(status_code=400, detail="Invalid node type")

    # 验证父节点存在性
    if node.parent_id:
        parent = db.query(TestDataNode).filter(TestDataNode.id == node.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent node not found")
        if parent.node_type != "folder":
            raise HTTPException(status_code=400, detail="Parent must be a folder node")

    # 检查同级节点名称冲突
    existing = db.query(TestDataNode).filter(
        TestDataNode.name == node.name,
        TestDataNode.parent_id == node.parent_id,
        TestDataNode.project_id == node.project_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Node name already exists at this level")

    # 创建节点
    db_node = TestDataNode(
        name=node.name,
        description=node.description,
        node_type=node.node_type,
        parent_id=node.parent_id,
        data_content=node.data_content,
        jinja2_template=node.jinja2_template,
        template_variables=node.template_variables,
        project_id=node.project_id,
        creator_id=node.creator_id
    )
    db.add(db_node)
    db.commit()
    db.refresh(db_node)

    response = TestDataNodeResponse.from_orm(db_node)
    response.full_path = db_node.full_path
    return response

@router.get("/nodes/{node_id}", response_model=TestDataNodeResponse)
async def get_test_data_node(node_id: int, db: Session = Depends(get_db)):
    """获取测试数据节点详情"""
    node = db.query(TestDataNode).filter(TestDataNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    response = TestDataNodeResponse.from_orm(node)
    response.full_path = node.full_path
    return response

@router.put("/nodes/{node_id}", response_model=TestDataNodeResponse)
async def update_test_data_node(node_id: int, node: TestDataNodeUpdate, db: Session = Depends(get_db)):
    """更新测试数据节点"""
    db_node = db.query(TestDataNode).filter(TestDataNode.id == node_id).first()
    if not db_node:
        raise HTTPException(status_code=404, detail="Node not found")

    # 更新字段
    if node.name is not None:
        # 检查名称冲突
        existing = db.query(TestDataNode).filter(
            TestDataNode.name == node.name,
            TestDataNode.parent_id == db_node.parent_id,
            TestDataNode.project_id == db_node.project_id,
            TestDataNode.id != node_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Node name already exists at this level")
        db_node.name = node.name

    if node.description is not None:
        db_node.description = node.description

    if node.node_type is not None:
        if node.node_type not in ["folder", "template", "data"]:
            raise HTTPException(status_code=400, detail="Invalid node type")
        db_node.node_type = node.node_type

    if node.data_content is not None:
        db_node.data_content = node.data_content

    if node.jinja2_template is not None:
        db_node.jinja2_template = node.jinja2_template

    if node.template_variables is not None:
        db_node.template_variables = node.template_variables

    if node.is_active is not None:
        db_node.is_active = node.is_active

    db.commit()
    db.refresh(db_node)

    response = TestDataNodeResponse.from_orm(db_node)
    response.full_path = db_node.full_path
    return response

@router.delete("/nodes/{node_id}")
async def delete_test_data_node(node_id: int, db: Session = Depends(get_db)):
    """删除测试数据节点"""
    db_node = db.query(TestDataNode).filter(TestDataNode.id == node_id).first()
    if not db_node:
        raise HTTPException(status_code=404, detail="Node not found")

    # 检查是否有子节点
    children = db.query(TestDataNode).filter(TestDataNode.parent_id == node_id).count()
    if children > 0:
        raise HTTPException(status_code=400, detail="Cannot delete node with children")

    db.delete(db_node)
    db.commit()
    return {"message": "Node deleted successfully"}

@router.post("/nodes/{node_id}/render")
async def render_jinja2_template(
    node_id: int,
    variables: Dict[str, Any] = {},
    db: Session = Depends(get_db)
):
    """渲染Jinja2模板"""
    node = db.query(TestDataNode).filter(TestDataNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    if node.node_type != "template" or not node.jinja2_template:
        raise HTTPException(status_code=400, detail="Node is not a template or has no template content")

    try:
        from jinja2 import Template
        template = Template(node.jinja2_template)

        # 合并节点定义的变量和请求传入的变量
        render_vars = {**node.template_variables, **variables}
        rendered_content = template.render(**render_vars)

        return {
            "rendered_content": rendered_content,
            "variables_used": render_vars,
            "template": node.jinja2_template
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Template rendering error: {str(e)}")
