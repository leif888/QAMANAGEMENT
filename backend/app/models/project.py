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

    # 关联关系
    test_steps = relationship("TestStep", back_populates="project", cascade="all, delete-orphan")
    test_data = relationship("TestData", back_populates="project", cascade="all, delete-orphan")
    test_data_nodes = relationship("TestDataNode", back_populates="project", cascade="all, delete-orphan")
    test_cases = relationship("TestCase", back_populates="project", cascade="all, delete-orphan")
    test_executions = relationship("TestExecution", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', status='{self.status.value}')>"
