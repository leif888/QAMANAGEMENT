"""
应用配置设置
"""
from typing import List


class Settings:
    """应用设置类"""

    # 项目基本信息
    PROJECT_NAME: str = "QA Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # 数据库配置
    DATABASE_URL: str = "sqlite:///./qa_management.db"

    # 执行引擎配置
    EXECUTION_ENGINE_PATH: str = "D:/AugmentProjects/StudentManagement/tests"
    EXECUTION_REPORTS_PATH: str = "D:/AugmentProjects/StudentManagement/tests/reports"
    EXECUTION_FEATURES_PATH: str = "D:/AugmentProjects/StudentManagement/tests/features"

    # CORS配置
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # React开发服务器
        "http://localhost:5173",  # Vite开发服务器
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # 安全配置
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8天

    # 文件上传配置
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"

    # 分页配置
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100


# 创建全局设置实例
settings = Settings()
