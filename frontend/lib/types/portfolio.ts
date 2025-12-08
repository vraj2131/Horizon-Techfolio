export interface Security {
  ticker: string;
  name?: string;
  exchange?: string;
  sector?: string;
  lastPrice?: number;
}

export interface Position {
  ticker: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface Portfolio {
  portfolioId: string;
  userId: string;
  name?: string;
  horizon?: 1 | 2 | 5;
  securities: (string | Security)[]; // Can be either string array or Security object array
  positions: Position[];
  cash?: number;
  currentValue?: number;
  totalValue?: number;
  initialCapital?: number;
  status?: string;
  createdAt: string;
  lastUpdated?: string;
}

export interface CreatePortfolioRequest {
  userId: string;
  portfolioName?: string;
  tickers: string[];
  horizon?: 1 | 2 | 5;
  initialCapital?: number;
}

export interface CreatePortfolioResponse {
  message: string;
  portfolioId: string;
  portfolio: Portfolio;
}

// Curated Portfolio Types
export interface CuratedPortfolioOption {
  id: string;
  name: string;
  description: string;
  type: 'growth' | 'balanced' | 'defensive';
  tickers: string[];
  riskLevel: string;
  expectedVolatility: string;
  rebalanceFrequency: string;
}

export interface CuratedPortfoliosByHorizon {
  horizon: number;
  options: CuratedPortfolioOption[];
}

export interface CuratedOptionsResponse {
  horizons?: number[];
  portfolioTypes?: string[];
  options?: {
    '1year': CuratedPortfolioOption[];
    '2year': CuratedPortfolioOption[];
    '5year': CuratedPortfolioOption[];
  };
  horizon?: number;
}

export interface CreateCustomPortfolioRequest {
  userId: string;
  portfolioName?: string;
  tickers: string[];
  horizon: 1 | 2 | 5;
  initialCapital?: number;
}

export interface CreateCustomPortfolioResponse {
  portfolioId: string;
  userId: string;
  type: 'custom';
  name: string;
  horizon: number;
  initialCapital: number;
  cash: number;
  securities: Security[];
  positions: {
    ticker: string;
    shares: number;
    avgCost: number;
    value: number;
  }[];
  validationResults: {
    ticker: string;
    status: string;
    note?: string;
    error?: string;
  }[];
  message: string;
}

export interface CreateCuratedPortfolioRequest {
  userId: string;
  horizon: 1 | 2 | 5;
  portfolioType: 'growth' | 'balanced' | 'defensive';
  initialCapital: number;
}

export interface AllocationInfo {
  ticker: string;
  shares: number;
  pricePerShare: number;
  investedAmount: number;
  targetAllocation: number;
  actualAllocation: number;
}

export interface CreateCuratedPortfolioResponse {
  portfolioId: string;
  userId: string;
  type: 'curated';
  curatedOption: {
    id: string;
    name: string;
    description: string;
    type: string;
    riskLevel: string;
    rebalanceFrequency: string;
  };
  horizon: number;
  initialCapital: number;
  totalInvested: number;
  residualCash: number;
  allocations: AllocationInfo[];
  tickerErrors?: { ticker: string; error: string }[];
  summary: {
    stocksAllocated: number;
    totalStocksInPortfolio: number;
    averageAllocationPerStock: number;
    investmentEfficiency: number;
  };
  message: string;
}

export interface PortfolioListResponse {
  userId: string;
  portfolios: Portfolio[];
  count: number;
}

export interface Signal {
  ticker: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
  indicators: {
    [key: string]: any;
  };
}

export interface PortfolioSignalsResponse {
  portfolioId: string;
  signals: Signal[];
  timestamp: string;
}

export interface Strategy {
  recommended: string;
  frequency: string;
  allocation: {
    [ticker: string]: number;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PortfolioStrategyResponse {
  portfolioId: string;
  horizon: number;
  strategy: Strategy;
}

export interface PerformanceMetrics {
  cagr?: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  totalReturn?: number;
  volatility?: number;
}

export interface PortfolioPerformanceResponse {
  portfolioId: string;
  metrics: PerformanceMetrics;
  timestamp: string;
}

export interface StockSearchRequest {
  tickers: string[];
}

export interface StockInfo {
  ticker: string;
  name: string;
  price: number;
  change?: number;
  changePercent?: number;
  exchange?: string;
  sector?: string;
}

export interface AvailableStocksResponse {
  stocks: StockInfo[];
  count: number;
}

