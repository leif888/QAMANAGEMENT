"""
测试数据模型
"""
from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum


class DataNodeType(enum.Enum):
    """数据节点类型"""
    FOLDER = "folder"      # 文件夹节点
    TEMPLATE = "template"  # Jinja2模板节点
    DATA = "data"         # 普通数据节点


class TestDataNode(BaseModel):
    """测试数据树形节点模型"""
    __tablename__ = "test_data_nodes"

    name = Column(String(255), nullable=False, index=True, comment="节点名称")
    description = Column(Text, comment="节点描述")
    node_type = Column(String(50), nullable=False, comment="节点类型: folder/template/data")

    # 树形结构字段
    parent_id = Column(Integer, ForeignKey("test_data_nodes.id"), comment="父节点ID")
    sort_order = Column(Integer, default=0, comment="排序顺序")

    # 数据内容
    data_content = Column(JSON, default=dict, comment="数据内容")
    jinja2_template = Column(Text, comment="Jinja2模板内容")
    template_variables = Column(JSON, default=dict, comment="模板变量定义")

    # 元数据
    is_active = Column(Boolean, default=True, comment="是否激活")
    version = Column(String(50), default="v1.0", comment="版本号")

    # Metadata
    creator_id = Column(Integer, comment="Creator ID")
    # creator = relationship("User", foreign_keys=[creator_id])  # 暂时注释，等用户模型创建后启用
    parent = relationship("TestDataNode", remote_side="TestDataNode.id", back_populates="children")
    children = relationship("TestDataNode", back_populates="parent", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TestDataNode(id={self.id}, name='{self.name}', type='{self.node_type}')>"

    @property
    def full_path(self):
        """获取节点的完整路径"""
        if self.parent:
            return f"{self.parent.full_path}/{self.name}"
        return self.name

    def get_all_children(self):
        """递归获取所有子节点"""
        result = []
        for child in self.children:
            result.append(child)
            result.extend(child.get_all_children())
        return result


# 保留原有的TestData模型作为兼容性支持
class TestData(BaseModel):
    """测试数据模型（兼容性保留）"""
    __tablename__ = "test_data"

    name = Column(String(255), nullable=False, index=True, comment="数据集名称")
    description = Column(Text, comment="数据集描述")
    data_type = Column(String(100), nullable=False, comment="数据类型")
    version = Column(String(50), default="v1.0", comment="数据版本")
    record_count = Column(Integer, default=0, comment="记录数量")

    # 数据内容存储（JSON格式）
    data_content = Column(JSON, default=list, comment="数据内容")

    # 数据结构定义
    schema_definition = Column(JSON, default=dict, comment="数据结构定义")

    # Metadata
    creator_id = Column(Integer, comment="Creator ID")

    def __repr__(self):
        return f"<TestData(id={self.id}, name='{self.name}', version='{self.version}')>"

    def update_record_count(self):
        """更新记录数量"""
        if isinstance(self.data_content, list):
            self.record_count = len(self.data_content)
        else:
            self.record_count = 0
