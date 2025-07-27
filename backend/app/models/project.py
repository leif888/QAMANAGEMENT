"""
项目模型
"""
from sqlalchemy import Column, String, Text, Enum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum


class ProjectStatus(enum.Enum):
    """项目状态枚举"""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


class Project(BaseModel):
    """项目模型"""
    __tablename__ = "projects"

    name = Column(String(255), nullable=False, index=True, comment="项目名称")
    description = Column(Text, comment="项目描述")
    status = Column(
        Enum(ProjectStatus), 
        default=ProjectStatus.ACTIVE, 
        nullable=False,
        comment="项目状态"
    )

    # Note: Relationships removed as we simplified the system to not use projects

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', status='{self.status.value}')>"
