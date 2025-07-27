"""
数据库初始化脚本
"""
from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal
from app.models import *
from app.core.database import Base


def create_tables():
    """创建所有数据表"""
    Base.metadata.create_all(bind=engine)
    print("✅ 数据表创建完成")


def init_sample_data():
    """初始化示例数据"""
    db = SessionLocal()
    try:
        # 检查是否已有数据
        if db.query(Project).first():
            print("⚠️  数据库已有数据，跳过示例数据初始化")
            return

        # 创建示例项目
        project1 = Project(
            name="电商平台测试",
            description="电商平台核心功能测试项目",
            status=ProjectStatus.ACTIVE
        )
        project2 = Project(
            name="用户管理系统",
            description="用户注册、登录、权限管理测试",
            status=ProjectStatus.ACTIVE
        )
        project3 = Project(
            name="支付模块测试",
            description="支付流程和安全性测试",
            status=ProjectStatus.PAUSED
        )
        
        db.add_all([project1, project2, project3])
        db.commit()

        # 创建示例测试步骤
        step1 = TestStep(
            name="用户登录",
            description="输入用户名和密码进行登录",
            type=StepType.ACTION,
            parameters=["username", "password"],
            project_id=project1.id
        )
        step2 = TestStep(
            name="验证登录成功",
            description="验证用户成功登录到系统",
            type=StepType.VERIFICATION,
            parameters=["expectedUrl"],
            project_id=project1.id
        )
        step3 = TestStep(
            name="准备测试用户",
            description="创建测试用户数据",
            type=StepType.SETUP,
            parameters=["userType", "permissions"],
            project_id=project1.id
        )
        
        db.add_all([step1, step2, step3])
        db.commit()

        # 创建示例测试数据
        test_data1 = TestData(
            name="用户基础数据",
            description="包含用户注册、登录相关的测试数据",
            data_type="user",
            version="v1.2",
            data_content=[
                {"username": "testuser1", "password": "123456", "email": "test1@example.com"},
                {"username": "testuser2", "password": "123456", "email": "test2@example.com"}
            ],
            project_id=project1.id
        )
        test_data1.update_record_count()
        
        test_data2 = TestData(
            name="商品信息数据",
            description="电商平台商品相关测试数据",
            data_type="product",
            version="v2.1",
            data_content=[
                {"name": "iPhone 15", "price": 5999, "category": "手机"},
                {"name": "MacBook Pro", "price": 12999, "category": "电脑"}
            ],
            project_id=project1.id
        )
        test_data2.update_record_count()
        
        db.add_all([test_data1, test_data2])
        db.commit()

        # 创建示例测试用例
        test_case1 = TestCase(
            name="用户登录功能测试",
            description="测试用户登录功能的各种场景",
            priority=Priority.HIGH,
            status=TestCaseStatus.APPROVED,
            gherkin_content="""Feature: 用户登录
  作为一个用户
  我想要登录系统
  以便访问我的账户

Scenario: 成功登录
  Given 我在登录页面
  When 我输入正确的用户名和密码
  Then 我应该成功登录到系统""",
            project_id=project1.id,
            creator_id=1
        )
        
        test_case2 = TestCase(
            name="商品搜索功能测试",
            description="测试商品搜索功能",
            priority=Priority.MEDIUM,
            status=TestCaseStatus.PENDING,
            gherkin_content="""Feature: 商品搜索
  作为一个用户
  我想要搜索商品
  以便找到我需要的商品

Scenario: 搜索存在的商品
  Given 我在首页
  When 我搜索"iPhone"
  Then 我应该看到相关的商品列表""",
            project_id=project1.id,
            creator_id=2
        )
        
        db.add_all([test_case1, test_case2])
        db.commit()

        print("✅ 示例数据初始化完成")
        
    except Exception as e:
        print(f"❌ 示例数据初始化失败: {e}")
        db.rollback()
    finally:
        db.close()


def init_database():
    """初始化数据库"""
    print("🚀 开始初始化数据库...")
    create_tables()
    init_sample_data()
    print("🎉 数据库初始化完成！")


if __name__ == "__main__":
    init_database()
