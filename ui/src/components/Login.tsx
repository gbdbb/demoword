import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { api, setAuthState } from '../api';

const { Title, Text } = Typography;

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await api.login(values.username, values.password);
      if (response.success && response.user) {
        // 保存用户信息到全局状态
        setAuthState({ user: response.user });
        message.success('登录成功');
        onLoginSuccess();
      } else {
        message.error(response.message || '登录失败');
      }
    } catch (error) {
      console.error('登录错误:', error);
      message.error('登录失败，请检查网络或用户名密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" bordered={false}>
        <div className="login-header">
          <Title level={3} className="login-title">
            AI驱动数字货币投资系统
          </Title>
          <Text type="secondary" className="login-subtitle">
            请登录以访问系统
          </Text>
        </div>
        
        <Form
          name="login"
          layout="vertical"
          onFinish={handleLogin}
          className="login-form"
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
            label="用户名"
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
            label="密码"
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>
          
          <Form.Item>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="login-button"
              >
                登录
              </Button>
              
              <div className="login-info">
                <Text type="secondary" className="login-hint">
                  测试账号
                </Text>
                <Text className="login-example">
                  普通用户：demo / 123456<br />
                  管理员：admin / 123456
                </Text>
              </div>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
