import React, { useState } from 'react'
import {
  Card,
  Button,
  Space,
  Form,
  Input,
  Radio,
  List,
  Avatar,
  Typography,
  Tag,
  Divider,
  message,
  Modal,
  Tooltip
} from 'antd'
import {
  AuditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MessageOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'

const { TextArea } = Input
const { Text, Paragraph } = Typography

interface ReviewRecord {
  id: number
  reviewer: string
  action: 'approve' | 'reject' | 'comment'
  comment: string
  time: string
  avatar?: string
}

interface ReviewPanelProps {
  testCaseId: number
  currentStatus: 'draft' | 'pending' | 'approved' | 'rejected'
  onStatusChange?: (newStatus: string) => void
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({
  testCaseId,
  currentStatus,
  onStatusChange
}) => {
  const [form] = Form.useForm()
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [commentModalVisible, setCommentModalVisible] = useState(false)
  
  const [reviewHistory] = useState<ReviewRecord[]>([
    {
      id: 1,
      reviewer: 'John',
      action: 'comment',
      comment: 'Suggest adding more detailed preconditions in Given steps',
      time: '2024-01-20 10:30'
    },
    {
      id: 2,
      reviewer: 'Jane',
      action: 'comment',
      comment: 'Test data preparation needs boundary value test scenarios',
      time: '2024-01-20 14:15'
    },
    {
      id: 3,
      reviewer: 'Bob',
      action: 'approve',
      comment: 'Test case design is reasonable, covers main functionality, approved',
      time: '2024-01-20 16:45'
    }
  ])

  const handleSubmitReview = async () => {
    try {
      const values = await form.validateFields()
      console.log('提交评审:', values)
      
      // Simulate API call
      message.success(`Review ${values.action === 'approve' ? 'approved' : 'rejected'} successfully`)
      setReviewModalVisible(false)
      form.resetFields()

      // Update status
      const newStatus = values.action === 'approve' ? 'approved' : 'rejected'
      onStatusChange?.(newStatus)
      
    } catch (error) {
      message.error('Please fill in review comments')
    }
  }

  const handleAddComment = async () => {
    try {
      const values = await form.validateFields()
      console.log('添加评论:', values)
      
      message.success('Comment added successfully')
      setCommentModalVisible(false)
      form.resetFields()

    } catch (error) {
      message.error('Please fill in comment content')
    }
  }

  const getStatusTag = (status: string) => {
    const statusConfig = {
      draft: { color: 'default', text: 'Draft' },
      pending: { color: 'processing', text: 'Pending' },
      approved: { color: 'success', text: 'Approved' },
      rejected: { color: 'error', text: 'Rejected' }
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'reject':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />
      case 'comment':
        return <MessageOutlined style={{ color: '#1890ff' }} />
      default:
        return <ClockCircleOutlined />
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'approve':
        return 'Approved'
      case 'reject':
        return 'Rejected'
      case 'comment':
        return 'Comment'
      default:
        return 'Action'
    }
  }

  const canReview = currentStatus === 'pending'
  const canComment = ['draft', 'pending', 'approved'].includes(currentStatus)

  return (
    <Card
      title={
        <Space>
          <AuditOutlined />
          Review & Collaboration
          {getStatusTag(currentStatus)}
        </Space>
      }
      extra={
        <Space>
          {canComment && (
            <Button
              size="small"
              icon={<MessageOutlined />}
              onClick={() => setCommentModalVisible(true)}
            >
              Add Comment
            </Button>
          )}
          {canReview && (
            <Button
              type="primary"
              size="small"
              icon={<AuditOutlined />}
              onClick={() => setReviewModalVisible(true)}
            >
              Review
            </Button>
          )}
        </Space>
      }
    >
      {/* 评审历史 */}
      <List
        itemLayout="vertical"
        dataSource={reviewHistory}
        renderItem={(item) => (
          <List.Item key={item.id}>
            <List.Item.Meta
              avatar={
                <Avatar 
                  icon={<UserOutlined />} 
                  src={item.avatar}
                />
              }
              title={
                <Space>
                  <Text strong>{item.reviewer}</Text>
                  <Space size="small">
                    {getActionIcon(item.action)}
                    <Text type="secondary">{getActionText(item.action)}</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {item.time}
                  </Text>
                </Space>
              }
              description={
                <Paragraph style={{ marginBottom: 0, marginTop: '8px' }}>
                  {item.comment}
                </Paragraph>
              }
            />
          </List.Item>
        )}
      />

      {reviewHistory.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          No review records yet
        </div>
      )}

      {/* 评审模态框 */}
      <Modal
        title="Test Case Review"
        open={reviewModalVisible}
        onOk={handleSubmitReview}
        onCancel={() => {
          setReviewModalVisible(false)
          form.resetFields()
        }}
        okText="Submit Review"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Review Result"
            name="action"
            rules={[{ required: true, message: 'Please select review result' }]}
          >
            <Radio.Group>
              <Radio value="approve">
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  Approve
                </Space>
              </Radio>
              <Radio value="reject">
                <Space>
                  <CloseCircleOutlined style={{ color: '#f5222d' }} />
                  Reject
                </Space>
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Review Comments"
            name="comment"
            rules={[{ required: true, message: 'Please fill in review comments' }]}
          >
            <TextArea
              rows={4}
              placeholder="Please provide detailed review comments..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 评论模态框 */}
      <Modal
        title="Add Comment"
        open={commentModalVisible}
        onOk={handleAddComment}
        onCancel={() => {
          setCommentModalVisible(false)
          form.resetFields()
        }}
        okText="Post Comment"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Comment Content"
            name="comment"
            rules={[{ required: true, message: 'Please fill in comment content' }]}
          >
            <TextArea
              rows={4}
              placeholder="Please enter your comment..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default ReviewPanel
