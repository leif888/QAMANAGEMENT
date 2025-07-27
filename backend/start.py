"""
启动脚本
"""
import sys
import os

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    # 初始化数据库
    print("🚀 正在初始化数据库...")
    try:
        from app.core.init_db import init_database
        init_database()
    except Exception as e:
        print(f"❌ 数据库初始化失败: {e}")
    
    # 启动服务器
    print("🚀 正在启动服务器...")
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
