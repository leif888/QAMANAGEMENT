"""
数据模型测试
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models import *


# 创建测试数据库
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    """创建测试数据库会话"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_create_project(db_session):
    """测试创建项目"""
    project = Project(
        name="测试项目",
        description="这是一个测试项目",
        status=ProjectStatus.ACTIVE
    )
    db_session.add(project)
    db_session.commit()
    
    assert project.id is not None
    assert project.name == "测试项目"
    assert project.status == ProjectStatus.ACTIVE


def test_create_test_step(db_session):
    """测试创建测试步骤"""
    # 先创建项目
    project = Project(name="测试项目", status=ProjectStatus.ACTIVE)
    db_session.add(project)
    db_session.commit()
    
    # 创建测试步骤
    step = TestStep(
        name="登录步骤",
        description="用户登录操作",
        type=StepType.ACTION,
        parameters=["username", "password"],
        project_id=project.id
    )
    db_session.add(step)
    db_session.commit()
    
    assert step.id is not None
    assert step.name == "登录步骤"
    assert step.type == StepType.ACTION
    assert step.parameters == ["username", "password"]


def test_create_test_case(db_session):
    """测试创建测试用例"""
    # 先创建项目
    project = Project(name="测试项目", status=ProjectStatus.ACTIVE)
    db_session.add(project)
    db_session.commit()
    
    # 创建测试用例
    test_case = TestCase(
        name="登录测试用例",
        description="测试用户登录功能",
        priority=Priority.HIGH,
        status=TestCaseStatus.DRAFT,
        gherkin_content="Feature: 用户登录\nScenario: 成功登录",
        project_id=project.id,
        creator_id=1
    )
    db_session.add(test_case)
    db_session.commit()
    
    assert test_case.id is not None
    assert test_case.name == "登录测试用例"
    assert test_case.priority == Priority.HIGH
    assert test_case.status == TestCaseStatus.DRAFT


def test_project_relationships(db_session):
    """测试项目关联关系"""
    # 创建项目
    project = Project(name="测试项目", status=ProjectStatus.ACTIVE)
    db_session.add(project)
    db_session.commit()
    
    # 创建关联的测试步骤
    step = TestStep(
        name="测试步骤",
        type=StepType.ACTION,
        project_id=project.id
    )
    db_session.add(step)
    
    # 创建关联的测试用例
    test_case = TestCase(
        name="测试用例",
        priority=Priority.MEDIUM,
        project_id=project.id,
        creator_id=1
    )
    db_session.add(test_case)
    db_session.commit()
    
    # 验证关联关系
    db_session.refresh(project)
    assert len(project.test_steps) == 1
    assert len(project.test_cases) == 1
    assert project.test_steps[0].name == "测试步骤"
    assert project.test_cases[0].name == "测试用例"


def test_test_data_record_count(db_session):
    """测试数据记录数量更新"""
    # 创建项目
    project = Project(name="测试项目", status=ProjectStatus.ACTIVE)
    db_session.add(project)
    db_session.commit()
    
    # 创建测试数据
    test_data = TestData(
        name="用户数据",
        data_type="user",
        data_content=[
            {"name": "用户1", "email": "user1@test.com"},
            {"name": "用户2", "email": "user2@test.com"}
        ],
        project_id=project.id
    )
    
    # 更新记录数量
    test_data.update_record_count()
    db_session.add(test_data)
    db_session.commit()
    
    assert test_data.record_count == 2
