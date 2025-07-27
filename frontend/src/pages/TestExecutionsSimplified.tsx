import React, { useState, useEffect } from 'react'
import { Typography, Button, Table, Space, Tag, Progress, Modal, Form, Input, Select, message } from 'antd'
import { PlusOutlined, EyeOutlined, FileTextOutlined, PlayCircleOutlined } from '@ant-design/icons'
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
}

const TestExecutionsPage: React.FC = () => {
  const navigate = useNavigate()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [dataSource, setDataSource] = useState<TestExecution[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTestExecutions()
  }, [])

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
      setLoading(true)

      const executionData = {
        ...values,
        executor: 'Current User', // This should come from auth context
        test_case_ids: [], // This should be selected from test cases
      }

      const response = await fetch('http://localhost:8000/api/v1/test-executions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(executionData)
      })

      if (response.ok) {
        message.success('Test execution created successfully!')
        await loadTestExecutions()
        setIsModalVisible(false)
        form.resetFields()
      } else {
        const error = await response.json()
        message.error(error.detail || 'Failed to create test execution')
      }
    } catch (error) {
      console.error('Failed to create test execution:', error)
      message.error('Failed to create test execution')
    } finally {
      setLoading(false)
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
            status: 'pending',
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
            <TextArea rows={3} placeholder="Enter execution description" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
          >
            <Select>
              <Option value="pending">Pending</Option>
              <Option value="running">Running</Option>
              <Option value="completed">Completed</Option>
              <Option value="failed">Failed</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Notes"
            name="notes"
          >
            <TextArea rows={3} placeholder="Enter execution notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TestExecutionsPage
