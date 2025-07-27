import React, { useState, useEffect } from 'react'
import {
  Typography, Button, Tree, Modal, Form, Input, Select, message,
  Space, Tooltip, Card, Row, Col, Spin, Tag, Switch
} from 'antd'
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined, 
  FileTextOutlined, FileAddOutlined, CodeOutlined 
} from '@ant-design/icons'
import Editor from '@monaco-editor/react'
import { setupGherkinLanguage } from '../utils/monacoConfig'

const { Title } = Typography
const { Option } = Select
const { DirectoryTree } = Tree

interface TestCase {
  id: number
  name: string
  tags?: string
  gherkin_content?: string
  is_folder?: boolean
  parent_id?: number
  sort_order?: number
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
  full_name: string
  file_extension: string
}

const TestCasesTreeStructurePage: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([])
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)
  const [selectedFile, setSelectedFile] = useState<TestCaseFile | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isFileModalVisible, setIsFileModalVisible] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isFileEditMode, setIsFileEditMode] = useState(false)
  const [form] = Form.useForm()
  const [fileForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fileContent, setFileContent] = useState('')
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null)

  useEffect(() => {
    loadTestCases()
    // Setup Gherkin language support when Monaco is ready
    const timer = setTimeout(() => {
      setupGherkinLanguage()
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const loadTestCases = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:8000/api/v1/test-cases/')
      if (response.ok) {
        const data = await response.json()
        setTreeData(convertToTreeData(data))
      } else {
        message.error('Failed to load test cases')
      }
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
      
      if (testCase.is_folder) {
        // Folder node - can contain other folders, test cases, and files
        const fileNodes = testCase.files?.map(file => ({
          key: `file-${file.id}`,
          title: (
            <Space>
              <FileTextOutlined style={{
                color: file.file_type === 'feature' ? '#52c41a' : '#1890ff'
              }} />
              <span>{file.full_name}</span>
              <Tooltip title="Edit File Name">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditFile(file)
                  }}
                />
              </Tooltip>
              <Tooltip title="Delete File">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteFile(file.id)
                  }}
                />
              </Tooltip>
            </Space>
          ),
          isLeaf: true,
          data: { ...file, nodeType: 'file', parentTestCase: testCase }
        })) || []

        return {
          key: `folder-${testCase.id}`,
          title: (
            <Space>
              <FolderOutlined style={{ color: '#faad14' }} />
              <span>{testCase.name}</span>
              <Space size="small">
                <Tooltip title="Edit Folder">
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
                <Tooltip title="Delete Folder">
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
          children: [...children.map(buildNode), ...fileNodes],
          isLeaf: false,
          data: { ...testCase, nodeType: 'folder' }
        }
      } else {
        // Test case node - now just a regular item, files are managed at folder level
        return {
          key: `testcase-${testCase.id}`,
          title: (
            <Space>
              <FileTextOutlined style={{ color: '#722ed1' }} />
              <span>{testCase.name}</span>
              {testCase.tags && (
                <Space size={4}>
                  {testCase.tags.split(',').filter(tag => tag.trim()).map(tag => (
                    <Tag key={tag.trim()} size="small" color="blue">{tag.trim()}</Tag>
                  ))}
                </Space>
              )}
              <Space size="small">
                <Tooltip title="Edit Test Case">
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
                <Tooltip title="Delete Test Case">
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
          isLeaf: children.length === 0,
          data: { ...testCase, nodeType: 'testcase' }
        }
      }
    }

    return rootCases.map(buildNode)
  }

  const handleCreateTestCase = async () => {
    try {
      const values = await form.validateFields()
      console.log('Test case form values:', values)
      console.log('Selected parent ID:', selectedParentId)
      setLoading(true)

      const testCaseData = {
        ...values,
        parent_id: selectedParentId,
      }
      console.log('Test case data to send:', testCaseData)

      const url = isEditMode 
        ? `http://localhost:8000/api/v1/test-cases/${selectedTestCase?.id}`
        : 'http://localhost:8000/api/v1/test-cases/'

      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCaseData)
      })

      if (response.ok) {
        message.success(`${values.is_folder ? 'Folder' : 'Test case'} ${isEditMode ? 'updated' : 'created'} successfully!`)
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
      tags: testCase.tags,
      is_folder: testCase.is_folder,
    })
    setIsModalVisible(true)
  }

  const handleEditFile = (file: TestCaseFile) => {
    setIsFileEditMode(true)
    setSelectedFile(file)
    fileForm.setFieldsValue({
      name: file.name,
      file_type: file.file_type,
    })
    setIsFileModalVisible(true)
  }

  const handleDelete = async (testCaseId: number) => {
    Modal.confirm({
      title: 'Delete Item',
      content: 'Are you sure you want to delete this item? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/v1/test-cases/${testCaseId}`, {
            method: 'DELETE'
          })
          
          if (response.ok) {
            message.success('Item deleted successfully!')
            await loadTestCases()
          } else {
            const error = await response.json()
            message.error(error.detail || 'Failed to delete item')
          }
        } catch (error) {
          console.error('Failed to delete item:', error)
          message.error('Failed to delete item')
        }
      },
    })
  }

  const handleDeleteFile = async (fileId: number) => {
    Modal.confirm({
      title: 'Delete File',
      content: 'Are you sure you want to delete this file? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/v1/test-case-files/${fileId}`, {
            method: 'DELETE'
          })
          
          if (response.ok) {
            message.success('File deleted successfully!')
            await loadTestCases()
          } else {
            const error = await response.json()
            message.error(error.detail || 'Failed to delete file')
          }
        } catch (error) {
          console.error('Failed to delete file:', error)
          message.error('Failed to delete file')
        }
      },
    })
  }

  const handleAddFile = (testCase: TestCase) => {
    setSelectedTestCase(testCase)
    setIsFileEditMode(false)
    fileForm.resetFields()
    setIsFileModalVisible(true)
  }

  const handleCreateFile = async () => {
    if (!selectedTestCase && !isFileEditMode) {
      message.error('No test case selected')
      return
    }

    try {
      const values = await fileForm.validateFields()
      console.log('File form values:', values)
      console.log('Selected test case:', selectedTestCase)
      console.log('Is file edit mode:', isFileEditMode)

      if (isFileEditMode && selectedFile) {
        // Update file name
        const response = await fetch(`http://localhost:8000/api/v1/test-case-files/${selectedFile.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: values.name,
            file_type: values.file_type,
            content: selectedFile.content
          })
        })

        if (response.ok) {
          message.success('File updated successfully!')
          setIsFileModalVisible(false)
          setIsFileEditMode(false)
          setSelectedFile(null)
          fileForm.resetFields()
          await loadTestCases()
        } else {
          const error = await response.json()
          message.error(error.detail || 'Failed to update file')
        }
      } else {
        // Create new file with better default content
        const defaultFeatureContent = `Feature: ${selectedTestCase!.name}
  As a user
  I want to test ${selectedTestCase!.name.toLowerCase()}
  So that I can ensure it works correctly

  Scenario: Basic ${selectedTestCase!.name.toLowerCase()} test
    Given I am on the application
    When I perform the action
    Then I should see the expected result`

        const defaultYamlContent = `# Test data for ${selectedTestCase!.name}
test_data:
  valid_input:
    username: "testuser"
    password: "testpass"

  invalid_input:
    username: ""
    password: ""

config:
  timeout: 30
  retry_count: 3`

        const fileData = {
          ...values,
          test_case_id: selectedTestCase!.id,
          content: values.file_type === 'feature' ? defaultFeatureContent : defaultYamlContent,
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
          await loadTestCases()
        } else {
          const error = await response.json()
          message.error(error.detail || 'Failed to create file')
        }
      }
    } catch (error) {
      console.error('Failed to save file:', error)
      message.error('Failed to save file')
    }
  }

  const onTreeSelect = async (selectedKeys: any[], info: any) => {
    if (selectedKeys.length > 0 && info.node.data) {
      const nodeData = info.node.data
      
      if (nodeData.nodeType === 'file') {
        // File selected
        setSelectedFile(nodeData)
        setFileContent(nodeData.content || '')
        setSelectedTestCase(nodeData.parentTestCase)
        setSelectedParentId(null)
      } else if (nodeData.nodeType === 'testcase') {
        // Test case selected
        setSelectedTestCase(nodeData)
        setSelectedFile(null)
        setSelectedParentId(nodeData.parent_id)
        
        // Load files for this test case
        const files = await loadTestCaseFiles(nodeData.id)
        setSelectedTestCase({...nodeData, files})
      } else if (nodeData.nodeType === 'folder') {
        // Folder selected
        setSelectedTestCase(nodeData)
        setSelectedFile(null)
        setSelectedParentId(nodeData.id) // Set as parent for new items

        // Load files for this folder
        const files = await loadTestCaseFiles(nodeData.id)
        setSelectedTestCase({...nodeData, files})
      }
    } else {
      // Clear selection when clicking empty space
      setSelectedTestCase(null)
      setSelectedFile(null)
      setSelectedParentId(null)
    }
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

  const handleContainerClick = (e: React.MouseEvent) => {
    // Clear selection when clicking on empty space
    if (e.target === e.currentTarget) {
      setSelectedTestCase(null)
      setSelectedFile(null)
      setSelectedParentId(null)
    }
  }

  return (
    <div onClick={handleContainerClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Test Case Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          New Item
        </Button>
      </div>

      <Row gutter={16}>
        <Col span={8}>
          <Card title="Test Case Tree" size="small">
            <Spin spinning={loading}>
              <DirectoryTree
                treeData={treeData}
                onSelect={onTreeSelect}
                height={600}
                defaultExpandAll={true}
              />
            </Spin>
          </Card>
        </Col>
        <Col span={16}>
          <Card 
            title={
              <Space>
                <CodeOutlined />
                {selectedFile ? `File: ${selectedFile.full_name}` : 
                 selectedTestCase ? `${selectedTestCase.is_folder ? 'Folder' : 'Test Case'}: ${selectedTestCase.name}` : 
                 'Select an item from the tree'}
              </Space>
            }
            size="small"
          >
            {selectedFile ? (
              <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Editing: {selectedFile.full_name}</strong>
                  <Button type="primary" onClick={handleSaveFileContent}>
                    Save
                  </Button>
                </div>
                <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}>
                  <Editor
                    height="500px"
                    language={selectedFile.file_type === 'feature' ? 'gherkin' : 'yaml'}
                    theme={selectedFile.file_type === 'feature' ? 'gherkin-theme' : 'vs'}
                    value={fileContent}
                    onChange={(value) => setFileContent(value || '')}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      lineNumbers: 'on',
                      wordWrap: 'on',
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>
            ) : selectedTestCase ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Type:</strong> {selectedTestCase.is_folder ? 'Folder' : 'Test Case'}
                </div>
                {selectedTestCase.tags && (
                  <div style={{ marginBottom: 16 }}>
                    <strong>Tags:</strong>
                    <Space size={4} style={{ marginLeft: 8 }}>
                      {selectedTestCase.tags.split(',').filter(tag => tag.trim()).map(tag => (
                        <Tag key={tag.trim()} color="blue">{tag.trim()}</Tag>
                      ))}
                    </Space>
                  </div>
                )}
                {!selectedTestCase.is_folder && (
                  <div style={{ marginTop: 16, padding: 16, background: '#f9f9f9', borderRadius: 6 }}>
                    <p style={{ margin: 0, color: '#666' }}>
                      💡 <strong>Tip:</strong> Create .feature files to write Gherkin scenarios, or .yaml files for test data.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                Select an item from the tree to view its content
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Create/Edit Modal */}
      <Modal
        title={isEditMode ? "Edit Item" : "Create New Item"}
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
            is_folder: false,
          }}
        >
          {selectedParentId && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f0f8ff', borderRadius: 6 }}>
              <strong>Parent:</strong> {selectedTestCase?.name || 'Selected Item'}
              <br />
              <small>This item will be created under the selected parent.</small>
            </div>
          )}
          
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Enter name" />
          </Form.Item>

          <Form.Item
            label="Type"
            name="is_folder"
            valuePropName="checked"
          >
            <Space>
              <span>Is Folder</span>
              <Switch />
            </Space>
          </Form.Item>

          <Form.Item
            label="Tags (comma separated)"
            name="tags"
            dependencies={['is_folder']}
          >
            {({ getFieldValue }) => (
              <div style={{ display: getFieldValue('is_folder') ? 'none' : 'block' }}>
                <Input placeholder="e.g., smoke, regression, api" />
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>

      {/* Create/Edit File Modal */}
      <Modal
        title={isFileEditMode ? "Edit File" : "Create New File"}
        open={isFileModalVisible}
        onOk={handleCreateFile}
        onCancel={() => {
          setIsFileModalVisible(false)
          setIsFileEditMode(false)
          setSelectedFile(null)
          fileForm.resetFields()
        }}
        okText={isFileEditMode ? "Update" : "Create"}
        cancelText="Cancel"
      >
        <Form
          form={fileForm}
          layout="vertical"
          initialValues={{
            file_type: 'feature',
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
        </Form>
      </Modal>
    </div>
  )
}

export default TestCasesTreeStructurePage
