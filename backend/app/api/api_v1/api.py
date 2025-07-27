"""
API v1 Route Configuration
"""
from fastapi import APIRouter
from app.api.api_v1.endpoints import (
    test_steps,
    test_data,
    projects,
    trade_templates,
    test_case_files
)
from app.api.api_v1.endpoints import test_executions_simplified as test_executions
from app.api.api_v1.endpoints import test_cases_simplified as test_cases

# Create API router
api_router = APIRouter()

# Include module routes
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

api_router.include_router(
    trade_templates.router,
    prefix="/trade-templates",
    tags=["trade-templates"]
)

api_router.include_router(
    test_case_files.router,
    prefix="/test-case-files",
    tags=["test-case-files"]
)
