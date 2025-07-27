import React, { useState } from 'react'
import { Typography, Button, Table, Space, Tag, Modal, Form, Input, Select, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

const Projects: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [form] = Form.useForm()
  const [dataSource, setDataSource] = useState([
    {
      key: '1',
      name: 'E-commerce Platform Testing',
      description: 'Core functionality testing for e-commerce platform',
      status: 'active',
      createdAt: '2024-01-15',
    },
    {
      key: '2',
      name: 'User Management System',
      description: 'User registration, login, and permission management testing',
      status: 'active',
      createdAt: '2024-01-10',
    },
    {
      key: '3',
      name: 'Payment Module Testing',
      description: 'Payment process and security testing',
      status: 'paused',
      createdAt: '2024-01-05',
    },
  ])
  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? 'Active' : 'Paused'}
        </Tag>
      ),
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
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
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



  const handleCreateProject = async () => {
    try {
      const values = await form.validateFields()
      console.log('Creating project:', values)

      if (isEditMode && editingProject) {
        // Update existing project
        const updatedProject = {
          ...editingProject,
          name: values.name,
          description: values.description,
          status: values.status,
        }

        setDataSource(prevData =>
          prevData.map(item =>
            item.key === editingProject.key ? updatedProject : item
          )
        )

        message.success('Project updated successfully!')
      } else {
        // Create new project
        const newProject = {
          key: Date.now().toString(), // Use timestamp as unique key
          name: values.name,
          description: values.description,
          status: values.status,
          createdAt: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        }

        // Add to data source
        setDataSource(prevData => [...prevData, newProject])

        message.success('Project created successfully!')
      }

      // TODO: Call API to create/update project

      setIsModalVisible(false)
      setIsEditMode(false)
      setEditingProject(null)
      form.resetFields()

    } catch (error) {
      message.error('Please fill in all required fields')
    }
  }

  const handleEdit = (record: any) => {
    setIsEditMode(true)
    setEditingProject(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      status: record.status,
    })
    setIsModalVisible(true)
  }

  const handleDelete = (key: string) => {
    Modal.confirm({
      title: 'Delete Project',
      content: 'Are you sure you want to delete this project? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        setDataSource(prevData => prevData.filter(item => item.key !== key))
        message.success('Project deleted successfully!')
        // TODO: Call API to delete project
      },
    })
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setIsEditMode(false)
    setEditingProject(null)
    form.resetFields()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Project Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          New Project
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

      {/* Create/Edit Project Modal */}
      <Modal
        title={isEditMode ? "Edit Project" : "Create New Project"}
        open={isModalVisible}
        onOk={handleCreateProject}
        onCancel={handleCancel}
        okText={isEditMode ? "Update" : "Create"}
        cancelText="Cancel"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'active'
          }}
        >
          <Form.Item
            label="Project Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter project name' },
              { min: 2, message: 'Project name must be at least 2 characters' },
              { max: 100, message: 'Project name cannot exceed 100 characters' }
            ]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: 'Please enter project description' },
              { max: 500, message: 'Description cannot exceed 500 characters' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Enter project description"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select project status' }]}
          >
            <Select placeholder="Select project status">
              <Option value="active">Active</Option>
              <Option value="paused">Paused</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Projects
