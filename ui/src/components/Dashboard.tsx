import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Button, Typography, message } from 'antd';
import {
  MailOutlined,
  FileTextOutlined,
  WalletOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { api, type MetricsResponse } from '../api';

type DashboardProps = {
  onNavigate: (key: string) => void;
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [metrics, setMetrics] = useState<MetricsResponse>({
    unreadNews: 0,
    pendingReports: 0,
    totalAssetValue: 0,
  });

  useEffect(() => {
    api
      .getMetrics()
      .then(setMetrics)
      .catch((err) => {
        console.error(err);
        message.error('加载指标失败，请稍后重试');
      });
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <Typography.Title level={3} className="page-title">
          系统概览
        </Typography.Title>
        <Typography.Text type="secondary">
          快速查看 AI 工作台的核心指标与导航入口
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]} className="section">
        <Col xs={24} md={8}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title="未读消息数"
              value={metrics.unreadNews}
              prefix={<MailOutlined style={{ color: '#1677ff' }} />}
              suffix="条"
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title="待审核建议报告"
              value={metrics.pendingReports}
              prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />}
              suffix="份"
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title="当前总资产估值"
              value={metrics.totalAssetValue}
              precision={2}
              prefix={<WalletOutlined style={{ color: '#52c41a' }} />}
              suffix=" USDT"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card
            title="消息列表"
            bordered={false}
            extra={<MailOutlined />}
            hoverable
            className="link-card"
            onClick={() => onNavigate('news')}
          >
            <Typography.Paragraph type="secondary" style={{ minHeight: 64 }}>
              查看并分析 AI 采集的市场消息，快速掌握行情动态。
            </Typography.Paragraph>
            <Button type="primary" icon={<ArrowRightOutlined />} block>
              进入消息列表
            </Button>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title="持仓数据"
            bordered={false}
            extra={<WalletOutlined />}
            hoverable
            className="link-card"
            onClick={() => onNavigate('portfolio')}
          >
            <Typography.Paragraph type="secondary" style={{ minHeight: 64 }}>
              可视化展示当前资产结构与历史变化趋势。
            </Typography.Paragraph>
            <Button type="primary" icon={<ArrowRightOutlined />} block>
              查看持仓数据
            </Button>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title="AI 建议报告"
            bordered={false}
            extra={<FileTextOutlined />}
            hoverable
            className="link-card"
            onClick={() => onNavigate('recommendation')}
          >
            <Typography.Paragraph type="secondary" style={{ minHeight: 64 }}>
              审核 AI 生成的投资建议，并执行资产配置调整。
            </Typography.Paragraph>
            <Button type="primary" icon={<ArrowRightOutlined />} block>
              进入建议报告
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
