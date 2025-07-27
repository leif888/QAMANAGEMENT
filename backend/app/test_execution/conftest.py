# 统一的测试执行配置文件
import pytest
from playwright.sync_api import sync_playwright, Browser, BrowserContext, Page
import os
import json
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@pytest.fixture(scope="session")
def browser():
    """Create a browser instance for the entire test session."""
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=os.getenv("HEADLESS", "false").lower() == "true",
            slow_mo=int(os.getenv("SLOW_MO", "0"))
        )
        yield browser
        browser.close()

@pytest.fixture(scope="function")
def context(browser: Browser):
    """Create a new browser context for each test."""
    context = browser.new_context(
        viewport={"width": 1280, "height": 720},
        ignore_https_errors=True
    )
    yield context
    context.close()

@pytest.fixture(scope="function")
def page(context: BrowserContext):
    """Create a new page for each test."""
    page = context.new_page()
    yield page
    page.close()

@pytest.fixture(scope="session")
def base_url():
    """Base URL for the application."""
    return os.getenv("BASE_URL", "http://localhost:3001")

@pytest.fixture(scope="function")
def student_management_page(page: Page, base_url: str):
    """Navigate to the student management system page."""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    return page

# QA系统集成相关的fixtures
@pytest.fixture(scope="session")
def execution_id():
    """获取QA系统执行ID"""
    return os.getenv("EXECUTION_ID")

@pytest.fixture(scope="session")
def qa_system_api():
    """QA系统API地址"""
    return os.getenv("QA_SYSTEM_API", "http://localhost:8000/api/v1")

# 测试报告增强
@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """生成测试报告时的钩子"""
    outcome = yield
    rep = outcome.get_result()

    # 发送结果到QA系统
    if rep.when == "call":
        execution_id = os.getenv("EXECUTION_ID")
        if execution_id:
            send_test_result_to_qa_system(item, rep, execution_id)

def send_test_result_to_qa_system(item, rep, execution_id):
    """发送测试结果到QA系统"""
    try:
        import requests

        qa_api = os.getenv("QA_SYSTEM_API", "http://localhost:8000/api/v1")

        result_data = {
            'execution_id': int(execution_id),
            'step_name': item.name,
            'status': 'passed' if rep.passed else 'failed',
            'duration': int(rep.duration * 1000),  # 转换为毫秒
            'error_message': str(rep.longrepr) if rep.failed else None
        }

        requests.post(
            f"{qa_api}/execution-engine/step-results",
            json=result_data,
            timeout=5
        )
    except Exception as e:
        print(f"Failed to send test result to QA system: {e}")

# 环境配置验证
def pytest_configure(config):
    """pytest配置钩子"""
    # 确保报告目录存在
    os.makedirs("./reports", exist_ok=True)
    os.makedirs("./reports/videos", exist_ok=True)
    os.makedirs("./reports/screenshots", exist_ok=True)

    # 打印执行配置
    print(f"\n=== Test Execution Configuration ===")
    print(f"Browser: {os.getenv('BROWSER', 'chromium')}")
    print(f"Headless: {os.getenv('HEADLESS', 'false')}")
    print(f"Base URL: {os.getenv('BASE_URL', 'http://localhost:3001')}")
    print(f"Execution ID: {os.getenv('EXECUTION_ID', 'Not set')}")
    print(f"QA System API: {os.getenv('QA_SYSTEM_API', 'Not set')}")
    print("=====================================\n")
