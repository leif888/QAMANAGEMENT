"""
API v1 路由汇总
"""
from fastapi import APIRouter
from app.api.api_v1.endpoints import (
    test_steps,
    test_data,
    test_cases,
    test_executions,
    projects
)

# 创建API路由器
api_router = APIRouter()

# 包含各个模块的路由
api_router.include_router(
    projects.router, 
    prefix="/projects", 
    tags=["projects"]
)

api_router.include_router(
    test_steps.router, 
    prefix="/test-steps", 
    tags=["test-steps"]
)

api_router.include_router(
    test_data.router, 
    prefix="/test-data", 
    tags=["test-data"]
)

api_router.include_router(
    test_cases.router, 
    prefix="/test-cases", 
    tags=["test-cases"]
)

api_router.include_router(
    test_executions.router, 
    prefix="/test-executions", 
    tags=["test-executions"]
)
