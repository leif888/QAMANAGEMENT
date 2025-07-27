# 学生管理系统QA集成配置文件
# 请将此文件复制到 D:\AugmentProjects\StudentManagement\tests\utils\qa_integration.py

import os
import requests
from typing import Dict, List, Any

class QASystemIntegration:
    """QA系统集成助手"""
    
    def __init__(self):
        self.qa_api_base = os.getenv('QA_SYSTEM_API', 'http://localhost:8000/api/v1')
        self.execution_id = os.getenv('EXECUTION_ID')
    
    def get_student_test_data(self) -> List[Dict]:
        """从QA系统获取学生测试数据"""
        try:
            response = requests.get(f"{self.qa_api_base}/test-data/datasets")
            if response.status_code == 200:
                datasets = response.json()
                
                # 查找学生数据集
                for dataset in datasets:
                    if 'student' in dataset.get('name', '').lower():
                        return dataset.get('data', [])
                
                # 如果没有找到，返回默认测试数据
                return self.get_default_student_data()
        except Exception as e:
            print(f"Failed to get test data from QA system: {e}")
            return self.get_default_student_data()
    
    def get_default_student_data(self) -> List[Dict]:
        """默认学生测试数据"""
        return [
            {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "age": "20",
                "major": "Computer Science",
                "phone": "123-456-7890"
            },
            {
                "name": "Jane Smith",
                "email": "jane.smith@example.com",
                "age": "22",
                "major": "Mathematics",
                "phone": "098-765-4321"
            },
            {
                "name": "Bob Wilson",
                "email": "bob.wilson@example.com",
                "age": "21",
                "major": "Physics",
                "phone": "555-123-4567"
            }
        ]
    
    def send_step_result(self, step_name: str, status: str, duration: float, error_message: str = None):
        """发送步骤结果到QA系统"""
        if not self.execution_id:
            return
        
        result_data = {
            'execution_id': int(self.execution_id),
            'step_name': step_name,
            'status': status,
            'duration': int(duration * 1000),  # 转换为毫秒
            'error_message': error_message
        }
        
        try:
            requests.post(
                f"{self.qa_api_base}/execution-engine/step-results",
                json=result_data
            )
        except Exception as e:
            print(f"Failed to send step result to QA system: {e}")

# 全局实例
qa_integration = QASystemIntegration()

def get_student_data_by_name(name: str) -> Dict:
    """根据姓名获取学生数据"""
    students = qa_integration.get_student_test_data()
    for student in students:
        if student.get('name') == name:
            return student
    return {}

def get_student_data_by_major(major: str) -> List[Dict]:
    """根据专业获取学生数据"""
    students = qa_integration.get_student_test_data()
    return [s for s in students if s.get('major') == major]
