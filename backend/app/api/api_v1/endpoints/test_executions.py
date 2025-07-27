"""
测试执行管理相关API端点 - 支持多选测试用例
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.models.test_execution import TestExecution
from app.models.test_case import TestCase
from app.services.execution_engine import ExecutionEngineService
from app.services.test_executor import PlaywrightTestExecutor

router = APIRouter()

class TestExecutionCreate(BaseModel):
    name: str
    description: str = ""
    test_case_ids: List[int] = []  # Support multi-select test cases
    tags: List[str] = []  # Support tag-based execution
    environment: str = "test"
    browser: str = "chromium"
    headless: bool = True
    executor: str = "system"
    status: str = "pending"
    notes: str = ""
    execution_type: str = "playwright"  # playwright, manual, api

class TestExecutionResponse(BaseModel):
    id: int
    name: str
    description: str = ""
    test_case_ids: List[int] = []
    test_case_names: List[str] = []
    status: str
    progress: int = 0
    pass_rate: int = 0
    environment: str
    browser: str
    headless: bool
    total_scenarios: int = 0
    passed_scenarios: int = 0
    failed_scenarios: int = 0
    skipped_scenarios: int = 0
    started_at: str = None
    completed_at: str = None
    duration: int = None
    executor: str = None
    execution_log: str = None
    error_message: str = None
    report_path: str = None
    created_at: str = None
    updated_at: str = None

    class Config:
        from_attributes = True

@router.get("/")
async def get_test_executions(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get test execution records list"""
    query = db.query(TestExecution)

    if status:
        query = query.filter(TestExecution.status == status)

    executions = query.order_by(TestExecution.created_at.desc()).all()

    # 为每个执行记录添加测试用例信息
    result = []
    for execution in executions:
        execution_dict = TestExecutionResponse.from_orm(execution).dict()

        # 获取关联的测试用例信息（这里简化处理，实际应该有专门的关联表）
        if execution.test_case_id:
            test_case = db.query(TestCase).filter(TestCase.id == execution.test_case_id).first()
            if test_case:
                execution_dict['test_case_ids'] = [test_case.id]
                execution_dict['test_case_names'] = [test_case.name]

        result.append(execution_dict)

    return result

