import { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Table, Button, Typography, message, Tag } from 'antd';
import { DownloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  BarChart,
  Bar,
} from 'recharts';
import { api, type Holding, type PortfolioResponse } from '../api';

// 现代化配色方案
const COLORS = ['#165dff', '#00b42a', '#ff7d00', '#13c2c2', '#722ed1', '#eb2f96'];

// 自定义饼图标签
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${name} ${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

// 自定义Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '10px 15px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
        <p className="label" style={{ margin: 0, fontWeight: 'bold', color: payload[0].color }}>{`${payload[0].name}: ${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

export default function Portfolio() {
  const [data, setData] = useState<PortfolioResponse>({ holdings: [], history: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getPortfolio()
      .then(setData)
      .catch((err) => {
        console.error(err);
        message.error('加载持仓数据失败');
      })
      .finally(() => setLoading(false));
  }, []);

  // 模拟价格变化数据，实际项目中可以从API获取
  const [priceChanges, setPriceChanges] = useState<Record<string, number>>({});
  
  useEffect(() => {
    // 模拟价格变化数据
    const mockChanges: Record<string, number> = {};
    data.holdings.forEach(holding => {
      mockChanges[holding.coin] = (Math.random() - 0.5) * 10; // -5% 到 5% 的随机变化
    });
    setPriceChanges(mockChanges);
  }, [data.holdings]);

  const columns: ColumnsType<Holding> = [
    {
      title: '币种',
      dataIndex: 'coin',
      key: 'coin',
      width: 120,
      render: (coin: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: COLORS[data.holdings.findIndex(h => h.coin === coin) % COLORS.length],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {coin}
          </div>
          <span style={{ fontWeight: '600', fontSize: '15px' }}>{coin}</span>
        </div>
      ),
    },
    {
      title: '数量',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (amount: number) => (
        <Typography.Text strong style={{ fontSize: '14px' }}>
          {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
        </Typography.Text>
      ),
    },
    {
      title: '24h变化',
      key: 'change',
      width: 120,
      render: (_: any, record: Holding) => {
        const change = priceChanges[record.coin] || 0;
        return (
          <Tag 
            icon={change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            color={change >= 0 ? 'success' : 'error'}
          >
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </Tag>
        );
      },
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 120,
      render: (percentage: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '3px',
              backgroundColor: '#e2e8f0',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                height: '100%',
                width: `${percentage}%`,
                backgroundColor: '#165dff',
                borderRadius: '3px'
              }}
            />
          </div>
          <Typography.Text strong>{percentage.toFixed(1)}%</Typography.Text>
        </div>
      ),
    },
    {
      title: '当前市值 (USDT)',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => (
        <Typography.Text strong style={{ fontSize: '15px', color: '#1e293b' }}>
          ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography.Text>
      ),
    },
  ];

  const totalValue = useMemo(
    () => data.holdings.reduce((sum, item) => sum + (item.value || 0), 0),
    [data.holdings],
  );
  const pieData = useMemo(
    () =>
      data.holdings.map((item) => ({
        name: item.coin,
        percentage: item.percentage,
      })),
    [data.holdings],
  );

  const handleExport = () => {
    message.info('导出为 Excel 的功能在对接后端接口时接入');
  };

  return (
    <div className="page">
      <div className="page-header">
        <Typography.Title level={3} className="page-title">
          持仓数据
        </Typography.Title>
        <Typography.Text type="secondary">
          资产结构与持仓波动概览，支持快速导出与复核
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="当前持仓占比" bordered={false}>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  nameKey="name"
                  labelLine={true}
                  label={(props: any) => {
                    const { name, percent } = props;
                    return `${name} ${(percent * 100).toFixed(1)}%`;
                  }}
                  outerRadius={90}
                  innerRadius={0}
                  fill="#8884d8"
                  dataKey="percentage"
                  paddingAngle={2}
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth={2}
                >
                  {pieData.map((item, index) => (
                    <Cell 
                      key={item.name} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  formatter={(value) => <span style={{ fontWeight: '500' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-footer" style={{ marginTop: '20px' }}>
              <Typography.Text strong style={{ fontSize: '16px', color: '#1e293b' }}>
                总估值 ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography.Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="近 7 日持仓波动 (%)" bordered={false}>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data.history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  tick={{ fill: '#64748b' }}
                />
                <YAxis 
                  stroke="#64748b"
                  tick={{ fill: '#64748b' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    border: 'none'
                  }}
                />
                <Legend 
                  formatter={(value) => <span style={{ fontWeight: '500' }}>{value}</span>}
                />
                <Line 
                  type="monotone" 
                  dataKey="BTC" 
                  stroke={COLORS[0]} 
                  strokeWidth={3} 
                  activeDot={{ r: 6, fill: COLORS[0] }}
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                  animationBegin={0}
                  dot={{ r: 4, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="ETH" 
                  stroke={COLORS[1]} 
                  strokeWidth={3} 
                  activeDot={{ r: 6, fill: COLORS[1] }}
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                  animationBegin={200}
                  dot={{ r: 4, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="SOL" 
                  stroke={COLORS[2]} 
                  strokeWidth={3} 
                  activeDot={{ r: 6, fill: COLORS[2] }}
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                  animationBegin={400}
                  dot={{ r: 4, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="USDT" 
                  stroke={COLORS[3]} 
                  strokeWidth={3} 
                  activeDot={{ r: 6, fill: COLORS[3] }}
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                  animationBegin={600}
                  dot={{ r: 4, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24}>
          <Card
            title="持仓明细"
            bordered={false}
            extra={
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
                导出 Excel
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={data.holdings}
              rowKey="coin"
              loading={loading}
              pagination={false}
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <strong>合计</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>-</Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <strong>100%</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <strong>{totalValue.toLocaleString()} USDT</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
