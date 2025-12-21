import { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Statistic, Button, Typography, message, Select } from 'antd';
import {
  MailOutlined,
  FileTextOutlined,
  WalletOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { api, type MetricsResponse, type ExchangeRatesResponse, type PortfolioResponse, COIN_GECKO_ID_MAP } from '../api';

const { Option } = Select;

type DashboardProps = {
  onNavigate: (key: string) => void;
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [metrics, setMetrics] = useState<MetricsResponse>({
    unreadNews: 0,
    pendingReports: 0,
    totalAssetValue: 0,
  });
  const [portfolio, setPortfolio] = useState<PortfolioResponse>({ holdings: [], history: [] });
  const [exchangeRates, setExchangeRates] = useState<ExchangeRatesResponse | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'usd' | 'cny'>('usd');
  const [ratesLoading, setRatesLoading] = useState(false);


  useEffect(() => {
    api
      .getMetrics()
      .then(setMetrics)
      .catch((err) => {
        console.error(err);
        message.error('加载指标失败，请稍后重试');
      });
  }, []);

  useEffect(() => {
    api
      .getPortfolio()
      .then(setPortfolio)
      .catch((err) => {
        console.error(err);
        message.error('加载持仓数据失败，请稍后重试');
      });
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
      message.success('获取实时汇率成功');
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

  

  // 根据实时汇率计算调整后的持仓数据
  const adjustedHoldings = useMemo(() => {
    if (!exchangeRates) return portfolio.holdings;

    // 先计算所有持仓的调整后价值
    const adjustedValues = portfolio.holdings.map((holding) => {
      const coinId = COIN_GECKO_ID_MAP[holding.coin];
      if (!coinId || !exchangeRates[coinId as keyof ExchangeRatesResponse]) {
        return holding.value || 0;
      }

      const coinPrice = exchangeRates[coinId as keyof ExchangeRatesResponse];
      const rate = coinPrice[selectedCurrency];
      return holding.amount * rate;
    });

    // 计算总资产价值
    const totalValue = adjustedValues.reduce((sum, value) => sum + value, 0);

    // 重新计算每个持仓的占比
    return portfolio.holdings.map((holding, index) => {
      const adjustedValue = adjustedValues[index];
      const percentage = totalValue > 0 ? (adjustedValue / totalValue) * 100 : 0;

      return {
        ...holding,
        value: adjustedValue,
        percentage: percentage,
      };
    });
  }, [portfolio.holdings, exchangeRates, selectedCurrency]);

  // 计算总资产估值
  const adjustedTotalAssetValue = useMemo(
    () => adjustedHoldings.reduce((sum, item) => sum + (item.value || 0), 0),
    [adjustedHoldings]
  );

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <Typography.Title level={3} className="page-title">
              系统概览
            </Typography.Title>
            <Typography.Text type="secondary">
              快速查看 AI 工作台的核心指标与导航入口
            </Typography.Text>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Select
              value={selectedCurrency}
              onChange={setSelectedCurrency}
              style={{ width: 120 }}
              loading={ratesLoading}
            >
              <Option value="usd">美元 (USD)</Option>
              <Option value="cny">人民币 (CNY)</Option>
            </Select>
            <Button
              type="primary"
              onClick={async () => {
                setRatesLoading(true);
                try {
                  // 先调用后端API更新数据库中的实时占比和当前市值
                  await api.updatePortfolioValues();
                  // 刷新汇率
                  await fetchExchangeRates(true);
                  // 重新获取更新后的持仓数据
                  const updatedPortfolio = await api.getPortfolio();
                  setPortfolio(updatedPortfolio);
                  message.success('投资组合数据已更新');
                } catch (error) {
                  console.error('更新投资组合数据失败:', error);
                  message.error('更新投资组合数据失败，请稍后重试');
                } finally {
                  setRatesLoading(false);
                }
              }}
              loading={ratesLoading}
              icon={<ArrowRightOutlined />}
            >
              刷新汇率
            </Button>
          </div>
        </div>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Statistic
                title="当前总资产估值"
                value={adjustedTotalAssetValue}
                precision={2}
                prefix={<WalletOutlined style={{ color: '#52c41a' }} />}
                suffix={` ${selectedCurrency.toUpperCase()}`}
              />
              <a 
                href="https://www.coingecko.com" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <img 
                    src="/coingecko.svg" 
                    alt="数据来源: CoinGecko" 
                    style={{ width: 120 }}
                  />
                  <span style={{ fontSize: 12, color: '#999', marginTop: 4, textAlign: 'right' }}>汇率数据来源</span>
                </div>
              </a>
            </div>
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
