import { useEffect, useMemo, useState } from 'react';
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
  Typography,
  message,
  Spin,
  Select,
} from 'antd';

const { Option } = Select;
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { api, type ReportDetail, type ReportSummary, type ProposedChange, type ExchangeRatesResponse, COIN_GECKO_ID_MAP, getAuthState } from '../api';

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
  const [exchangeRates, setExchangeRates] = useState<ExchangeRatesResponse | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'usd' | 'cny'>('usd');
  const [ratesLoading, setRatesLoading] = useState(false);

  // 根据实时汇率计算调整后的持仓数据
  const adjustedHoldings = useMemo(() => {
    if (!detail || !exchangeRates) return detail?.currentHoldings || [];

    // 先计算所有持仓的调整后价值
    const adjustedValues = detail.currentHoldings.map((holding) => {
      const coinId = COIN_GECKO_ID_MAP[holding.coin];
      if (!coinId || !exchangeRates[coinId as keyof ExchangeRatesResponse]) {
        return holding.value;
      }

      const coinPrice = exchangeRates[coinId as keyof ExchangeRatesResponse];
      const rate = coinPrice[selectedCurrency];
      return holding.amount * rate;
    });

    // 计算总资产价值
    const totalValue = adjustedValues.reduce((sum, value) => sum + value, 0);

    // 重新计算每个持仓的占比
    return detail.currentHoldings.map((holding, index) => {
      const adjustedValue = adjustedValues[index];
      const percentage = totalValue > 0 ? (adjustedValue / totalValue) * 100 : holding.percentage;

      return {
        ...holding,
        value: adjustedValue,
        percentage: percentage,
      };
    });
  }, [detail, exchangeRates, selectedCurrency]);

  const pieData = useMemo(
    () => adjustedHoldings.map((item) => ({
      name: item.coin,
      percentage: item.percentage,
    })),
    [adjustedHoldings]
  );

  // 计算总资产估值
  const totalAssetValue = useMemo(
    () => adjustedHoldings.reduce((sum, item) => sum + item.value, 0),
    [adjustedHoldings],
  );

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

  // 获取汇率数据（带缓存）
  const fetchExchangeRates = async (forceRefresh = false) => {
    setRatesLoading(true);
    try {
      // 检查localStorage是否有缓存的汇率数据
      const cachedRates = localStorage.getItem('exchangeRates');
      const cachedRatesTimestamp = localStorage.getItem('exchangeRatesTimestamp');
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

      // 如果不是强制刷新且有缓存且未过期，则使用缓存数据
      if (!forceRefresh && cachedRates && cachedRatesTimestamp && now - parseInt(cachedRatesTimestamp) < CACHE_DURATION) {
        setExchangeRates(JSON.parse(cachedRates));
        return;
      }

      // 强制刷新或没有缓存或已过期，请求新数据
      const newRates = await api.getExchangeRates();
      setExchangeRates(newRates);
      
      // 缓存新数据
      localStorage.setItem('exchangeRates', JSON.stringify(newRates));
      localStorage.setItem('exchangeRatesTimestamp', now.toString());
    } catch (err) {
      console.error('获取汇率数据失败:', err);
      message.error('获取实时汇率失败，使用默认汇率');
    } finally {
      setRatesLoading(false);
    }
  };

  // 初始加载汇率数据
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  // 获取货币符号
  const getCurrencySymbol = (currency: 'usd' | 'cny') => {
    return currency === 'usd' ? '$' : '¥';
  };

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

  const handleUndo = () => {
    if (!detail) return;
    Modal.confirm({
      title: '确认撤销',
      content: '确认要撤销此 AI 建议的通过状态并恢复原始持仓吗？',
      okText: '确认撤销',
      cancelText: '取消',
      onOk: () => {
        api
          .undoReport(detail.id)
          .then(() => {
            message.success('已撤销该建议的通过状态，持仓已恢复');
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <Typography.Title level={3} className="page-title">
              AI 建议报告
            </Typography.Title>
            <Typography.Text type="secondary">
              结合市场消息、持仓分布与风险提示的智能建议
            </Typography.Text>
          </div>
          <Select
            value={selectedCurrency}
            onChange={setSelectedCurrency}
            style={{ width: 120 }}
            loading={ratesLoading}
          >
            <Option value="usd">美元 (USD)</Option>
            <Option value="cny">人民币 (CNY)</Option>
          </Select>
        </div>
      </div>

      <div className="report-content">
        <div className="report-list-sidebar">
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
                    title={
                      <Space>
                        <span className="report-id">#{report.id}</span>
                        <Tag color={statusColors[report.status]}>{statusTexts[report.status]}</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div className="report-date">{report.date}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>
        
        <div className="main-content">
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
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
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
                </Col>
                <Col xs={24} lg={12}>
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
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="当前持仓快照" bordered={false} className="chart-card">
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px', fontWeight: '500' }}>
                          当前总资产估值
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '700', background: 'linear-gradient(135deg, #165dff, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                          {getCurrencySymbol(selectedCurrency)}{totalAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCurrency.toUpperCase()}
                        </div>
                      </div>
                      <div style={{ marginLeft: 'auto', width: '50%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              nameKey="name"
                              labelLine={false}
                              label={({ name, value }) => `${name} ${Number(value).toFixed(1)}%`}
                              outerRadius={70}
                              fill="#8884d8"
                              dataKey="percentage"
                              animationBegin={0}
                              animationDuration={800}
                            >
                              {pieData.map((item, index) => (
                                <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
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

              {(detail.status === 'pending' || detail.status === 'approved') && (
                <Card bordered={false} className="action-card">
                  <div className="action-container">
                    <div className="action-info">
                      <Typography.Title level={4}>
                        {detail.status === 'pending' ? '操作建议' : '已通过操作'}
                      </Typography.Title>
                      <Typography.Text type="secondary">
                        {detail.status === 'pending' 
                          ? '请审核此AI建议报告，选择通过或驳回' 
                          : '该建议已通过，您可以选择撤销该操作'}
                      </Typography.Text>
                    </div>
                    <div className="action-buttons">
                      {/* 检查用户是否是管理员 */}
                      {getAuthState().user?.isAdmin && detail.status === 'pending' && (
                        <>
                          <Button
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
                        </>
                      )}
                      {getAuthState().user?.isAdmin && detail.status === 'approved' && (
                        <Button
                          size="large"
                          icon={<WarningOutlined />}
                          onClick={handleUndo}
                          className="undo-btn"
                          style={{ marginRight: '16px' }}
                        >
                          撤销建议
                        </Button>
                      )}
                      {/* 普通用户显示提示信息 */}
                      {!getAuthState().user?.isAdmin && (
                        <Alert
                          message="权限不足"
                          description="您是普通用户，没有权限执行此操作"
                          type="info"
                          showIcon
                          style={{ marginLeft: '16px' }}
                        />
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </Space>
          )}
        </div>
      </div>

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
