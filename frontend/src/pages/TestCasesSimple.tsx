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
  is_folder?: boolean
  parent_id?: number
}

interface TestCaseFile {
  id: number
  name: string
  file_type: 'feature' | 'yaml'
  content: string
  test_case_id: number
  full_name: string
}

const TestCasesSimplePage: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([])
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)
  const [selectedFile, setSelectedFile] = useState<TestCaseFile | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isFileModalVisible, setIsFileModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [fileForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fileContent, setFileContent] = useState('')
  const [allFiles, setAllFiles] = useState<TestCaseFile[]>([])
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null)

  useEffect(() => {
    loadData()
    setTimeout(() => setupGherkinLanguage(), 1000)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load test cases
      const casesResponse = await fetch('http://localhost:8000/api/v1/test-cases/')
      const testCases = casesResponse.ok ? await casesResponse.json() : []
      
      // Load all files
      const filesResponse = await fetch('http://localhost:8000/api/v1/test-case-files/')
      const files = filesResponse.ok ? await filesResponse.json() : []
      
      console.log('Loaded test cases:', testCases)
      console.log('Loaded files:', files)
      
      setAllFiles(files)
      setTreeData(buildTreeData(testCases, files))
    } catch (error) {
      console.error('Failed to load data:', error)
      message.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const buildTreeData = (testCases: TestCase[], files: TestCaseFile[]): any[] => {
    const rootCases = testCases.filter(tc => !tc.parent_id)
    
    const buildNode = (testCase: TestCase): any => {
      const children = testCases.filter(tc => tc.parent_id === testCase.id)
      const testCaseFiles = files.filter(f => f.test_case_id === testCase.id)
      
      console.log(`Building node for ${testCase.name} (ID: ${testCase.id}), files:`, testCaseFiles)
      
      if (testCase.is_folder) {
        // Folder node with files
        const fileNodes = testCaseFiles.map(file => ({
          key: `file-${file.id}`,
          title: (
            <Space>
              <FileTextOutlined style={{
                color: file.file_type === 'feature' ? '#52c41a' : '#1890ff'
              }} />
              <span>{file.full_name}</span>
              <Tooltip title="Delete File">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteFile(file.id, file.full_name)
                  }}
                />
              </Tooltip>
            </Space>
          ),
          isLeaf: true,
          data: { ...file, nodeType: 'file', parentTestCase: testCase }
        }))
        
        return {
          key: `folder-${testCase.id}`,
          title: (
            <Space>
              <FolderOutlined style={{ color: '#faad14' }} />
              <span>{testCase.name}</span>
              <Space size="small">
                <Tooltip title="Add Folder">
                  <Button
                    type="text"
                    size="small"
                    icon={<FolderOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddFolder(testCase)
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
                      handleDeleteFolder(testCase.id, testCase.name)
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
        // Regular test case
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
              <Tooltip title="Delete Test Case">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteTestCase(testCase.id, testCase.name)
                  }}
                />
              </Tooltip>
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
      console.log('Creating test case with values:', values)
      
      const testCaseData = {
        name: values.name,
        tags: values.tags || '',
        is_folder: values.is_folder || false,
        parent_id: selectedParentId,
        creator_id: 1
      }
      console.log('Sending test case data with parent_id:', testCaseData)

      const response = await fetch('http://localhost:8000/api/v1/test-cases/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCaseData)
      })

      if (response.ok) {
        message.success(`${values.is_folder ? 'Folder' : 'Test case'} created successfully!`)
        setIsModalVisible(false)
        setSelectedParentId(null)
        form.resetFields()
        await loadData()
      } else {
        const error = await response.json()
        console.error('API Error:', error)
        message.error(error.detail || 'Failed to create item')
      }
    } catch (error) {
      console.error('Failed to create item:', error)
      message.error('Failed to create item')
    }
  }

  const handleAddFolder = (testCase: TestCase) => {
    console.log('Adding folder under test case:', testCase)
    setSelectedTestCase(testCase)
    setSelectedParentId(testCase.id)
    form.setFieldsValue({ is_folder: true })
    setIsModalVisible(true)
  }

  const handleAddFile = (testCase: TestCase) => {
    console.log('Adding file to test case:', testCase)
    setSelectedTestCase(testCase)
    fileForm.resetFields()
    setIsFileModalVisible(true)
  }

  const handleDeleteFile = async (fileId: number, fileName: string) => {
    Modal.confirm({
      title: 'Delete File',
      content: `Are you sure you want to delete "${fileName}"? This action cannot be undone.`,
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
            await loadData()
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

  const handleDeleteFolder = async (folderId: number, folderName: string) => {
    Modal.confirm({
      title: 'Delete Folder',
      content: `Are you sure you want to delete "${folderName}" and all its contents? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/v1/test-cases/${folderId}`, {
            method: 'DELETE'
          })

          if (response.ok) {
            message.success('Folder deleted successfully!')
            await loadData()
          } else {
            const error = await response.json()
            message.error(error.detail || 'Failed to delete folder')
          }
        } catch (error) {
          console.error('Failed to delete folder:', error)
          message.error('Failed to delete folder')
        }
      },
    })
  }

  const handleDeleteTestCase = async (testCaseId: number, testCaseName: string) => {
    Modal.confirm({
      title: 'Delete Test Case',
      content: `Are you sure you want to delete "${testCaseName}"? This action cannot be undone.`,
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
            await loadData()
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

  const handleCreateFile = async () => {
    if (!selectedTestCase) {
      message.error('No test case selected')
      return
    }

    try {
      const values = await fileForm.validateFields()
      console.log('Creating file with values:', values)

      const defaultFeatureContent = `Feature: ${selectedTestCase.name}
  As a user
  I want to test ${selectedTestCase.name.toLowerCase()}
  So that I can ensure it works correctly

  Scenario: Basic ${selectedTestCase.name.toLowerCase()} test
    Given I am on the application
    When I perform the action
    Then I should see the expected result`

      const defaultYamlContent = `# Test data for ${selectedTestCase.name}
test_data:
  valid_input:
    username: "testuser"
    password: "testpass"
  
config:
  timeout: 30
  retry_count: 3`

      const fileData = {
        name: values.name,
        file_type: values.file_type,
        test_case_id: selectedTestCase.id,
        content: values.file_type === 'feature' ? defaultFeatureContent : defaultYamlContent,
        creator_id: 1
      }

      const response = await fetch('http://localhost:8000/api/v1/test-case-files/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData)
      })

      if (response.ok) {
        const newFile = await response.json()
        console.log('File created successfully:', newFile)
        message.success('File created successfully!')
        setIsFileModalVisible(false)
        fileForm.resetFields()
        
        // Reload all data to refresh the tree
        await loadData()
      } else {
        const error = await response.json()
        console.error('File creation error:', error)
        message.error(error.detail || 'Failed to create file')
      }
    } catch (error) {
      console.error('Failed to create file:', error)
      message.error('Failed to create file')
    }
  }

  const onTreeSelect = (selectedKeys: any[], info: any) => {
    if (selectedKeys.length > 0 && info.node.data) {
      const nodeData = info.node.data
      console.log('Selected node:', nodeData)

      if (nodeData.nodeType === 'file') {
        setSelectedFile(nodeData)
        setFileContent(nodeData.content || '')
        setSelectedTestCase(nodeData.parentTestCase)
        setSelectedParentId(null) // Files don't set parent for new items
      } else {
        setSelectedTestCase(nodeData)
        setSelectedFile(null)
        // Set parent_id based on node type
        if (nodeData.nodeType === 'folder') {
          setSelectedParentId(nodeData.id) // New items will be created under this folder
        } else {
          setSelectedParentId(nodeData.parent_id) // New items will be created at the same level
        }
        console.log('Set parent_id to:', nodeData.nodeType === 'folder' ? nodeData.id : nodeData.parent_id)
      }
    } else {
      // Clear selection
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Test Case Management (Simple)</Title>
        <Space>
          <Button onClick={loadData}>Refresh</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            New Item
          </Button>
        </Space>
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
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>Select a file from the tree to edit its content</p>
                {selectedTestCase && selectedTestCase.is_folder && (
                  <div>
                    <p>📁 Click "Add Folder" to create a subfolder</p>
                    <p>📝 Click "Add File" to create a new file</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Create Test Case Modal */}
      <Modal
        title="Create New Item"
        open={isModalVisible}
        onOk={handleCreateTestCase}
        onCancel={() => {
          setIsModalVisible(false)
          setSelectedParentId(null)
          form.resetFields()
        }}
        okText="Create"
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ is_folder: false }}
        >
          {selectedParentId && selectedTestCase && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f0f8ff', borderRadius: 6 }}>
              <strong>Parent Folder:</strong> {selectedTestCase.name}
              <br />
              <small>This item will be created under the selected folder.</small>
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
            label="Is Folder"
            name="is_folder"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            shouldUpdate={(prevValues, currentValues) => prevValues.is_folder !== currentValues.is_folder}
          >
            {({ getFieldValue }) =>
              !getFieldValue('is_folder') ? (
                <Form.Item
                  label="Tags (comma separated)"
                  name="tags"
                >
                  <Input placeholder="e.g., smoke, regression, api" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
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
          initialValues={{ file_type: 'feature' }}
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

export default TestCasesSimplePage
