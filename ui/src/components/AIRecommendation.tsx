import { useEffect, useState } from 'react';
import {
  Card,
  List,
  Tag,
  Button,
  Row,
  Col,
  Table,
  Modal,
  Input,
  Alert,
  Space,
  Descriptions,
  Typography,
  message,
  Spin,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { api, type ReportDetail, type ReportSummary, type ProposedChange } from '../api';

const { TextArea } = Input;

const statusColors = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
};

const statusTexts = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
};

const riskColors = {
  high: 'red',
  medium: 'orange',
  low: 'green',
};

const riskTexts = {
  high: '高风险',
  medium: '中等风险',
  low: '低风险',
};

const sentimentColors = {
  bullish: 'green',
  bearish: 'red',
  neutral: 'default',
};

const sentimentTexts = {
  bullish: '利好',
  bearish: '利空',
  neutral: '中性',
};

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#13c2c2'];

export default function AIRecommendation() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const pieData = detail
    ? detail.currentHoldings.map((item) => ({
        name: item.coin,
        percentage: item.percentage,
      }))
    : [];

  const loadReports = () => {
    setLoadingList(true);
    api
      .getReports()
      .then((res) => {
        setReports(res);
        if (!selectedReportId && res.length > 0) {
          setSelectedReportId(res[0].id);
          loadDetail(res[0].id);
        } else if (selectedReportId) {
          loadDetail(selectedReportId);
        }
      })
      .catch((err) => {
        console.error(err);
        message.error('加载报告列表失败');
      })
      .finally(() => setLoadingList(false));
  };

  const loadDetail = (id: string) => {
    setLoadingDetail(true);
    api
      .getReportDetail(id)
      .then((res) => setDetail(res))
      .catch((err) => {
        console.error(err);
        message.error('加载报告详情失败');
      })
      .finally(() => setLoadingDetail(false));
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adjustmentColumns: ColumnsType<ProposedChange> = [
    {
      title: '币种',
      dataIndex: 'coin',
      key: 'coin',
      width: 100,
    },
    {
      title: '当前数量',
      dataIndex: 'currentAmount',
      key: 'currentAmount',
      width: 120,
      render: (amount: number) => amount.toLocaleString(),
    },
    {
      title: '建议数量',
      dataIndex: 'proposedAmount',
      key: 'proposedAmount',
      width: 120,
      render: (amount: number) => amount.toLocaleString(),
    },
    {
      title: '变化',
      dataIndex: 'change',
      key: 'change',
      width: 100,
      render: (change: number) => (
        <Tag color={change > 0 ? 'green' : change < 0 ? 'red' : 'default'}>
          {change > 0 ? '+' : ''}
          {change}%
        </Tag>
      ),
    },
    {
      title: '调整原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
  ];

  const handleApprove = () => {
    if (!detail) return;
    Modal.confirm({
      title: '确认通过',
      content: '确认要通过此 AI 建议并执行持仓调整吗？',
      okText: '确认通过',
      cancelText: '取消',
      onOk: () => {
        api
          .approveReport(detail.id)
          .then(() => {
            message.success('已通过该建议，等待执行资产调整');
            loadReports();
          })
          .catch((err) => {
            console.error(err);
            message.error('操作失败，请稍后再试');
          });
      },
    });
  };

  const handleReject = () => {
    setRejectModalVisible(true);
  };

  const submitReject = () => {
    if (!detail) return;
    if (!rejectReason.trim()) {
      message.warning('请输入驳回原因');
      return;
    }
    api
      .rejectReport(detail.id, rejectReason)
      .then(() => {
        message.info('已驳回该报告并记录原因');
        setRejectModalVisible(false);
        setRejectReason('');
        loadReports();
      })
      .catch((err) => {
        console.error(err);
        message.error('操作失败，请稍后再试');
      });
  };

  return (
    <div className="page">
      <div className="page-header">
        <Typography.Title level={3} className="page-title">
          AI 建议报告
        </Typography.Title>
        <Typography.Text type="secondary">
          结合市场消息、持仓分布与风险提示的智能建议
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={7}>
          <Card 
            title="报告列表" 
            bordered={false} 
            loading={loadingList}
            className="report-list-card"
            extra={
              <Button type="link" size="small" onClick={loadReports}>
                刷新
              </Button>
            }
          >
            <List
              dataSource={reports}
              renderItem={(report) => (
                <List.Item
                  key={report.id}
                  onClick={() => {
                    setSelectedReportId(report.id);
                    loadDetail(report.id);
                  }}
                  className={selectedReportId === report.id ? 'report-item active' : 'report-item'}
                >
                  <List.Item.Meta
                    avatar={
                      <div className={`report-status-indicator ${report.status}`} />
                    }
                    title={
                      <Space>
                        <span className="report-id">#{report.id}</span>
                        <Tag color={statusColors[report.status]}>{statusTexts[report.status]}</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div className="report-date">{report.date}</div>
                        {report.status === 'pending' && (
                          <Tag size="small" color="blue">待处理</Tag>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={17}>
          {loadingDetail && (
            <Card bordered={false} className="detail-loading-card">
              <div className="loading-container">
                <Spin size="large" />
                <Typography.Text type="secondary" style={{ marginTop: 16, display: 'block' }}>
                  正在加载报告详情...
                </Typography.Text>
              </div>
            </Card>
          )}
          {!loadingDetail && detail && (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card title="建议摘要" bordered={false} className="summary-card">
                <Row gutter={[24, 16]}>
                  <Col xs={24} sm={12}>
                    <div className="summary-item">
                      <span className="summary-label">报告编号</span>
                      <span className="summary-value">#{detail.id}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">生成时间</span>
                      <span className="summary-value">{detail.date}</span>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div className="summary-item">
                      <span className="summary-label">状态</span>
                      <Tag color={statusColors[detail.status]}>{statusTexts[detail.status]}</Tag>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">风险等级</span>
                      <Tag icon={<WarningOutlined />} color={riskColors[detail.riskLevel]}>
                        {riskTexts[detail.riskLevel]}
                      </Tag>
                    </div>
                  </Col>
                  <Col xs={24}>
                    <div className="ai-judgment">
                      <div className="summary-label">AI 总体判断</div>
                      <Alert message={detail.aiJudgment} type="info" showIcon />
                    </div>
                  </Col>
                </Row>
              </Card>

              <Card title="关联市场消息" bordered={false} className="news-card">
                <List
                  dataSource={detail.relatedNews}
                  renderItem={(news) => (
                    <List.Item
                      key={news.id}
                      className="news-item"
                      actions={[
                        <Button
                          type="link"
                          icon={<LinkOutlined />}
                          href={news.source}
                          target="_blank"
                          key="link"
                          className="news-source-btn"
                        >
                          查看来源
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div className={`news-sentiment-indicator ${news.sentiment}`} />
                        }
                        title={
                          <Space>
                            <Tag color="blue" className="news-coin-tag">{news.coin}</Tag>
                            <Tag color={sentimentColors[news.sentiment]} className="news-sentiment-tag">
                              {sentimentTexts[news.sentiment]}
                            </Tag>
                            <span className="news-time subtle-text">{news.time}</span>
                          </Space>
                        }
                        description={
                          <div className="news-summary">{news.summary}</div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>

              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="当前持仓快照" bordered={false} className="chart-card">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          nameKey="name"
                          labelLine={false}
                          label={({ name, value }) => `${name} ${value}%`}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="percentage"
                          animationBegin={0}
                          animationDuration={800}
                        >
                          {pieData.map((item, index) => (
                            <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="chart-footer">
                      {pieData.length} 种币种持仓
                    </div>
                  </Card>
                </Col>

                {detail.proposedChanges.length > 0 && (
                  <Col xs={24} lg={12}>
                    <Card title="调整建议方案" bordered={false} className="adjustment-card">
                      <Table
                        columns={adjustmentColumns}
                        dataSource={detail.proposedChanges}
                        rowKey="coin"
                        pagination={false}
                        size="small"
                        className="adjustment-table"
                      />
                    </Card>
                  </Col>
                )}
              </Row>

              {detail.status === 'pending' && (
                <Card bordered={false} className="action-card">
                  <div className="action-container">
                    <div className="action-info">
                      <Typography.Title level={4}>操作建议</Typography.Title>
                      <Typography.Text type="secondary">
                        请审核此AI建议报告，选择通过或驳回
                      </Typography.Text>
                    </div>
                    <div className="action-buttons">
                      <Button
                        type="primary"
                        size="large"
                        icon={<CheckCircleOutlined />}
                        onClick={handleApprove}
                        className="approve-btn"
                      >
                        通过建议
                      </Button>
                      <Button
                        danger
                        size="large"
                        icon={<CloseCircleOutlined />}
                        onClick={handleReject}
                        className="reject-btn"
                      >
                        驳回建议
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </Space>
          )}
        </Col>
      </Row>

      <Modal
        title="驳回原因"
        open={rejectModalVisible}
        onOk={submitReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason('');
        }}
        okText="确认驳回"
        cancelText="取消"
      >
        <TextArea
          rows={4}
          placeholder="请填写驳回原因，方便模型迭代与记录"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
