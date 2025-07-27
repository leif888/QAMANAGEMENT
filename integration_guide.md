# QA系统与Playwright+pytest-bdd集成指南

## 🏗️ 项目结构

```
your-playwright-project/
├── features/                    # Feature文件目录
│   ├── login.feature
│   ├── user_management.feature
│   └── ...
├── step_definitions/           # 步骤定义
│   ├── __init__.py
│   ├── login_steps.py
│   ├── user_steps.py
│   └── common_steps.py
├── pages/                      # 页面对象模型
│   ├── __init__.py
│   ├── base_page.py
│   ├── login_page.py
│   └── dashboard_page.py
├── utils/                      # 工具类
│   ├── __init__.py
│   ├── config.py
│   ├── data_helper.py
│   └── report_helper.py
├── conftest.py                 # pytest配置
├── pytest.ini                 # pytest配置文件
├── requirements.txt            # 依赖包
└── reports/                    # 测试报告目录
    ├── allure-results/
    └── json-reports/
```

## 🔧 必要的配置文件

### 1. requirements.txt
```
playwright==1.40.0
pytest==7.4.3
pytest-bdd==7.0.0
pytest-json-report==1.5.0
allure-pytest==2.13.2
requests==2.31.0
```

### 2. conftest.py
```python
import pytest
import os
from playwright.sync_api import sync_playwright
from utils.config import get_config

@pytest.fixture(scope="session")
def browser_context():
    """浏览器上下文fixture"""
    config = get_config()
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=config.get('headless', True),
            slow_mo=config.get('slow_mo', 0)
        )
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            ignore_https_errors=True
        )
        yield context
        context.close()
        browser.close()

@pytest.fixture
def page(browser_context):
    """页面fixture"""
    page = browser_context.new_page()
    yield page
    page.close()

def pytest_configure(config):
    """pytest配置钩子"""
    # 从环境变量获取执行配置
    execution_id = os.getenv('EXECUTION_ID')
    if execution_id:
        # 可以在这里设置特定的配置
        pass

def pytest_runtest_makereport(item, call):
    """测试报告钩子"""
    if call.when == "call":
        # 可以在这里收集额外的测试信息
        pass
```

### 3. utils/config.py
```python
import os
from typing import Dict, Any

def get_config() -> Dict[str, Any]:
    """获取测试配置"""
    return {
        'base_url': os.getenv('BASE_URL', 'http://localhost:3000'),
        'headless': os.getenv('HEADLESS', 'true').lower() == 'true',
        'browser': os.getenv('BROWSER', 'chromium'),
        'environment': os.getenv('TEST_ENVIRONMENT', 'test'),
        'execution_id': os.getenv('EXECUTION_ID'),
        'slow_mo': int(os.getenv('SLOW_MO', '0'))
    }

def get_test_data_url() -> str:
    """获取测试数据API地址"""
    return os.getenv('QA_SYSTEM_API', 'http://localhost:8000/api/v1')
```

### 4. utils/data_helper.py
```python
import requests
from typing import Dict, List, Any
from .config import get_test_data_url

class TestDataHelper:
    """测试数据助手"""
    
    def __init__(self):
        self.api_base = get_test_data_url()
    
    def get_user_data(self, data_type: str = "user") -> List[Dict]:
        """从QA系统获取用户测试数据"""
        try:
            response = requests.get(f"{self.api_base}/test-data/datasets")
            datasets = response.json()
            
            for dataset in datasets:
                if dataset['dataType'] == data_type:
                    # 获取具体数据
                    data_response = requests.get(
                        f"{self.api_base}/test-data/datasets/{dataset['id']}/data"
                    )
                    return data_response.json()
            return []
        except Exception as e:
            print(f"Failed to get test data: {e}")
            return []
    
    def get_user_by_role(self, role: str) -> Dict:
        """根据角色获取用户数据"""
        users = self.get_user_data("user")
        for user in users:
            if user.get('role') == role:
                return user
        return {}
```

## 🎯 Feature文件示例

