import React, { useState, useEffect } from 'react'
import { 
  Typography, Button, Tree, Modal, Form, Input, Select, message, 
  Space, Tooltip, Card, Row, Col, Spin, Tabs, Switch 
} from 'antd'
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined, 
  FileTextOutlined, PlayCircleOutlined, CodeOutlined, FileAddOutlined 
} from '@ant-design/icons'
import { testCaseApi, projectApi } from '@/services/api'
import type { Project } from '@/types'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select
const { DirectoryTree } = Tree
const { TabPane } = Tabs

interface TestCase {
  id: number
  name: string
  description?: string
  priority?: string
  status?: string
  gherkin_content?: string
  is_automated?: boolean
  is_folder?: boolean
  parent_id?: number
  sort_order?: number
  project_id: number
  full_path?: string
  children?: TestCase[]
  files?: TestCaseFile[]
}

interface TestCaseFile {
  id: number
  name: string
  file_type: 'feature' | 'yaml'
  content: string
  test_case_id: number
  project_id: number
  full_name: string
  file_extension: string
}

const TestCasesEnhancedPage: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([])
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)
  const [selectedFile, setSelectedFile] = useState<TestCaseFile | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isFileModalVisible, setIsFileModalVisible] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [form] = Form.useForm()
  const [fileForm] = Form.useForm()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [fileContent, setFileContent] = useState('')
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadTestCases()
    }
  }, [selectedProject])

  const loadProjects = async () => {
    try {
      const response = await projectApi.getProjects()
      setProjects(response || [])
    } catch (error) {
      console.error('Failed to load projects:', error)
      message.error('Failed to load projects')
    }
  }

  const loadTestCases = async () => {
    if (!selectedProject) return
    
    try {
      setLoading(true)
      const response = await testCaseApi.getTestCases()
      // Filter by project and build tree structure
      const projectCases = (response || []).filter(tc => tc.project_id === selectedProject)
      setTreeData(convertToTreeData(projectCases))
    } catch (error) {
      console.error('Failed to load test cases:', error)
      message.error('Failed to load test cases')
    } finally {
      setLoading(false)
    }
  }

  const loadTestCaseFiles = async (testCaseId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/test-case-files/?test_case_id=${testCaseId}`)
      if (response.ok) {
        const files = await response.json()
        return files
      }
    } catch (error) {
      console.error('Failed to load test case files:', error)
    }
    return []
  }

  const convertToTreeData = (testCases: TestCase[]): any[] => {
    const rootCases = testCases.filter(tc => !tc.parent_id)
    
    const buildNode = (testCase: TestCase): any => {
      const children = testCases.filter(tc => tc.parent_id === testCase.id)
      
      return {
        key: `case-${testCase.id}`,
        title: (
          <Space>
            {testCase.is_folder ? <FolderOutlined /> : <FileTextOutlined />}
            <span>{testCase.name}</span>
            <Space size="small">
              <Tooltip title="Edit">
                <Button 
                  type="text" 
                  size="small" 
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit(testCase)
                  }}
                />
              </Tooltip>
              {!testCase.is_folder && (
                <Tooltip title="Add File">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<FileAddOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddFile(testCase)
                    }}
                  />
                </Tooltip>
              )}
              <Tooltip title="Delete">
                <Button 
                  type="text" 
                  size="small" 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(testCase.id)
                  }}
                />
              </Tooltip>
            </Space>
          </Space>
        ),
        children: children.map(buildNode),
        isLeaf: !testCase.is_folder && children.length === 0,
        data: testCase
      }
    }

    return rootCases.map(buildNode)
  }

  const handleCreateTestCase = async () => {
    if (!selectedProject) {
      message.error('Please select a project first')
      return
    }

    try {
      const values = await form.validateFields()
      setLoading(true)

      const testCaseData = {
        ...values,
        project_id: selectedProject,
      }

      const url = isEditMode 
        ? `http://localhost:8000/api/v1/test-cases/${selectedTestCase?.id}`
        : 'http://localhost:8000/api/v1/test-cases/'

      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCaseData)
      })

      if (response.ok) {
        message.success(`Test case ${isEditMode ? 'updated' : 'created'} successfully!`)
        await loadTestCases()
        setIsModalVisible(false)
        setIsEditMode(false)
        setSelectedTestCase(null)
        form.resetFields()
      } else {
        const error = await response.json()
        message.error(error.detail || 'Failed to save test case')
      }
    } catch (error) {
      console.error('Failed to save test case:', error)
      message.error('Failed to save test case')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (testCase: TestCase) => {
    setIsEditMode(true)
    setSelectedTestCase(testCase)
    form.setFieldsValue({
      name: testCase.name,
      description: testCase.description,
      priority: testCase.priority,
      gherkin_content: testCase.gherkin_content,
      is_automated: testCase.is_automated,
      is_folder: testCase.is_folder,
    })
    setIsModalVisible(true)
  }

  const handleDelete = async (testCaseId: number) => {
    Modal.confirm({
      title: 'Delete Test Case',
      content: 'Are you sure you want to delete this test case? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/v1/test-cases/${testCaseId}`, {
            method: 'DELETE'
          })
          
          if (response.ok) {
            message.success('Test case deleted successfully!')
            await loadTestCases()
          } else {
            const error = await response.json()
            message.error(error.detail || 'Failed to delete test case')
          }
        } catch (error) {
          console.error('Failed to delete test case:', error)
          message.error('Failed to delete test case')
        }
      },
    })
  }

  const handleAddFile = (testCase: TestCase) => {
    setSelectedTestCase(testCase)
    fileForm.resetFields()
    setIsFileModalVisible(true)
  }

  const handleCreateFile = async () => {
    if (!selectedTestCase) return

    try {
      const values = await fileForm.validateFields()
      
      const fileData = {
        ...values,
        test_case_id: selectedTestCase.id,
        project_id: selectedTestCase.project_id,
      }

      const response = await fetch('http://localhost:8000/api/v1/test-case-files/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData)
      })

      if (response.ok) {
        message.success('File created successfully!')
        setIsFileModalVisible(false)
        fileForm.resetFields()
        // Reload files for the selected test case
        if (selectedTestCase) {
          const files = await loadTestCaseFiles(selectedTestCase.id)
          setSelectedTestCase({...selectedTestCase, files})
        }
      } else {
        const error = await response.json()
        message.error(error.detail || 'Failed to create file')
      }
    } catch (error) {
      console.error('Failed to create file:', error)
      message.error('Failed to create file')
    }
  }

  const onTreeSelect = async (selectedKeys: any[], info: any) => {
    if (selectedKeys.length > 0 && info.node.data) {
      const testCase = info.node.data
      setSelectedTestCase(testCase)
      setActiveTab('details')
      
      // Load files for this test case
      if (!testCase.is_folder) {
        const files = await loadTestCaseFiles(testCase.id)
        setSelectedTestCase({...testCase, files})
      }
    }
  }

  const handleFileSelect = (file: TestCaseFile) => {
    setSelectedFile(file)
    setFileContent(file.content)
    setActiveTab('files')
  }

  const handleSaveFileContent = async () => {
    if (!selectedFile) return

    try {
      const response = await fetch(`http://localhost:8000/api/v1/test-case-files/${selectedFile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fileContent })
      })

      if (response.ok) {
        message.success('File saved successfully!')
        setSelectedFile({...selectedFile, content: fileContent})
      } else {
        const error = await response.json()
        message.error(error.detail || 'Failed to save file')
      }
    } catch (error) {
      console.error('Failed to save file:', error)
      message.error('Failed to save file')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Enhanced Test Case Management</Title>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div>
            <label style={{ marginRight: 8 }}>Project:</label>
            <Select
              style={{ width: 200 }}
              placeholder="Select a project"
              value={selectedProject}
              onChange={setSelectedProject}
              loading={loading}
            >
              {projects.map(project => (
                <Option key={project.id} value={project.id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            disabled={!selectedProject}
          >
            New Test Case
          </Button>
        </div>
      </div>

      {!selectedProject && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          background: '#f5f5f5', 
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <p style={{ fontSize: '16px', color: '#666' }}>
            Please select a project to view and manage test cases
          </p>
        </div>
      )}

      {selectedProject && (
        <Row gutter={16}>
          <Col span={8}>
            <Card title="Test Case Tree" size="small">
              <Spin spinning={loading}>
                <DirectoryTree
                  treeData={treeData}
                  onSelect={onTreeSelect}
                  height={600}
                />
              </Spin>
            </Card>
          </Col>
          <Col span={16}>
            <Card 
              title={
                <Space>
                  <CodeOutlined />
                  {selectedTestCase ? `Test Case: ${selectedTestCase.name}` : 'Select a test case'}
                </Space>
              }
              size="small"
            >
              {selectedTestCase ? (
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                  <TabPane tab="Details" key="details">
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <strong>Description:</strong> {selectedTestCase.description || 'No description'}
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <strong>Priority:</strong> {selectedTestCase.priority || 'Medium'}
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <strong>Automated:</strong> {selectedTestCase.is_automated ? 'Yes' : 'No'}
                      </div>
                      {selectedTestCase.gherkin_content && (
                        <div>
                          <strong>Gherkin Content:</strong>
                          <TextArea
                            value={selectedTestCase.gherkin_content}
                            readOnly
                            rows={10}
                            style={{ marginTop: 8, fontFamily: 'monospace' }}
                          />
                        </div>
                      )}
                    </div>
                  </TabPane>
                  
                  {!selectedTestCase.is_folder && (
                    <TabPane tab="Files" key="files">
                      <div style={{ marginBottom: 16 }}>
                        <Button 
                          type="primary" 
                          icon={<FileAddOutlined />}
                          onClick={() => handleAddFile(selectedTestCase)}
                        >
                          Add File
                        </Button>
                      </div>
                      
                      <Row gutter={16}>
                        <Col span={8}>
                          <div style={{ marginBottom: 16 }}>
                            <strong>Files:</strong>
                          </div>
                          {selectedTestCase.files?.map(file => (
                            <div 
                              key={file.id} 
                              style={{ 
                                padding: '8px', 
                                border: selectedFile?.id === file.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                borderRadius: '4px',
                                marginBottom: '8px',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleFileSelect(file)}
                            >
                              <Space>
                                <FileTextOutlined />
                                <span>{file.full_name}</span>
                              </Space>
                            </div>
                          ))}
                        </Col>
                        
                        <Col span={16}>
                          {selectedFile && (
                            <div>
                              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong>Editing: {selectedFile.full_name}</strong>
                                <Button type="primary" onClick={handleSaveFileContent}>
                                  Save
                                </Button>
                              </div>
                              <TextArea
                                value={fileContent}
                                onChange={(e) => setFileContent(e.target.value)}
                                rows={20}
                                style={{ fontFamily: 'monospace' }}
                                placeholder={selectedFile.file_type === 'feature' 
                                  ? 'Feature: Test Feature Name\n  Scenario: Test scenario\n    Given precondition\n    When action\n    Then expected result'
                                  : 'key: value\nconfig:\n  setting: true'
                                }
                              />
                            </div>
                          )}
                        </Col>
                      </Row>
                    </TabPane>
                  )}
                </Tabs>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  Select a test case from the tree to view its details and files
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* Create/Edit Test Case Modal */}
      <Modal
        title={isEditMode ? "Edit Test Case" : "Create New Test Case"}
        open={isModalVisible}
        onOk={handleCreateTestCase}
        onCancel={() => {
          setIsModalVisible(false)
          setIsEditMode(false)
          setSelectedTestCase(null)
          form.resetFields()
        }}
        okText={isEditMode ? "Update" : "Create"}
        cancelText="Cancel"
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            priority: 'medium',
            is_automated: false,
            is_folder: false,
          }}
        >
          <Form.Item
            label="Test Case Name"
            name="name"
            rules={[{ required: true, message: 'Please enter test case name' }]}
          >
            <Input placeholder="Enter test case name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea rows={3} placeholder="Enter test case description" />
          </Form.Item>

          <Form.Item
            label="Priority"
            name="priority"
          >
            <Select>
              <Option value="high">High</Option>
              <Option value="medium">Medium</Option>
              <Option value="low">Low</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Gherkin Content (BDD)"
            name="gherkin_content"
          >
            <TextArea 
              rows={6} 
              placeholder="Feature: Test Case Name
  Scenario: Test scenario
    Given precondition
    When action
    Then expected result"
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              label="Is Automated"
              name="is_automated"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Is Folder"
              name="is_folder"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Create File Modal */}
      <Modal
        title="Create New File"
        open={isFileModalVisible}
        onOk={handleCreateFile}
        onCancel={() => {
          setIsFileModalVisible(false)
          fileForm.resetFields()
        }}
        okText="Create"
        cancelText="Cancel"
      >
        <Form
          form={fileForm}
          layout="vertical"
          initialValues={{
            file_type: 'feature',
            content: '',
          }}
        >
          <Form.Item
            label="File Name"
            name="name"
            rules={[{ required: true, message: 'Please enter file name' }]}
          >
            <Input placeholder="Enter file name (without extension)" />
          </Form.Item>

          <Form.Item
            label="File Type"
            name="file_type"
            rules={[{ required: true, message: 'Please select file type' }]}
          >
            <Select>
              <Option value="feature">Feature File (.feature)</Option>
              <Option value="yaml">YAML File (.yaml)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Initial Content"
            name="content"
          >
            <TextArea 
              rows={8} 
              placeholder="Enter initial file content..."
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TestCasesEnhancedPage
