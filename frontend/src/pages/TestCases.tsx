import React, { useState } from 'react'
import { Typography, Button, Table, Space, Tag, Modal, Form, Input, Select, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, AuditOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

const TestCases: React.FC = () => {
  const navigate = useNavigate()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [dataSource, setDataSource] = useState([
    {
      key: '1',
      name: 'User Login Function Test',
      project: 'E-commerce Platform Testing',
      priority: 'high',
      status: 'approved',
      creator: 'John',
      createdAt: '2024-01-20',
    },
    {
      key: '2',
      name: 'Product Search Function Test',
      project: 'E-commerce Platform Testing',
      priority: 'medium',
      status: 'pending',
      creator: 'Jane',
      createdAt: '2024-01-19',
    },
    {
      key: '3',
      name: 'Shopping Cart Operation Test',
      project: 'E-commerce Platform Testing',
      priority: 'medium',
      status: 'draft',
      creator: 'Bob',
      createdAt: '2024-01-18',
    },
  ])
  const columns = [
    {
      title: 'Test Case Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'green'}>
          {priority === 'high' ? 'High' : priority === 'medium' ? 'Medium' : 'Low'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'approved' ? 'green' : status === 'pending' ? 'orange' : 'blue'}>
          {status === 'approved' ? 'Approved' : status === 'pending' ? 'Pending' : 'Draft'}
        </Tag>
      ),
    },
    {
      title: 'Creator',
      dataIndex: 'creator',
      key: 'creator',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
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
            onClick={() => navigate('/test-cases/detail')}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate('/test-cases/detail')}
          >
            Edit
          </Button>
          {record.status === 'draft' && (
            <Button type="link" icon={<AuditOutlined />} size="small">
              Submit Review
            </Button>
          )}
          <Button type="link" danger icon={<DeleteOutlined />} size="small">
            Delete
          </Button>
        </Space>
      ),
    },
  ]



  const handleCreateTestCase = async () => {
    try {
      const values = await form.validateFields()
      console.log('Creating test case:', values)

      // Create new test case object
      const newTestCase = {
        key: Date.now().toString(), // Use timestamp as unique key
        name: values.name,
        project: values.project,
        priority: values.priority,
        status: 'draft', // New test case starts as draft
        creator: 'Current User', // In real app, get from auth context
        createdAt: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
      }

      // Add to data source
      setDataSource(prevData => [...prevData, newTestCase])

      // TODO: Call API to create test case
      message.success('Test case created successfully!')

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
        <Title level={2}>Test Case Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          New Test Case
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

      {/* New Test Case Modal */}
      <Modal
        title="Create New Test Case"
        open={isModalVisible}
        onOk={handleCreateTestCase}
        onCancel={handleCancel}
        okText="Create"
        cancelText="Cancel"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            priority: 'medium',
            project: 'E-commerce Platform Testing'
          }}
        >
          <Form.Item
            label="Test Case Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter test case name' },
              { min: 2, message: 'Test case name must be at least 2 characters' },
              { max: 100, message: 'Test case name cannot exceed 100 characters' }
            ]}
          >
            <Input placeholder="Enter test case name" />
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
              placeholder="Enter test case description"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="Priority"
            name="priority"
            rules={[{ required: true, message: 'Please select priority' }]}
          >
            <Select placeholder="Select priority">
              <Option value="high">High</Option>
              <Option value="medium">Medium</Option>
              <Option value="low">Low</Option>
            </Select>
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
            label="Tags"
            name="tags"
            help="Enter tags separated by commas (e.g., Login, Security)"
          >
            <Input placeholder="Enter tags (comma separated)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TestCases
