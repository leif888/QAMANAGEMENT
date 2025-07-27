import React, { useState, useEffect } from 'react'
import { Typography, Button, Table, Space, Tag, Progress, Modal, Form, Input, Select, message, Checkbox, Divider } from 'antd'
import { PlusOutlined, EyeOutlined, FileTextOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

interface TestExecution {
  id: number
  name: string
  status: string
  progress: number
  pass_rate?: number
  executor: string
  executed_at: string
  test_case_ids?: number[]
  tags?: string[]
  execution_type?: string
}

interface TestCase {
  id: number
  name: string
  tags: string
  status: string
}

const TestExecutionsPage: React.FC = () => {
  const navigate = useNavigate()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [dataSource, setDataSource] = useState<TestExecution[]>([])
  const [loading, setLoading] = useState(false)
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [selectedTestCases, setSelectedTestCases] = useState<number[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [executionType, setExecutionType] = useState<string>('playwright')
  const [progressModal, setProgressModal] = useState<{visible: boolean, executionId?: number}>({visible: false})

  useEffect(() => {
    loadTestExecutions()
    loadTestCases()
  }, [])

  const loadTestCases = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/test-cases/')
      if (response.ok) {
        const data = await response.json()
        setTestCases(data)

        // 提取所有标签
        const tags = new Set<string>()
        data.forEach((testCase: TestCase) => {
          if (testCase.tags) {
            testCase.tags.split(',').forEach(tag => {
              const trimmedTag = tag.trim()
              if (trimmedTag) {
                tags.add(trimmedTag)
              }
            })
          }
        })
        setAvailableTags(Array.from(tags))
      }
    } catch (error) {
      console.error('Failed to load test cases:', error)
    }
  }

  const loadTestExecutions = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:8000/api/v1/test-executions/')
      if (response.ok) {
        const data = await response.json()
        setDataSource(data || [])
      } else {
        message.error('Failed to load test executions')
      }
    } catch (error) {
      console.error('Failed to load test executions:', error)
      message.error('Failed to load test executions')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Execution Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          completed: { color: 'green', text: 'Completed' },
          running: { color: 'blue', text: 'Running' },
          failed: { color: 'red', text: 'Failed' },
          pending: { color: 'orange', text: 'Pending' },
        }
        const config = statusConfig[status] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress percent={progress} size="small" />
      ),
    },
    {
      title: 'Pass Rate',
      dataIndex: 'pass_rate',
      key: 'pass_rate',
      render: (rate: number) => rate ? `${rate}%` : '-',
    },
    {
      title: 'Executor',
      dataIndex: 'executor',
      key: 'executor',
    },
    {
      title: 'Executed At',
      dataIndex: 'executed_at',
      key: 'executed_at',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record: TestExecution) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate('/test-executions/detail', { state: { execution: record } })}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            size="small"
            onClick={() => navigate('/test-executions/report', { state: { execution: record } })}
          >
            Report
          </Button>
        </Space>
      ),
    },
  ]

  const handleCreateExecution = async () => {
    try {
      const values = await form.validateFields()

      // 验证至少选择了测试用例或标签
      if (selectedTestCases.length === 0 && selectedTags.length === 0) {
        message.error('Please select test cases or tags')
        return
      }

      setLoading(true)

      const executionData = {
        name: values.name,
        description: values.description || '',
        test_case_ids: selectedTestCases,
        tags: selectedTags,
        environment: values.environment || 'test',
        browser: values.browser || 'chromium',
        headless: values.headless !== false,
        execution_type: executionType,
        notes: values.notes || ''
      }

      console.log('Creating execution with data:', executionData)

      const response = await fetch('http://localhost:8000/api/v1/test-executions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(executionData)
      })

      if (response.ok) {
        const result = await response.json()
        message.success('Test execution created successfully!')
        await loadTestExecutions()
        setIsModalVisible(false)
        form.resetFields()
        setSelectedTestCases([])
        setSelectedTags([])

        // 如果是Playwright执行，询问是否立即开始
        if (executionType === 'playwright') {
          Modal.confirm({
            title: 'Start Execution',
            content: 'Do you want to start the Playwright execution now?',
            onOk: () => startPlaywrightExecution(result.id),
          })
        }
      } else {
        const error = await response.json()
        console.error('Create execution error:', error)
        message.error(error.detail || 'Failed to create test execution')
      }
    } catch (error) {
      console.error('Failed to create test execution:', error)
      message.error('Failed to create test execution')
    } finally {
      setLoading(false)
    }
  }

  const startPlaywrightExecution = async (executionId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/test-executions/${executionId}/start-playwright`, {
        method: 'POST'
      })

      if (response.ok) {
        message.success('Playwright execution started!')
        setProgressModal({visible: true, executionId})
        await loadTestExecutions()
      } else {
        const error = await response.json()
        message.error(error.detail || 'Failed to start execution')
      }
    } catch (error) {
      console.error('Failed to start execution:', error)
      message.error('Failed to start execution')
    }
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Test Execution Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          New Execution
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowKey="id"
        pagination={{
          total: dataSource.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Total ${total} records`,
        }}
      />

      {/* Create Test Execution Modal */}
      <Modal
        title="Create New Test Execution"
        open={isModalVisible}
        onOk={handleCreateExecution}
        onCancel={handleCancel}
        okText="Create"
        cancelText="Cancel"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            environment: 'test',
            browser: 'chromium',
            headless: true,
          }}
        >
          <Form.Item
            label="Execution Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter execution name' },
              { min: 2, message: 'Name must be at least 2 characters' },
            ]}
          >
            <Input placeholder="Enter execution name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea rows={2} placeholder="Enter execution description" />
          </Form.Item>

          <Form.Item label="Execution Type">
            <Select value={executionType} onChange={setExecutionType}>
              <Option value="playwright">Playwright + pytest-bdd</Option>
              <Option value="manual">Manual Testing</Option>
              <Option value="api">API Testing</Option>
            </Select>
          </Form.Item>

          <Divider>Test Selection</Divider>

          <Form.Item label="Select by Test Cases">
            <Checkbox.Group
              value={selectedTestCases}
              onChange={setSelectedTestCases}
              style={{ width: '100%' }}
            >
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {testCases.map(testCase => (
                  <div key={testCase.id} style={{ marginBottom: '8px' }}>
                    <Checkbox value={testCase.id}>
                      {testCase.name}
                      {testCase.tags && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                          Tags: {testCase.tags}
                        </span>
                      )}
                    </Checkbox>
                  </div>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item label="Or Select by Tags">
            <Select
              mode="multiple"
              placeholder="Select tags to run all test cases with these tags"
              value={selectedTags}
              onChange={setSelectedTags}
              style={{ width: '100%' }}
            >
              {availableTags.map(tag => (
                <Option key={tag} value={tag}>{tag}</Option>
              ))}
            </Select>
          </Form.Item>

          {executionType === 'playwright' && (
            <>
              <Divider>Playwright Configuration</Divider>

              <Form.Item label="Environment" name="environment">
                <Select>
                  <Option value="test">Test</Option>
                  <Option value="staging">Staging</Option>
                  <Option value="production">Production</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Browser" name="browser">
                <Select>
                  <Option value="chromium">Chromium</Option>
                  <Option value="firefox">Firefox</Option>
                  <Option value="webkit">WebKit</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Headless Mode" name="headless" valuePropName="checked">
                <Checkbox>Run in headless mode</Checkbox>
              </Form.Item>
            </>
          )}

          <Form.Item label="Notes" name="notes">
            <TextArea rows={2} placeholder="Additional notes for this execution" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Progress Monitoring Modal */}
      <Modal
        title="Execution Progress"
        open={progressModal.visible}
        onCancel={() => setProgressModal({visible: false})}
        footer={[
          <Button key="close" onClick={() => setProgressModal({visible: false})}>
            Close
          </Button>,
          <Button key="refresh" icon={<ReloadOutlined />} onClick={() => {
            // Refresh progress
          }}>
            Refresh
          </Button>
        ]}
        width={600}
      >
        <div>
          <p>Execution is running... Check the progress in the main table.</p>
          <p>You can close this dialog and monitor progress from the executions list.</p>
        </div>
      </Modal>
    </div>
  )
}

export default TestExecutionsPage
