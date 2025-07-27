"""
测试执行器 - 集成Playwright + pytest-bdd
"""
import os
import subprocess
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.test_execution import TestExecution, ExecutionStatus
from app.models.test_case import TestCase
from app.models.test_case_file import TestCaseFile
from app.core.database import get_db
import tempfile
import shutil


class PlaywrightTestExecutor:
    """Playwright + pytest-bdd 测试执行器"""
    
    def __init__(self, db: Session):
        self.db = db
        self.temp_dir = None
        
    async def execute_test_cases(
        self, 
        execution_id: int, 
        test_case_ids: List[int] = None,
        tags: List[str] = None
    ) -> Dict[str, Any]:
        """
        执行测试用例
        
        Args:
            execution_id: 执行ID
            test_case_ids: 要执行的测试用例ID列表
            tags: 要执行的标签列表
            
        Returns:
            执行结果字典
        """
        execution = self.db.query(TestExecution).filter(TestExecution.id == execution_id).first()
        if not execution:
            raise ValueError(f"Execution {execution_id} not found")
            
        try:
            # 开始执行
            execution.start_execution()
            self.db.commit()
            
            # 准备测试环境
            await self._prepare_test_environment(execution, test_case_ids, tags)
            
            # 执行测试
            result = await self._run_pytest(execution)
            
            # 处理结果
            await self._process_results(execution, result)
            
            # 完成执行
            execution.complete_execution()
            self.db.commit()
            
            return {
                "status": "success",
                "execution_id": execution_id,
                "total_cases": execution.total_cases,
                "passed": execution.passed_cases,
                "failed": execution.failed_cases,
                "skipped": execution.skipped_cases,
                "duration": execution.duration
            }
            
        except Exception as e:
            execution.status = ExecutionStatus.FAILED
            self.db.commit()
            raise e
        finally:
            # 清理临时文件
            self._cleanup()
            
    async def _prepare_test_environment(
        self, 
        execution: TestExecution, 
        test_case_ids: List[int] = None,
        tags: List[str] = None
    ):
        """准备测试环境"""
        # 创建临时目录
        self.temp_dir = tempfile.mkdtemp(prefix="qa_test_")
        
        # 创建features目录
        features_dir = os.path.join(self.temp_dir, "features")
        os.makedirs(features_dir, exist_ok=True)
        
        # 创建step_definitions目录
        steps_dir = os.path.join(self.temp_dir, "step_definitions")
        os.makedirs(steps_dir, exist_ok=True)
        
        # 获取要执行的测试用例
        query = self.db.query(TestCase).filter(TestCase.is_active == True)
        
        if test_case_ids:
            query = query.filter(TestCase.id.in_(test_case_ids))
        elif tags:
            # 根据标签过滤
            tag_conditions = []
            for tag in tags:
                tag_conditions.append(TestCase.tags.like(f"%{tag}%"))
            query = query.filter(db.or_(*tag_conditions))
            
        test_cases = query.all()
        execution.total_cases = len(test_cases)
        
        # 生成feature文件
        for test_case in test_cases:
            await self._generate_feature_files(test_case, features_dir)
            
        # 生成pytest配置
        await self._generate_pytest_config()
        
        # 生成步骤定义文件
        await self._generate_step_definitions(steps_dir)
        
    async def _generate_feature_files(self, test_case: TestCase, features_dir: str):
        """生成feature文件"""
        # 获取测试用例的feature文件
        feature_files = self.db.query(TestCaseFile).filter(
            TestCaseFile.test_case_id == test_case.id,
            TestCaseFile.file_type == 'feature',
            TestCaseFile.is_active == True
        ).all()
        
        for feature_file in feature_files:
            file_path = os.path.join(features_dir, feature_file.full_name)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(feature_file.content or '')
                
    async def _generate_pytest_config(self):
        """生成pytest配置文件"""
        config_content = """
[tool:pytest]
addopts = 
    --strict-markers
    --strict-config
    --verbose
    --tb=short
    --gherkin-terminal-reporter
    --json-report
    --json-report-file=test_results.json
    
markers =
    smoke: Smoke tests
    regression: Regression tests
    api: API tests
    ui: UI tests
    
bdd_features_base_dir = features/
"""
        
        config_path = os.path.join(self.temp_dir, "pytest.ini")
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(config_content)
            
    async def _generate_step_definitions(self, steps_dir: str):
        """生成步骤定义文件"""
        # 这里可以从数据库中的Test Steps生成步骤定义
        # 或者使用预定义的步骤定义文件
        
        step_content = '''
"""
Generated step definitions for QA Management System
"""
from pytest_bdd import given, when, then, parsers
from playwright.sync_api import Page, expect


@given(parsers.parse('I am on the {page_name} page'))
def navigate_to_page(page: Page, page_name: str):
    """Navigate to specified page"""
    # Implementation based on page_name
    pass


@when(parsers.parse('I {action} {element}'))
def perform_action(page: Page, action: str, element: str):
    """Perform action on element"""
    # Implementation based on action and element
    pass


@then(parsers.parse('I should see {expected_result}'))
def verify_result(page: Page, expected_result: str):
    """Verify expected result"""
    # Implementation based on expected_result
    pass
'''
        
        step_file_path = os.path.join(steps_dir, "test_steps.py")
        with open(step_file_path, 'w', encoding='utf-8') as f:
            f.write(step_content)
            
    async def _run_pytest(self, execution: TestExecution) -> Dict[str, Any]:
        """运行pytest"""
        cmd = [
            "python", "-m", "pytest",
            "--json-report",
            "--json-report-file=test_results.json",
            "-v",
            self.temp_dir
        ]
        
        # 添加标签过滤
        if execution.execution_config.get('tags'):
            tags = execution.execution_config['tags']
            for tag in tags:
                cmd.extend(["-m", tag])
                
        # 运行pytest
        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=self.temp_dir,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        # 读取JSON报告
        results_file = os.path.join(self.temp_dir, "test_results.json")
        if os.path.exists(results_file):
            with open(results_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return {
                "summary": {"total": 0, "passed": 0, "failed": 0, "skipped": 0},
                "tests": [],
                "stdout": stdout.decode(),
                "stderr": stderr.decode()
            }
            
    async def _process_results(self, execution: TestExecution, result: Dict[str, Any]):
        """处理测试结果"""
        summary = result.get("summary", {})
        
        execution.total_cases = summary.get("total", 0)
        execution.passed_cases = summary.get("passed", 0)
        execution.failed_cases = summary.get("failed", 0)
        execution.skipped_cases = summary.get("skipped", 0)
        
        # 保存详细结果到execution_config
        execution.execution_config = {
            **execution.execution_config,
            "test_results": result
        }
        
    def _cleanup(self):
        """清理临时文件"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
            
    async def get_execution_progress(self, execution_id: int) -> Dict[str, Any]:
        """获取执行进度"""
        execution = self.db.query(TestExecution).filter(TestExecution.id == execution_id).first()
        if not execution:
            return {"error": "Execution not found"}
            
        return {
            "execution_id": execution_id,
            "status": execution.status.value,
            "progress": execution.progress,
            "total_cases": execution.total_cases,
            "passed_cases": execution.passed_cases,
            "failed_cases": execution.failed_cases,
            "skipped_cases": execution.skipped_cases,
            "started_at": execution.started_at.isoformat() if execution.started_at else None,
            "duration": execution.duration
        }
