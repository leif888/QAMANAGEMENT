from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api import deps
from app.services.execution_engine import ExecutionEngineService
from app.models.test_execution import TestExecution, TestStepResult

router = APIRouter()

class ExecutionCreateRequest(BaseModel):
    test_case_id: int
    name: str = None
    environment: str = "test"
    browser: str = "chromium"
    headless: bool = True
    project_id: int = None

class ExecutionResponse(BaseModel):
    id: int
    name: str
    test_case_id: int
    status: str
    progress: int
    environment: str
    browser: str
    started_at: str = None
    completed_at: str = None
    duration: int = None
    
    class Config:
        from_attributes = True

class StepResultResponse(BaseModel):
    id: int
    step_name: str
    step_keyword: str
    status: str
    duration: int
    error_message: str = None
    
    class Config:
        from_attributes = True

@router.post("/executions", response_model=ExecutionResponse)
async def create_execution(
    request: ExecutionCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db)
):
    """创建并启动测试执行"""
    service = ExecutionEngineService(db)
    
    # 创建执行记录
    execution = await service.create_execution(
        test_case_id=request.test_case_id,
        config=request.dict()
    )
    
    # 后台异步执行
    background_tasks.add_task(service.start_execution, execution.id)
    
    return execution

@router.get("/executions/{execution_id}", response_model=ExecutionResponse)
def get_execution(
    execution_id: int,
    db: Session = Depends(deps.get_db)
):
    """获取执行状态"""
    service = ExecutionEngineService(db)
    execution = service.get_execution_status(execution_id)
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    return execution

@router.get("/executions/{execution_id}/steps", response_model=List[StepResultResponse])
def get_execution_steps(
    execution_id: int,
    db: Session = Depends(deps.get_db)
):
    """获取执行步骤详情"""
    service = ExecutionEngineService(db)
    steps = service.get_execution_results(execution_id)
    
    return steps

@router.post("/executions/{execution_id}/stop")
async def stop_execution(
    execution_id: int,
    db: Session = Depends(deps.get_db)
):
    """停止执行"""
    # TODO: 实现停止执行逻辑
    return {"message": "Execution stop requested"}

@router.get("/executions/{execution_id}/report")
def get_execution_report(
    execution_id: int,
    db: Session = Depends(deps.get_db)
):
    """获取执行报告"""
    service = ExecutionEngineService(db)
    execution = service.get_execution_status(execution_id)
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    if not execution.report_path:
        raise HTTPException(status_code=404, detail="Report not available")
    
    return {
        "execution_id": execution_id,
        "report_path": execution.report_path,
        "allure_report_path": execution.allure_report_path,
        "status": execution.status
    }

# Feature文件管理
class FeatureFileRequest(BaseModel):
    name: str
    content: str
    test_case_id: int
    project_id: int

@router.post("/feature-files")
def create_feature_file(
    request: FeatureFileRequest,
    db: Session = Depends(deps.get_db)
):
    """创建或更新Feature文件"""
    from app.models.execution_engine import FeatureFile
    import hashlib
    
    # 计算文件hash
    file_hash = hashlib.sha256(request.content.encode()).hexdigest()
    
    # 检查是否已存在
    existing = db.query(FeatureFile).filter(
        FeatureFile.test_case_id == request.test_case_id
    ).first()
    
    if existing:
        # 更新现有文件
        existing.content = request.content
        existing.file_hash = file_hash
        existing.name = request.name
        db.commit()
        return existing
    else:
        # 创建新文件
        feature_file = FeatureFile(
            name=request.name,
            file_path=f"features/{request.name}.feature",
            content=request.content,
            file_hash=file_hash,
            test_case_id=request.test_case_id,
            project_id=request.project_id
        )
        db.add(feature_file)
        db.commit()
        return feature_file

@router.get("/feature-files/{test_case_id}")
def get_feature_file(
    test_case_id: int,
    db: Session = Depends(deps.get_db)
):
    """获取测试用例关联的Feature文件"""
    from app.models.execution_engine import FeatureFile
    
    feature_file = db.query(FeatureFile).filter(
        FeatureFile.test_case_id == test_case_id,
        FeatureFile.is_active == True
    ).first()
    
    if not feature_file:
        raise HTTPException(status_code=404, detail="Feature file not found")
    
    return feature_file

# WebSocket支持实时状态更新
from fastapi import WebSocket, WebSocketDisconnect
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast_execution_update(self, execution_id: int, data: Dict):
        message = {
            "type": "execution_update",
            "execution_id": execution_id,
            "data": data
        }
        
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                disconnected.append(connection)
        
        # 清理断开的连接
        for connection in disconnected:
            self.active_connections.remove(connection)

manager = ConnectionManager()

@router.websocket("/ws/executions")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # 保持连接活跃
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
