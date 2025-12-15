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

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
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
};
