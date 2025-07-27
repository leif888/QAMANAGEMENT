"""
API端点测试
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_projects():
    """测试获取项目列表"""
    response = client.get("/api/v1/projects/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_get_project_detail():
    """测试获取项目详情"""
    response = client.get("/api/v1/projects/1")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_get_test_steps():
    """测试获取测试步骤列表"""
    response = client.get("/api/v1/test-steps/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_get_test_data():
    """测试获取测试数据列表"""
    response = client.get("/api/v1/test-data/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_get_test_cases():
    """测试获取测试用例列表"""
    response = client.get("/api/v1/test-cases/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_get_test_executions():
    """测试获取测试执行列表"""
    response = client.get("/api/v1/test-executions/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_create_project():
    """测试创建项目"""
    project_data = {
        "name": "新测试项目",
        "description": "这是一个新的测试项目"
    }
    response = client.post("/api/v1/projects/", json=project_data)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_create_test_step():
    """测试创建测试步骤"""
    step_data = {
        "name": "新测试步骤",
        "description": "这是一个新的测试步骤",
        "type": "action",
        "parameters": ["param1", "param2"]
    }
    response = client.post("/api/v1/test-steps/", json=step_data)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_create_test_case():
    """测试创建测试用例"""
    case_data = {
        "name": "新测试用例",
        "description": "这是一个新的测试用例",
        "priority": "high",
        "gherkin_content": "Feature: 测试功能\nScenario: 测试场景"
    }
    response = client.post("/api/v1/test-cases/", json=case_data)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_cors_headers():
    """测试CORS头部"""
    response = client.options("/api/v1/projects/")
    assert response.status_code == 200
    # 检查CORS头部是否存在
    assert "access-control-allow-origin" in response.headers or "Access-Control-Allow-Origin" in response.headers
