"""
数据库模型模块
"""
from app.models.base import BaseModel
from app.models.project import Project, ProjectStatus
from app.models.test_step import TestStep, StepType
from app.models.test_data import TestData, TestDataNode, DataNodeType
from app.models.trade_template import TradeTemplate, TemplateNodeType
from app.models.test_case_file import TestCaseFile, FileType
from app.models.test_case import (
    TestCase,
    TestCaseStep,
    TestCaseReview,
    TestCaseHistory,
    Priority,
    TestCaseStatus
)
from app.models.test_execution import (
    TestExecution,
    TestStepResult,
    TestReport,
    ExecutionStatus,
    StepResult
)

# 导出所有模型
__all__ = [
    "BaseModel",
    "Project", "ProjectStatus",
    "TestStep", "StepType",
    "TestData", "TestDataNode", "DataNodeType",
    "TradeTemplate", "TemplateNodeType",
    "TestCaseFile", "FileType",
    "TestCase", "TestCaseStep", "TestCaseReview", "TestCaseHistory",
    "Priority", "TestCaseStatus",
    "TestExecution", "TestStepResult", "TestReport",
    "ExecutionStatus", "StepResult"
]
