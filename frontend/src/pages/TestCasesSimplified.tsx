import React, { useState, useEffect } from 'react'
import { Typography, Button, Table, Space, Tag, Modal, Form, Input, Select, message, Switch } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined, FileTextOutlined } from '@ant-design/icons'
import { testCaseApi, projectApi } from '@/services/api'
import type { TestCase, Project } from '@/types'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

interface ExtendedTestCase extends TestCase {
  priority?: string
  status?: string
  gherkin_content?: string
  is_automated?: boolean
  is_folder?: boolean
  parent_id?: number
  sort_order?: number
  full_path?: string
  children?: ExtendedTestCase[]
}

const TestCasesPage: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingCase, setEditingCase] = useState<ExtendedTestCase | null>(null)
  const [form] = Form.useForm()
  const [dataSource, setDataSource] = useState<ExtendedTestCase[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadTestCases()
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

  const loadTestCases = async () => {
    if (!selectedProject) return
    
    try {
      setLoading(true)
      const response = await testCaseApi.getTestCases()
      // Filter by project if needed (API should support this)
      setDataSource(response || [])
    } catch (error) {
      console.error('Failed to load test cases:', error)
      message.error('Failed to load test cases')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Type',
      dataIndex: 'is_folder',
      key: 'is_folder',
      width: 60,
      render: (isFolder: boolean) => (
        isFolder ? <FolderOutlined style={{ color: '#1890ff' }} /> : <FileTextOutlined style={{ color: '#52c41a' }} />
      ),
    },
    {
      title: 'Test Case Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'blue'}>
          {priority?.toUpperCase() || 'MEDIUM'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : status === 'draft' ? 'orange' : 'default'}>
          {status?.toUpperCase() || 'DRAFT'}
        </Tag>
      ),
    },
    {
      title: 'Automated',
      dataIndex: 'is_automated',
      key: 'is_automated',
      render: (isAutomated: boolean) => (
        <Tag color={isAutomated ? 'green' : 'default'}>
          {isAutomated ? 'YES' : 'NO'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record: ExtendedTestCase) => (
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

  const handleCreateCase = async () => {
    if (!selectedProject) {
      message.error('Please select a project first')
      return
    }

    try {
      const values = await form.validateFields()
      setLoading(true)

      const caseData = {
        ...values,
        project_id: selectedProject,
      }

      if (isEditMode && editingCase) {
        await testCaseApi.updateTestCase(editingCase.id, caseData)
        message.success('Test case updated successfully!')
      } else {
        await testCaseApi.createTestCase(caseData)
        message.success('Test case created successfully!')
      }

      await loadTestCases()
      setIsModalVisible(false)
      setIsEditMode(false)
      setEditingCase(null)
      form.resetFields()

    } catch (error) {
      console.error('Failed to save test case:', error)
      message.error('Failed to save test case')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record: ExtendedTestCase) => {
    setIsEditMode(true)
    setEditingCase(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      priority: record.priority,
      gherkin_content: record.gherkin_content,
      is_automated: record.is_automated,
      is_folder: record.is_folder,
    })
    setIsModalVisible(true)
  }

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Delete Test Case',
      content: 'Are you sure you want to delete this test case? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await testCaseApi.deleteTestCase(id)
          message.success('Test case deleted successfully!')
          await loadTestCases()
        } catch (error) {
          console.error('Failed to delete test case:', error)
          message.error('Failed to delete test case')
        }
      },
    })
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setIsEditMode(false)
    setEditingCase(null)
    form.resetFields()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Test Case Management</Title>
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
            New Test Case
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
            Please select a project to view and manage test cases
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

      {/* Create/Edit Test Case Modal */}
      <Modal
        title={isEditMode ? "Edit Test Case" : "Create New Test Case"}
        open={isModalVisible}
        onOk={handleCreateCase}
        onCancel={handleCancel}
        okText={isEditMode ? "Update" : "Create"}
        cancelText="Cancel"
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            priority: 'medium',
            is_automated: false,
            is_folder: false,
          }}
        >
          <Form.Item
            label="Test Case Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter test case name' },
              { min: 2, message: 'Name must be at least 2 characters' },
            ]}
          >
            <Input placeholder="Enter test case name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea rows={3} placeholder="Enter test case description" />
          </Form.Item>

          <Form.Item
            label="Priority"
            name="priority"
          >
            <Select>
              <Option value="high">High</Option>
              <Option value="medium">Medium</Option>
              <Option value="low">Low</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Gherkin Content (BDD)"
            name="gherkin_content"
          >
            <TextArea 
              rows={6} 
              placeholder="Feature: Test Case Name
  Scenario: Test scenario
    Given precondition
    When action
    Then expected result"
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              label="Is Automated"
              name="is_automated"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Is Folder"
              name="is_folder"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default TestCasesPage
