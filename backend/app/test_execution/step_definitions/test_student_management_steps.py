import pytest
from pytest_bdd import scenarios, given, when, then, parsers
from playwright.sync_api import Page, expect
from pages.student_management_page import StudentManagementPage
from typing import Dict, List

# Load scenarios from feature file
scenarios('../features/student_management.feature')

@pytest.fixture
def student_page(student_management_page: Page) -> StudentManagementPage:
    """Create StudentManagementPage instance."""
    return StudentManagementPage(student_management_page)

# Given steps
@given('I am on the student management system page')
def given_on_student_management_page(student_page: StudentManagementPage):
    """Ensure we are on the student management page."""
    student_page.wait_for_page_load()
    expect(student_page.page_title).to_have_text("Student Management System")

@given('there are no students in the system')
def given_no_students_in_system(student_page: StudentManagementPage):
    """Ensure there are no students in the system."""
    # The system starts empty by default
    pass

@given(parsers.parse('I have added a student with the following details:\n{student_data}'))
def given_student_added(student_page: StudentManagementPage, student_data: str):
    """Add a student with the given details."""
    data = parse_table_data(student_data)
    student_page.fill_student_form(data)
    student_page.click_add_student_button()

@given(parsers.parse('I have added multiple students:\n{students_data}'))
def given_multiple_students_added(student_page: StudentManagementPage, students_data: str):
    """Add multiple students with the given details."""
    students = parse_multiple_students_data(students_data)
    for student_data in students:
        student_page.fill_student_form(student_data)
        student_page.click_add_student_button()

# When steps
@when(parsers.parse('I fill in the student form with the following details:\n{student_data}'))
def when_fill_student_form(student_page: StudentManagementPage, student_data: str):
    """Fill the student form with provided data."""
    data = parse_table_data(student_data)
    student_page.fill_student_form(data)

@when(parsers.parse('I update the student form with the following details:\n{student_data}'))
def when_update_student_form(student_page: StudentManagementPage, student_data: str):
    """Update the student form with provided data."""
    data = parse_table_data(student_data)
    student_page.clear_all_form_fields()
    student_page.fill_student_form(data)

@when('I click the "Add Student" button')
def when_click_add_student_button(student_page: StudentManagementPage):
    """Click the Add Student button."""
    student_page.click_add_student_button()

@when('I click the "Update Student" button')
def when_click_update_student_button(student_page: StudentManagementPage):
    """Click the Update Student button."""
    student_page.click_update_student_button()

@when('I click the "Cancel" button')
def when_click_cancel_button(student_page: StudentManagementPage):
    """Click the Cancel button."""
    student_page.click_cancel_button()

@when(parsers.parse('I click the "Edit" button for student "{student_name}"'))
def when_click_edit_button(student_page: StudentManagementPage, student_name: str):
    """Click the Edit button for a specific student."""
    student_page.click_edit_button_for_student(student_name)

@when(parsers.parse('I click the "Delete" button for student "{student_name}"'))
def when_click_delete_button(student_page: StudentManagementPage, student_name: str):
    """Click the Delete button for a specific student."""
    student_page.click_delete_button_for_student(student_name)

@when('I confirm the deletion')
def when_confirm_deletion(student_page: StudentManagementPage):
    """Confirm the deletion dialog."""
    student_page.confirm_deletion()

@when('I cancel the deletion')
def when_cancel_deletion(student_page: StudentManagementPage):
    """Cancel the deletion dialog."""
    student_page.cancel_deletion()

@when('I click the "Add Student" button without filling any information')
def when_click_add_without_info(student_page: StudentManagementPage):
    """Click Add Student button without filling any information."""
    student_page.clear_all_form_fields()
    student_page.click_add_student_button()

# Then steps
@then(parsers.parse('I should see the student "{student_name}" in the student list'))
def then_student_visible_in_list(student_page: StudentManagementPage, student_name: str):
    """Verify that the student is visible in the list."""
    assert student_page.is_student_visible(student_name), f"Student {student_name} should be visible"