@router.post("/", response_model=TestExecutionResponse)
async def create_test_execution(
    execution: TestExecutionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """创建测试执行记录（支持多选测试用例和标签）"""
    # 根据test_case_ids或tags获取要执行的测试用例
    test_cases = []

    if execution.test_case_ids:
        # 通过ID获取测试用例
        test_cases = db.query(TestCase).filter(TestCase.id.in_(execution.test_case_ids)).all()
        if len(test_cases) != len(execution.test_case_ids):
            raise HTTPException(status_code=404, detail="Some test cases not found")
    elif execution.tags:
        # 通过标签获取测试用例
        from sqlalchemy import or_
        tag_conditions = []
        for tag in execution.tags:
            tag_conditions.append(TestCase.tags.like(f"%{tag}%"))
        test_cases = db.query(TestCase).filter(
            TestCase.is_active == True,
            or_(*tag_conditions)
        ).all()
    else:
        raise HTTPException(status_code=400, detail="Either test_case_ids or tags must be provided")

    # 创建单个执行记录，包含所有选中的测试用例
    db_execution = TestExecution(
        name=execution.name,
        description=execution.description,
        status="pending",
        executor_id=1,  # 默认执行者ID
        execution_config={
            "test_case_ids": [tc.id for tc in test_cases],
            "tags": execution.tags,
            "environment": execution.environment,
            "browser": execution.browser,
            "headless": execution.headless,
            "execution_type": execution.execution_type,
            "notes": execution.notes
        },
        total_cases=len(test_cases)
    )

    db.add(db_execution)
    db.commit()
    db.refresh(db_execution)

    # 如果是Playwright执行类型，可以选择立即启动或手动启动
    if execution.execution_type == "playwright":
        # 这里可以选择立即启动或等待手动触发
        pass

    return TestExecutionResponse.from_orm(db_execution)

@router.get("/{execution_id}", response_model=TestExecutionResponse)
async def get_test_execution(execution_id: int, db: Session = Depends(get_db)):
    """获取测试执行记录详情"""
    execution = db.query(TestExecution).filter(TestExecution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Test execution not found")

    response = TestExecutionResponse.from_orm(execution)

    # 获取关联的测试用例信息
    if execution.test_case_id:
        test_case = db.query(TestCase).filter(TestCase.id == execution.test_case_id).first()
        if test_case:
            response.test_case_ids = [test_case.id]
            response.test_case_names = [test_case.name]

    return response

@router.put("/{execution_id}")
async def update_test_execution(execution_id: int, db: Session = Depends(get_db)):
    """更新测试执行记录"""
    execution = db.query(TestExecution).filter(TestExecution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Test execution not found")

    # 这里可以添加更新逻辑
    return {"message": "Test execution updated successfully"}

@router.get("/{execution_id}/report")
async def get_test_execution_report(execution_id: int, db: Session = Depends(get_db)):
    """获取测试执行报告"""
    service = ExecutionEngineService(db)
    execution = service.get_execution_status(execution_id)

    if not execution:
        raise HTTPException(status_code=404, detail="Test execution not found")

    # 获取步骤结果
    step_results = service.get_execution_results(execution_id)

    return {
        "execution": TestExecutionResponse.from_orm(execution).dict(),
        "step_results": [
            {
                "id": step.id,
                "step_name": step.step_name,
                "step_keyword": step.step_keyword,
                "status": step.status,
                "duration": step.duration,
                "error_message": step.error_message,
                "created_at": step.created_at.isoformat() if step.created_at else None
            }
            for step in step_results
        ]
    }

@router.get("/reports/summary")
async def get_test_reports_summary(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """获取测试报告汇总"""
    query = db.query(TestExecution)

    if project_id:
        query = query.filter(TestExecution.project_id == project_id)

    executions = query.all()

    # 计算汇总统计
    total_executions = len(executions)
    completed_executions = len([e for e in executions if e.status == "completed"])
    failed_executions = len([e for e in executions if e.status == "failed"])
    running_executions = len([e for e in executions if e.status == "running"])

    total_scenarios = sum(e.total_scenarios or 0 for e in executions)
    passed_scenarios = sum(e.passed_scenarios or 0 for e in executions)
    failed_scenarios = sum(e.failed_scenarios or 0 for e in executions)

    pass_rate = (passed_scenarios / total_scenarios * 100) if total_scenarios > 0 else 0

    return {
        "summary": {
            "total_executions": total_executions,
            "completed_executions": completed_executions,
            "failed_executions": failed_executions,
            "running_executions": running_executions,
            "total_scenarios": total_scenarios,
            "passed_scenarios": passed_scenarios,
            "failed_scenarios": failed_scenarios,
            "pass_rate": round(pass_rate, 2)
        },
        "recent_executions": [
            TestExecutionResponse.from_orm(e).dict()
            for e in sorted(executions, key=lambda x: x.created_at, reverse=True)[:10]
        ]
    }


@router.post("/{execution_id}/start-playwright")
async def start_playwright_execution(
    execution_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """启动Playwright测试执行"""
    execution = db.query(TestExecution).filter(TestExecution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Test execution not found")

    if execution.status != "pending":
        raise HTTPException(status_code=400, detail="Execution is not in pending status")

    # 在后台启动测试执行
    background_tasks.add_task(run_playwright_execution, execution_id, db)

    return {"message": "Playwright execution started", "execution_id": execution_id}


@router.get("/{execution_id}/progress")
async def get_execution_progress(execution_id: int, db: Session = Depends(get_db)):
    """获取执行进度"""
    executor = PlaywrightTestExecutor(db)
    progress = await executor.get_execution_progress(execution_id)
    return progress


@router.get("/{execution_id}/report")
async def get_execution_report(execution_id: int, db: Session = Depends(get_db)):
    """获取执行报告"""
    execution = db.query(TestExecution).filter(TestExecution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Test execution not found")

    # 从execution_config中获取测试结果
    test_results = execution.execution_config.get("test_results", {})

    return {
        "execution_id": execution_id,
        "name": execution.name,
        "status": execution.status,
        "summary": {
            "total_cases": execution.total_cases,
            "passed_cases": execution.passed_cases,
            "failed_cases": execution.failed_cases,
            "skipped_cases": execution.skipped_cases,
            "pass_rate": execution.pass_rate,
            "duration": execution.duration
        },
        "started_at": execution.started_at.isoformat() if execution.started_at else None,
        "completed_at": execution.completed_at.isoformat() if execution.completed_at else None,
        "test_results": test_results
    }


async def run_playwright_execution(execution_id: int, db: Session):
    """后台运行Playwright测试执行"""
    try:
        executor = PlaywrightTestExecutor(db)
        execution = db.query(TestExecution).filter(TestExecution.id == execution_id).first()

        # 获取执行配置
        test_case_ids = execution.execution_config.get("test_case_ids", [])
        tags = execution.execution_config.get("tags", [])

        # 执行测试
        result = await executor.execute_test_cases(
            execution_id=execution_id,
            test_case_ids=test_case_ids if test_case_ids else None,
            tags=tags if tags else None
        )

        print(f"Execution {execution_id} completed: {result}")

    except Exception as e:
        print(f"Execution {execution_id} failed: {str(e)}")
        # 更新执行状态为失败
        execution = db.query(TestExecution).filter(TestExecution.id == execution_id).first()
        if execution:
            execution.status = "failed"
            db.commit()
