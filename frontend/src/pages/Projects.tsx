import React, { useState, useEffect } from 'react'
import { Typography, Button, Table, Space, Tag, Modal, Form, Input, Select, message, Spin } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { projectApi } from '@/services/api'
import type { Project } from '@/types'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

const Projects: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form] = Form.useForm()
  const [dataSource, setDataSource] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  // Load projects on component mount
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await projectApi.getProjects()
      setDataSource(response || [])
    } catch (error) {
      console.error('Failed to load projects:', error)
      message.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }
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
        <Tag color={status === 'active' ? 'green' : status === 'paused' ? 'orange' : 'blue'}>
          {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record: Project) => (
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
            onClick={() => handleDelete(record.id)}
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
      setLoading(true)

      if (isEditMode && editingProject) {
        // Update existing project
        await projectApi.updateProject(editingProject.id, values)
        message.success('Project updated successfully!')
      } else {
        // Create new project
        await projectApi.createProject(values)
        message.success('Project created successfully!')
      }

      // Reload projects
      await loadProjects()

      setIsModalVisible(false)
      setIsEditMode(false)
      setEditingProject(null)
      form.resetFields()

    } catch (error) {
      console.error('Failed to save project:', error)
      message.error('Failed to save project')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record: Project) => {
    setIsEditMode(true)
    setEditingProject(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      status: record.status,
    })
    setIsModalVisible(true)
  }

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Delete Project',
      content: 'Are you sure you want to delete this project? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await projectApi.deleteProject(id)
          message.success('Project deleted successfully!')
          await loadProjects()
        } catch (error) {
          console.error('Failed to delete project:', error)
          message.error('Failed to delete project')
        }
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
