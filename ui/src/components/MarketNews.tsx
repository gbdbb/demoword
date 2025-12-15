import { useEffect, useState } from 'react';
import { Table, Tag, Select, Space, Card, Button, Typography, message } from 'antd';
import { LinkOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../api';
import type { NewsItem, NewsPage } from '../api';
type SentimentType = NewsItem['sentiment'];

const { Option } = Select;

const sentimentColors: Record<SentimentType, string> = {
  bullish: 'green',
  bearish: 'red',
  neutral: 'default',
};

const sentimentTexts: Record<SentimentType, string> = {
  bullish: '利好',
  bearish: '利空',
  neutral: '中性',
};

export default function MarketNews() {
  const [selectedCoin, setSelectedCoin] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [pageData, setPageData] = useState<NewsPage>({
    content: [],
    page: 0,
    size: 8,
    totalElements: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);

  const loadData = (page = 0, size = pageData.size) => {
    setLoading(true);
    api
      .getNews({ coin: selectedCoin, sentiment: selectedSentiment, page, size })
      .then((res) => setPageData(res))
      .catch((err) => {
        console.error(err);
        message.error('加载消息失败，请稍后再试');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData(0, pageData.size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCoin, selectedSentiment]);

  const columns: ColumnsType<NewsItem> = [
    {
      title: '发布时间',
      dataIndex: 'time',
      key: 'time',
      width: 180,
      sorter: (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: '币种',
      dataIndex: 'coin',
      key: 'coin',
      width: 100,
      render: (coin: string) => <Tag color="blue">{coin}</Tag>,
    },
    {
      title: '情绪',
      dataIndex: 'sentiment',
      key: 'sentiment',
      width: 100,
      render: (sentiment: SentimentType) => (
        <Tag color={sentimentColors[sentiment]}>{sentimentTexts[sentiment]}</Tag>
      ),
    },
    {
      title: '消息摘要',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'read',
      key: 'read',
      width: 100,
      render: (read: boolean | undefined) => (
        <Tag color={read ? 'default' : 'green'}>{read ? '已读' : '未读'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<LinkOutlined />} href={record.source} target="_blank">
            查看详情
          </Button>
          <Button
            type="link"
            disabled={record.read}
            onClick={() => {
              api
                .markNewsRead(record.id)
                .then(() => {
                  setPageData((prev) => ({
                    ...prev,
                    content: prev.content.map((item) =>
                      item.id === record.id ? { ...item, read: true } : item,
                    ),
                  }));
                  message.success('已标记为已读');
                })
                .catch((err) => {
                  console.error(err);
                  message.error('标记已读失败');
                });
            }}
          >
            标记已读
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <Typography.Title level={3} className="page-title">
          消息列表
        </Typography.Title>
        <Typography.Text type="secondary">实时追踪 AI 采集的链上和市场资讯</Typography.Text>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} size="middle" wrap>
          <Space>
            <FilterOutlined />
            <Typography.Text strong>筛选条件</Typography.Text>
          </Space>
          <Space size="middle" wrap>
            <span>币种</span>
            <Select value={selectedCoin} onChange={setSelectedCoin} style={{ width: 140 }}>
              <Option value="all">全部</Option>
              <Option value="BTC">BTC</Option>
              <Option value="ETH">ETH</Option>
              <Option value="SOL">SOL</Option>
            </Select>
            <span>情绪</span>
            <Select
              value={selectedSentiment}
              onChange={setSelectedSentiment}
              style={{ width: 140 }}
            >
              <Option value="all">全部</Option>
              <Option value="bullish">利好</Option>
              <Option value="bearish">利空</Option>
              <Option value="neutral">中性</Option>
            </Select>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={pageData.content}
          rowKey="id"
          loading={loading}
          tableLayout="auto"
          scroll={{ x: 'max-content' }}
          pagination={{
            current: pageData.page + 1,
            pageSize: pageData.size,
            total: pageData.totalElements,
            showSizeChanger: true,
            pageSizeOptions: [8, 10, 20],
            showTotal: (total) => `共 ${total} 条消息`,
            onChange: (p, size) => loadData(p - 1, size),
          }}
        />
      </Card>
    </div>
  );
}
