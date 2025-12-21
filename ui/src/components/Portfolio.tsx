import { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Table, Button, Typography, message, Tag, Select } from 'antd';
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
} from 'recharts';
import { api, type Holding, type PortfolioResponse, type ExchangeRatesResponse, COIN_GECKO_ID_MAP } from '../api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const { Option } = Select;

// 现代化配色方案
const COLORS = ['#165dff', '#00b42a', '#ff7d00', '#13c2c2', '#722ed1', '#eb2f96'];



export default function Portfolio() {
  const [data, setData] = useState<PortfolioResponse>({ holdings: [], history: [] });
  const [loading, setLoading] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRatesResponse | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'usd' | 'cny'>('usd');
  const [ratesLoading, setRatesLoading] = useState(false);

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

  // 从汇率数据中获取真实的24h变化数据
  const get24hChange = (coin: string): number => {
    if (!exchangeRates) return 0;
    const coinId = COIN_GECKO_ID_MAP[coin];
    if (!coinId || !exchangeRates[coinId as keyof ExchangeRatesResponse]) {
      return 0;
    }
    return exchangeRates[coinId as keyof ExchangeRatesResponse].usd_24h_change || 0;
  };

  // 获取货币符号
  const getCurrencySymbol = (currency: 'usd' | 'cny') => {
    return currency === 'usd' ? '$' : '¥';
  };

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
              backgroundColor: COLORS[adjustedHoldings.findIndex(h => h.coin === coin) % COLORS.length],
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
        const change = get24hChange(record.coin);
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
      title: `当前市值 (${selectedCurrency.toUpperCase()})`,
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => (
        <Typography.Text strong style={{ fontSize: '15px', color: '#1e293b' }}>
          {getCurrencySymbol(selectedCurrency)}{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography.Text>
      ),
    },
  ];

  // 根据实时汇率计算持仓市值和占比
  const adjustedHoldings = useMemo(() => {
    if (!exchangeRates) return data.holdings;

    // 先计算所有持仓的总市值
    const adjustedValues = data.holdings.map((holding) => {
      const coinId = COIN_GECKO_ID_MAP[holding.coin];
      if (!coinId || !exchangeRates[coinId as keyof ExchangeRatesResponse]) {
        return holding.value || 0;
      }
      const coinPrice = exchangeRates[coinId as keyof ExchangeRatesResponse];
      const rate = coinPrice[selectedCurrency];
      return holding.amount * rate;
    });
    
    const total = adjustedValues.reduce((sum, value) => sum + value, 0);

    // 重新计算每个持仓的占比
    return data.holdings.map((holding, index) => {
      let adjustedValue = adjustedValues[index];
      
      return {
        ...holding,
        value: adjustedValue,
        percentage: total > 0 ? (adjustedValue / total) * 100 : 0
      };
    });
  }, [data.holdings, exchangeRates, selectedCurrency]);

  const totalValue = useMemo(
    () => adjustedHoldings.reduce((sum, item) => sum + (item.value || 0), 0),
    [adjustedHoldings],
  );

  const pieData = useMemo(
    () =>
      adjustedHoldings.map((item) => ({
        name: item.coin,
        percentage: item.percentage,
      })),
    [adjustedHoldings],
  );

  const handleExport = () => {
    try {
      // 使用固定列名避免语法问题
      const exportData = adjustedHoldings.map(item => {
        return {
          '币种': item.coin,
          '数量': item.amount,
          '占比': item.percentage.toFixed(2) + '%',
          '市值': item.value.toFixed(2),
          '货币单位': selectedCurrency.toUpperCase(),
          '更新时间': new Date().toLocaleString('zh-CN')
        };
      });

      // 创建工作簿和工作表
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '持仓数据');

      // 调整列宽
      const colWidths = [
        { wch: 10 },  // 币种
        { wch: 15 },  // 数量
        { wch: 10 },  // 占比
        { wch: 15 },  // 市值
        { wch: 15 },  // 货币单位
        { wch: 25 }   // 更新时间
      ];
      ws['!cols'] = colWidths;

      // 生成Excel文件
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // 保存文件
      const fileName = '持仓数据_' + new Date().toISOString().slice(0, 10) + '.xlsx';
      saveAs(dataBlob, fileName);
      
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <Typography.Title level={3} className="page-title">
              持仓数据
            </Typography.Title>
            <Typography.Text type="secondary">
              资产结构与持仓波动概览，支持快速导出与复核
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

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="当前资产配置比例" bordered={false} className="portfolio-chart-card">
            <ResponsiveContainer width="100%" height="100%">
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
                <Tooltip formatter={(value: number | string) => `${parseFloat(String(value)).toFixed(1)}%`} />
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
                总估值 {getCurrencySymbol(selectedCurrency)}{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCurrency.toUpperCase()}
              </Typography.Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="近 7 日资产权重历史演化" bordered={false} className="portfolio-chart-card">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={useMemo(() => {
                  // 按日期排序
                  const sortedHistory = [...data.history].sort((a, b) => {
                    return new Date(a.date as string).getTime() - new Date(b.date as string).getTime();
                  });
                  // 只显示最近7天的数据
                  return sortedHistory.slice(-7);
                }, [data.history])} 
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
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
              dataSource={adjustedHoldings}
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
                      <strong>{getCurrencySymbol(selectedCurrency)}{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCurrency.toUpperCase()}</strong>
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
