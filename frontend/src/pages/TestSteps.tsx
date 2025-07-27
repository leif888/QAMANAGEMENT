import React, { useState } from 'react'
import { Typography, Button, Table, Space, Tag, Modal, Form, Input, Select, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

const TestSteps: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingStep, setEditingStep] = useState<any>(null)
  const [form] = Form.useForm()
  const [dataSource, setDataSource] = useState([
    {
      key: '1',
      name: 'User Login',
      description: 'Enter username and password to login',
      type: 'action',
      parameters: ['username', 'password'],
      usageCount: 15,
    },
    {
      key: '2',
      name: 'Verify Login Success',
      description: 'Verify user successfully logged into the system',
      type: 'verification',
      parameters: ['expectedUrl'],
      usageCount: 12,
    },
    {
      key: '3',
      name: 'Prepare Test User',
      description: 'Create test user data',
      type: 'setup',
      parameters: ['userType', 'permissions'],
      usageCount: 8,
    },
  ])
  const columns = [
    {
      title: 'Step Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'action' ? 'blue' : type === 'verification' ? 'green' : 'orange'}>
          {type === 'action' ? 'Action Step' : type === 'verification' ? 'Verification Step' : 'Data Setup'}
        </Tag>
      ),
    },
    {
      title: 'Parameters',
      dataIndex: 'parameters',
      key: 'parameters',
      render: (params: string[]) => (
        <Space>
          {params?.map((param, index) => (
            <Tag key={index} color="default">{param}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Usage Count',
      dataIndex: 'usageCount',
      key: 'usageCount',
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            icon={<CopyOutlined />}
            size="small"
            onClick={() => handleCopy(record)}
          >
            Copy
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.key)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ]



  const handleCreateStep = async () => {
    try {
      const values = await form.validateFields()
      console.log('Creating/updating test step:', values)

      if (isEditMode && editingStep) {
        // Update existing step
        const updatedStep = {
          ...editingStep,
          name: values.name,
          description: values.description,
          type: values.type,
          parameters: values.parameters ? values.parameters.split(',').map((p: string) => p.trim()) : [],
        }

        setDataSource(prevData =>
          prevData.map(item =>
            item.key === editingStep.key ? updatedStep : item
          )
        )

        message.success('Test step updated successfully!')
      } else {
        // Create new step object
        const newStep = {
          key: Date.now().toString(), // Use timestamp as unique key
          name: values.name,
          description: values.description,
          type: values.type,
          parameters: values.parameters ? values.parameters.split(',').map((p: string) => p.trim()) : [],
          usageCount: 0, // New step starts with 0 usage
        }

        // Add to data source
        setDataSource(prevData => [...prevData, newStep])

        message.success('Test step created successfully!')
      }

      // TODO: Call API to create/update test step

      setIsModalVisible(false)
      setIsEditMode(false)
      setEditingStep(null)
      form.resetFields()

    } catch (error) {
      message.error('Please fill in all required fields')
    }
  }

  const handleEdit = (record: any) => {
    setIsEditMode(true)
    setEditingStep(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      type: record.type,
      parameters: record.parameters ? record.parameters.join(', ') : '',
    })
    setIsModalVisible(true)
  }

  const handleCopy = (record: any) => {
    const copiedStep = {
      key: Date.now().toString(),
      name: `${record.name} (Copy)`,
      description: record.description,
      type: record.type,
      parameters: record.parameters,
      usageCount: 0,
    }

    setDataSource(prevData => [...prevData, copiedStep])
    message.success('Test step copied successfully!')
  }

  const handleDelete = (key: string) => {
    Modal.confirm({
      title: 'Delete Test Step',
      content: 'Are you sure you want to delete this test step? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        setDataSource(prevData => prevData.filter(item => item.key !== key))
        message.success('Test step deleted successfully!')
        // TODO: Call API to delete test step
      },
    })
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setIsEditMode(false)
    setEditingStep(null)
    form.resetFields()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Test Step Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          New Step
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

      {/* Create/Edit Test Step Modal */}
      <Modal
        title={isEditMode ? "Edit Test Step" : "Create New Test Step"}
        open={isModalVisible}
        onOk={handleCreateStep}
        onCancel={handleCancel}
        okText={isEditMode ? "Update" : "Create"}
        cancelText="Cancel"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: 'action'
          }}
        >
          <Form.Item
            label="Step Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter step name' },
              { min: 2, message: 'Step name must be at least 2 characters' },
              { max: 100, message: 'Step name cannot exceed 100 characters' }
            ]}
          >
            <Input placeholder="Enter step name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: 'Please enter step description' },
              { max: 500, message: 'Description cannot exceed 500 characters' }
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Enter step description"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="Step Type"
            name="type"
            rules={[{ required: true, message: 'Please select step type' }]}
          >
            <Select placeholder="Select step type">
              <Option value="action">Action Step</Option>
              <Option value="verification">Verification Step</Option>
              <Option value="setup">Data Setup</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Parameters"
            name="parameters"
            help="Enter parameters separated by commas (e.g., username, password)"
          >
            <Input placeholder="Enter parameters (comma separated)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TestSteps
