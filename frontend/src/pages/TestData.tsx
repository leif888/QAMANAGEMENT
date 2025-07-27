import React, { useState } from 'react'
import { Typography, Button, Table, Space, Tag, Modal, Form, Input, Select, message, Drawer } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

const TestData: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingDataset, setEditingDataset] = useState<any>(null)
  const [isDataViewerVisible, setIsDataViewerVisible] = useState(false)
  const [viewingDataset, setViewingDataset] = useState<any>(null)
  const [form] = Form.useForm()
  const [dataSource, setDataSource] = useState([
    {
      key: '1',
      name: 'User Basic Data',
      description: 'Test data for user registration and login',
      dataType: 'user',
      recordCount: 100,
      version: 'v1.2',
      updatedAt: '2024-01-20',
      data: [
        { id: 1, username: 'john_doe', email: 'john@example.com', password: 'password123', role: 'user' },
        { id: 2, username: 'jane_smith', email: 'jane@example.com', password: 'securepass', role: 'admin' },
        { id: 3, username: 'bob_wilson', email: 'bob@example.com', password: 'mypassword', role: 'user' },
        { id: 4, username: 'alice_brown', email: 'alice@example.com', password: 'alicepass', role: 'moderator' },
        { id: 5, username: 'charlie_davis', email: 'charlie@example.com', password: 'charlie123', role: 'user' },
      ]
    },
    {
      key: '2',
      name: 'Product Information Data',
      description: 'E-commerce platform product-related test data',
      dataType: 'product',
      recordCount: 250,
      version: 'v2.1',
      updatedAt: '2024-01-18',
      data: [
        { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 1299.99, stock: 50, brand: 'TechCorp' },
        { id: 2, name: 'Wireless Mouse', category: 'Electronics', price: 29.99, stock: 200, brand: 'MouseTech' },
        { id: 3, name: 'Coffee Mug', category: 'Home', price: 12.99, stock: 100, brand: 'MugCo' },
        { id: 4, name: 'Running Shoes', category: 'Sports', price: 89.99, stock: 75, brand: 'SportsBrand' },
        { id: 5, name: 'Smartphone', category: 'Electronics', price: 699.99, stock: 30, brand: 'PhoneCorp' },
      ]
    },
    {
      key: '3',
      name: 'Order Test Data',
      description: 'Order creation, payment, refund scenario data',
      dataType: 'order',
      recordCount: 80,
      version: 'v1.0',
      updatedAt: '2024-01-15',
      data: [
        { id: 1, orderId: 'ORD-001', customerId: 1, total: 1329.98, status: 'completed', paymentMethod: 'credit_card' },
        { id: 2, orderId: 'ORD-002', customerId: 2, total: 42.98, status: 'pending', paymentMethod: 'paypal' },
        { id: 3, orderId: 'ORD-003', customerId: 3, total: 789.99, status: 'shipped', paymentMethod: 'debit_card' },
        { id: 4, orderId: 'ORD-004', customerId: 1, total: 12.99, status: 'cancelled', paymentMethod: 'credit_card' },
        { id: 5, orderId: 'ORD-005', customerId: 4, total: 199.99, status: 'processing', paymentMethod: 'bank_transfer' },
      ]
    },
  ])
  const columns = [
    {
      title: 'Dataset Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Data Type',
      dataIndex: 'dataType',
      key: 'dataType',
      render: (type: string) => (
        <Tag color={type === 'user' ? 'blue' : type === 'product' ? 'green' : 'orange'}>
          {type === 'user' ? 'User Data' : type === 'product' ? 'Product Data' : 'Other'}
        </Tag>
      ),
    },
    {
      title: 'Record Count',
      dataIndex: 'recordCount',
      key: 'recordCount',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
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
            onClick={() => handleViewData(record)}
          >
            View Data
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button type="link" icon={<DownloadOutlined />} size="small">
            Export
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



  const handleCreateDataset = async () => {
    try {
      const values = await form.validateFields()
      console.log('Creating/updating dataset:', values)

      if (isEditMode && editingDataset) {
        // Update existing dataset
        const updatedDataset = {
          ...editingDataset,
          name: values.name,
          description: values.description,
          dataType: values.dataType,
          version: values.version,
          updatedAt: new Date().toISOString().split('T')[0],
        }

        setDataSource(prevData =>
          prevData.map(item =>
            item.key === editingDataset.key ? updatedDataset : item
          )
        )

        message.success('Dataset updated successfully!')
      } else {
        // Create new dataset object
        const newDataset = {
          key: Date.now().toString(), // Use timestamp as unique key
          name: values.name,
          description: values.description,
          dataType: values.dataType,
          recordCount: 0, // New dataset starts with 0 records
          version: values.version,
          updatedAt: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
          data: [] // New dataset starts with empty data
        }

        // Add to data source
        setDataSource(prevData => [...prevData, newDataset])

        message.success('Dataset created successfully!')
      }

      // TODO: Call API to create/update dataset

      setIsModalVisible(false)
      setIsEditMode(false)
      setEditingDataset(null)
      form.resetFields()

    } catch (error) {
      message.error('Please fill in all required fields')
    }
  }

  const handleViewData = (record: any) => {
    setViewingDataset(record)
    setIsDataViewerVisible(true)
  }

  const handleEdit = (record: any) => {
    setIsEditMode(true)
    setEditingDataset(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      dataType: record.dataType,
      version: record.version,
    })
    setIsModalVisible(true)
  }

  const handleDelete = (key: string) => {
    Modal.confirm({
      title: 'Delete Dataset',
      content: 'Are you sure you want to delete this dataset? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        setDataSource(prevData => prevData.filter(item => item.key !== key))
        message.success('Dataset deleted successfully!')
        // TODO: Call API to delete dataset
      },
    })
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setIsEditMode(false)
    setEditingDataset(null)
    form.resetFields()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Test Data Management</Title>
        <Space>
          <Button icon={<UploadOutlined />}>
            Import Data
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            New Dataset
          </Button>
        </Space>
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

      {/* Create/Edit Dataset Modal */}
      <Modal
        title={isEditMode ? "Edit Dataset" : "Create New Dataset"}
        open={isModalVisible}
        onOk={handleCreateDataset}
        onCancel={handleCancel}
        okText={isEditMode ? "Update" : "Create"}
        cancelText="Cancel"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            dataType: 'user',
            version: 'v1.0'
          }}
        >
          <Form.Item
            label="Dataset Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter dataset name' },
              { min: 2, message: 'Dataset name must be at least 2 characters' },
              { max: 100, message: 'Dataset name cannot exceed 100 characters' }
            ]}
          >
            <Input placeholder="Enter dataset name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: 'Please enter dataset description' },
              { max: 500, message: 'Description cannot exceed 500 characters' }
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Enter dataset description"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="Data Type"
            name="dataType"
            rules={[{ required: true, message: 'Please select data type' }]}
          >
            <Select placeholder="Select data type">
              <Option value="user">User Data</Option>
              <Option value="product">Product Data</Option>
              <Option value="order">Order Data</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Version"
            name="version"
            rules={[
              { required: true, message: 'Please enter version' },
              { pattern: /^v\d+\.\d+$/, message: 'Version format should be like v1.0' }
            ]}
          >
            <Input placeholder="e.g., v1.0" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Data Viewer Drawer */}
      <Drawer
        title={
          <Space>
            <EyeOutlined />
            {viewingDataset?.name} - Data View
          </Space>
        }
        placement="right"
        onClose={() => setIsDataViewerVisible(false)}
        open={isDataViewerVisible}
        width={800}
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} size="small">
              Export
            </Button>
            <Button
              type="primary"
              size="small"
              onClick={() => {
                // TODO: Add functionality to add new data row
                message.info('Add new data functionality coming soon!')
              }}
            >
              Add Row
            </Button>
          </Space>
        }
      >
        {viewingDataset && (
          <div>
            {/* Dataset Info */}
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
              <Space direction="vertical" size="small">
                <div><strong>Description:</strong> {viewingDataset.description}</div>
                <div><strong>Type:</strong> <Tag color="blue">{viewingDataset.dataType}</Tag></div>
                <div><strong>Version:</strong> {viewingDataset.version}</div>
                <div><strong>Records:</strong> {viewingDataset.data?.length || 0}</div>
                <div><strong>Last Updated:</strong> {viewingDataset.updatedAt}</div>
              </Space>
            </div>

            {/* Data Table */}
            {viewingDataset.data && viewingDataset.data.length > 0 ? (
              <Table
                dataSource={viewingDataset.data}
                columns={
                  Object.keys(viewingDataset.data[0]).map(key => ({
                    title: key.charAt(0).toUpperCase() + key.slice(1),
                    dataIndex: key,
                    key: key,
                    ellipsis: true,
                    render: (text: any) => {
                      if (typeof text === 'string' && text.length > 50) {
                        return (
                          <span title={text}>
                            {text.substring(0, 50)}...
                          </span>
                        )
                      }
                      return text
                    }
                  }))
                }
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `Total ${total} records`,
                }}
                scroll={{ x: 'max-content' }}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <div>No data available</div>
                <div style={{ marginTop: 8 }}>
                  <Button type="primary" onClick={() => message.info('Import data functionality coming soon!')}>
                    Import Data
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default TestData
