import React, { useState, useEffect } from 'react'
import { Typography, Button, Table, Space, Tag, Modal, Form, Input, Select, message, Card, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { testStepApi, projectApi } from '@/services/api'
import type { TestStep, Project } from '@/types'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

interface ExtendedTestStep extends TestStep {
  decorator?: string
  usage_example?: string
  function_name?: string
  creator_id?: number
}

const TestSteps: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingStep, setEditingStep] = useState<ExtendedTestStep | null>(null)
  const [form] = Form.useForm()
  const [dataSource, setDataSource] = useState<ExtendedTestStep[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState<number | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadTestSteps()
    }
  }, [selectedProject])

  const loadProjects = async () => {
    try {
      const response = await projectApi.getProjects()
      setProjects(response || [])
    } catch (error) {
      console.error('Failed to load projects:', error)
      message.error('Failed to load projects')
    }
  }

  const loadTestSteps = async () => {
    if (!selectedProject) return

    try {
      setLoading(true)
      const response = await testStepApi.getTestSteps()
      // Filter by project if needed (API should support this)
      setDataSource(response || [])
    } catch (error) {
      console.error('Failed to load test steps:', error)
      message.error('Failed to load test steps')
    } finally {
      setLoading(false)
    }
  }
  const columns = [
    {
      title: 'Step Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Decorator',
      dataIndex: 'decorator',
      key: 'decorator',
      width: 100,
      render: (decorator: string) => decorator ? (
        <Tag color="purple">{decorator}</Tag>
      ) : '-',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={type === 'action' ? 'blue' : type === 'verification' ? 'green' : 'orange'}>
          {type?.charAt(0).toUpperCase() + type?.slice(1) || 'Unknown'}
        </Tag>
      ),
    },
    {
      title: 'Function Name',
      dataIndex: 'function_name',
      key: 'function_name',
      width: 150,
      render: (name: string) => name ? (
        <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '3px' }}>
          {name}
        </code>
      ) : '-',
    },
    {
      title: 'Usage Example',
      dataIndex: 'usage_example',
      key: 'usage_example',
      width: 250,
      render: (example: string) => example ? (
        <Tooltip title={example}>
          <div style={{
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {example}
          </div>
        </Tooltip>
      ) : '-',
    },
    {
      title: 'Usage Count',
      dataIndex: 'usage_count',
      key: 'usage_count',
      width: 100,
      sorter: (a: ExtendedTestStep, b: ExtendedTestStep) => (a.usage_count || 0) - (b.usage_count || 0),
    },
    {
      title: 'Actions',
      key: 'action',
      width: 150,
      render: (_, record: ExtendedTestStep) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button
              type="link"
              icon={<InfoCircleOutlined />}
              size="small"
              onClick={() => showStepDetails(record)}
            />
          </Tooltip>
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
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  const showStepDetails = (step: ExtendedTestStep) => {
    Modal.info({
      title: `Test Step Details: ${step.name}`,
      width: 600,
      content: (
        <div>
          <Card size="small" style={{ marginBottom: 16 }}>
            <p><strong>Description:</strong> {step.description || 'No description'}</p>
            <p><strong>Type:</strong> {step.type}</p>
            <p><strong>Decorator:</strong> {step.decorator || 'None'}</p>
            <p><strong>Function Name:</strong> {step.function_name || 'None'}</p>
            <p><strong>Usage Count:</strong> {step.usage_count || 0}</p>
          </Card>
          {step.usage_example && (
            <Card size="small" title="Usage Example">
              <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                {step.usage_example}
              </pre>
            </Card>
          )}
        </div>
      ),
    })
  }

  const handleCreateStep = async () => {
    if (!selectedProject) {
      message.error('Please select a project first')
      return
    }

    try {
      const values = await form.validateFields()
      setLoading(true)

      const stepData = {
        ...values,
        project_id: selectedProject,
        parameters: values.parameters ? values.parameters.split(',').map((p: string) => p.trim()) : [],
      }

      if (isEditMode && editingStep) {
        await testStepApi.updateTestStep(editingStep.id, stepData)
        message.success('Test step updated successfully!')
      } else {
        await testStepApi.createTestStep(stepData)
        message.success('Test step created successfully!')
      }

      await loadTestSteps()
      setIsModalVisible(false)
      setIsEditMode(false)
      setEditingStep(null)
      form.resetFields()

    } catch (error) {
      console.error('Failed to save test step:', error)
      message.error('Failed to save test step')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record: ExtendedTestStep) => {
    setIsEditMode(true)
    setEditingStep(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      type: record.type,
      decorator: record.decorator,
      usage_example: record.usage_example,
      function_name: record.function_name,
      parameters: record.parameters ? record.parameters.join(', ') : '',
    })
    setIsModalVisible(true)
  }

  const handleCopy = async (record: ExtendedTestStep) => {
    if (!selectedProject) {
      message.error('Please select a project first')
      return
    }

    try {
      const copyData = {
        name: `${record.name} (Copy)`,
        description: record.description,
        type: record.type,
        decorator: record.decorator,
        usage_example: record.usage_example,
        function_name: record.function_name,
        project_id: selectedProject,
        parameters: record.parameters || [],
      }

      await testStepApi.createTestStep(copyData)
      message.success('Test step copied successfully!')
      await loadTestSteps()
    } catch (error) {
      console.error('Failed to copy test step:', error)
      message.error('Failed to copy test step')
    }
  }

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Delete Test Step',
      content: 'Are you sure you want to delete this test step? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await testStepApi.deleteTestStep(id)
          message.success('Test step deleted successfully!')
          await loadTestSteps()
        } catch (error) {
          console.error('Failed to delete test step:', error)
          message.error('Failed to delete test step')
        }
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
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div>
            <label style={{ marginRight: 8 }}>Project:</label>
            <Select
              style={{ width: 200 }}
              placeholder="Select a project"
              value={selectedProject}
              onChange={setSelectedProject}
              loading={loading}
            >
              {projects.map(project => (
                <Option key={project.id} value={project.id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            disabled={!selectedProject}
          >
            New Step
          </Button>
        </div>
      </div>

      {!selectedProject && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <p style={{ fontSize: '16px', color: '#666' }}>
            Please select a project to view and manage test steps
          </p>
        </div>
      )}

      {selectedProject && (
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
      )}

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
