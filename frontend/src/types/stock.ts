export interface TechnicalKPI {
  value: number | null;
  score: number;
  weight: number;
  insight: string;
}

export interface TechnicalAnalysis {
  rsi: TechnicalKPI;
  sma_trend: TechnicalKPI;
  momentum: TechnicalKPI;
  volume_trend: TechnicalKPI;
  technical_score: number;
  strength: string;
}

export interface FundamentalKPI {
  value: number | null;
  score: number;
  weight: number;
  insight: string;
}

export interface FundamentalAnalysis {
  roe: FundamentalKPI;
  debt_to_equity: FundamentalKPI;
  revenue_growth: FundamentalKPI;
  eps_growth: FundamentalKPI;
  fundamental_score: number;
  strength: string;
}

export interface InstitutionalHoldingsResponse {
  promoter_pct: number;
  fii_pct: number;
  dii_pct: number;
  public_pct: number;
  insight: string;
}

export interface NewsArticleResponse {
  title: string;
  source: string | null;
  published_at: string | null;
  sentiment: string | null;
  summary: string | null;
}

export interface StockAnalysisResponse {
  symbol: string;
  company_name: string;
  sector: string | null;
  current_price: number | null;
  technical: TechnicalAnalysis;
  fundamental: FundamentalAnalysis;
  institutional: InstitutionalHoldingsResponse | null;
  news: NewsArticleResponse[];
  final_score: number;
  recommendation: string;
  rank_label: string;
  description: string | null;
  summary?: string;
}

export interface CompareResponse {
  stock1: StockAnalysisResponse;
  stock2: StockAnalysisResponse;
  winner: string | null;
  insight: string | null;
}

export interface StockDetailsResponse {
  symbol: string;
  company_name: string;
  sector: string | null;
  industry: string | null;
  current_price: number | null;
  market_cap: number | null;
  pe_ratio: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
}
