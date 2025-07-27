import React, { useState } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Button, 
  Space, 
  Row, 
  Col, 
  Typography, 
  Divider,
  Tag,
  Timeline,
  Avatar,
  message
} from 'antd'
import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  AuditOutlined,
  HistoryOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import BDDEditor from '../components/BDDEditor'
import ReviewPanel from '../components/ReviewPanel'
import ChangeHistory from '../components/ChangeHistory'
import ExecutionEngine from '../components/ExecutionEngine'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

const TestCaseDetail: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [currentStatus, setCurrentStatus] = useState<'draft' | 'pending' | 'approved' | 'rejected'>('pending')
  const [bddContent, setBddContent] = useState(`Feature: User Login Function
  As a user
  I want to login to the system
  So that I can access my account

Scenario: Successful Login
  Given I am on the login page
  When I enter correct username and password
  Then I should successfully login to the system

Scenario: Login Failure
  Given I am on the login page
  When I enter incorrect username or password
  Then I should see error message`)

  const [reviewHistory] = useState([
    {
      id: 1,
      action: 'Created',
      user: 'John',
      time: '2024-01-20 10:30',
      comment: 'Created test case'
    },
    {
      id: 2,
      action: 'Modified',
      user: 'Jane',
      time: '2024-01-20 14:15',
      comment: 'Updated test step description'
    },
    {
      id: 3,
      action: 'Submitted for Review',
      user: 'John',
      time: '2024-01-20 16:45',
      comment: 'Submitted case for review'
    }
  ])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const testCaseData = {
        ...values,
        gherkinContent: bddContent
      }
      console.log('保存测试用例:', testCaseData)
      message.success('Test case saved successfully')
    } catch (error) {
      message.error('Please check if the form is complete')
    }
  }

  const handleSubmitReview = () => {
    message.success('Test case submitted for review')
  }

  const handleBDDChange = (content: string) => {
    setBddContent(content)
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/test-cases')}
          style={{ marginRight: '16px' }}
        >
          Back to List
        </Button>
        <Title level={3} style={{ display: 'inline-block', margin: 0 }}>
          Test Case Details
        </Title>
        <Tag color={currentStatus === 'pending' ? 'orange' : currentStatus === 'approved' ? 'green' : currentStatus === 'rejected' ? 'red' : 'default'} style={{ marginLeft: '16px' }}>
          {currentStatus === 'pending' ? 'Pending' : currentStatus === 'approved' ? 'Approved' : currentStatus === 'rejected' ? 'Rejected' : 'Draft'}
        </Tag>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="Basic Information" style={{ marginBottom: '24px' }}>
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                name: 'User Login Function Test',
                description: 'Test various scenarios of user login functionality',
                priority: 'high',
                project: 'E-commerce Platform Testing',
                tags: ['Login', 'User Management']
              }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Test Case Name"
                    name="name"
                    rules={[{ required: true, message: 'Please enter test case name' }]}
                  >
                    <Input placeholder="Please enter test case name" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Priority"
                    name="priority"
                    rules={[{ required: true, message: 'Please select priority' }]}
                  >
                    <Select placeholder="Please select priority">
                      <Option value="high">High</Option>
                      <Option value="medium">Medium</Option>
                      <Option value="low">Low</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Project"
                    name="project"
                    rules={[{ required: true, message: 'Please select project' }]}
                  >
                    <Select placeholder="Please select project">
                      <Option value="E-commerce Platform Testing">E-commerce Platform Testing</Option>
                      <Option value="User Management System">User Management System</Option>
                      <Option value="Payment Module Testing">Payment Module Testing</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Tags" name="tags">
                    <Select mode="tags" placeholder="Please enter tags">
                      <Option value="Login">Login</Option>
                      <Option value="User Management">User Management</Option>
                      <Option value="Security">Security</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Test Case Description" name="description">
                <TextArea
                  rows={3}
                  placeholder="Please enter test case description"
                />
              </Form.Item>
            </Form>
          </Card>

          <BDDEditor
            value={bddContent}
            onChange={handleBDDChange}
            height={500}
          />

          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => navigate('/test-cases')}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Draft
              </Button>
              <Button
                type="primary"
                icon={<AuditOutlined />}
                onClick={handleSubmitReview}
              >
                Submit for Review
              </Button>
            </Space>
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <ReviewPanel
            testCaseId={1}
            currentStatus={currentStatus}
            onStatusChange={(newStatus) => setCurrentStatus(newStatus as any)}
          />

          <ChangeHistory
            entityId={1}
            entityType="test-case"
          />

          <Card
            title="Test Execution"
            size="small"
            style={{ marginTop: '16px' }}
          >
            <ExecutionEngine
              testCaseId={1}
              testCaseName="User Login Function Test"
              onExecutionComplete={(result) => {
                message.success(`Execution completed with status: ${result.status}`)
              }}
            />
          </Card>

          <Card
            title="Related Information"
            size="small"
            style={{ marginTop: '16px' }}
          >
            <div style={{ marginBottom: '12px' }}>
              <Text type="secondary">Related Test Steps:</Text>
              <div style={{ marginTop: '4px' }}>
                <Tag>User Login</Tag>
                <Tag>Verify Login Success</Tag>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <Text type="secondary">Test Data Used:</Text>
              <div style={{ marginTop: '4px' }}>
                <Tag>User Basic Data</Tag>
              </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div>
              <Text type="secondary">Execution Statistics:</Text>
              <div style={{ marginTop: '8px' }}>
                <Row>
                  <Col span={12}>
                    <Text>Total Executions:</Text>
                    <Text strong>15</Text>
                  </Col>
                  <Col span={12}>
                    <Text>Passed:</Text>
                    <Text strong style={{ color: '#52c41a' }}>12</Text>
                  </Col>
                </Row>
                <Row style={{ marginTop: '4px' }}>
                  <Col span={12}>
                    <Text>Failed:</Text>
                    <Text strong style={{ color: '#f5222d' }}>3</Text>
                  </Col>
                  <Col span={12}>
                    <Text>Pass Rate:</Text>
                    <Text strong>80%</Text>
                  </Col>
                </Row>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default TestCaseDetail
