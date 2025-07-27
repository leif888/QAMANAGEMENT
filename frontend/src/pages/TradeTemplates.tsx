import React, { useState, useEffect } from 'react'
import { 
  Typography, Button, Tree, Modal, Form, Input, Select, message, 
  Space, Tooltip, Card, Row, Col, Spin 
} from 'antd'
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined, 
  FileTextOutlined, PlayCircleOutlined, CodeOutlined 
} from '@ant-design/icons'
import { projectApi } from '@/services/api'
import type { Project } from '@/types'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select
const { DirectoryTree } = Tree

interface TradeTemplate {
  id: string
  name: string
  description?: string
  node_type: 'folder' | 'template'
  parent_id?: string
  jinja2_content?: string
  template_variables: Record<string, any>
  project_id: number
  full_path?: string
  children?: TradeTemplate[]
}

const TradeTemplatesPage: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<TradeTemplate | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [form] = Form.useForm()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [templateContent, setTemplateContent] = useState('')
  const [isRenderModalVisible, setIsRenderModalVisible] = useState(false)
  const [renderForm] = Form.useForm()
  const [renderedContent, setRenderedContent] = useState('')

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadTradeTemplates()
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

  const loadTradeTemplates = async () => {
    if (!selectedProject) return
    
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8000/api/v1/trade-templates/tree?project_id=${selectedProject}`)
      if (response.ok) {
        const data = await response.json()
        setTreeData(convertToTreeData(data))
      } else {
        message.error('Failed to load trade templates')
      }
    } catch (error) {
      console.error('Failed to load trade templates:', error)
      message.error('Failed to load trade templates')
    } finally {
      setLoading(false)
    }
  }

  const convertToTreeData = (templates: TradeTemplate[]): any[] => {
    return templates.map(template => ({
      key: template.id,
      title: (
        <Space>
          {template.node_type === 'folder' ? <FolderOutlined /> : <FileTextOutlined />}
          <span>{template.name}</span>
          <Space size="small">
            <Tooltip title="Edit">
              <Button 
                type="text" 
                size="small" 
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleEdit(template)
                }}
              />
            </Tooltip>
            {template.node_type === 'template' && (
              <Tooltip title="Render Template">
                <Button 
                  type="text" 
                  size="small" 
                  icon={<PlayCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRenderTemplate(template)
                  }}
                />
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <Button 
                type="text" 
                size="small" 
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(template.id)
                }}
              />
            </Tooltip>
          </Space>
        </Space>
      ),
      children: template.children ? convertToTreeData(template.children) : [],
      isLeaf: template.node_type === 'template',
      data: template
    }))
  }

  const handleCreateTemplate = async () => {
    if (!selectedProject) {
      message.error('Please select a project first')
      return
    }

    try {
      const values = await form.validateFields()
      setLoading(true)

      const templateData = {
        ...values,
        project_id: selectedProject,
      }

      const url = isEditMode 
        ? `http://localhost:8000/api/v1/trade-templates/${selectedTemplate?.id}`
        : 'http://localhost:8000/api/v1/trade-templates/'

      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })

      if (response.ok) {
        message.success(`Template ${isEditMode ? 'updated' : 'created'} successfully!`)
        await loadTradeTemplates()
        setIsModalVisible(false)
        setIsEditMode(false)
        setSelectedTemplate(null)
        form.resetFields()
      } else {
        const error = await response.json()
        message.error(error.detail || 'Failed to save template')
      }
    } catch (error) {
      console.error('Failed to save template:', error)
      message.error('Failed to save template')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (template: TradeTemplate) => {
    setIsEditMode(true)
    setSelectedTemplate(template)
    form.setFieldsValue({
      name: template.name,
      description: template.description,
      node_type: template.node_type,
      jinja2_content: template.jinja2_content,
      template_variables: JSON.stringify(template.template_variables, null, 2),
    })
    setIsModalVisible(true)
  }

  const handleDelete = async (templateId: string) => {
    Modal.confirm({
      title: 'Delete Template',
      content: 'Are you sure you want to delete this template? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/v1/trade-templates/${templateId}`, {
            method: 'DELETE'
          })
          
          if (response.ok) {
            message.success('Template deleted successfully!')
            await loadTradeTemplates()
          } else {
            const error = await response.json()
            message.error(error.detail || 'Failed to delete template')
          }
        } catch (error) {
          console.error('Failed to delete template:', error)
          message.error('Failed to delete template')
        }
      },
    })
  }

  const handleRenderTemplate = (template: TradeTemplate) => {
    setSelectedTemplate(template)
    renderForm.setFieldsValue({})
    setRenderedContent('')
    setIsRenderModalVisible(true)
  }

  const handleRender = async () => {
    if (!selectedTemplate) return

    try {
      const values = await renderForm.validateFields()
      const variables = {}
      
      // Parse form values as template variables
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== '') {
          variables[key] = values[key]
        }
      })

      const response = await fetch(`http://localhost:8000/api/v1/trade-templates/${selectedTemplate.id}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables })
      })

      if (response.ok) {
        const result = await response.json()
        setRenderedContent(result.rendered_content)
      } else {
        const error = await response.json()
        message.error(error.detail || 'Failed to render template')
      }
    } catch (error) {
      console.error('Failed to render template:', error)
      message.error('Failed to render template')
    }
  }

  const onTreeSelect = (selectedKeys: any[], info: any) => {
    if (selectedKeys.length > 0 && info.node.data?.node_type === 'template') {
      setSelectedTemplate(info.node.data)
      setTemplateContent(info.node.data.jinja2_content || '')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Trade Template Management</Title>
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
            New Template
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
            Please select a project to view and manage trade templates
          </p>
        </div>
      )}

      {selectedProject && (
        <Row gutter={16}>
          <Col span={8}>
            <Card title="Template Tree" size="small">
              <Spin spinning={loading}>
                <DirectoryTree
                  treeData={treeData}
                  onSelect={onTreeSelect}
                  height={600}
                />
              </Spin>
            </Card>
          </Col>
          <Col span={16}>
            <Card 
              title={
                <Space>
                  <CodeOutlined />
                  {selectedTemplate ? `Template: ${selectedTemplate.name}` : 'Select a template'}
                </Space>
              }
              size="small"
            >
              {selectedTemplate ? (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <strong>Description:</strong> {selectedTemplate.description || 'No description'}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <strong>Template Content:</strong>
                  </div>
                  <TextArea
                    value={templateContent}
                    readOnly
                    rows={20}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  Select a template from the tree to view its content
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* Create/Edit Template Modal */}
      <Modal
        title={isEditMode ? "Edit Template" : "Create New Template"}
        open={isModalVisible}
        onOk={handleCreateTemplate}
        onCancel={() => {
          setIsModalVisible(false)
          setIsEditMode(false)
          setSelectedTemplate(null)
          form.resetFields()
        }}
        okText={isEditMode ? "Update" : "Create"}
        cancelText="Cancel"
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            node_type: 'template',
            template_variables: '{}',
          }}
        >
          <Form.Item
            label="Template Name"
            name="name"
            rules={[{ required: true, message: 'Please enter template name' }]}
          >
            <Input placeholder="Enter template name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea rows={2} placeholder="Enter template description" />
          </Form.Item>

          <Form.Item
            label="Node Type"
            name="node_type"
            rules={[{ required: true, message: 'Please select node type' }]}
          >
            <Select>
              <Option value="folder">Folder</Option>
              <Option value="template">Template</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Jinja2 Template Content"
            name="jinja2_content"
          >
            <TextArea 
              rows={8} 
              placeholder="Enter Jinja2 template content, e.g., Hello {{ name }}!"
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item
            label="Template Variables (JSON)"
            name="template_variables"
          >
            <TextArea 
              rows={4} 
              placeholder='{"name": {"type": "string", "default": "World"}}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Render Template Modal */}
      <Modal
        title={`Render Template: ${selectedTemplate?.name}`}
        open={isRenderModalVisible}
        onOk={handleRender}
        onCancel={() => setIsRenderModalVisible(false)}
        okText="Render"
        cancelText="Cancel"
        width={800}
      >
        <Form form={renderForm} layout="vertical">
          <Form.Item
            label="Variable: name"
            name="name"
          >
            <Input placeholder="Enter value for 'name'" />
          </Form.Item>
          
          <Form.Item
            label="Variable: username"
            name="username"
          >
            <Input placeholder="Enter value for 'username'" />
          </Form.Item>
        </Form>
        
        {renderedContent && (
          <div style={{ marginTop: 16 }}>
            <strong>Rendered Content:</strong>
            <TextArea
              value={renderedContent}
              readOnly
              rows={6}
              style={{ marginTop: 8, fontFamily: 'monospace' }}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default TradeTemplatesPage