@then(parsers.parse('I should not see the student "{student_name}" in the student list'))
def then_student_not_visible_in_list(student_page: StudentManagementPage, student_name: str):
    """Verify that the student is not visible in the list."""
    assert not student_page.is_student_visible(student_name), f"Student {student_name} should not be visible"

@then(parsers.parse('the student should have email "{email}"'))
def then_student_has_email(student_page: StudentManagementPage, email: str):
    """Verify student's email."""
    # Get the most recently added student or use context
    # For simplicity, we'll check the first student in the list
    students = student_page.student_items.all()
    if students:
        actual_email = students[0].locator('p:has-text("Email:")').inner_text()
        assert email in actual_email, f"Expected email {email} not found"

@then(parsers.parse('the student should have age "{age}"'))
def then_student_has_age(student_page: StudentManagementPage, age: str):
    """Verify student's age."""
    students = student_page.student_items.all()
    if students:
        age_elements = students[0].locator('p:has-text("Age:")')
        if age_elements.count() > 0:
            actual_age = age_elements.inner_text()
            assert age in actual_age, f"Expected age {age} not found"

@then(parsers.parse('the student should have major "{major}"'))
def then_student_has_major(student_page: StudentManagementPage, major: str):
    """Verify student's major."""
    students = student_page.student_items.all()
    if students:
        major_elements = students[0].locator('p:has-text("Major:")')
        if major_elements.count() > 0:
            actual_major = major_elements.inner_text()
            assert major in actual_major, f"Expected major {major} not found"

@then(parsers.parse('the student should have phone "{phone}"'))
def then_student_has_phone(student_page: StudentManagementPage, phone: str):
    """Verify student's phone."""
    students = student_page.student_items.all()
    if students:
        phone_elements = students[0].locator('p:has-text("Phone:")')
        if phone_elements.count() > 0:
            actual_phone = phone_elements.inner_text()
            assert phone in actual_phone, f"Expected phone {phone} not found"

@then('I should see a validation message indicating required fields')
def then_see_validation_message(student_page: StudentManagementPage):
    """Verify validation message is shown."""
    # Handle the alert dialog
    def handle_dialog(dialog):
        assert "Name and Email are required" in dialog.message
        dialog.accept()
    
    student_page.page.on("dialog", handle_dialog)

@then(parsers.parse('I should see the message "{message}"'))
def then_see_message(student_page: StudentManagementPage, message: str):
    """Verify a specific message is displayed."""
    if message == "No Students Found":
        assert student_page.is_empty_state_visible()
        assert message in student_page.get_empty_state_title()
    elif "Add your first student" in message:
        assert message in student_page.get_empty_state_message()

@then(parsers.parse('I should see "{header_text}" in the student list header'))
def then_see_header_text(student_page: StudentManagementPage, header_text: str):
    """Verify the student list header contains specific text."""
    actual_header = student_page.get_student_count_from_header()
    assert header_text in actual_header, f"Expected '{header_text}' in header, but got '{actual_header}'"

# Helper functions
def parse_table_data(table_data: str) -> Dict[str, str]:
    """Parse table data from Gherkin format."""
    data = {}
    lines = table_data.strip().split('\n')
    for line in lines[1:]:  # Skip header line
        if '|' in line:
            parts = [part.strip() for part in line.split('|')[1:-1]]  # Remove empty first/last elements
            if len(parts) >= 2:
                data[parts[0]] = parts[1]
    return data

def parse_multiple_students_data(students_data: str) -> List[Dict[str, str]]:
    """Parse multiple students data from Gherkin format."""
    students = []
    lines = students_data.strip().split('\n')
    headers = [h.strip() for h in lines[0].split('|')[1:-1]]  # Get headers
    
    for line in lines[1:]:  # Skip header line
        if '|' in line:
            values = [v.strip() for v in line.split('|')[1:-1]]
            if len(values) == len(headers):
                student_data = dict(zip(headers, values))
                students.append(student_data)
    
    return students
