// 基础类型定义

export interface BaseEntity {
  id: number
  created_at: string
  updated_at: string
}

// Project related types
export interface Project extends BaseEntity {
  name: string
  description: string
  status: 'active' | 'paused' | 'completed'
}

// 测试步骤相关类型
export interface TestStep extends BaseEntity {
  name: string
  description: string
  type: 'action' | 'verification' | 'setup'
  parameters: string[]
  usageCount: number
  projectId: number
}

// 测试数据相关类型
export interface TestData extends BaseEntity {
  name: string
  description: string
  dataType: string
  recordCount: number
  version: string
  projectId: number
}

// 测试用例相关类型
export interface TestCase extends BaseEntity {
  name: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  gherkinContent: string
  projectId: number
  creatorId: number
  creator?: string
}

// 测试执行相关类型
export interface TestExecution extends BaseEntity {
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  passRate: number
  projectId: number
  executorId: number
  executor?: string
  executedAt?: string
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

// 表单类型
export interface CreateProjectForm {
  name: string
  description: string
}

export interface CreateTestStepForm {
  name: string
  description: string
  type: 'action' | 'verification' | 'setup'
  parameters: string[]
  projectId: number
}

export interface CreateTestCaseForm {
  name: string
  description: string
  priority: 'high' | 'medium' | 'low'
  gherkinContent: string
  projectId: number
}
