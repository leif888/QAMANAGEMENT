import React from 'react'
import { Card, Row, Col, Statistic, Typography, Space } from 'antd'
import {
  ProjectOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

const { Title } = Typography

const Dashboard: React.FC = () => {
  return (
    <div>
      <Title level={2}>Dashboard</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Projects"
              value={5}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Test Cases"
              value={128}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Executions"
              value={456}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pass Rate"
              value={85.6}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Activities" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>• User John created test case "Login Function Test"</div>
              <div>• User Jane executed test suite "User Management Module"</div>
              <div>• User Bob updated test data "User Basic Data"</div>
              <div>• System automatically generated test report</div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="To-Do Items" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>• 3 test cases pending review</div>
              <div>• 2 failed test executions need attention</div>
              <div>• 1 project test data needs update</div>
              <div>• Weekly report needs to be generated</div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