### features/login.feature
```gherkin
Feature: User Login
  As a user
  I want to login to the system
  So that I can access my account

  Background:
    Given I am on the login page

  Scenario: Successful login with valid credentials
    When I login with username "john_doe" and password "password123"
    Then I should be redirected to the dashboard
    And I should see welcome message

  Scenario: Failed login with invalid credentials
    When I login with username "invalid_user" and password "wrong_password"
    Then I should see error message "Invalid credentials"
    And I should remain on the login page

  Scenario Outline: Login with different user roles
    When I login with username "<username>" and password "<password>"
    Then I should see "<expected_page>" page
    And I should have "<role>" permissions

    Examples:
      | username   | password    | expected_page | role      |
      | john_doe   | password123 | dashboard     | user      |
      | jane_smith | securepass  | admin_panel   | admin     |
      | bob_wilson | mypassword  | dashboard     | user      |
```

## 🔗 步骤定义示例

### step_definitions/login_steps.py
```python
from pytest_bdd import given, when, then, parsers
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage
from utils.data_helper import TestDataHelper

@given("I am on the login page")
def navigate_to_login(page):
    login_page = LoginPage(page)
    login_page.navigate()

@when(parsers.parse('I login with username "{username}" and password "{password}"'))
def login_with_credentials(page, username, password):
    # 如果是测试数据中的用户名，从QA系统获取实际数据
    data_helper = TestDataHelper()
    if username in ['john_doe', 'jane_smith', 'bob_wilson']:
        user_data = data_helper.get_user_by_username(username)
        if user_data:
            username = user_data['username']
            password = user_data['password']
    
    login_page = LoginPage(page)
    login_page.login(username, password)

@then("I should be redirected to the dashboard")
def verify_dashboard_redirect(page):
    dashboard_page = DashboardPage(page)
    assert dashboard_page.is_loaded()

@then(parsers.parse('I should see error message "{message}"'))
def verify_error_message(page, message):
    login_page = LoginPage(page)
    assert login_page.get_error_message() == message
```

## 🚀 集成步骤

### 1. 安装依赖
```bash
cd your-playwright-project
pip install -r requirements.txt
playwright install
```

### 2. 配置QA系统
```bash
# 设置执行引擎路径
export EXECUTION_ENGINE_PATH="/path/to/your-playwright-project"

# 启动QA系统后端
cd qa-management-system/backend
python -m app.main
```

### 3. 测试集成
```bash
# 手动测试执行
cd your-playwright-project
pytest features/login.feature --browser chromium --headed --json-report --json-report-file=reports/test_report.json

# 通过QA系统执行
# 在QA系统中创建测试用例，关联feature文件，然后点击"Run Test"
```

## 📊 报告集成

### Allure报告配置
```python
# conftest.py 中添加
import allure
from allure_commons.types import AttachmentType

@pytest.fixture(autouse=True)
def attach_screenshot_on_failure(request, page):
    yield
    if request.node.rep_call.failed:
        allure.attach(
            page.screenshot(),
            name="screenshot",
            attachment_type=AttachmentType.PNG
        )
```

### 自定义报告钩子
```python
def pytest_runtest_makereport(item, call):
    """自定义报告生成"""
    if call.when == "call":
        execution_id = os.getenv('EXECUTION_ID')
        if execution_id:
            # 发送步骤结果到QA系统
            send_step_result_to_qa_system(execution_id, item, call)

def send_step_result_to_qa_system(execution_id, item, call):
    """发送步骤结果到QA系统"""
    import requests
    
    result_data = {
        'execution_id': execution_id,
        'step_name': item.name,
        'status': 'passed' if call.excinfo is None else 'failed',
        'duration': call.duration * 1000,  # 转换为毫秒
        'error_message': str(call.excinfo.value) if call.excinfo else None
    }
    
    try:
        requests.post(
            'http://localhost:8000/api/v1/execution-engine/step-results',
            json=result_data
        )
    except Exception as e:
        print(f"Failed to send result to QA system: {e}")
```

## 🎉 完成集成

现在你的Playwright+pytest-bdd项目已经与QA管理系统完全集成！

### 主要功能：
1. ✅ 从QA系统触发测试执行
2. ✅ 实时监控执行进度
3. ✅ 自动收集测试结果
4. ✅ 生成详细的测试报告
5. ✅ 集成测试数据管理
6. ✅ 支持多环境执行
7. ✅ WebSocket实时状态更新

### 下一步：
1. 根据你的项目结构调整路径配置
2. 添加更多的页面对象和步骤定义
3. 配置CI/CD集成
4. 扩展报告功能
