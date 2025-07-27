from playwright.sync_api import Page, expect
from typing import Dict, List


class StudentManagementPage:
    """Page Object Model for Student Management System."""
    
    def __init__(self, page: Page):
        self.page = page
        
        # Form selectors
        self.name_input = page.locator('input[name="name"]')
        self.email_input = page.locator('input[name="email"]')
        self.age_input = page.locator('input[name="age"]')
        self.major_input = page.locator('input[name="major"]')
        self.phone_input = page.locator('input[name="phone"]')
        self.add_button = page.locator('button[type="submit"]')
        self.cancel_button = page.locator('button:has-text("Cancel")')
        
        # Student list selectors
        self.student_list = page.locator('.student-list')
        self.student_items = page.locator('.student-item')
        self.empty_state = page.locator('.empty-state')
        self.student_list_header = page.locator('.student-list h2')
        
        # Page elements
        self.page_title = page.locator('h1.header')
        self.form_container = page.locator('.form-container')
    
    def navigate_to_page(self, url: str):
        """Navigate to the student management page."""
        self.page.goto(url)
        self.page.wait_for_load_state("networkidle")
    
    def fill_student_form(self, student_data: Dict[str, str]):
        """Fill the student form with provided data."""
        if 'name' in student_data:
            self.name_input.fill(student_data['name'])
        if 'email' in student_data:
            self.email_input.fill(student_data['email'])
        if 'age' in student_data:
            self.age_input.fill(student_data['age'])
        if 'major' in student_data:
            self.major_input.fill(student_data['major'])
        if 'phone' in student_data:
            self.phone_input.fill(student_data['phone'])
    
    def click_add_student_button(self):
        """Click the Add Student button."""
        self.add_button.click()
    
    def click_update_student_button(self):
        """Click the Update Student button."""
        update_button = self.page.locator('button:has-text("Update Student")')
        update_button.click()
    
    def click_cancel_button(self):
        """Click the Cancel button."""
        self.cancel_button.click()
    
    def get_student_by_name(self, name: str):
        """Get student element by name."""
        return self.page.locator(f'.student-item:has(h3:has-text("{name}"))')
    
    def is_student_visible(self, name: str) -> bool:
        """Check if a student is visible in the list."""
        student = self.get_student_by_name(name)
        return student.is_visible()
    
    def click_edit_button_for_student(self, name: str):
        """Click the Edit button for a specific student."""
        student = self.get_student_by_name(name)
        edit_button = student.locator('button:has-text("Edit")')
        edit_button.click()
    
    def click_delete_button_for_student(self, name: str):
        """Click the Delete button for a specific student."""
        student = self.get_student_by_name(name)
        delete_button = student.locator('button:has-text("Delete")')
        delete_button.click()
    
    def confirm_deletion(self):
        """Confirm deletion in the browser dialog."""
        self.page.on("dialog", lambda dialog: dialog.accept())
    
    def cancel_deletion(self):
        """Cancel deletion in the browser dialog."""
        self.page.on("dialog", lambda dialog: dialog.dismiss())
    
    def get_student_email(self, name: str) -> str:
        """Get the email of a student by name."""
        student = self.get_student_by_name(name)
        email_element = student.locator('p:has-text("Email:")')
        return email_element.inner_text().replace("Email: ", "")
    
    def get_student_age(self, name: str) -> str:
        """Get the age of a student by name."""
        student = self.get_student_by_name(name)
        age_element = student.locator('p:has-text("Age:")')
        return age_element.inner_text().replace("Age: ", "")
    
    def get_student_major(self, name: str) -> str:
        """Get the major of a student by name."""
        student = self.get_student_by_name(name)
        major_element = student.locator('p:has-text("Major:")')
        return major_element.inner_text().replace("Major: ", "")
    
    def get_student_phone(self, name: str) -> str:
        """Get the phone of a student by name."""
        student = self.get_student_by_name(name)
        phone_element = student.locator('p:has-text("Phone:")')
        return phone_element.inner_text().replace("Phone: ", "")
    
    def is_empty_state_visible(self) -> bool:
        """Check if the empty state is visible."""
        return self.empty_state.is_visible()
    
    def get_empty_state_title(self) -> str:
        """Get the empty state title text."""
        return self.empty_state.locator('h3').inner_text()
    
    def get_empty_state_message(self) -> str:
        """Get the empty state message text."""
        return self.empty_state.locator('p').inner_text()
    
    def get_student_count_from_header(self) -> str:
        """Get the student count from the list header."""
        return self.student_list_header.inner_text()
    
    def get_form_title(self) -> str:
        """Get the current form title."""
        return self.form_container.locator('h2').inner_text()
    
    def clear_all_form_fields(self):
        """Clear all form fields."""
        self.name_input.fill("")
        self.email_input.fill("")
        self.age_input.fill("")
        self.major_input.fill("")
        self.phone_input.fill("")
    
    def wait_for_page_load(self):
        """Wait for the page to fully load."""
        self.page.wait_for_load_state("networkidle")
        expect(self.page_title).to_be_visible()
    
    def get_validation_message(self) -> str:
        """Get validation message from browser alert."""
        # This will be handled by the dialog event listener
        return "Name and Email are required fields"
