import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Progress,
  Tag,
  Table,
  Button,
  Space,
  Statistic,
  Timeline,
  Descriptions,
  Divider
} from 'antd'
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

const TestExecutionDetail: React.FC = () => {
  const navigate = useNavigate()
  
  const [executionData] = useState({
    id: 1,
    name: 'User Module Regression Test',
    project: 'E-commerce Platform Testing',
    status: 'running',
    progress: 65,
    passRate: 78,
    totalCases: 25,
    passedCases: 16,
    failedCases: 4,
    skippedCases: 1,
    runningCases: 4,
    startTime: '2024-01-20 14:30:00',
    estimatedEndTime: '2024-01-20 16:45:00',
    executor: 'John',
    environment: 'Test Environment',
    browser: 'Chrome 120.0'
  })

  const stepResults = [
    {
      key: '1',
      stepName: 'User Login',
      testCase: 'User Login Function Test',
      status: 'pass',
      duration: '2.3s',
      message: 'Execution successful',
      screenshot: '/screenshots/login_success.png'
    },
    {
      key: '2',
      stepName: 'Verify User Information',
      testCase: 'User Information Display Test',
      status: 'pass',
      duration: '1.8s',
      message: 'Verification passed',
      screenshot: null
    },
    {
      key: '3',
      stepName: 'Modify User Profile',
      testCase: 'User Profile Modification Test',
      status: 'fail',
      duration: '3.2s',
      message: 'Save button not responding',
      screenshot: '/screenshots/profile_error.png'
    },
    {
      key: '4',
      stepName: 'User Logout',
      testCase: 'User Logout Function Test',
      status: 'running',
      duration: '-',
      message: 'Executing...',
      screenshot: null
    }
  ]

  const columns = [
    {
      title: 'Step Name',
      dataIndex: 'stepName',
      key: 'stepName',
    },
    {
      title: 'Test Case',
      dataIndex: 'testCase',
      key: 'testCase',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          pass: { color: 'success', icon: <CheckCircleOutlined />, text: 'Passed' },
          fail: { color: 'error', icon: <CloseCircleOutlined />, text: 'Failed' },
          running: { color: 'processing', icon: <ClockCircleOutlined />, text: 'Running' },
          skip: { color: 'default', icon: <ExclamationCircleOutlined />, text: 'Skipped' }
        }
        const config = statusConfig[status as keyof typeof statusConfig]
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          {record.screenshot && (
            <Button type="link" size="small">
              View Screenshot
            </Button>
          )}
          <Button type="link" size="small">
            View Log
          </Button>
        </Space>
      ),
    },
  ]

  const getStatusColor = (status: string) => {
    const colors = {
      running: 'processing',
      completed: 'success',
      failed: 'error',
      pending: 'default'
    }
    return colors[status as keyof typeof colors] || 'default'
  }

  const executionTimeline = [
    {
      color: 'green',
      children: (
        <div>
          <Text strong>Execution Started</Text>
          <br />
          <Text type="secondary">2024-01-20 14:30:00</Text>
          <br />
          <Text>Started executing user module regression test</Text>
        </div>
      )
    },
    {
      color: 'blue',
      children: (
        <div>
          <Text strong>Test Cases Running</Text>
          <br />
          <Text type="secondary">2024-01-20 14:35:00</Text>
          <br />
          <Text>Completed 16/25 test cases</Text>
        </div>
      )
    },
    {
      color: 'red',
      children: (
        <div>
          <Text strong>Failed Case Detected</Text>
          <br />
          <Text type="secondary">2024-01-20 15:12:00</Text>
          <br />
          <Text>User profile modification test failed</Text>
        </div>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/test-executions')}
          style={{ marginRight: '16px' }}
        >
          Back to List
        </Button>
        <Title level={3} style={{ display: 'inline-block', margin: 0 }}>
          {executionData.name}
        </Title>
        <Tag
          color={getStatusColor(executionData.status)}
          style={{ marginLeft: '16px' }}
        >
          {executionData.status === 'running' ? 'Running' : 'Completed'}
        </Tag>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          {/* Execution Overview */}
          <Card title="Execution Overview" style={{ marginBottom: '24px' }}>
            <Row gutter={16}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Cases"
                  value={executionData.totalCases}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Passed"
                  value={executionData.passedCases}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Failed"
                  value={executionData.failedCases}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Skipped"
                  value={executionData.skippedCases}
                  valueStyle={{ color: '#d46b08' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text>Execution Progress</Text>
                  <Progress
                    percent={executionData.progress}
                    status={executionData.status === 'running' ? 'active' : 'success'}
                  />
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text>Pass Rate</Text>
                  <Progress
                    percent={executionData.passRate}
                    strokeColor={executionData.passRate >= 80 ? '#52c41a' : executionData.passRate >= 60 ? '#faad14' : '#f5222d'}
                  />
                </div>
              </Col>
            </Row>
          </Card>

          {/* Execution Details */}
          <Card title="Execution Details">
            <Table
              columns={columns}
              dataSource={stepResults}
              pagination={false}
              size="small"
            />
          </Card>

          {/* Action Buttons */}
          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              {executionData.status === 'running' && (
                <>
                  <Button icon={<PauseCircleOutlined />}>
                    Pause Execution
                  </Button>
                  <Button danger icon={<StopOutlined />}>
                    Stop Execution
                  </Button>
                </>
              )}
              <Button type="primary" icon={<FileTextOutlined />}>
                Generate Report
              </Button>
            </Space>
          </div>
        </Col>

        <Col xs={24} lg={8}>
          {/* Execution Information */}
          <Card title="Execution Information" size="small" style={{ marginBottom: '16px' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Executor">{executionData.executor}</Descriptions.Item>
              <Descriptions.Item label="Project">{executionData.project}</Descriptions.Item>
              <Descriptions.Item label="Environment">{executionData.environment}</Descriptions.Item>
              <Descriptions.Item label="Browser">{executionData.browser}</Descriptions.Item>
              <Descriptions.Item label="Start Time">{executionData.startTime}</Descriptions.Item>
              <Descriptions.Item label="Estimated End">{executionData.estimatedEndTime}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Execution Timeline */}
          <Card title="Execution Timeline" size="small">
            <Timeline items={executionTimeline} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default TestExecutionDetail
