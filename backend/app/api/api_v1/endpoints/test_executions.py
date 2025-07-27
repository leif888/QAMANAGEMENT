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

router = APIRouter()

class TestExecutionCreate(BaseModel):
    name: str
    test_case_ids: List[int]  # 支持多选测试用例
    project_id: int
    environment: str = "test"
    browser: str = "chromium"
    headless: bool = True
    executor: str = "system"

class TestExecutionResponse(BaseModel):
    id: int
    name: str
    test_case_ids: List[int] = []
    test_case_names: List[str] = []
    project_id: int
    status: str
    progress: int = 0
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

@router.get("/", response_model=List[TestExecutionResponse])
async def get_test_executions(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """获取测试执行记录列表"""
    query = db.query(TestExecution)

    if project_id:
        query = query.filter(TestExecution.project_id == project_id)

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
    """创建测试执行记录（支持多选测试用例）"""
    # 验证测试用例存在性
    test_cases = db.query(TestCase).filter(TestCase.id.in_(execution.test_case_ids)).all()
    if len(test_cases) != len(execution.test_case_ids):
        raise HTTPException(status_code=404, detail="Some test cases not found")

    # 验证所有测试用例属于同一项目
    project_ids = set(case.project_id for case in test_cases)
    if len(project_ids) > 1:
        raise HTTPException(status_code=400, detail="All test cases must belong to the same project")

    if project_ids and list(project_ids)[0] != execution.project_id:
        raise HTTPException(status_code=400, detail="Test cases project mismatch")

    # 创建执行记录（目前先创建单个，后续可扩展为批量）
    service = ExecutionEngineService(db)

    # 为每个测试用例创建执行记录
    execution_results = []
    for test_case in test_cases:
        config = {
            "name": f"{execution.name} - {test_case.name}",
            "project_id": execution.project_id,
            "environment": execution.environment,
            "browser": execution.browser,
            "headless": execution.headless,
            "executor": execution.executor
        }

        db_execution = await service.create_execution(test_case.id, config)
        execution_results.append(db_execution)

        # 启动异步执行
        background_tasks.add_task(service.start_execution, db_execution.id)

    # 返回第一个执行记录（简化处理）
    if execution_results:
        first_execution = execution_results[0]
        response = TestExecutionResponse.from_orm(first_execution)
        response.test_case_ids = execution.test_case_ids
        response.test_case_names = [case.name for case in test_cases]
        return response

    raise HTTPException(status_code=500, detail="Failed to create execution")

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
