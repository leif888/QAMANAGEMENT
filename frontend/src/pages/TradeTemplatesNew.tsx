import React, { useState, useEffect } from 'react'
import { 
  Typography, Button, Tree, Modal, Form, Input, Select, message, 
  Space, Tooltip, Card, Row, Col, Spin, Tag, Switch 
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined,
  FileTextOutlined, FileAddOutlined, CodeOutlined
} from '@ant-design/icons'
import Editor from '@monaco-editor/react'

const { Title } = Typography
const { Option } = Select
const { DirectoryTree } = Tree

interface TradeTemplate {
  id: number
  name: string
  description?: string
  node_type: 'folder' | 'template'
  parent_id?: number
  jinja2_content?: string
  template_variables?: Record<string, any>
  children?: TradeTemplate[]
}

const TradeTemplatesNewPage: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<TradeTemplate | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [templateContent, setTemplateContent] = useState('')
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('Loading trade templates...')
      const response = await fetch('http://localhost:8000/api/v1/trade-templates/')
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('Loaded trade templates:', data)
        setTreeData(buildTreeData(data))
      } else {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        message.error(`Failed to load trade templates: ${response.status} ${errorText}`)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      message.error(`Failed to load data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const buildTreeData = (templates: TradeTemplate[]): any[] => {
    const rootTemplates = templates.filter(t => !t.parent_id)
    
    const buildNode = (template: TradeTemplate): any => {
      const children = templates.filter(t => t.parent_id === template.id)
      
      console.log(`Building node for ${template.name} (ID: ${template.id})`)
      
      if (template.node_type === 'folder') {
        // Folder node
        return {
          key: `folder-${template.id}`,
          title: (
            <Space>
              <FolderOutlined style={{ color: '#faad14' }} />
              <span>{template.name}</span>
              <Space size="small">
                <Tooltip title="Add Folder">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<FolderOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddFolder(template)
                    }}
                  />
                </Tooltip>
                <Tooltip title="Add Template">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<FileAddOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddTemplate(template)
                    }}
                  />
                </Tooltip>
                <Tooltip title="Delete Folder">
                  <Button 
                    type="text" 
                    size="small" 
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTemplate(template.id, template.name)
                    }}
                  />
                </Tooltip>
              </Space>
            </Space>
          ),
          children: children.map(buildNode),
          isLeaf: false,
          data: { ...template, nodeType: 'folder' }
        }
      } else {
        // Template node
        return {
          key: `template-${template.id}`,
          title: (
            <Space>
              <FileTextOutlined style={{ color: '#52c41a' }} />
              <span>{template.name}</span>
              <Space size="small">

                <Tooltip title="Delete Template">
                  <Button 
                    type="text" 
                    size="small" 
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTemplate(template.id, template.name)
                    }}
                  />
                </Tooltip>
              </Space>
            </Space>
          ),
          children: children.map(buildNode),
          isLeaf: children.length === 0,
          data: { ...template, nodeType: 'template' }
        }
      }
    }

    return rootTemplates.map(buildNode)
  }

  const handleCreateItem = async () => {
    try {
      const values = await form.validateFields()
      console.log('Form values:', values)
      console.log('Selected parent ID:', selectedParentId)

      const templateData = {
        name: values.name,
        description: values.description || '',
        node_type: values.is_folder ? 'folder' : 'template',
        parent_id: selectedParentId || null,
        jinja2_content: values.is_folder ? '' : 'Enter your Jinja2 template here...',
        template_variables: {},
        creator_id: 1
      }

      console.log('Sending template data:', JSON.stringify(templateData, null, 2))

      const response = await fetch('http://localhost:8000/api/v1/trade-templates/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })

      console.log('Create response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('Created item:', result)
        message.success(`${values.is_folder ? 'Folder' : 'Template'} created successfully!`)
        setIsModalVisible(false)
        setSelectedParentId(null)
        form.resetFields()
        await loadData()
      } else {
        const errorText = await response.text()
        console.error('Create error:', response.status, errorText)
        message.error(`Failed to create item: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to create item:', error)
      message.error('Failed to create item')
    }
  }

  const handleAddFolder = (template: TradeTemplate) => {
    console.log('Adding folder under template:', template)
    setSelectedTemplate(template)
    setSelectedParentId(template.id)
    form.setFieldsValue({ is_folder: true })
    setIsModalVisible(true)
  }

  const handleAddTemplate = (template: TradeTemplate) => {
    console.log('Adding template under folder:', template)
    setSelectedTemplate(template)
    setSelectedParentId(template.id)
    form.setFieldsValue({ is_folder: false })
    setIsModalVisible(true)
  }

  const handleDeleteTemplate = async (templateId: number, templateName: string) => {
    Modal.confirm({
      title: 'Delete Item',
      content: `Are you sure you want to delete "${templateName}" and all its contents? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/v1/trade-templates/${templateId}`, {
            method: 'DELETE'
          })
          
          if (response.ok) {
            message.success('Item deleted successfully!')
            await loadData()
          } else {
            const error = await response.json()
            message.error(error.detail || 'Failed to delete item')
          }
        } catch (error) {
          console.error('Failed to delete item:', error)
          message.error('Failed to delete item')
        }
      },
    })
  }



  const onTreeSelect = (selectedKeys: any[], info: any) => {
    if (selectedKeys.length > 0 && info.node.data) {
      const nodeData = info.node.data
      console.log('Selected node:', nodeData)
      
      setSelectedTemplate(nodeData)
      
      if (nodeData.nodeType === 'template') {
        setTemplateContent(nodeData.jinja2_content || '')
      } else if (nodeData.nodeType === 'folder') {
        setSelectedParentId(nodeData.id)
      }
    } else {
      setSelectedTemplate(null)
      setSelectedParentId(null)
    }
  }

  const handleSaveTemplateContent = async () => {
    if (!selectedTemplate || selectedTemplate.nodeType !== 'template') {
      message.error('No template selected')
      return
    }

    try {
      console.log('Saving template content:', templateContent)
      console.log('Selected template:', selectedTemplate)

      // Only send the jinja2_content field for update
      const updateData = {
        jinja2_content: templateContent
      }

      console.log('Update data:', updateData)

      const response = await fetch(`http://localhost:8000/api/v1/trade-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      console.log('Save response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('Saved template result:', result)
        message.success('Template saved successfully!')

        // Update the selected template with new content
        setSelectedTemplate({...selectedTemplate, jinja2_content: templateContent})

        // Reload data to ensure consistency
        await loadData()
      } else {
        const errorText = await response.text()
        console.error('Save error:', response.status, errorText)
        message.error(`Failed to save template: ${response.status}`)
      }
    } catch (error: any) {
      console.error('Failed to save template:', error)
      message.error(`Failed to save template: ${error.message}`)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Trade Templates Management</Title>
        <Space>
          <Button onClick={loadData}>Refresh</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            New Item
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={8}>
          <Card title="Template Tree" size="small">
            <Spin spinning={loading}>
              <DirectoryTree
                treeData={treeData}
                onSelect={onTreeSelect}
                height={600}
                defaultExpandAll={true}
              />
            </Spin>
          </Card>
        </Col>
        <Col span={16}>
          <Card 
            title={
              <Space>
                <CodeOutlined />
                {selectedTemplate ? 
                  `${selectedTemplate.node_type === 'folder' ? 'Folder' : 'Template'}: ${selectedTemplate.name}` : 
                  'Select an item from the tree'}
              </Space>
            }
            size="small"
          >
            {selectedTemplate && selectedTemplate.node_type === 'template' ? (
              <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Editing: {selectedTemplate.name}</strong>
                  <Button type="primary" onClick={handleSaveTemplateContent}>
                    Save
                  </Button>
                </div>
                <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}>
                  <Editor
                    height="500px"
                    language="html"
                    value={templateContent}
                    onChange={(value) => setTemplateContent(value || '')}
                    options={{
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
                <p>Select a template from the tree to edit its content</p>
                {selectedTemplate && selectedTemplate.node_type === 'folder' && (
                  <div>
                    <p>📁 Click "Add Folder" to create a subfolder</p>
                    <p>📝 Click "Add Template" to create a new template</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Create Item Modal */}
      <Modal
        title="Create New Item"
        open={isModalVisible}
        onOk={handleCreateItem}
        onCancel={() => {
          setIsModalVisible(false)
          setSelectedParentId(null)
          form.resetFields()
        }}
        okText="Create"
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ is_folder: false }}
        >
          {selectedParentId && selectedTemplate && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f0f8ff', borderRadius: 6 }}>
              <strong>Parent Folder:</strong> {selectedTemplate.name}
              <br />
              <small>This item will be created under the selected folder.</small>
            </div>
          )}
          
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Enter name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <Input placeholder="Enter description (optional)" />
          </Form.Item>

          <Form.Item
            label="Is Folder"
            name="is_folder"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>


    </div>
  )
}

export default TradeTemplatesNewPage
