import React, { useState, useEffect } from 'react'
import { 
  Button, 
  Modal, 
  Form, 
  Select, 
  Switch, 
  Input, 
  Progress, 
  Table, 
  Tag, 
  Space,
  message,
  Card,
  Descriptions
} from 'antd'
import { 
  PlayCircleOutlined, 
  StopOutlined, 
  ReloadOutlined,
  FileTextOutlined,
  BugOutlined
} from '@ant-design/icons'

const { Option } = Select
const { TextArea } = Input

interface ExecutionConfig {
  testCaseId: number
  name?: string
  environment: string
  browser: string
  headless: boolean
  projectId?: number
}

interface ExecutionResult {
  id: number
  name: string
  status: string
  progress: number
  environment: string
  browser: string
  startedAt?: string
  completedAt?: string
  duration?: number
}

interface StepResult {
  id: number
  stepName: string
  stepKeyword: string
  status: string
  duration: number
  errorMessage?: string
}

interface ExecutionEngineProps {
  testCaseId: number
  testCaseName: string
  onExecutionComplete?: (result: ExecutionResult) => void
}

const ExecutionEngine: React.FC<ExecutionEngineProps> = ({
  testCaseId,
  testCaseName,
  onExecutionComplete
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentExecution, setCurrentExecution] = useState<ExecutionResult | null>(null)
  const [stepResults, setStepResults] = useState<StepResult[]>([])
  const [form] = Form.useForm()

  // WebSocket连接用于实时更新
  useEffect(() => {
    if (currentExecution && currentExecution.status === 'running') {
      const ws = new WebSocket('ws://localhost:8000/api/v1/execution-engine/ws/executions')
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'execution_update' && data.execution_id === currentExecution.id) {
          setCurrentExecution(prev => ({ ...prev, ...data.data }))
        }
      }

      return () => ws.close()
    }
  }, [currentExecution])

  const handleStartExecution = async () => {
    try {
      const values = await form.validateFields()
      
      const config: ExecutionConfig = {
        testCaseId,
        name: values.name || `Execution for ${testCaseName}`,
        environment: values.environment,
        browser: values.browser,
        headless: values.headless
      }

      setIsExecuting(true)
      
      const response = await fetch('/api/v1/execution-engine/executions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        const execution = await response.json()
        setCurrentExecution(execution)
        setIsModalVisible(false)
        message.success('Test execution started successfully!')
        
        // 开始轮询执行状态
        pollExecutionStatus(execution.id)
      } else {
        throw new Error('Failed to start execution')
      }
    } catch (error) {
      message.error('Failed to start test execution')
      setIsExecuting(false)
    }
  }

  const pollExecutionStatus = async (executionId: number) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/execution-engine/executions/${executionId}`)
        if (response.ok) {
          const execution = await response.json()
          setCurrentExecution(execution)
          
          if (execution.status === 'completed' || execution.status === 'failed') {
            clearInterval(pollInterval)
            setIsExecuting(false)
            
            // 获取步骤结果
            const stepsResponse = await fetch(`/api/v1/execution-engine/executions/${executionId}/steps`)
            if (stepsResponse.ok) {
              const steps = await stepsResponse.json()
              setStepResults(steps)
            }
            
            onExecutionComplete?.(execution)
          }
        }
      } catch (error) {
        console.error('Failed to poll execution status:', error)
      }
    }, 2000) // 每2秒轮询一次
  }

  const handleStopExecution = async () => {
    if (currentExecution) {
      try {
        await fetch(`/api/v1/execution-engine/executions/${currentExecution.id}/stop`, {
          method: 'POST'
        })
        message.success('Execution stop requested')
      } catch (error) {
        message.error('Failed to stop execution')
      }
    }
  }

  const stepColumns = [
    {
      title: 'Step',
      dataIndex: 'stepName',
      key: 'stepName',
    },
    {
      title: 'Keyword',
      dataIndex: 'stepKeyword',
      key: 'stepKeyword',
      render: (keyword: string) => (
        <Tag color="blue">{keyword}</Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'passed' ? 'success' : status === 'failed' ? 'error' : 'default'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${duration}ms`
    },
    {
      title: 'Error',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      render: (error: string) => error ? (
        <Button 
          type="link" 
          icon={<BugOutlined />} 
          onClick={() => Modal.error({
            title: 'Step Error',
            content: error,
            width: 600
          })}
        >
          View Error
        </Button>
      ) : '-'
    }
  ]

  return (
    <div>
      <Space>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => setIsModalVisible(true)}
          disabled={isExecuting}
        >
          Run Test
        </Button>
        
        {isExecuting && (
          <Button
            danger
            icon={<StopOutlined />}
            onClick={handleStopExecution}
          >
            Stop
          </Button>
        )}
        
        {currentExecution && (
          <Button
            icon={<ReloadOutlined />}
            onClick={() => pollExecutionStatus(currentExecution.id)}
          >
            Refresh
          </Button>
        )}
      </Space>

      {/* 执行配置模态框 */}
      <Modal
        title="Test Execution Configuration"
        open={isModalVisible}
        onOk={handleStartExecution}
        onCancel={() => setIsModalVisible(false)}
        okText="Start Execution"
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            environment: 'test',
            browser: 'chromium',
            headless: true
          }}
        >
          <Form.Item
            label="Execution Name"
            name="name"
          >
            <Input placeholder={`Execution for ${testCaseName}`} />
          </Form.Item>

          <Form.Item
            label="Environment"
            name="environment"
            rules={[{ required: true, message: 'Please select environment' }]}
          >
            <Select>
              <Option value="test">Test</Option>
              <Option value="staging">Staging</Option>
              <Option value="production">Production</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Browser"
            name="browser"
            rules={[{ required: true, message: 'Please select browser' }]}
          >
            <Select>
              <Option value="chromium">Chromium</Option>
              <Option value="firefox">Firefox</Option>
              <Option value="webkit">WebKit</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Headless Mode"
            name="headless"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 执行状态显示 */}
      {currentExecution && (
        <Card 
          title="Execution Status" 
          style={{ marginTop: 16 }}
          extra={
            <Tag color={
              currentExecution.status === 'completed' ? 'success' :
              currentExecution.status === 'failed' ? 'error' :
              currentExecution.status === 'running' ? 'processing' : 'default'
            }>
              {currentExecution.status.toUpperCase()}
            </Tag>
          }
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Name">{currentExecution.name}</Descriptions.Item>
            <Descriptions.Item label="Environment">{currentExecution.environment}</Descriptions.Item>
            <Descriptions.Item label="Browser">{currentExecution.browser}</Descriptions.Item>
            <Descriptions.Item label="Started">{currentExecution.startedAt}</Descriptions.Item>
            {currentExecution.completedAt && (
              <Descriptions.Item label="Completed">{currentExecution.completedAt}</Descriptions.Item>
            )}
            {currentExecution.duration && (
              <Descriptions.Item label="Duration">{currentExecution.duration}s</Descriptions.Item>
            )}
          </Descriptions>

          <div style={{ marginTop: 16 }}>
            <Progress 
              percent={currentExecution.progress} 
              status={currentExecution.status === 'failed' ? 'exception' : 'active'}
            />
          </div>

          {stepResults.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4>Step Results</h4>
              <Table
                columns={stepColumns}
                dataSource={stepResults}
                pagination={false}
                size="small"
              />
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default ExecutionEngine
