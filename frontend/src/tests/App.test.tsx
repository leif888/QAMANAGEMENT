import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import App from '../App'

// 创建测试用的QueryClient
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

// 测试包装器组件
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  )
}

describe('App Component', () => {
  test('renders without crashing', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
  })

  test('displays sidebar navigation', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // 检查侧边栏导航项
    expect(screen.getByText('仪表盘')).toBeInTheDocument()
    expect(screen.getByText('项目管理')).toBeInTheDocument()
    expect(screen.getByText('测试步骤')).toBeInTheDocument()
    expect(screen.getByText('测试数据')).toBeInTheDocument()
    expect(screen.getByText('测试用例')).toBeInTheDocument()
    expect(screen.getByText('测试执行')).toBeInTheDocument()
  })

  test('displays header with title', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    expect(screen.getByText('QA管理系统')).toBeInTheDocument()
  })
})
