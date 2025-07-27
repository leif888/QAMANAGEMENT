Feature: Student Management System
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
    And the student should have email "john.doe@example.com"
    And the student should have age "20"
    And the student should have major "Computer Science"
    And the student should have phone "+1-555-123-4567"

  @smoke
  Scenario: Add a new student with only required information
    When I fill in the student form with the following details:
      | field | value                |
      | name  | Jane Smith           |
      | email | jane.smith@test.com  |
    And I click the "Add Student" button
    Then I should see the student "Jane Smith" in the student list
    And the student should have email "jane.smith@test.com"

  @regression
  Scenario: Edit an existing student
    Given I have added a student with the following details:
      | field | value                    |
      | name  | Alice Johnson            |
      | email | alice.johnson@test.com   |
      | age   | 22                       |
      | major | Mathematics              |
      | phone | +1-555-987-6543         |
    When I click the "Edit" button for student "Alice Johnson"
    And I update the student form with the following details:
      | field | value                    |
      | name  | Alice Johnson-Smith      |
      | email | alice.smith@test.com     |
      | age   | 23                       |
      | major | Applied Mathematics      |
      | phone | +1-555-987-1234         |
    And I click the "Update Student" button
    Then I should see the student "Alice Johnson-Smith" in the student list
    And the student should have email "alice.smith@test.com"
    And the student should have age "23"
    And the student should have major "Applied Mathematics"
    And the student should have phone "+1-555-987-1234"

  @regression
  Scenario: Delete a student
    Given I have added a student with the following details:
      | field | value                  |
      | name  | Bob Wilson             |
      | email | bob.wilson@test.com    |
      | age   | 21                     |
      | major | Physics                |
      | phone | +1-555-456-7890       |
    When I click the "Delete" button for student "Bob Wilson"
    And I confirm the deletion
    Then I should not see the student "Bob Wilson" in the student list

  @regression
  Scenario: Cancel student deletion
    Given I have added a student with the following details:
      | field | value                  |
      | name  | Carol Davis            |
      | email | carol.davis@test.com   |
      | age   | 19                     |
      | major | Chemistry              |
      | phone | +1-555-321-9876       |
    When I click the "Delete" button for student "Carol Davis"
    And I cancel the deletion
    Then I should see the student "Carol Davis" in the student list

  @regression
  Scenario: Cancel editing a student
    Given I have added a student with the following details:
      | field | value                    |
      | name  | David Brown              |
      | email | david.brown@test.com     |
      | age   | 24                       |
      | major | Engineering              |
      | phone | +1-555-654-3210         |
    When I click the "Edit" button for student "David Brown"
    And I update the student form with the following details:
      | field | value                    |
      | name  | David Brown-Updated      |
      | email | david.updated@test.com   |
    And I click the "Cancel" button
    Then I should see the student "David Brown" in the student list
    And the student should have email "david.brown@test.com"

  @smoke
  Scenario: Form validation for required fields
    When I click the "Add Student" button without filling any information
    Then I should see a validation message indicating required fields

  @regression
  Scenario: Display empty state when no students exist
    Given there are no students in the system
    Then I should see the message "No Students Found"
    And I should see the message "Add your first student using the form above."

  @regression
  Scenario: Student count display
    Given I have added multiple students:
      | name        | email                  |
      | Student One | student1@test.com      |
      | Student Two | student2@test.com      |
      | Student Three | student3@test.com    |
    Then I should see "Student List (3)" in the student list header
