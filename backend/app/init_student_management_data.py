#!/usr/bin/env python3
"""
初始化学生管理系统测试数据
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.project import Project
from app.models.test_case import TestCase, Priority, TestCaseStatus
from app.models.test_data import TestData
import json
from datetime import datetime

def init_student_management_data():
    """初始化学生管理系统的项目和测试数据"""
    db: Session = SessionLocal()
    
    try:
        # 1. 创建学生管理系统项目
        project = db.query(Project).filter(Project.name == "Student Management System").first()
        if not project:
            project = Project(
                name="Student Management System",
                description="A web-based student information management system with CRUD operations",
                created_at=datetime.utcnow()
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            print(f"✅ Created project: {project.name}")
        else:
            print(f"📋 Project already exists: {project.name}")
        
        # 2. 创建测试用例
        test_cases_data = [
            {
                "name": "Add New Student - Complete Information",
                "description": "Test adding a new student with all required and optional information",
                "priority": Priority.HIGH,
                "gherkin_content": """Feature: Student Management System
  As a user of the student management system
  I want to add new students
  So that I can manage student information

Scenario: Add a new student with complete information
  Given I am on the student management page
  When I fill in the student form with complete details
  And I click the "Add Student" button
  Then I should see the student in the student list
  And all student information should be displayed correctly"""
            },
            {
                "name": "Edit Existing Student",
                "description": "Test editing an existing student's information",
                "priority": Priority.MEDIUM,
                "gherkin_content": """Feature: Student Management System
  As a user of the student management system
  I want to edit student information
  So that I can keep student data up to date

Scenario: Edit an existing student
  Given I have added a student to the system
  When I click the "Edit" button for the student
  And I update the student information
  And I click the "Update Student" button
  Then I should see the updated information in the student list"""
            },
            {
                "name": "Delete Student",
                "description": "Test deleting a student from the system",
                "priority": Priority.MEDIUM,
                "gherkin_content": """Feature: Student Management System
  As a user of the student management system
  I want to delete students
  So that I can remove outdated records

Scenario: Delete a student
  Given I have added a student to the system
  When I click the "Delete" button for the student
  And I confirm the deletion
  Then the student should be removed from the student list"""
            },
            {
                "name": "Form Validation",
                "description": "Test form validation for required fields",
                "priority": Priority.HIGH,
                "gherkin_content": """Feature: Student Management System
  As a user of the student management system
  I want to see validation messages
  So that I know what information is required

Scenario: Form validation for required fields
  Given I am on the student management page
  When I click the "Add Student" button without filling any information
  Then I should see validation messages for required fields"""
            }
        ]
        
        for test_case_data in test_cases_data:
            existing_case = db.query(TestCase).filter(
                TestCase.name == test_case_data["name"],
                TestCase.project_id == project.id
            ).first()
            
            if not existing_case:
                test_case = TestCase(
                    name=test_case_data["name"],
                    description=test_case_data["description"],
                    priority=test_case_data["priority"],
                    project_id=project.id,
                    gherkin_content=test_case_data["gherkin_content"],
                    creator_id=1,  # 默认创建者ID
                    is_automated=True
                )
                db.add(test_case)
                db.commit()
                db.refresh(test_case)
                print(f"✅ Created test case: {test_case.name}")
            else:
                print(f"📋 Test case already exists: {existing_case.name}")
        
        # 3. 创建测试数据集
        test_data_items = [
            {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "age": "20",
                "major": "Computer Science",
                "phone": "+1-555-123-4567"
            },
            {
                "name": "Jane Smith",
                "email": "jane.smith@test.com",
                "age": "22",
                "major": "Mathematics",
                "phone": "+1-555-987-6543"
            },
            {
                "name": "Bob Wilson",
                "email": "bob.wilson@test.com",
                "age": "21",
                "major": "Physics",
                "phone": "+1-555-456-7890"
            }
        ]

        dataset = db.query(TestData).filter(
            TestData.name == "Student Test Data",
            TestData.project_id == project.id
        ).first()

        if not dataset:
            dataset = TestData(
                name="Student Test Data",
                description="Test data for student management system testing",
                data_type="student",
                project_id=project.id,
                data_content=test_data_items,
                record_count=len(test_data_items)
            )
            db.add(dataset)
            db.commit()
            db.refresh(dataset)
            print(f"✅ Created dataset: {dataset.name}")
        else:
            print(f"📋 Dataset already exists: {dataset.name}")

        db.commit()
        print("\n🎉 Student Management System data initialization completed!")
        print(f"Project ID: {project.id}")
        print(f"Dataset ID: {dataset.id}")
        
    except Exception as e:
        print(f"❌ Error initializing data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_student_management_data()
