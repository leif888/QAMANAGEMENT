"""
Test Case File Models for SQLite
"""
from sqlalchemy import Column, String, Text, Integer, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum


class FileType(enum.Enum):
    """Test case file types"""
    FEATURE = "feature"  # Gherkin feature file
    YAML = "yaml"       # YAML configuration file


class TestCaseFile(BaseModel):
    """Test Case File Model"""
    __tablename__ = "test_case_files"

    name = Column(String(255), nullable=False, index=True, comment="File name")
    file_type = Column(
        Enum(FileType), 
        nullable=False,
        comment="File type: feature or yaml"
    )
    content = Column(Text, comment="File content")
    
    # Relationships
    test_case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=False, comment="Test case ID")
    creator_id = Column(Integer, default=1, comment="Creator ID")

    # Metadata
    is_active = Column(Boolean, default=True, comment="Is active")
    version = Column(String(50), default="v1.0", comment="Version")

    # Relationships
    test_case = relationship("TestCase", back_populates="files")

    def __repr__(self):
        return f"<TestCaseFile(id={self.id}, name='{self.name}', type='{self.file_type.value}')>"

    @property
    def file_extension(self):
        """Get file extension based on type"""
        if self.file_type == FileType.FEATURE:
            return ".feature"
        elif self.file_type == FileType.YAML:
            return ".yaml"
        return ""

    @property
    def full_name(self):
        """Get full file name with extension"""
        if self.name.endswith(self.file_extension):
            return self.name
        return f"{self.name}{self.file_extension}"
