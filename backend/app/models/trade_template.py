"""
Trade Template Models for SQLite
"""
from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON, Boolean, Enum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum


class TemplateNodeType(enum.Enum):
    """Template node types"""
    FOLDER = "folder"
    TEMPLATE = "template"


class TradeTemplate(BaseModel):
    """Trade Template Tree Node Model"""
    __tablename__ = "trade_templates"

    name = Column(String(255), nullable=False, index=True, comment="Template name")
    description = Column(Text, comment="Template description")
    node_type = Column(
        Enum(TemplateNodeType),
        nullable=False,
        comment="Node type: folder or template"
    )

    # Tree structure
    parent_id = Column(Integer, ForeignKey("trade_templates.id"), comment="Parent template ID")
    sort_order = Column(Integer, default=0, comment="Sort order")

    # Template content (only for template nodes)
    jinja2_content = Column(Text, comment="Jinja2 template content")
    template_variables = Column(JSON, default=dict, comment="Template variables definition")

    # Metadata
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, comment="Project ID")
    creator_id = Column(Integer, default=1, comment="Creator ID")
    is_active = Column(Boolean, default=True, comment="Is active")
    version = Column(String(50), default="v1.0", comment="Version")

    # Relationships
    project = relationship("Project", back_populates="trade_templates")
    parent = relationship("TradeTemplate", remote_side="TradeTemplate.id", back_populates="children")
    children = relationship("TradeTemplate", back_populates="parent", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TradeTemplate(id={self.id}, name='{self.name}', type='{self.node_type.value}')>"

    @property
    def full_path(self):
        """Get full path of the template"""
        if self.parent:
            return f"{self.parent.full_path}/{self.name}"
        return self.name

    def get_all_children(self):
        """Recursively get all children"""
        result = []
        for child in self.children:
            result.append(child)
            result.extend(child.get_all_children())
        return result



