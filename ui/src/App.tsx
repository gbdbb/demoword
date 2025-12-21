import { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Button, Space } from 'antd';
import {
  DashboardOutlined,
  MailOutlined,
  WalletOutlined,
  FileTextOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import Dashboard from './components/Dashboard';
import MarketNews from './components/MarketNews';
import Portfolio from './components/Portfolio';
import AIRecommendation from './components/AIRecommendation';
import Login from './components/Login';
import { api, getAuthState, setAuthState, type User } from './api';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

type PageKey = 'dashboard' | 'news' | 'portfolio' | 'recommendation';

const menuItems = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: '系统概览' },
  { key: 'news', icon: <MailOutlined />, label: '消息列表' },
  { key: 'portfolio', icon: <WalletOutlined />, label: '持仓数据' },
  { key: 'recommendation', icon: <FileTextOutlined />, label: 'AI 建议报告' },
];

export default function App() {
  const [selectedKey, setSelectedKey] = useState<PageKey>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 检查登录状态
  useEffect(() => {
    const authState = getAuthState();
    if (authState.user) {
      setIsLoggedIn(true);
      setCurrentUser(authState.user);
    }
  }, []);

  const handleLoginSuccess = () => {
    const authState = getAuthState();
    setIsLoggedIn(true);
    setCurrentUser(authState.user);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setAuthState({ user: null });
      setIsLoggedIn(false);
      setCurrentUser(null);
    } catch (error) {
      console.error('登出错误:', error);
    }
  };

  const renderPage = () => {
    switch (selectedKey) {
      case 'news':
        return <MarketNews />;
      case 'portfolio':
        return <Portfolio />;
      case 'recommendation':
        return <AIRecommendation />;
      case 'dashboard':
      default:
        return <Dashboard onNavigate={(key) => setSelectedKey(key as PageKey)} />;
    }
  };

  // 如果未登录，显示登录页面
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout className="app-shell">
      <Sider
        width={240}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="app-sider"
      >
        <div className="logo-block">
          <div className="logo-mark">AI</div>
          {!collapsed && <div className="logo-text">数字货币助手</div>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => setSelectedKey(key as PageKey)}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div>
            <Title level={4} className="header-title">
              AI 驱动数字货币投资系统
            </Title>
            <Text className="header-subtitle">结合行情、AI 建议与风控的实时工作台</Text>
          </div>
          <Space>
            <Text type="secondary">
              {currentUser?.realName || currentUser?.username} ({currentUser?.isAdmin ? '管理员' : '普通用户'})
            </Text>
            <Button
              type="link"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              size="small"
            >
              登出
            </Button>
          </Space>
        </Header>
        <Content className="app-content">{renderPage()}</Content>
      </Layout>
    </Layout>
  );
}
