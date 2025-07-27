-- 学生管理系统测试用例数据
-- 请在QA系统数据库中执行这些SQL语句

-- 1. 创建学生管理项目
INSERT INTO projects (name, description, created_at) VALUES 
('Student Management System', 'A web-based student information management system', datetime('now'));

-- 2. 创建测试用例
INSERT INTO test_cases (
    name, description, priority, status, project_id, 
    bdd_content, expected_result, created_at
) VALUES 
(
    'Add New Student - Complete Information',
    'Test adding a new student with all required and optional information',
    'high',
    'active',
    (SELECT id FROM projects WHERE name = 'Student Management System'),
    'Feature: Student Management System
  Scenario: Add a new student with all information
    Given I am on the student management system page
    When I fill in the student form with complete details
    And I click the "Add Student" button
    Then I should see the student in the student list
    And all student information should be displayed correctly',
    'Student should be successfully added to the system with all information preserved',
    datetime('now')
),
(
    'Add New Student - Required Fields Only',
    'Test adding a new student with only required information (name and email)',
    'high',
    'active',
    (SELECT id FROM projects WHERE name = 'Student Management System'),
    'Feature: Student Management System
  Scenario: Add a new student with only required information
    Given I am on the student management system page
    When I fill in the student form with name and email only
    And I click the "Add Student" button
    Then I should see the student in the student list
    And the student should have the correct name and email',
    'Student should be successfully added with required fields only',
    datetime('now')
),
(
    'Edit Existing Student',
    'Test editing an existing student''s information',
    'medium',
    'active',
    (SELECT id FROM projects WHERE name = 'Student Management System'),
    'Feature: Student Management System
  Scenario: Edit an existing student
    Given I have added a student to the system
    When I click the "Edit" button for the student
    And I update the student information
    And I click the "Update Student" button
    Then I should see the updated information in the student list',
    'Student information should be successfully updated',
    datetime('now')
),
(
    'Delete Student',
    'Test deleting a student from the system',
    'medium',
    'active',
    (SELECT id FROM projects WHERE name = 'Student Management System'),
    'Feature: Student Management System
  Scenario: Delete a student
    Given I have added a student to the system
    When I click the "Delete" button for the student
    And I confirm the deletion
    Then the student should be removed from the student list',
    'Student should be successfully deleted from the system',
    datetime('now')
),
(
    'Form Validation',
    'Test form validation for required fields',
    'high',
    'active',
    (SELECT id FROM projects WHERE name = 'Student Management System'),
    'Feature: Student Management System
  Scenario: Form validation for required fields
    Given I am on the student management system page
    When I click the "Add Student" button without filling any information
    Then I should see validation messages for required fields',
    'Appropriate validation messages should be displayed',
    datetime('now')
);

-- 3. 创建测试数据集
INSERT INTO test_data_sets (
    name, description, data_type, project_id, created_at
) VALUES 
(
    'Student Test Data',
    'Test data for student management system testing',
    'student',
    (SELECT id FROM projects WHERE name = 'Student Management System'),
    datetime('now')
);

-- 4. 添加测试数据
INSERT INTO test_data (
    dataset_id, data_key, data_value, data_type, created_at
) VALUES 
(
    (SELECT id FROM test_data_sets WHERE name = 'Student Test Data'),
    'student_1',
    '{"name": "John Doe", "email": "john.doe@example.com", "age": "20", "major": "Computer Science", "phone": "+1-555-123-4567"}',
    'json',
    datetime('now')
),
(
    (SELECT id FROM test_data_sets WHERE name = 'Student Test Data'),
    'student_2',
    '{"name": "Jane Smith", "email": "jane.smith@test.com", "age": "22", "major": "Mathematics", "phone": "+1-555-987-6543"}',
    'json',
    datetime('now')
),
(
    (SELECT id FROM test_data_sets WHERE name = 'Student Test Data'),
    'student_3',
    '{"name": "Bob Wilson", "email": "bob.wilson@test.com", "age": "21", "major": "Physics", "phone": "+1-555-456-7890"}',
    'json',
    datetime('now')
),
(
    (SELECT id FROM test_data_sets WHERE name = 'Student Test Data'),
    'student_4',
    '{"name": "Alice Johnson", "email": "alice.johnson@test.com", "age": "23", "major": "Chemistry", "phone": "+1-555-321-9876"}',
    'json',
    datetime('now')
);

-- 5. 创建Feature文件记录
INSERT INTO feature_files (
    name, file_path, content, project_id, created_at
) VALUES 
(
    'Student Management Feature',
    'tests/features/student_management.feature',
    'Feature: Student Management System
  As a user of the student management system
  I want to be able to manage student information
  So that I can keep track of students effectively

  Background:
    Given I am on the student management system page

  @smoke
  Scenario: Add a new student with all information
    When I fill in the student form with the following details:
      | field | value                    |
      | name  | John Doe                 |
      | email | john.doe@example.com     |
      | age   | 20                       |
      | major | Computer Science         |
      | phone | +1-555-123-4567         |
    And I click the "Add Student" button
    Then I should see the student "John Doe" in the student list
    And the student should have email "john.doe@example.com"',
    (SELECT id FROM projects WHERE name = 'Student Management System'),
    datetime('now')
);
