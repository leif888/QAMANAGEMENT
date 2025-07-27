"""
测试用例生成器 - 从Test Steps生成Playwright+pytest-bdd测试用例
"""
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.test_step import TestStep, StepType
from app.models.test_case import TestCase
from app.models.test_case_file import TestCaseFile
from app.models.test_case_step import TestCaseStep


class TestCaseGenerator:
    """测试用例生成器"""
    
    def __init__(self, db: Session):
        self.db = db
        
    def generate_test_case_from_steps(
        self, 
        step_ids: List[int],
        test_case_name: str,
        test_case_description: str = "",
        tags: str = "",
        project_id: int = 1
    ) -> Dict[str, Any]:
        """
        从选定的Test Steps生成完整的测试用例
        
        Args:
            step_ids: 选中的步骤ID列表
            test_case_name: 测试用例名称
            test_case_description: 测试用例描述
            tags: 标签
            project_id: 项目ID
            
        Returns:
            生成结果字典
        """
        # 获取选中的步骤
        steps = self.db.query(TestStep).filter(TestStep.id.in_(step_ids)).all()
        if not steps:
            raise ValueError("No valid steps found")
            
        # 按类型分组步骤
        grouped_steps = self._group_steps_by_type(steps)
        
        # 生成Feature文件内容
        feature_content = self._generate_feature_file(
            test_case_name, 
            test_case_description, 
            grouped_steps,
            tags
        )
        
        # 生成步骤定义文件内容
        step_definitions_content = self._generate_step_definitions(steps)
        
        # 创建测试用例
        test_case = TestCase(
            name=test_case_name,
            description=test_case_description,
            tags=tags,
            project_id=project_id,
            status="active",
            priority="medium",
            test_type="automated",
            creator_id=1
        )
        
        self.db.add(test_case)
        self.db.commit()
        self.db.refresh(test_case)
        
        # 创建Feature文件
        feature_file = TestCaseFile(
            test_case_id=test_case.id,
            file_name=f"{self._sanitize_filename(test_case_name)}.feature",
            file_type="feature",
            content=feature_content,
            creator_id=1
        )
        
        # 创建步骤定义文件
        step_def_file = TestCaseFile(
            test_case_id=test_case.id,
            file_name=f"test_{self._sanitize_filename(test_case_name)}.py",
            file_type="python",
            content=step_definitions_content,
            creator_id=1
        )
        
        self.db.add(feature_file)
        self.db.add(step_def_file)
        
        # 创建测试用例步骤关联
        for order, step in enumerate(steps, 1):
            test_case_step = TestCaseStep(
                test_case_id=test_case.id,
                test_step_id=step.id,
                step_order=order,
                parameters=step.parameters or []
            )
            self.db.add(test_case_step)
            
        self.db.commit()
        
        return {
            "test_case_id": test_case.id,
            "test_case_name": test_case.name,
            "feature_file_id": feature_file.id,
            "step_definitions_file_id": step_def_file.id,
            "steps_count": len(steps),
            "feature_content": feature_content,
            "step_definitions_content": step_definitions_content
        }
        
    def _group_steps_by_type(self, steps: List[TestStep]) -> Dict[str, List[TestStep]]:
        """按步骤类型分组"""
        grouped = {
            "setup": [],
            "action": [],
            "verification": []
        }
        
        for step in steps:
            if step.type == StepType.SETUP:
                grouped["setup"].append(step)
            elif step.type == StepType.ACTION:
                grouped["action"].append(step)
            elif step.type == StepType.VERIFICATION:
                grouped["verification"].append(step)
                
        return grouped
        
    def _generate_feature_file(
        self, 
        test_case_name: str, 
        description: str, 
        grouped_steps: Dict[str, List[TestStep]],
        tags: str
    ) -> str:
        """生成Feature文件内容"""
        
        # 处理标签
        tag_line = ""
        if tags:
            tag_list = [f"@{tag.strip()}" for tag in tags.split(",") if tag.strip()]
            tag_line = " ".join(tag_list) + "\n"
            
        feature_content = f"""{tag_line}Feature: {test_case_name}
  {description or f"Automated test case for {test_case_name}"}

  Scenario: {test_case_name}
"""

        # 添加Given步骤 (Setup)
        for step in grouped_steps.get("setup", []):
            step_text = self._convert_step_to_gherkin(step, "Given")
            feature_content += f"    Given {step_text}\n"
            
        # 添加When步骤 (Action)
        for step in grouped_steps.get("action", []):
            step_text = self._convert_step_to_gherkin(step, "When")
            feature_content += f"    When {step_text}\n"
            
        # 添加Then步骤 (Verification)
        for step in grouped_steps.get("verification", []):
            step_text = self._convert_step_to_gherkin(step, "Then")
            feature_content += f"    Then {step_text}\n"
            
        return feature_content
        
    def _convert_step_to_gherkin(self, step: TestStep, gherkin_keyword: str) -> str:
        """将测试步骤转换为Gherkin语法"""
        # 如果步骤有usage_example，使用它
        if step.usage_example:
            return step.usage_example
            
        # 否则基于步骤名称和参数生成
        step_text = step.name
        
        # 如果有参数，添加参数占位符
        if step.parameters:
            for i, param in enumerate(step.parameters):
                param_name = param.get('name', f'param{i+1}')
                step_text += f" {{param_{param_name}}}"
                
        return step_text
        
    def _generate_step_definitions(self, steps: List[TestStep]) -> str:
        """生成步骤定义文件内容"""
        
        content = '''"""
Generated step definitions for Playwright + pytest-bdd
"""
from pytest_bdd import given, when, then, parsers
from playwright.sync_api import Page, expect
import pytest


'''

        # 为每个步骤生成函数定义
        for step in steps:
            function_name = step.function_name or self._generate_function_name(step.name)
            decorator = self._get_step_decorator(step)
            step_pattern = self._generate_step_pattern(step)
            
            content += f'''@{decorator}(parsers.parse("{step_pattern}"))
def {function_name}(page: Page'''
            
            # 添加参数
            if step.parameters:
                for param in step.parameters:
                    param_name = param.get('name', 'value')
                    content += f', {param_name}: str'
                    
            content += '''):
    """'''
            content += step.description or f"Execute step: {step.name}"
            content += '''"""
    # TODO: Implement step logic
    pass


'''

        return content
        
    def _get_step_decorator(self, step: TestStep) -> str:
        """获取步骤装饰器"""
        if step.decorator:
            return step.decorator.replace('@', '')
            
        # 根据步骤类型推断装饰器
        if step.type == StepType.SETUP:
            return "given"
        elif step.type == StepType.ACTION:
            return "when"
        elif step.type == StepType.VERIFICATION:
            return "then"
        else:
            return "when"
            
    def _generate_step_pattern(self, step: TestStep) -> str:
        """生成步骤模式"""
        if step.usage_example:
            return step.usage_example
            
        pattern = step.name
        if step.parameters:
            for param in step.parameters:
                param_name = param.get('name', 'value')
                pattern += f" {{param_{param_name}}}"
                
        return pattern
        
    def _generate_function_name(self, step_name: str) -> str:
        """生成函数名"""
        # 将步骤名称转换为有效的Python函数名
        function_name = re.sub(r'[^\w\s]', '', step_name.lower())
        function_name = re.sub(r'\s+', '_', function_name)
        return f"step_{function_name}"
        
    def _sanitize_filename(self, name: str) -> str:
        """清理文件名"""
        # 移除特殊字符，替换为下划线
        filename = re.sub(r'[^\w\s-]', '', name.lower())
        filename = re.sub(r'[-\s]+', '_', filename)
        return filename
        
    def get_available_steps(self) -> List[Dict[str, Any]]:
        """获取可用的测试步骤"""
        steps = self.db.query(TestStep).filter(TestStep.is_active == True).all()
        
        result = []
        for step in steps:
            result.append({
                "id": step.id,
                "name": step.name,
                "description": step.description,
                "type": step.type.value,
                "decorator": step.decorator,
                "usage_example": step.usage_example,
                "parameters": step.parameters or []
            })
            
        return result
