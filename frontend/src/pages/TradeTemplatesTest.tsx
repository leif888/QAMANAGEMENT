import React, { useState, useEffect } from 'react'
import { Typography, Button, Card, message, Spin } from 'antd'

const { Title } = Typography

const TradeTemplatesTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const testAPI = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Testing API...')
      
      const response = await fetch('http://localhost:8000/api/v1/trade-templates/')
      console.log('Response:', response)
      console.log('Status:', response.status)
      console.log('OK:', response.ok)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Data:', result)
        setData(result)
        message.success(`Successfully loaded ${result.length} templates`)
      } else {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        setError(`${response.status}: ${errorText}`)
        message.error(`API Error: ${response.status}`)
      }
    } catch (error: any) {
      console.error('Exception:', error)
      setError(error.message)
      message.error(`Exception: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testCreateTemplate = async () => {
    try {
      setLoading(true)
      console.log('Testing template creation...')
      
      const testData = {
        name: 'Test Template ' + Date.now(),
        description: 'Test description',
        node_type: 'template',
        jinja2_content: 'Hello {{ name }}!',
        template_variables: { name: 'World' },
        creator_id: 1
      }
      
      const response = await fetch('http://localhost:8000/api/v1/trade-templates/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })
      
      console.log('Create response:', response)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Created:', result)
        message.success('Template created successfully!')
        testAPI() // Reload data
      } else {
        const errorText = await response.text()
        console.error('Create error:', errorText)
        message.error(`Create failed: ${response.status}`)
      }
    } catch (error: any) {
      console.error('Create exception:', error)
      message.error(`Create exception: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testAPI()
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Trade Templates API Test</Title>
      
      <Card title="API Test Results" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Button onClick={testAPI} loading={loading} style={{ marginRight: 8 }}>
            Test GET API
          </Button>
          <Button onClick={testCreateTemplate} loading={loading} type="primary">
            Test CREATE API
          </Button>
        </div>
        
        {loading && <Spin />}
        
        {error && (
          <div style={{ color: 'red', marginBottom: 16 }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div>
          <strong>Data Count:</strong> {data.length}
        </div>
        
        {data.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <strong>Templates:</strong>
            <ul>
              {data.map((template, index) => (
                <li key={index}>
                  {template.name} ({template.node_type}) - ID: {template.id}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
      
      <Card title="Console Output">
        <div style={{ fontSize: '12px', color: '#666' }}>
          Check the browser console (F12) for detailed logs.
        </div>
      </Card>
    </div>
  )
}

export default TradeTemplatesTestPage
