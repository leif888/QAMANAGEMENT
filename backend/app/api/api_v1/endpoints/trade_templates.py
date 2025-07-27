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
    description: Optional[str] = ""
    node_type: str  # "folder" or "template"
    parent_id: Optional[int] = None
    jinja2_content: Optional[str] = ""
    template_variables: Optional[Dict[str, Any]] = {}
    creator_id: int = 1

class TradeTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    jinja2_content: Optional[str] = None
    template_variables: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

class TradeTemplateResponse(BaseModel):
    id: int
    name: str
    description: str = None
    node_type: str
    parent_id: int = None
    sort_order: int = 0
    jinja2_content: str = None
    template_variables: Dict[str, Any] = {}

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


@router.get("/")
async def get_trade_templates(db: Session = Depends(get_db)):
    """Get all trade templates"""
    templates = db.query(TradeTemplate).filter(TradeTemplate.is_active == True).all()

    result = []
    for template in templates:
        result.append({
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "node_type": template.node_type.value,
            "parent_id": template.parent_id,
            "jinja2_content": template.jinja2_content or "",
            "template_variables": template.template_variables or {},
            "creator_id": template.creator_id,
            "is_active": template.is_active,
            "sort_order": template.sort_order,
            "created_at": template.created_at.isoformat() if template.created_at else None,
            "updated_at": template.updated_at.isoformat() if template.updated_at else None,
        })

    return result


@router.get("/tree")
async def get_trade_templates_tree(
    parent_id: Optional[int] = Query(None, description="Parent node ID, null for root nodes"),
    db: Session = Depends(get_db)
):
    """Get trade templates tree structure"""
    query = db.query(TradeTemplate).filter(TradeTemplate.is_active == True)

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
        TradeTemplate.is_active == True
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Template name already exists at this level")

    # Convert node_type string to enum
    try:
        if template.node_type.lower() == 'folder':
            node_type = TemplateNodeType.FOLDER
        elif template.node_type.lower() == 'template':
            node_type = TemplateNodeType.TEMPLATE
        else:
            raise HTTPException(status_code=400, detail="Invalid node_type. Must be 'folder' or 'template'")
    except AttributeError:
        raise HTTPException(status_code=400, detail="node_type is required")

    # Create template
    db_template = TradeTemplate(
        name=template.name,
        description=template.description,
        node_type=node_type,
        parent_id=template.parent_id,
        jinja2_content=template.jinja2_content,
        template_variables=template.template_variables,
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
            TradeTemplate.id != template_id,
            TradeTemplate.is_active == True
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Template name already exists at this level")

    # Update fields
    print(f"Updating template {template_id} with data: {template}")

    if template.name is not None:
        print(f"Updating name: {template.name}")
        db_template.name = template.name
    if template.description is not None:
        print(f"Updating description: {template.description}")
        db_template.description = template.description
    if template.jinja2_content is not None:
        print(f"Updating jinja2_content: {template.jinja2_content}")
        db_template.jinja2_content = template.jinja2_content
    if template.template_variables is not None:
        print(f"Updating template_variables: {template.template_variables}")
        db_template.template_variables = template.template_variables
    if template.is_active is not None:
        print(f"Updating is_active: {template.is_active}")
        db_template.is_active = template.is_active
    if template.sort_order is not None:
        print(f"Updating sort_order: {template.sort_order}")
        db_template.sort_order = template.sort_order

    print(f"Before commit - jinja2_content: {db_template.jinja2_content}")
    db.commit()
    db.refresh(db_template)
    print(f"After commit - jinja2_content: {db_template.jinja2_content}")

    return {
        "id": db_template.id,
        "name": db_template.name,
        "description": db_template.description,
        "node_type": db_template.node_type.value,
        "parent_id": db_template.parent_id,
        "sort_order": db_template.sort_order,
        "jinja2_content": db_template.jinja2_content,
        "template_variables": db_template.template_variables or {},
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

    def delete_template_recursive(template_id: int):
        """Recursively delete template and all its children"""
        # Get all children
        children = db.query(TradeTemplate).filter(
            TradeTemplate.parent_id == template_id,
            TradeTemplate.is_active == True
        ).all()

        # Recursively delete children first
        for child in children:
            delete_template_recursive(child.id)

        # Delete the template itself
        template_to_delete = db.query(TradeTemplate).filter(TradeTemplate.id == template_id).first()
        if template_to_delete:
            template_to_delete.is_active = False

    # Start recursive deletion
    delete_template_recursive(template_id)
    db.commit()

    return {"message": "Template and all children deleted successfully"}


@router.post("/render")
async def render_template_content(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Render template content with variables"""
    template_content = request.get("template_content", "")
    variables = request.get("variables", {})

    if not template_content:
        raise HTTPException(status_code=400, detail="template_content is required")

    try:
        import jinja2
        jinja_template = jinja2.Template(template_content)
        rendered_content = jinja_template.render(**variables)

        return {
            "rendered_content": rendered_content,
            "variables_used": variables,
            "template": template_content
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Template rendering error: {str(e)}")


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


@router.post("/{template_id}/validate")
async def validate_template_content(template_id: int, db: Session = Depends(get_db)):
    """Validate template content (XML and Jinja2)"""
    template = db.query(TradeTemplate).filter(TradeTemplate.id == template_id).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if template.node_type != TemplateNodeType.TEMPLATE or not template.jinja2_content:
        raise HTTPException(status_code=400, detail="Node is not a template or has no template content")

    validation_result = {"valid": True, "errors": [], "warnings": []}
    content = template.jinja2_content

    # Check if content looks like XML
    is_xml_like = content.strip().startswith('<') and content.strip().endswith('>')

    if is_xml_like:
        # XML validation
        try:
            import xml.etree.ElementTree as ET
            # Try to parse as XML (ignoring Jinja2 variables for now)
            xml_content = content
            # Simple validation - just check if it's well-formed XML structure
            if '<' in xml_content and '>' in xml_content:
                validation_result["warnings"].append("XML structure detected - ensure proper XML syntax")
        except Exception as e:
            validation_result["valid"] = False
            validation_result["errors"].append(f"XML parsing error: {str(e)}")

    # Jinja2 validation
    try:
        import jinja2
        jinja_template = jinja2.Template(content)
        validation_result["warnings"].append("Jinja2 template syntax is valid")
    except jinja2.TemplateSyntaxError as e:
        validation_result["valid"] = False
        validation_result["errors"].append(f"Jinja2 syntax error: {str(e)}")
    except Exception as e:
        validation_result["valid"] = False
        validation_result["errors"].append(f"Template validation error: {str(e)}")

    # Check for common Jinja2 patterns
    jinja_patterns = ['{%', '{{', '{#']
    has_jinja = any(pattern in content for pattern in jinja_patterns)

    if not has_jinja and not is_xml_like:
        validation_result["warnings"].append("No Jinja2 template syntax detected - this appears to be plain text")

    return validation_result



