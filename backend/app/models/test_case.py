"""
测试用例模型
"""
from sqlalchemy import Column, String, Text, Integer, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum


class Priority(enum.Enum):
    """优先级枚举"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TestCaseStatus(enum.Enum):
    """测试用例状态枚举"""
    DRAFT = "draft"        # 草稿
    PENDING = "pending"    # 待审核
    APPROVED = "approved"  # 已审核
    REJECTED = "rejected"  # 已拒绝


class TestCase(BaseModel):
    """测试用例模型"""
    __tablename__ = "test_cases"

    name = Column(String(255), nullable=False, index=True, comment="用例名称")
    description = Column(Text, comment="用例描述")
    priority = Column(
        Enum(Priority),
        default=Priority.MEDIUM,
        nullable=False,
        comment="优先级"
    )
    status = Column(
        Enum(TestCaseStatus),
        default=TestCaseStatus.DRAFT,
        nullable=False,
        comment="用例状态"
    )

    # BDD内容
    gherkin_content = Column(Text, comment="Gherkin语法内容")

    # 是否自动化
    is_automated = Column(Boolean, default=False, comment="是否自动化")

    # 树形结构字段
    parent_id = Column(Integer, ForeignKey("test_cases.id"), comment="父用例ID（用于组织层级结构）")
    sort_order = Column(Integer, default=0, comment="排序顺序")
    is_folder = Column(Boolean, default=False, comment="是否为文件夹节点")

    # 外键关系
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, comment="所属项目ID")
    creator_id = Column(Integer, nullable=False, comment="创建者ID")  # 暂时用整数，后续可关联用户表

    # Relationships
    project = relationship("Project", back_populates="test_cases")
    test_case_steps = relationship("TestCaseStep", back_populates="test_case", cascade="all, delete-orphan")
    executions = relationship("TestExecution", back_populates="test_case")
    reviews = relationship("TestCaseReview", back_populates="test_case", cascade="all, delete-orphan")
    history = relationship("TestCaseHistory", back_populates="test_case", cascade="all, delete-orphan")
    files = relationship("TestCaseFile", back_populates="test_case", cascade="all, delete-orphan")

    # Tree structure relationships
    parent = relationship("TestCase", remote_side="TestCase.id", back_populates="children")
    children = relationship("TestCase", back_populates="parent", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TestCase(id={self.id}, name='{self.name}', status='{self.status.value}')>"

    @property
    def full_path(self):
        """获取测试用例的完整路径"""
        if self.parent:
            return f"{self.parent.full_path}/{self.name}"
        return self.name

    def get_all_children(self):
        """递归获取所有子用例"""
        result = []
        for child in self.children:
            result.append(child)
            result.extend(child.get_all_children())
        return result


class TestCaseStep(BaseModel):
    """测试用例步骤关联模型"""
    __tablename__ = "test_case_steps"

    sequence = Column(Integer, nullable=False, comment="步骤序号")
    parameters = Column(Text, comment="步骤参数值")
    
    # 外键关系
    test_case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=False, comment="测试用例ID")
    test_step_id = Column(Integer, ForeignKey("test_steps.id"), nullable=False, comment="测试步骤ID")
    
    # 关联关系
    test_case = relationship("TestCase", back_populates="test_case_steps")
    test_step = relationship("TestStep", back_populates="test_case_steps")

    def __repr__(self):
        return f"<TestCaseStep(test_case_id={self.test_case_id}, test_step_id={self.test_step_id}, sequence={self.sequence})>"


class TestCaseReview(BaseModel):
    """测试用例评审模型"""
    __tablename__ = "test_case_reviews"

    action = Column(String(20), nullable=False, comment="评审动作: approve/reject")
    comment = Column(Text, comment="评审意见")
    reviewer_id = Column(Integer, nullable=False, comment="评审者ID")
    
    # 外键关系
    test_case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=False, comment="测试用例ID")
    
    # 关联关系
    test_case = relationship("TestCase", back_populates="reviews")

    def __repr__(self):
        return f"<TestCaseReview(id={self.id}, action='{self.action}', test_case_id={self.test_case_id})>"


class TestCaseHistory(BaseModel):
    """测试用例变更历史模型"""
    __tablename__ = "test_case_history"

    action = Column(String(50), nullable=False, comment="变更动作")
    changes = Column(Text, comment="变更内容")
    user_id = Column(Integer, nullable=False, comment="操作用户ID")
    
    # 外键关系
    test_case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=False, comment="测试用例ID")
    
    # 关联关系
    test_case = relationship("TestCase", back_populates="history")

    def __repr__(self):
        return f"<TestCaseHistory(id={self.id}, action='{self.action}', test_case_id={self.test_case_id})>"
