# QA系统执行脚本 - 请保存为 D:\AugmentProjects\StudentManagement\tests\qa_execution.py

import subprocess
import sys
import os
import json
import time
from pathlib import Path
from typing import Dict, List

class StudentManagementTestExecutor:
    """学生管理系统测试执行器"""
    
    def __init__(self, execution_config: Dict):
        self.config = execution_config
        self.test_dir = Path(__file__).parent
        self.reports_dir = self.test_dir / "reports"
        self.reports_dir.mkdir(exist_ok=True)
        
    def setup_environment(self):
        """设置执行环境"""
        env_vars = {
            "BROWSER": self.config.get("browser", "chromium"),
            "HEADLESS": str(self.config.get("headless", True)).lower(),
            "BASE_URL": self.config.get("base_url", "http://localhost:3001"),
            "EXECUTION_ID": str(self.config.get("execution_id", "")),
            "QA_SYSTEM_API": self.config.get("qa_api", "http://localhost:8000/api/v1"),
            "RECORD_VIDEO": str(self.config.get("record_video", False)).lower()
        }
        
        # 更新环境变量
        for key, value in env_vars.items():
            os.environ[key] = value
            
        # 创建.env文件
        env_file = self.test_dir / ".env"
        with open(env_file, "w") as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")
    
    def execute_tests(self) -> Dict:
        """执行测试"""
        self.setup_environment()
        
        execution_id = self.config.get("execution_id", int(time.time()))
        report_file = self.reports_dir / f"execution_{execution_id}_report.json"
        html_report = self.reports_dir / f"execution_{execution_id}_report.html"
        allure_results = self.reports_dir / f"allure_results_{execution_id}"
        
        # 构建pytest命令
        cmd = [
            sys.executable, "-m", "pytest",
            str(self.test_dir / "step_definitions"),
            "-v",
            "--tb=short",
            f"--json-report",
            f"--json-report-file={report_file}",
            f"--html={html_report}",
            f"--alluredir={allure_results}",
            "--self-contained-html"
        ]
        
        # 添加标签过滤
        if self.config.get("tags"):
            cmd.extend(["-m", self.config["tags"]])
        
        # 添加特定测试文件
        if self.config.get("test_file"):
            cmd.append(str(self.test_dir / "features" / self.config["test_file"]))
        
        print(f"Executing command: {' '.join(cmd)}")
        
        try:
            # 执行测试
            result = subprocess.run(
                cmd,
                cwd=self.test_dir,
                capture_output=True,
                text=True,
                timeout=self.config.get("timeout", 300)  # 5分钟超时
            )
            
            # 解析结果
            execution_result = {
                "execution_id": execution_id,
                "exit_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "report_file": str(report_file),
                "html_report": str(html_report),
                "allure_results": str(allure_results)
            }
            
            # 解析JSON报告
            if report_file.exists():
                with open(report_file, 'r') as f:
                    json_report = json.load(f)
                    execution_result.update({
                        "total_tests": json_report.get("summary", {}).get("total", 0),
                        "passed_tests": json_report.get("summary", {}).get("passed", 0),
                        "failed_tests": json_report.get("summary", {}).get("failed", 0),
                        "skipped_tests": json_report.get("summary", {}).get("skipped", 0),
                        "duration": json_report.get("duration", 0)
                    })
            
            return execution_result
            
        except subprocess.TimeoutExpired:
            return {
                "execution_id": execution_id,
                "exit_code": -1,
                "error": "Test execution timed out",
                "duration": self.config.get("timeout", 300)
            }
        except Exception as e:
            return {
                "execution_id": execution_id,
                "exit_code": -1,
                "error": str(e)
            }

def main():
    """主函数 - 用于命令行执行"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Execute Student Management Tests")
    parser.add_argument("--browser", default="chromium", choices=["chromium", "firefox", "webkit"])
    parser.add_argument("--headless", action="store_true", default=True)
    parser.add_argument("--base-url", default="http://localhost:3001")
    parser.add_argument("--execution-id", type=int)
    parser.add_argument("--qa-api", default="http://localhost:8000/api/v1")
    parser.add_argument("--tags", help="Pytest markers to filter tests")
    parser.add_argument("--test-file", help="Specific feature file to run")
    parser.add_argument("--timeout", type=int, default=300)
    
    args = parser.parse_args()
    
    config = {
        "browser": args.browser,
        "headless": args.headless,
        "base_url": args.base_url,
        "execution_id": args.execution_id or int(time.time()),
        "qa_api": args.qa_api,
        "tags": args.tags,
        "test_file": args.test_file,
        "timeout": args.timeout
    }
    
    executor = StudentManagementTestExecutor(config)
    result = executor.execute_tests()
    
    print(json.dumps(result, indent=2))
    return result["exit_code"]

if __name__ == "__main__":
    sys.exit(main())
