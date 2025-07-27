"""
测试步骤模型
"""
from sqlalchemy import Column, String, Text, Integer, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum


class StepType(enum.Enum):
    """步骤类型枚举"""
    ACTION = "action"          # 操作步骤
    VERIFICATION = "verification"  # 验证步骤
    SETUP = "setup"           # 数据准备步骤


class TestStep(BaseModel):
    """测试步骤模型"""
    __tablename__ = "test_steps"

    name = Column(String(255), nullable=False, index=True, comment="步骤名称")
    description = Column(Text, comment="步骤描述")
    type = Column(
        Enum(StepType),
        nullable=False,
        comment="步骤类型"
    )
    parameters = Column(JSON, default=list, comment="步骤参数列表")
    usage_count = Column(Integer, default=0, comment="使用次数")

    # 新增字段
    decorator = Column(String(100), comment="步骤装饰器，如@given, @when, @then")
    usage_example = Column(Text, comment="使用示例，展示如何使用动态变量")
    creator_id = Column(Integer, comment="创建者ID")
    function_name = Column(String(255), comment="对应的Python函数名")

    # 外键关系
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, comment="所属项目ID")

    # 关联关系
    project = relationship("Project", back_populates="test_steps")
    test_case_steps = relationship("TestCaseStep", back_populates="test_step", cascade="all, delete-orphan")
    # creator = relationship("User", foreign_keys=[creator_id])  # 暂时注释，等用户模型创建后启用

    def __repr__(self):
        return f"<TestStep(id={self.id}, name='{self.name}', type='{self.type.value}')>"

    def increment_usage(self):
        """增加使用次数"""
        self.usage_count += 1
