export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

export type NewsItem = {
  id: number;
  time: string;
  coin: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  summary: string;
  source: string;
  title?: string;
  read?: boolean;
};

export type NewsPage = {
  content: NewsItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export type Holding = {
  coin: string;
  amount: number;
  percentage: number;
  value: number;
};

export type PortfolioResponse = {
  holdings: Holding[];
  history: { [key: string]: string | number }[];
};

export type ReportSummary = {
  id: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  riskLevel: 'high' | 'medium' | 'low';
};

export type ProposedChange = {
  coin: string;
  currentAmount: number;
  proposedAmount: number;
  change: number;
  reason: string;
};

export type ReportDetail = {
  id: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  riskLevel: 'high' | 'medium' | 'low';
  aiJudgment: string;
  relatedNews: NewsItem[];
  proposedChanges: ProposedChange[];
  currentHoldings: Holding[];
};

export type MetricsResponse = {
  unreadNews: number;
  pendingReports: number;
  totalAssetValue: number;
};

export type CoinPrice = {
  usd: number;
  cny: number;
  usd_24h_change: number;
  cny_24h_change: number;
};

export type ExchangeRatesResponse = {
  bitcoin: CoinPrice;
  ethereum: CoinPrice;
  solana: CoinPrice;
  tether: CoinPrice;
};

// 币种映射，将前端使用的缩写映射到CoinGecko的id
export const COIN_GECKO_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  USDT: 'tether'
};

// 反向映射，用于显示
export const COIN_ABBREVIATION_MAP: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  tether: 'USDT'
};

// 递归地将字符串形式的数字转换为number类型
function convertStringsToNumbers(obj: any): any {
  if (typeof obj === 'string' && !isNaN(Number(obj))) {
    return Number(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(convertStringsToNumbers);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, convertStringsToNumbers(value)])
    );
  }
  return obj;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const data = await res.json();
  // 转换所有字符串形式的数字为number类型
  return convertStringsToNumbers(data) as T;
}

export const api = {
  getMetrics: () => request<MetricsResponse>(`${API_BASE}/metrics`),
  getNews: (params: { coin: string; sentiment: string; page: number; size: number }) => {
    const search = new URLSearchParams({
      coin: params.coin,
      sentiment: params.sentiment,
      page: String(params.page),
      size: String(params.size),
    });
    return request<NewsPage>(`${API_BASE}/news?${search.toString()}`);
  },
  getPortfolio: () => request<PortfolioResponse>(`${API_BASE}/portfolio`),
  getExchangeRates: () => request<ExchangeRatesResponse>(`${API_BASE}/exchange-rates`),
  markNewsRead: (id: number) =>
    request<void>(`${API_BASE}/news/${id}/read`, { method: 'POST' }),
  getReports: () => request<ReportSummary[]>(`${API_BASE}/reports`),
  getReportDetail: (id: string) => request<ReportDetail>(`${API_BASE}/reports/${id}`),
  approveReport: (id: string) =>
    request<{ status: string }>(`${API_BASE}/reports/${id}/approve`, { method: 'POST' }),
  rejectReport: (id: string, reason: string) =>
    request<{ status: string }>(`${API_BASE}/reports/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }),
  undoReport: (id: string) =>
    request<{ status: string }>(`${API_BASE}/reports/${id}/undo`, {
      method: 'POST',
    }),
  updatePortfolioValues: () =>
    request<{ message: string }>(`${API_BASE}/portfolio/update`, { method: 'POST' }),
};
