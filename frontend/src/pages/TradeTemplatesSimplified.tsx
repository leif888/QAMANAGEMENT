import React, { useState, useEffect } from 'react'
import {
  Typography, Button, Tree, Modal, Form, Input, Select, message,
  Space, Tooltip, Card, Row, Col, Spin, Alert
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined,
  FileTextOutlined, CodeOutlined, CheckCircleOutlined, FormatPainterOutlined
} from '@ant-design/icons'
import Editor from '@monaco-editor/react'

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
  full_path?: string
  children?: TradeTemplate[]
}

const TradeTemplatesPage: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<TradeTemplate | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [templateContent, setTemplateContent] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)
  const [editorContent, setEditorContent] = useState('')
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null)

  useEffect(() => {
    loadTradeTemplates()
  }, [])

  const loadTradeTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:8000/api/v1/trade-templates/tree')
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
              <>
                <Tooltip title="Validate Template">
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleValidateTemplate(template)
                    }}
                  />
                </Tooltip>
                <Tooltip title="Format Template">
                  <Button
                    type="text"
                    size="small"
                    icon={<FormatPainterOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFormatTemplate(template)
                    }}
                  />
                </Tooltip>
              </>
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
    try {
      const values = await form.validateFields()
      setLoading(true)

      const templateData = {
        ...values,
        parent_id: selectedParentId, // Set parent_id if a folder is selected
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
    setEditorContent(template.jinja2_content || '')
    form.setFieldsValue({
      name: template.name,
      description: template.description,
      node_type: template.node_type,
      jinja2_content: template.jinja2_content,
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

  const handleValidateTemplate = async (template: TradeTemplate) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/trade-templates/${template.id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const result = await response.json()
        setValidationResult(result)

        if (result.valid) {
          message.success('Template validation passed!')
        } else {
          message.error('Template validation failed!')
        }
      } else {
        const error = await response.json()
        message.error(error.detail || 'Failed to validate template')
      }
    } catch (error) {
      console.error('Failed to validate template:', error)
      message.error('Failed to validate template')
    }
  }

  const handleFormatTemplate = async (template: TradeTemplate) => {
    if (!template.jinja2_content) {
      message.warning('No template content to format')
      return
    }

    try {
      // Simple XML formatting
      let formatted = template.jinja2_content

      // Basic XML formatting (this is a simple implementation)
      if (formatted.includes('<') && formatted.includes('>')) {
        // Remove extra whitespace
        formatted = formatted.replace(/>\s+</g, '><')

        // Add proper indentation
        let indent = 0
        const lines = formatted.split(/(?=<)/)
        const formattedLines = lines.map(line => {
          if (line.trim()) {
            if (line.includes('</') && !line.includes('</'+ line.split('</')[1].split('>')[0] + '>')) {
              indent = Math.max(0, indent - 2)
            }
            const indentedLine = '  '.repeat(indent) + line.trim()
            if (line.includes('<') && !line.includes('</') && !line.includes('/>')) {
              indent += 1
            }
            return indentedLine
          }
          return line
        })
        formatted = formattedLines.join('\n')
      }

      // Update the template content
      const response = await fetch(`http://localhost:8000/api/v1/trade-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          node_type: template.node_type,
          jinja2_content: formatted
        })
      })

      if (response.ok) {
        message.success('Template formatted successfully!')
        await loadTemplates()
        // Update the selected template content
        if (selectedTemplate?.id === template.id) {
          setTemplateContent(formatted)
        }
      } else {
        const error = await response.json()
        message.error(error.detail || 'Failed to format template')
      }
    } catch (error) {
      console.error('Failed to format template:', error)
      message.error('Failed to format template')
    }
  }



  const onTreeSelect = (selectedKeys: any[], info: any) => {
    if (selectedKeys.length > 0 && info.node.data) {
      const template = info.node.data
      setSelectedTemplate(template)

      // Set parent_id for creating new templates
      if (template.node_type === 'folder') {
        setSelectedParentId(template.id)
      } else {
        setSelectedParentId(template.parent_id)
      }

      if (template.node_type === 'template') {
        setTemplateContent(template.jinja2_content || '')
      }
    } else {
      // Clear selection when clicking empty space
      setSelectedTemplate(null)
      setSelectedParentId(null)
      setTemplateContent('')
    }
  }

  const handleContainerClick = (e: React.MouseEvent) => {
    // Clear selection when clicking on empty space
    if (e.target === e.currentTarget) {
      setSelectedTemplate(null)
      setSelectedParentId(null)
      setTemplateContent('')
    }
  }

  return (
    <div onClick={handleContainerClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Trade Template Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          New Template
        </Button>
      </div>

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

                {validationResult && (
                  <div style={{ marginBottom: 16 }}>
                    {validationResult.valid ? (
                      <Alert message="Template validation passed" type="success" showIcon />
                    ) : (
                      <Alert
                        message="Template validation failed"
                        description={validationResult.errors?.join(', ')}
                        type="error"
                        showIcon
                      />
                    )}
                    {validationResult.warnings?.length > 0 && (
                      <Alert
                        message="Validation warnings"
                        description={validationResult.warnings.join(', ')}
                        type="warning"
                        showIcon
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <strong>Template Content:</strong>
                </div>
                <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}>
                  <Editor
                    height="400px"
                    language={templateContent?.includes('<') ? 'xml' : 'plaintext'}
                    value={templateContent}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      lineNumbers: 'on',
                      wordWrap: 'on',
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                Select a template from the tree to view its content
              </div>
            )}
          </Card>
        </Col>
      </Row>

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
          }}
        >
          {selectedParentId && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f0f8ff', borderRadius: 6 }}>
              <strong>Parent Folder:</strong> {selectedTemplate?.name || 'Selected Folder'}
              <br />
              <small>This template will be created under the selected folder.</small>
            </div>
          )}

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
            label="Jinja2/XML Template Content"
            name="jinja2_content"
          >
            <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}>
              <Editor
                height="300px"
                language="xml"
                value={editorContent}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
                onChange={(value) => {
                  setEditorContent(value || '')
                  form.setFieldsValue({ jinja2_content: value })
                }}
              />
            </div>
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              Supports XML with Jinja2 template syntax: {'{{ variable }}'}, {'{% if condition %}'}, etc.
            </div>
          </Form.Item>
        </Form>
      </Modal>


    </div>
  )
}

export default TradeTemplatesPage
