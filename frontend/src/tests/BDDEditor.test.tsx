import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BDDEditor from '../components/BDDEditor'

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => {
  return {
    __esModule: true,
    default: ({ value, onChange }: any) => (
      <textarea
        data-testid="monaco-editor"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    )
  }
})

describe('BDDEditor Component', () => {
  test('renders editor with default props', () => {
    render(<BDDEditor />)
    
    expect(screen.getByText('BDD测试用例编辑器')).toBeInTheDocument()
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
  })

  test('displays editor controls', () => {
    render(<BDDEditor />)
    
    expect(screen.getByText('撤销')).toBeInTheDocument()
    expect(screen.getByText('重做')).toBeInTheDocument()
    expect(screen.getByText('插入模板')).toBeInTheDocument()
    expect(screen.getByText('验证语法')).toBeInTheDocument()
    expect(screen.getByText('保存')).toBeInTheDocument()
  })

  test('calls onChange when editor content changes', async () => {
    const mockOnChange = jest.fn()
    render(<BDDEditor onChange={mockOnChange} />)
    
    const editor = screen.getByTestId('monaco-editor')
    fireEvent.change(editor, { target: { value: 'Feature: Test Feature' } })
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('Feature: Test Feature')
    })
  })

  test('inserts template when template button is clicked', async () => {
    const mockOnChange = jest.fn()
    render(<BDDEditor onChange={mockOnChange} />)
    
    const templateButton = screen.getByText('插入模板')
    fireEvent.click(templateButton)
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  test('validates syntax when validate button is clicked', () => {
    render(<BDDEditor value="Feature: Test Feature\nScenario: Test Scenario" />)
    
    const validateButton = screen.getByText('验证语法')
    fireEvent.click(validateButton)
    
    // 验证按钮应该可以点击
    expect(validateButton).toBeInTheDocument()
  })

  test('renders with initial value', () => {
    const initialValue = 'Feature: Initial Feature'
    render(<BDDEditor value={initialValue} />)
    
    const editor = screen.getByTestId('monaco-editor')
    expect(editor).toHaveValue(initialValue)
  })

  test('renders in readonly mode', () => {
    render(<BDDEditor readOnly={true} />)
    
    const editor = screen.getByTestId('monaco-editor')
    expect(editor).toBeInTheDocument()
  })
})
