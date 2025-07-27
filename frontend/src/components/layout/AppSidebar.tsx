import React, { useState } from 'react'
import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  ProjectOutlined,
  OrderedListOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'

const { Sider } = Layout

const AppSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: 'Projects',
    },
    {
      key: '/test-steps',
      icon: <OrderedListOutlined />,
      label: 'Test Steps',
    },
    {
      key: '/test-data',
      icon: <DatabaseOutlined />,
      label: 'Test Data',
    },
    {
      key: '/test-cases',
      icon: <FileTextOutlined />,
      label: 'Test Cases',
    },
    {
      key: '/test-executions',
      icon: <PlayCircleOutlined />,
      label: 'Test Executions',
    },
    {
      key: '/trade-templates',
      icon: <FileTextOutlined />,
      label: 'Trade Templates',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      style={{
        background: '#001529',
      }}
    >
      <div
        style={{
          height: 32,
          margin: 16,
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
        }}
      >
        {collapsed ? 'QA' : 'QA Mgmt'}
      </div>
      
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  )
}

export default AppSidebar
