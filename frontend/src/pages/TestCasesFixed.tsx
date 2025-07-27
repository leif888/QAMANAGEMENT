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
}

const TestCasesFixedPage: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([])
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)
  const [selectedFile, setSelectedFile] = useState<TestCaseFile | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isFileModalVisible, setIsFileModalVisible] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [form] = Form.useForm()
  const [fileForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fileContent, setFileContent] = useState('')
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null)

  useEffect(() => {
    loadTestCases()
    setTimeout(() => setupGherkinLanguage(), 1000)
  }, [])

  const loadTestCases = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:8000/api/v1/test-cases/')
      if (response.ok) {
        const data = await response.json()

        // Load files for each folder
        const testCasesWithFiles = await Promise.all(
          data.map(async (testCase: TestCase) => {
            if (testCase.is_folder) {
              const files = await loadTestCaseFiles(testCase.id)
              return { ...testCase, files }
            }
            return testCase
          })
        )

        setTreeData(convertToTreeData(testCasesWithFiles))
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
      console.log(`Loading files for test case ${testCaseId}`)
      const response = await fetch(`http://localhost:8000/api/v1/test-case-files/?test_case_id=${testCaseId}`)
      if (response.ok) {
        const files = await response.json()
        console.log(`Found ${files.length} files for test case ${testCaseId}:`, files)
        return files
      } else {
        console.error(`Failed to load files for test case ${testCaseId}:`, response.status, response.statusText)
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
        // Load files for folder
        console.log(`Building folder node for ${testCase.name}, files:`, testCase.files)
        const fileNodes = testCase.files?.map(file => ({
          key: `file-${file.id}`,
          title: (
            <Space>
              <FileTextOutlined style={{ 
                color: file.file_type === 'feature' ? '#52c41a' : '#1890ff' 
              }} />
              <span>{file.full_name}</span>
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
              </Space>
            </Space>
          ),
          children: [...children.map(buildNode), ...fileNodes],
          isLeaf: false,
          data: { ...testCase, nodeType: 'folder' }
        }
      } else {
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
      console.log('Form values:', values)
      setLoading(true)

      const testCaseData = {
        name: values.name,
        tags: values.tags || '',
        is_folder: values.is_folder || false,
        parent_id: selectedParentId,
        creator_id: 1
      }
      console.log('Sending data:', testCaseData)

      const response = await fetch('http://localhost:8000/api/v1/test-cases/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCaseData)
      })

      if (response.ok) {
        message.success(`${values.is_folder ? 'Folder' : 'Test case'} created successfully!`)
        await loadTestCases()
        setIsModalVisible(false)
        form.resetFields()
      } else {
        const error = await response.json()
        console.error('API Error:', error)
        message.error(error.detail || 'Failed to create item')
      }
    } catch (error) {
      console.error('Failed to create item:', error)
      message.error('Failed to create item')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFile = (testCase: TestCase) => {
    console.log('Adding file to test case:', testCase)
    setSelectedTestCase(testCase)
    fileForm.resetFields()
    setIsFileModalVisible(true)
  }

  const handleCreateFile = async () => {
    if (!selectedTestCase) {
      message.error('No test case selected')
      return
    }

    try {
      const values = await fileForm.validateFields()
      console.log('File form values:', values)
      console.log('Selected test case:', selectedTestCase)

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
      console.log('Sending file data:', fileData)

      const response = await fetch('http://localhost:8000/api/v1/test-case-files/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData)
      })

      if (response.ok) {
        const newFile = await response.json()
        message.success('File created successfully!')
        setIsFileModalVisible(false)
        fileForm.resetFields()

        // Immediately update the selected test case with the new file
        if (selectedTestCase) {
          const updatedFiles = await loadTestCaseFiles(selectedTestCase.id)
          setSelectedTestCase({...selectedTestCase, files: updatedFiles})
        }

        // Reload the entire tree
        await loadTestCases()
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

  const onTreeSelect = async (selectedKeys: any[], info: any) => {
    if (selectedKeys.length > 0 && info.node.data) {
      const nodeData = info.node.data
      
      if (nodeData.nodeType === 'file') {
        setSelectedFile(nodeData)
        setFileContent(nodeData.content || '')
        setSelectedTestCase(nodeData.parentTestCase)
      } else if (nodeData.nodeType === 'folder') {
        setSelectedTestCase(nodeData)
        setSelectedFile(null)
        setSelectedParentId(nodeData.id)
        
        // Load files for this folder
        const files = await loadTestCaseFiles(nodeData.id)
        setSelectedTestCase({...nodeData, files})
      } else {
        setSelectedTestCase(nodeData)
        setSelectedFile(null)
        setSelectedParentId(nodeData.parent_id)
      }
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
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                Select a file from the tree to edit its content
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Create Modal */}
      <Modal
        title="Create New Item"
        open={isModalVisible}
        onOk={handleCreateTestCase}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        okText="Create"
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            is_folder: false,
          }}
        >
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

export default TestCasesFixedPage
