"""
Trade Template Management API Endpoints - SQLite Version
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import jinja2

from app.core.database import get_db
from app.models.trade_template import TradeTemplate, TemplateNodeType

router = APIRouter()

class TradeTemplateCreate(BaseModel):
    name: str
    description: str = None
    node_type: str  # "folder" or "template"
    parent_id: int = None
    jinja2_content: str = None
    template_variables: Dict[str, Any] = {}
    project_id: int
    creator_id: int = 1

class TradeTemplateUpdate(BaseModel):
    name: str = None
    description: str = None
    jinja2_content: str = None
    template_variables: Dict[str, Any] = None
    is_active: bool = None
    sort_order: int = None

class TradeTemplateResponse(BaseModel):
    id: int
    name: str
    description: str = None
    node_type: str
    parent_id: int = None
    sort_order: int = 0
    jinja2_content: str = None
    template_variables: Dict[str, Any] = {}
    project_id: int
    creator_id: int
    is_active: bool = True
    version: str = "v1.0"
    full_path: str = None
    children: List['TradeTemplateResponse'] = []
    created_at: str = None
    updated_at: str = None

    class Config:
        from_attributes = True

# Resolve forward references
TradeTemplateResponse.model_rebuild()


@router.get("/tree")
async def get_trade_templates_tree(
    project_id: Optional[int] = Query(None, description="Project ID filter"),
    parent_id: Optional[int] = Query(None, description="Parent node ID, null for root nodes"),
    db: Session = Depends(get_db)
):
    """Get trade templates tree structure"""
    query = db.query(TradeTemplate).filter(TradeTemplate.is_active == True)

    if project_id:
        query = query.filter(TradeTemplate.project_id == project_id)

    if parent_id is None:
        query = query.filter(TradeTemplate.parent_id.is_(None))
    else:
        query = query.filter(TradeTemplate.parent_id == parent_id)

    templates = query.order_by(TradeTemplate.sort_order).all()

    def build_tree_node(template):
        children = db.query(TradeTemplate).filter(
            TradeTemplate.parent_id == template.id,
            TradeTemplate.is_active == True
        ).order_by(TradeTemplate.sort_order).all()

        return {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "node_type": template.node_type.value,
            "parent_id": template.parent_id,
            "sort_order": template.sort_order,
            "jinja2_content": template.jinja2_content,
            "template_variables": template.template_variables or {},
            "project_id": template.project_id,
            "creator_id": template.creator_id,
            "is_active": template.is_active,
            "version": template.version,
            "full_path": template.full_path,
            "children": [build_tree_node(child) for child in children],
            "created_at": template.created_at.isoformat() if template.created_at else None,
            "updated_at": template.updated_at.isoformat() if template.updated_at else None,
        }

    return [build_tree_node(template) for template in templates]


@router.post("/")
async def create_trade_template(template: TradeTemplateCreate, db: Session = Depends(get_db)):
    """Create new trade template"""

    # Validate parent if specified
    if template.parent_id:
        parent = db.query(TradeTemplate).filter(TradeTemplate.id == template.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent node not found")
        if parent.node_type != TemplateNodeType.FOLDER:
            raise HTTPException(status_code=400, detail="Parent must be a folder node")

    # Check name conflict at same level
    existing = db.query(TradeTemplate).filter(
        TradeTemplate.name == template.name,
        TradeTemplate.parent_id == template.parent_id,
        TradeTemplate.project_id == template.project_id,
        TradeTemplate.is_active == True
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Template name already exists at this level")

    # Create template
    db_template = TradeTemplate(
        name=template.name,
        description=template.description,
        node_type=TemplateNodeType(template.node_type),
        parent_id=template.parent_id,
        jinja2_content=template.jinja2_content,
        template_variables=template.template_variables,
        project_id=template.project_id,
        creator_id=template.creator_id,
    )

    db.add(db_template)
    db.commit()
    db.refresh(db_template)

    return {
        "id": db_template.id,
        "name": db_template.name,
        "description": db_template.description,
        "node_type": db_template.node_type.value,
        "parent_id": db_template.parent_id,
        "sort_order": db_template.sort_order,
        "jinja2_content": db_template.jinja2_content,
        "template_variables": db_template.template_variables or {},
        "project_id": db_template.project_id,
        "creator_id": db_template.creator_id,
        "is_active": db_template.is_active,
        "version": db_template.version,
        "full_path": db_template.full_path,
        "children": [],
        "created_at": db_template.created_at.isoformat() if db_template.created_at else None,
        "updated_at": db_template.updated_at.isoformat() if db_template.updated_at else None,
    }


@router.get("/{template_id}")
async def get_trade_template(template_id: int, db: Session = Depends(get_db)):
    """Get trade template details"""
    template = db.query(TradeTemplate).filter(TradeTemplate.id == template_id).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return {
        "id": template.id,
        "name": template.name,
        "description": template.description,
        "node_type": template.node_type.value,
        "parent_id": template.parent_id,
        "sort_order": template.sort_order,
        "jinja2_content": template.jinja2_content,
        "template_variables": template.template_variables or {},
        "project_id": template.project_id,
        "creator_id": template.creator_id,
        "is_active": template.is_active,
        "version": template.version,
        "full_path": template.full_path,
        "children": [],
        "created_at": template.created_at.isoformat() if template.created_at else None,
        "updated_at": template.updated_at.isoformat() if template.updated_at else None,
    }


@router.put("/{template_id}")
async def update_trade_template(template_id: int, template: TradeTemplateUpdate, db: Session = Depends(get_db)):
    """Update trade template"""
    db_template = db.query(TradeTemplate).filter(TradeTemplate.id == template_id).first()

    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Check name conflict if name is being updated
    if template.name and template.name != db_template.name:
        existing = db.query(TradeTemplate).filter(
            TradeTemplate.name == template.name,
            TradeTemplate.parent_id == db_template.parent_id,
            TradeTemplate.project_id == db_template.project_id,
            TradeTemplate.id != template_id,
            TradeTemplate.is_active == True
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Template name already exists at this level")

    # Update fields
    if template.name is not None:
        db_template.name = template.name
    if template.description is not None:
        db_template.description = template.description
    if template.jinja2_content is not None:
        db_template.jinja2_content = template.jinja2_content
    if template.template_variables is not None:
        db_template.template_variables = template.template_variables
    if template.is_active is not None:
        db_template.is_active = template.is_active
    if template.sort_order is not None:
        db_template.sort_order = template.sort_order

    db.commit()
    db.refresh(db_template)

    return {
        "id": db_template.id,
        "name": db_template.name,
        "description": db_template.description,
        "node_type": db_template.node_type.value,
        "parent_id": db_template.parent_id,
        "sort_order": db_template.sort_order,
        "jinja2_content": db_template.jinja2_content,
        "template_variables": db_template.template_variables or {},
        "project_id": db_template.project_id,
        "creator_id": db_template.creator_id,
        "is_active": db_template.is_active,
        "version": db_template.version,
        "full_path": db_template.full_path,
        "children": [],
        "created_at": db_template.created_at.isoformat() if db_template.created_at else None,
        "updated_at": db_template.updated_at.isoformat() if db_template.updated_at else None,
    }


@router.delete("/{template_id}")
async def delete_trade_template(template_id: int, db: Session = Depends(get_db)):
    """Delete trade template"""
    template = db.query(TradeTemplate).filter(TradeTemplate.id == template_id).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Check if has children
    children_count = db.query(TradeTemplate).filter(
        TradeTemplate.parent_id == template_id,
        TradeTemplate.is_active == True
    ).count()

    if children_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete template with children")

    # Soft delete
    template.is_active = False
    db.commit()

    return {"message": "Template deleted successfully"}


@router.post("/{template_id}/render")
async def render_trade_template(
    template_id: int,
    variables: Dict[str, Any] = {},
    db: Session = Depends(get_db)
):
    """Render Jinja2 template"""
    template = db.query(TradeTemplate).filter(TradeTemplate.id == template_id).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if template.node_type != TemplateNodeType.TEMPLATE or not template.jinja2_content:
        raise HTTPException(status_code=400, detail="Node is not a template or has no template content")

    try:
        jinja_template = jinja2.Template(template.jinja2_content)

        # Merge template variables with request variables
        render_vars = {**(template.template_variables or {}), **variables}
        rendered_content = jinja_template.render(**render_vars)

        return {
            "rendered_content": rendered_content,
            "variables_used": render_vars,
            "template": template.jinja2_content
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Template rendering error: {str(e)}")



