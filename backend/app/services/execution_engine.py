import asyncio
import subprocess
import json
import os
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path

from app.models.test_execution import TestExecution, TestStepResult
from app.core.config import settings
from sqlalchemy.orm import Session

class PlaywrightPytestExecutor:
    """Playwright + pytest-bdd 执行引擎"""
    
    def __init__(self, db: Session):
        self.db = db
        # 使用QA系统内部的测试执行目录
        self.base_path = Path(__file__).parent.parent / "test_execution"
        self.features_path = self.base_path / "features"
        self.reports_path = self.base_path / "reports"

        # 确保目录存在
        self.features_path.mkdir(parents=True, exist_ok=True)
        self.reports_path.mkdir(parents=True, exist_ok=True)
    
    async def execute_test_case(self, execution_id: int) -> Dict:
        """执行测试用例"""
        execution = self.db.query(TestExecution).filter(
            TestExecution.id == execution_id
        ).first()
        
        if not execution:
            raise ValueError(f"Execution {execution_id} not found")
        
        try:
            # 更新执行状态
            execution.status = "running"
            execution.started_at = datetime.utcnow()
            self.db.commit()
            
            # 准备feature文件
            feature_path = await self._prepare_feature_file(execution)
            
            # 执行pytest-bdd
            result = await self._run_pytest(execution, feature_path)
            
            # 解析执行结果
            await self._parse_execution_result(execution, result)
            
            # 更新执行状态
            execution.status = "completed" if result["exit_code"] == 0 else "failed"
            execution.completed_at = datetime.utcnow()
            execution.duration = (execution.completed_at - execution.started_at).total_seconds()
            
            self.db.commit()
            
            return {
                "execution_id": execution_id,
                "status": execution.status,
                "duration": execution.duration,
                "report_path": execution.report_path
            }
            
        except Exception as e:
            execution.status = "failed"
            execution.error_message = str(e)
            execution.completed_at = datetime.utcnow()
            self.db.commit()
            raise
    
    async def _prepare_feature_file(self, execution: TestExecution) -> str:
        """准备feature文件"""
        # 从数据库获取feature文件内容
        feature_file = self.db.query(FeatureFile).filter(
            FeatureFile.test_case_id == execution.test_case_id
        ).first()
        
        if not feature_file:
            # 如果没有关联的feature文件，从BDD内容生成
            feature_content = self._generate_feature_from_bdd(execution.test_case)
        else:
            feature_content = feature_file.content
        
        # 写入临时feature文件
        feature_filename = f"test_case_{execution.test_case_id}_{execution.id}.feature"
        feature_path = self.features_path / feature_filename
        
        with open(feature_path, 'w', encoding='utf-8') as f:
            f.write(feature_content)
        
        return str(feature_path)
    
    async def _run_pytest(self, execution: TestExecution, feature_path: str) -> Dict:
        """运行pytest-bdd (使用内部测试执行)"""
        report_dir = self.reports_path / f"execution_{execution.id}"
        report_dir.mkdir(exist_ok=True)

        # 直接使用pytest执行内部测试
        cmd = [
            "python", "-m", "pytest",
            str(self.base_path / "step_definitions"),
            "-v",
            "--tb=short",
            f"--json-report",
            f"--json-report-file={report_dir}/report.json",
            f"--html={report_dir}/report.html",
            "--self-contained-html"
        ]

        # 设置环境变量
        env = os.environ.copy()
        env.update({
            "TEST_ENVIRONMENT": execution.environment,
            "EXECUTION_ID": str(execution.id),
            "BROWSER": execution.browser,
            "HEADLESS": str(execution.headless).lower(),
            "BASE_URL": "http://localhost:3001",  # 学生管理系统地址
            "QA_SYSTEM_API": "http://localhost:8000/api/v1"
        })

        try:
            # 执行测试
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env,
                cwd=self.base_path
            )

            stdout, stderr = await process.communicate()

            return {
                "exit_code": process.returncode,
                "stdout": stdout.decode(),
                "stderr": stderr.decode(),
                "report_dir": str(report_dir)
            }
        except Exception as e:
            return {
                "exit_code": -1,
                "stdout": "",
                "stderr": str(e),
                "report_dir": str(report_dir)
            }
    
    async def _parse_execution_result(self, execution: TestExecution, result: Dict):
        """解析执行结果"""
        report_file = Path(result["report_dir"]) / "report.json"
        
        if report_file.exists():
            with open(report_file, 'r') as f:
                report_data = json.load(f)
            
            # 更新执行统计
            execution.total_scenarios = report_data.get("summary", {}).get("total", 0)
            execution.passed_scenarios = report_data.get("summary", {}).get("passed", 0)
            execution.failed_scenarios = report_data.get("summary", {}).get("failed", 0)
            execution.skipped_scenarios = report_data.get("summary", {}).get("skipped", 0)
            
            # 计算进度
            if execution.total_scenarios > 0:
                execution.progress = int(
                    (execution.passed_scenarios + execution.failed_scenarios + execution.skipped_scenarios) 
                    / execution.total_scenarios * 100
                )
            
            # 保存步骤结果
            await self._save_step_results(execution, report_data)
        
        # 保存执行日志
        execution.execution_log = result["stdout"]
        if result["stderr"]:
            execution.error_message = result["stderr"]
        
        # 保存报告路径
        execution.report_path = result["report_dir"]
    
    async def _save_step_results(self, execution: TestExecution, report_data: Dict):
        """保存步骤执行结果"""
        for test in report_data.get("tests", []):
            for step in test.get("steps", []):
                step_result = StepExecutionResult(
                    execution_id=execution.id,
                    step_name=step.get("name", ""),
                    step_keyword=step.get("keyword", ""),
                    step_text=step.get("text", ""),
                    status=step.get("outcome", "unknown"),
                    duration=step.get("duration", 0) * 1000,  # 转换为毫秒
                    error_message=step.get("error", {}).get("message") if step.get("error") else None
                )
                self.db.add(step_result)
    
    def _generate_feature_from_bdd(self, test_case) -> str:
        """从测试用例的BDD内容生成feature文件"""
        # 这里需要根据你的测试用例数据结构来实现
        # 假设test_case有bdd_content字段
        if hasattr(test_case, 'bdd_content') and test_case.bdd_content:
            return test_case.bdd_content
        
        # 如果没有BDD内容，生成基础模板
        return f"""Feature: {test_case.name}
  {test_case.description or 'Test case description'}

Scenario: {test_case.name}
  Given I am on the application
  When I perform the test action
  Then I should see the expected result
"""

