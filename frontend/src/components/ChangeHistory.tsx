import React, { useState } from 'react'
import {
  Card,
  Timeline,
  Typography,
  Space,
  Avatar,
  Button,
  Modal,
  Descriptions,
  Tag,
  Divider,
  List
} from 'antd'
import {
  HistoryOutlined,
  UserOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  AuditOutlined,
  EyeOutlined,
  DiffOutlined
} from '@ant-design/icons'

const { Text, Paragraph } = Typography

interface ChangeRecord {
  id: number
  action: string
  actionType: 'create' | 'update' | 'delete' | 'review' | 'comment'
  user: string
  time: string
  description: string
  changes?: {
    field: string
    oldValue: string
    newValue: string
  }[]
  avatar?: string
}

interface ChangeHistoryProps {
  entityId: number
  entityType: 'test-case' | 'test-step' | 'test-data'
}

const ChangeHistory: React.FC<ChangeHistoryProps> = ({
  entityId,
  entityType
}) => {
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedChange, setSelectedChange] = useState<ChangeRecord | null>(null)

  const [changeHistory] = useState<ChangeRecord[]>([
    {
      id: 1,
      action: 'Created',
      actionType: 'create',
      user: 'John',
      time: '2024-01-20 10:30:00',
      description: 'Created test case',
      changes: [
        { field: 'Test Case Name', oldValue: '', newValue: 'User Login Function Test' },
        { field: 'Priority', oldValue: '', newValue: 'High' },
        { field: 'Status', oldValue: '', newValue: 'Draft' }
      ]
    },
    {
      id: 2,
      action: 'Modified',
      actionType: 'update',
      user: 'Jane',
      time: '2024-01-20 14:15:00',
      description: 'Updated test step description',
      changes: [
        { field: 'BDD Content', oldValue: 'Given I am on login page', newValue: 'Given I am on login page and page is fully loaded' },
        { field: 'Description', oldValue: 'Test user login function', newValue: 'Test various scenarios of user login function' }
      ]
    },
    {
      id: 3,
      action: 'Submitted for Review',
      actionType: 'review',
      user: 'John',
      time: '2024-01-20 16:45:00',
      description: 'Submitted case for review',
      changes: [
        { field: 'Status', oldValue: 'Draft', newValue: 'Pending' }
      ]
    },
    {
      id: 4,
      action: 'Added Comment',
      actionType: 'comment',
      user: 'Bob',
      time: '2024-01-20 17:20:00',
      description: 'Added review comment',
      changes: []
    },
    {
      id: 5,
      action: 'Review Approved',
      actionType: 'review',
      user: 'Bob',
      time: '2024-01-20 17:30:00',
      description: 'Review approved, test case design is reasonable',
      changes: [
        { field: 'Status', oldValue: 'Pending', newValue: 'Approved' }
      ]
    }
  ])

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return <PlusOutlined style={{ color: '#52c41a' }} />
      case 'update':
        return <EditOutlined style={{ color: '#1890ff' }} />
      case 'delete':
        return <DeleteOutlined style={{ color: '#f5222d' }} />
      case 'review':
        return <AuditOutlined style={{ color: '#722ed1' }} />
      case 'comment':
        return <HistoryOutlined style={{ color: '#fa8c16' }} />
      default:
        return <HistoryOutlined />
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'green'
      case 'update':
        return 'blue'
      case 'delete':
        return 'red'
      case 'review':
        return 'purple'
      case 'comment':
        return 'orange'
      default:
        return 'default'
    }
  }

  const handleViewDetail = (change: ChangeRecord) => {
    setSelectedChange(change)
    setDetailModalVisible(true)
  }

  const renderChangeDetail = (change: ChangeRecord) => {
    if (!change.changes || change.changes.length === 0) {
      return <Text type="secondary">No field changes</Text>
    }

    return (
      <List
        size="small"
        dataSource={change.changes}
        renderItem={(item) => (
          <List.Item>
            <div style={{ width: '100%' }}>
              <div style={{ marginBottom: '8px' }}>
                <Text strong>{item.field}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <Text type="secondary">Old Value:</Text>
                  <Text
                    delete
                    style={{
                      backgroundColor: '#fff2f0',
                      padding: '2px 4px',
                      borderRadius: '2px'
                    }}
                  >
                    {item.oldValue || '(Empty)'}
                  </Text>
                </div>
                <DiffOutlined style={{ color: '#1890ff' }} />
                <div style={{ flex: 1 }}>
                  <Text type="secondary">New Value:</Text>
                  <Text 
                    style={{ 
                      backgroundColor: '#f6ffed', 
                      padding: '2px 4px',
                      borderRadius: '2px'
                    }}
                  >
                    {item.newValue}
                  </Text>
                </div>
              </div>
            </div>
          </List.Item>
        )}
      />
    )
  }

  return (
    <>
      <Card
        title={
          <Space>
            <HistoryOutlined />
            Change History
          </Space>
        }
        size="small"
      >
        <Timeline
          items={changeHistory.map(item => ({
            color: getActionColor(item.actionType),
            children: (
              <div key={item.id}>
                <div style={{ marginBottom: '4px' }}>
                  <Space>
                    <Avatar 
                      size="small" 
                      icon={<UserOutlined />} 
                      src={item.avatar}
                    />
                    <Text strong>{item.user}</Text>
                    <Space size="small">
                      {getActionIcon(item.actionType)}
                      <Text type="secondary">{item.action}</Text>
                    </Space>
                  </Space>
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {item.time}
                  </Text>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text>{item.description}</Text>
                </div>
                {item.changes && item.changes.length > 0 && (
                  <div>
                    <Button 
                      type="link" 
                      size="small" 
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDetail(item)}
                      style={{ padding: 0 }}
                    >
                      View Change Details
                    </Button>
                  </div>
                )}
              </div>
            )
          }))}
        />

        {changeHistory.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            No change records yet
          </div>
        )}
      </Card>

      {/* Change Details Modal */}
      <Modal
        title={
          <Space>
            <DiffOutlined />
            Change Details
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false)
          setSelectedChange(null)
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedChange && (
          <div>
            <Descriptions column={2} size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="Action Type">
                <Tag color={getActionColor(selectedChange.actionType)}>
                  {selectedChange.action}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="User">
                {selectedChange.user}
              </Descriptions.Item>
              <Descriptions.Item label="Time">
                {selectedChange.time}
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {selectedChange.description}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Field Changes</Divider>
            {renderChangeDetail(selectedChange)}
          </div>
        )}
      </Modal>
    </>
  )
}

export default ChangeHistory
