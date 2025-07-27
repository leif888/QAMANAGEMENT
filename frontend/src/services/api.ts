import axios from 'axios'
import type { 
  ApiResponse, 
  PaginatedResponse, 
  Project, 
  TestStep, 
  TestData, 
  TestCase, 
  TestExecution 
} from '@/types'

// 创建axios实例
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// 项目相关API
export const projectApi = {
  getProjects: (): Promise<ApiResponse<PaginatedResponse<Project>>> =>
    api.get('/projects'),
  
  getProject: (id: number): Promise<ApiResponse<Project>> =>
    api.get(`/projects/${id}`),
  
  createProject: (data: Partial<Project>): Promise<ApiResponse<Project>> =>
    api.post('/projects', data),
  
  updateProject: (id: number, data: Partial<Project>): Promise<ApiResponse<Project>> =>
    api.put(`/projects/${id}`, data),
  
  deleteProject: (id: number): Promise<ApiResponse<void>> =>
    api.delete(`/projects/${id}`),
}

// 测试步骤相关API
export const testStepApi = {
  getTestSteps: (): Promise<ApiResponse<PaginatedResponse<TestStep>>> =>
    api.get('/test-steps'),
  
  getTestStep: (id: number): Promise<ApiResponse<TestStep>> =>
    api.get(`/test-steps/${id}`),
  
  createTestStep: (data: Partial<TestStep>): Promise<ApiResponse<TestStep>> =>
    api.post('/test-steps', data),
  
  updateTestStep: (id: number, data: Partial<TestStep>): Promise<ApiResponse<TestStep>> =>
    api.put(`/test-steps/${id}`, data),
  
  deleteTestStep: (id: number): Promise<ApiResponse<void>> =>
    api.delete(`/test-steps/${id}`),
}

// 测试数据相关API
export const testDataApi = {
  getTestData: (): Promise<ApiResponse<PaginatedResponse<TestData>>> =>
    api.get('/test-data'),
  
  getTestDataDetail: (id: number): Promise<ApiResponse<TestData>> =>
    api.get(`/test-data/${id}`),
  
  createTestData: (data: Partial<TestData>): Promise<ApiResponse<TestData>> =>
    api.post('/test-data', data),
  
  updateTestData: (id: number, data: Partial<TestData>): Promise<ApiResponse<TestData>> =>
    api.put(`/test-data/${id}`, data),
  
  deleteTestData: (id: number): Promise<ApiResponse<void>> =>
    api.delete(`/test-data/${id}`),
  
  importTestData: (file: File): Promise<ApiResponse<void>> => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/test-data/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  exportTestData: (id: number): Promise<Blob> =>
    api.get(`/test-data/export?id=${id}`, { responseType: 'blob' }),
}

// 测试用例相关API
export const testCaseApi = {
  getTestCases: (): Promise<ApiResponse<PaginatedResponse<TestCase>>> =>
    api.get('/test-cases'),
  
  getTestCase: (id: number): Promise<ApiResponse<TestCase>> =>
    api.get(`/test-cases/${id}`),
  
  createTestCase: (data: Partial<TestCase>): Promise<ApiResponse<TestCase>> =>
    api.post('/test-cases', data),
  
  updateTestCase: (id: number, data: Partial<TestCase>): Promise<ApiResponse<TestCase>> =>
    api.put(`/test-cases/${id}`, data),
  
  deleteTestCase: (id: number): Promise<ApiResponse<void>> =>
    api.delete(`/test-cases/${id}`),
  
  reviewTestCase: (id: number, action: 'approve' | 'reject', comment?: string): Promise<ApiResponse<void>> =>
    api.post(`/test-cases/${id}/review`, { action, comment }),
  
  getTestCaseHistory: (id: number): Promise<ApiResponse<any[]>> =>
    api.get(`/test-cases/${id}/history`),
}

// 测试执行相关API
export const testExecutionApi = {
  getTestExecutions: (): Promise<ApiResponse<PaginatedResponse<TestExecution>>> =>
    api.get('/test-executions'),
  
  getTestExecution: (id: number): Promise<ApiResponse<TestExecution>> =>
    api.get(`/test-executions/${id}`),
  
  createTestExecution: (data: Partial<TestExecution>): Promise<ApiResponse<TestExecution>> =>
    api.post('/test-executions', data),
  
  updateTestExecution: (id: number, data: Partial<TestExecution>): Promise<ApiResponse<TestExecution>> =>
    api.put(`/test-executions/${id}`, data),
  
  getTestExecutionReport: (id: number): Promise<ApiResponse<any>> =>
    api.get(`/test-executions/${id}/report`),
  
  getTestReportsSummary: (): Promise<ApiResponse<any>> =>
    api.get('/test-executions/reports/summary'),
}

export default api
