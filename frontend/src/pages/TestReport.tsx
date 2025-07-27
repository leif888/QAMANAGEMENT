import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Button,
  Space,
  Statistic,
  Progress,
  Tag,
  DatePicker,
  Select,
  Divider,
  Alert
} from 'antd'
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  PrinterOutlined,
  BarChartOutlined,
  PieChartOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const TestReport: React.FC = () => {
  const navigate = useNavigate()
  
  const [reportData] = useState({
    title: 'User Module Regression Test Report',
    executionId: 1,
    project: 'E-commerce Platform Testing',
    executor: 'John',
    startTime: '2024-01-20 14:30:00',
    endTime: '2024-01-20 16:15:00',
    duration: '1 hour 45 minutes',
    totalCases: 25,
    passedCases: 20,
    failedCases: 4,
    skippedCases: 1,
    passRate: 80,
    environment: 'Test Environment',
    browser: 'Chrome 120.0'
  })

  const testCaseResults = [
    {
      key: '1',
      caseName: 'User Login Function Test',
      priority: 'high',
      status: 'pass',
      duration: '2.3s',
      failureReason: null
    },
    {
      key: '2',
      caseName: 'User Information Display Test',
      priority: 'medium',
      status: 'pass',
      duration: '1.8s',
      failureReason: null
    },
    {
      key: '3',
      caseName: 'User Profile Modification Test',
      priority: 'high',
      status: 'fail',
      duration: '3.2s',
      failureReason: 'Save button not responding, possible frontend JavaScript error'
    },
    {
      key: '4',
      caseName: 'Password Change Function Test',
      priority: 'medium',
      status: 'fail',
      duration: '2.1s',
      failureReason: 'New password validation rules incorrect'
    },
    {
      key: '5',
      caseName: 'User Avatar Upload Test',
      priority: 'low',
      status: 'skip',
      duration: '-',
      failureReason: 'File upload service unavailable in test environment'
    }
  ]

  const columns = [
    {
      title: 'Test Case',
      dataIndex: 'caseName',
      key: 'caseName',
      width: '30%'
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'green'}>
          {priority === 'high' ? 'High' : priority === 'medium' ? 'Medium' : 'Low'}
        </Tag>
      )
    },
    {
      title: 'Result',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'pass' ? 'success' : status === 'fail' ? 'error' : 'default'}>
          {status === 'pass' ? 'Passed' : status === 'fail' ? 'Failed' : 'Skipped'}
        </Tag>
      )
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration'
    },
    {
      title: 'Failure Reason',
      dataIndex: 'failureReason',
      key: 'failureReason',
      render: (reason: string) => reason || '-'
    }
  ]

  const handleExport = (format: string) => {
    console.log(`Export ${format} format report`)
  }

  const handlePrint = () => {
    window.print()
  }

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
          Test Report
        </Title>
      </div>

      {/* Report Actions */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>Report Filter:</Text>
              <RangePicker
                defaultValue={[dayjs().subtract(7, 'day'), dayjs()]}
                size="small"
              />
              <Select defaultValue="all" size="small" style={{ width: 120 }}>
                <Option value="all">All Projects</Option>
                <Option value="ecommerce">E-commerce</Option>
                <Option value="user">User Management</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleExport('PDF')}
                size="small"
              >
                Export PDF
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleExport('Excel')}
                size="small"
              >
                Export Excel
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                size="small"
              >
                Print Report
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          {/* Report Overview */}
          <Card title="Execution Overview" style={{ marginBottom: '24px' }}>
            <Row gutter={16}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Cases"
                  value={reportData.totalCases}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Passed Cases"
                  value={reportData.passedCases}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Failed Cases"
                  value={reportData.failedCases}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Skipped Cases"
                  value={reportData.skippedCases}
                  valueStyle={{ color: '#d46b08' }}
                />
              </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text>Pass Rate</Text>
                  <Progress 
                    percent={reportData.passRate} 
                    strokeColor={reportData.passRate >= 80 ? '#52c41a' : reportData.passRate >= 60 ? '#faad14' : '#f5222d'}
                  />
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text>Execution Duration</Text>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                    {reportData.duration}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Failed Cases Analysis */}
          {reportData.failedCases > 0 && (
            <Card title="Failed Cases Analysis" style={{ marginBottom: '24px' }}>
              <Alert
                message="Failed Cases Detected"
                description={`${reportData.failedCases} test cases failed in this execution. It is recommended to fix high-priority failed cases first.`}
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />

              <Table
                columns={columns.filter(col => col.key !== 'duration')}
                dataSource={testCaseResults.filter(item => item.status === 'fail')}
                pagination={false}
                size="small"
              />
            </Card>
          )}

          {/* Detailed Results */}
          <Card title="Detailed Execution Results">
            <Table
              columns={columns}
              dataSource={testCaseResults}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} records`
              }}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* Report Information */}
          <Card title="Report Information" size="small" style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <Text type="secondary">Report Title:</Text>
              <div><Text strong>{reportData.title}</Text></div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text type="secondary">Executor:</Text>
              <div><Text>{reportData.executor}</Text></div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text type="secondary">Project:</Text>
              <div><Text>{reportData.project}</Text></div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text type="secondary">Environment:</Text>
              <div><Text>{reportData.environment}</Text></div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text type="secondary">Browser:</Text>
              <div><Text>{reportData.browser}</Text></div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text type="secondary">Start Time:</Text>
              <div><Text>{reportData.startTime}</Text></div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text type="secondary">End Time:</Text>
              <div><Text>{reportData.endTime}</Text></div>
            </div>
          </Card>

          {/* Statistics Chart */}
          <Card title="Result Distribution" size="small">
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <BarChartOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </div>
              <Text type="secondary">Chart feature under development...</Text>
              <div style={{ marginTop: '16px' }}>
                <Button type="link" icon={<PieChartOutlined />}>
                  View Pie Chart
                </Button>
                <Button type="link" icon={<BarChartOutlined />}>
                  View Bar Chart
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default TestReport
