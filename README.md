# QA管理系统

一个轻量级的QA管理系统，专门为单一应用程序设计，主要用于测试流程管理和测试用例编写。

## 功能特性

### 核心功能
- **测试步骤定义**: 可视化界面定义测试步骤序列，支持参数化配置和步骤复用
- **测试数据管理**: 集中维护测试数据集，支持多种数据类型和版本控制
- **BDD测试用例支持**: 提供Gherkin语法编辑器，支持Given-When-Then结构
- **测试执行与报告**: 记录测试执行结果，生成简明测试报告

### 用户体验
- **BA友好界面**: 简洁直观的UI设计，减少技术术语使用
- **协作功能**: 支持测试用例评审流程、变更历史追踪、评论讨论

## 技术架构

### 后端
- **框架**: FastAPI (Python)
- **数据库**: SQLite + SQLAlchemy ORM
- **数据验证**: Pydantic
- **数据库迁移**: Alembic

### 前端
- **框架**: React 18 + TypeScript
- **UI组件**: Ant Design
- **编辑器**: Monaco Editor (BDD编辑)
- **状态管理**: React Query
- **构建工具**: Vite

## 项目结构

```
QAManagement/
├── backend/                 # 后端代码
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据模型
│   │   ├── schemas/        # Pydantic模式
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   ├── alembic/            # 数据库迁移
│   ├── tests/              # 测试
│   └── requirements.txt    # Python依赖
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── pages/          # 页面
│   │   ├── services/       # API服务
│   │   ├── types/          # TypeScript类型
│   │   └── utils/          # 工具函数
│   ├── public/
│   └── package.json
├── docs/                   # 文档
└── docker-compose.yml      # 容器化部署
```

## 快速开始

### 后端启动
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 前端启动
```bash
cd frontend
npm install
npm run dev
```

## 开发计划

1. [x] 项目架构设计与初始化
2. [ ] 数据库设计与模型定义
3. [ ] 后端API开发
4. [ ] 前端界面开发
5. [ ] BDD编辑器实现
6. [ ] 测试执行与报告功能
7. [ ] 协作功能开发
8. [ ] 系统测试与部署

## 许可证

MIT License
