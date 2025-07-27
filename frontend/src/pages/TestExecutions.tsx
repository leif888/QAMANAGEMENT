import React, { useState } from 'react'
import { Typography, Button, Table, Space, Tag, Progress, Modal, Form, Input, Select, message } from 'antd'
import { PlusOutlined, EyeOutlined, FileTextOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

const TestExecutions: React.FC = () => {
  const navigate = useNavigate()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [dataSource, setDataSource] = useState([
    {
      key: '1',
      name: 'User Module Regression Test',
      project: 'E-commerce Platform Testing',
      status: 'completed',
      progress: 100,
      passRate: 85,
      executor: 'John',
      executedAt: '2024-01-20 14:30',
    },
    {
      key: '2',
      name: 'Payment Process Test',
      project: 'E-commerce Platform Testing',
      status: 'running',
      progress: 65,
      passRate: 78,
      executor: 'Jane',
      executedAt: '2024-01-20 16:00',
    },
    {
      key: '3',
      name: 'Product Management Test',
      project: 'E-commerce Platform Testing',
      status: 'failed',
      progress: 45,
      passRate: 60,
      executor: 'Bob',
      executedAt: '2024-01-20 10:15',
    },
    {
      key: '4',
      name: 'Order Processing Test',
      project: 'E-commerce Platform Testing',
      status: 'pending',
      progress: 0,
      passRate: 0,
      executor: 'Alice',
      executedAt: '-',
    },
  ])
  const columns = [
    {
      title: 'Execution Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : status === 'running' ? 'blue' : status === 'failed' ? 'red' : 'orange'}>
          {status === 'completed' ? 'Completed' : status === 'running' ? 'Running' : status === 'failed' ? 'Failed' : 'Pending'}
        </Tag>
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number, record) => (
        <Progress
          percent={progress}
          size="small"
          status={record.status === 'failed' ? 'exception' : record.status === 'completed' ? 'success' : 'active'}
        />
      ),
    },
    {
      title: 'Pass Rate',
      dataIndex: 'passRate',
      key: 'passRate',
      render: (rate: number) => (
        <span style={{ color: rate >= 80 ? '#52c41a' : rate >= 60 ? '#faad14' : '#f5222d' }}>
          {rate}%
        </span>
      ),
    },
    {
      title: 'Executor',
      dataIndex: 'executor',
      key: 'executor',
    },
    {
      title: 'Executed At',
      dataIndex: 'executedAt',
      key: 'executedAt',
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate('/test-executions/detail')}
          >
            View Details
          </Button>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            size="small"
            onClick={() => navigate('/test-executions/report')}
          >
            View Report
          </Button>
          {record.status === 'pending' && (
            <Button type="link" icon={<PlayCircleOutlined />} size="small">
              Start Execution
            </Button>
          )}
        </Space>
      ),
    },
  ]



  const handleCreateExecution = async () => {
    try {
      const values = await form.validateFields()
      console.log('Creating test execution:', values)

      // Create new execution object
      const newExecution = {
        key: Date.now().toString(), // Use timestamp as unique key
        name: values.name,
        project: values.project,
        status: 'pending', // New execution starts as pending
        progress: 0, // New execution starts with 0 progress
        passRate: 0, // New execution starts with 0 pass rate
        executor: values.executor,
        executedAt: '-', // Not executed yet
      }

      // Add to data source
      setDataSource(prevData => [...prevData, newExecution])

      // TODO: Call API to create test execution
      message.success('Test execution created successfully!')

      setIsModalVisible(false)
      form.resetFields()

    } catch (error) {
      message.error('Please fill in all required fields')
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
        pagination={{
          total: dataSource.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Total ${total} records`,
        }}
      />

      {/* New Test Execution Modal */}
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
            project: 'E-commerce Platform Testing'
          }}
        >
          <Form.Item
            label="Execution Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter execution name' },
              { min: 2, message: 'Execution name must be at least 2 characters' },
              { max: 100, message: 'Execution name cannot exceed 100 characters' }
            ]}
          >
            <Input placeholder="Enter execution name" />
          </Form.Item>

          <Form.Item
            label="Project"
            name="project"
            rules={[{ required: true, message: 'Please select project' }]}
          >
            <Select placeholder="Select project">
              <Option value="E-commerce Platform Testing">E-commerce Platform Testing</Option>
              <Option value="User Management System">User Management System</Option>
              <Option value="Payment Module Testing">Payment Module Testing</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { max: 500, message: 'Description cannot exceed 500 characters' }
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Enter execution description"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="Executor"
            name="executor"
            rules={[{ required: true, message: 'Please enter executor name' }]}
          >
            <Input placeholder="Enter executor name" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TestExecutions
