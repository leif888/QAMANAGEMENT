import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import AppHeader from './components/layout/AppHeader'
import AppSidebar from './components/layout/AppSidebar'
import Dashboard from './pages/Dashboard'
import TestSteps from './pages/TestSteps'
import TestData from './pages/TestData'
import TestCases from './pages/TestCasesSimple'
import TestCaseDetail from './pages/TestCaseDetail'
import TestExecutions from './pages/TestExecutionsSimplified'
import TestExecutionDetail from './pages/TestExecutionDetail'
import TestReport from './pages/TestReport'
import TradeTemplates from './pages/TradeTemplatesNew'


const { Content } = Layout

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '16px', background: '#fff', padding: '24px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/test-steps" element={<TestSteps />} />
            <Route path="/test-data" element={<TestData />} />
            <Route path="/test-cases" element={<TestCases />} />
            <Route path="/test-cases/detail" element={<TestCaseDetail />} />
            <Route path="/test-executions" element={<TestExecutions />} />
            <Route path="/test-executions/detail" element={<TestExecutionDetail />} />
            <Route path="/test-executions/report" element={<TestReport />} />
            <Route path="/trade-templates" element={<TradeTemplates />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
