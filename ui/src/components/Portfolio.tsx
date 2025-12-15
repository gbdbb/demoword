import { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Table, Button, Typography, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
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
} from 'recharts';
import { api, type Holding, type PortfolioResponse } from '../api';

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#13c2c2'];

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

  const columns: ColumnsType<Holding> = [
    {
      title: '币种',
      dataIndex: 'coin',
      key: 'coin',
      width: 120,
    },
    {
      title: '数量',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (amount: number) => amount.toLocaleString(),
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 120,
      render: (percentage: number) => `${percentage}%`,
    },
    {
      title: '当前市值 (USDT)',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => value.toLocaleString(),
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
              总估值 <strong>{totalValue.toLocaleString()} USDT</strong>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="近 7 日持仓波动 (%)" bordered={false}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="BTC" stroke="#1677ff" strokeWidth={2} />
                <Line type="monotone" dataKey="ETH" stroke="#52c41a" strokeWidth={2} />
                <Line type="monotone" dataKey="SOL" stroke="#faad14" strokeWidth={2} />
                <Line type="monotone" dataKey="USDT" stroke="#13c2c2" strokeWidth={2} />
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