class ExecutionEngineService:
    """执行引擎服务"""
    
    def __init__(self, db: Session):
        self.db = db
        self.executor = PlaywrightPytestExecutor(db)
    
    async def create_execution(self, test_case_id: int, config: Dict) -> TestExecution:
        """创建测试执行"""
        execution = TestExecution(
            name=config.get("name", f"Execution for test case {test_case_id}"),
            test_case_id=test_case_id,
            project_id=config.get("project_id"),
            environment=config.get("environment", "test"),
            browser=config.get("browser", "chromium"),
            headless=config.get("headless", True),
            executor=config.get("executor", "system")
        )
        
        self.db.add(execution)
        self.db.commit()
        self.db.refresh(execution)
        
        return execution
    
    async def start_execution(self, execution_id: int):
        """启动测试执行"""
        return await self.executor.execute_test_case(execution_id)
    
    def get_execution_status(self, execution_id: int) -> Optional[TestExecution]:
        """获取执行状态"""
        return self.db.query(TestExecution).filter(
            TestExecution.id == execution_id
        ).first()
    
    def get_execution_results(self, execution_id: int) -> List[TestStepResult]:
        """获取执行结果详情"""
        return self.db.query(TestStepResult).filter(
            TestStepResult.execution_id == execution_id
        ).all()
