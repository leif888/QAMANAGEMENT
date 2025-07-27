"""
测试执行模型
"""
from sqlalchemy import Column, String, Text, Integer, ForeignKey, Enum, Float, DateTime, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum
from datetime import datetime


class ExecutionStatus(enum.Enum):
    """执行状态枚举"""
    PENDING = "pending"      # 待执行
    RUNNING = "running"      # 执行中
    COMPLETED = "completed"  # 已完成
    FAILED = "failed"        # 失败
    CANCELLED = "cancelled"  # 已取消


class StepResult(enum.Enum):
    """步骤执行结果枚举"""
    PASS = "pass"
    FAIL = "fail"
    SKIP = "skip"
    BLOCKED = "blocked"


class TestExecution(BaseModel):
    """测试执行模型"""
    __tablename__ = "test_executions"

    name = Column(String(255), nullable=False, index=True, comment="执行名称")
    description = Column(Text, comment="执行描述")
    status = Column(
        Enum(ExecutionStatus), 
        default=ExecutionStatus.PENDING, 
        nullable=False,
        comment="执行状态"
    )
    
    # 执行进度和结果
    progress = Column(Float, default=0.0, comment="执行进度(0-100)")
    pass_rate = Column(Float, default=0.0, comment="通过率(0-100)")
    total_cases = Column(Integer, default=0, comment="总用例数")
    passed_cases = Column(Integer, default=0, comment="通过用例数")
    failed_cases = Column(Integer, default=0, comment="失败用例数")
    skipped_cases = Column(Integer, default=0, comment="跳过用例数")
    
    # 执行时间
    started_at = Column(DateTime, comment="开始时间")
    completed_at = Column(DateTime, comment="完成时间")
    duration = Column(Integer, comment="执行时长(秒)")
    
    # 执行配置
    execution_config = Column(JSON, default=dict, comment="执行配置")
    
    # Relationships
    test_case_id = Column(Integer, ForeignKey("test_cases.id"), comment="Associated test case ID")
    executor_id = Column(Integer, nullable=False, comment="Executor ID")

    # Relationships
    test_case = relationship("TestCase", back_populates="executions")
    step_results = relationship("TestStepResult", back_populates="execution", cascade="all, delete-orphan")
    reports = relationship("TestReport", back_populates="execution", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TestExecution(id={self.id}, name='{self.name}', status='{self.status.value}')>"

    def calculate_progress(self):
        """计算执行进度"""
        if self.total_cases > 0:
            completed = self.passed_cases + self.failed_cases + self.skipped_cases
            self.progress = (completed / self.total_cases) * 100
        else:
            self.progress = 0.0

    def calculate_pass_rate(self):
        """计算通过率"""
        if self.total_cases > 0:
            self.pass_rate = (self.passed_cases / self.total_cases) * 100
        else:
            self.pass_rate = 0.0

    def start_execution(self):
        """开始执行"""
        self.status = ExecutionStatus.RUNNING
        self.started_at = datetime.utcnow()

    def complete_execution(self):
        """完成执行"""
        self.status = ExecutionStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        if self.started_at:
            self.duration = int((self.completed_at - self.started_at).total_seconds())
        self.calculate_progress()
        self.calculate_pass_rate()


class TestStepResult(BaseModel):
    """测试步骤执行结果模型"""
    __tablename__ = "test_step_results"

    step_name = Column(String(255), nullable=False, comment="步骤名称")
    result = Column(
        Enum(StepResult), 
        nullable=False,
        comment="执行结果"
    )
    message = Column(Text, comment="执行消息")
    screenshot = Column(String(500), comment="截图路径")
    execution_time = Column(Float, comment="执行时间(秒)")
    
    # 外键关系
    execution_id = Column(Integer, ForeignKey("test_executions.id"), nullable=False, comment="测试执行ID")
    
    # 关联关系
    execution = relationship("TestExecution", back_populates="step_results")

    def __repr__(self):
        return f"<TestStepResult(id={self.id}, step_name='{self.step_name}', result='{self.result.value}')>"


class TestReport(BaseModel):
    """测试报告模型"""
    __tablename__ = "test_reports"

    title = Column(String(255), nullable=False, comment="报告标题")
    content = Column(Text, comment="报告内容")
    report_type = Column(String(50), default="execution", comment="报告类型")
    file_path = Column(String(500), comment="报告文件路径")
    
    # 外键关系
    execution_id = Column(Integer, ForeignKey("test_executions.id"), nullable=False, comment="测试执行ID")
    
    # 关联关系
    execution = relationship("TestExecution", back_populates="reports")

    def __repr__(self):
        return f"<TestReport(id={self.id}, title='{self.title}', type='{self.report_type}')>"
