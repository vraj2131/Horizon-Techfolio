import { get, post } from './client';
import type {
  StockSearchRequest,
  AvailableStocksResponse
} from '../types/portfolio';

export interface WatchlistStock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  date: string;
  previousClose: number;
}

export interface WatchlistResponse {
  watchlist: WatchlistStock[];
  count: number;
  lastUpdated: string | null;
  marketStatus: 'open' | 'closed' | 'weekend';
}

export interface StockDetails {
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  previousClose: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  high52w: number;
  low52w: number;
  date: string;
  lastUpdated: string;
  historicalData: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  totalDataPoints: number;
}

/**
 * Get all available stocks from database
 */
export const getAvailableStocks = async (): Promise<AvailableStocksResponse> => {
  const response = await get<AvailableStocksResponse>('/stocks/available');
  return response;
};

/**
 * Search for stocks by ticker
 */
export const searchStocks = async (tickers: string[]): Promise<any> => {
  const response = await post<any>('/stocks/search', { tickers });
  return response;
};

/**
 * Get popular/recommended stocks
 */
export const getPopularStocks = async (): Promise<any> => {
  const response = await get<any>('/stocks/popular');
  return response;
};

/**
 * Get watchlist with current prices and daily changes
 */
export const getWatchlist = async (): Promise<WatchlistResponse> => {
  const response = await get<WatchlistResponse>('/stocks/watchlist');
  return response;
};

/**
 * Get detailed stock information
 */
export const getStockDetails = async (ticker: string): Promise<StockDetails> => {
  const response = await get<StockDetails>(`/stocks/${ticker}`);
  return response;
};

/**
 * Technical Indicator Types
 */
export interface IndicatorValue {
  // For simple indicators (SMA, EMA, RSI)
  value?: number;
  // For MACD
  macd?: number;
  signal?: number;
  histogram?: number;
  // For Bollinger Bands
  upper?: number;
  middle?: number;
  lower?: number;
  currentPrice?: number;
}

export interface IndicatorExplanation {
  signalExplanation: string;
  description: string;
  currentValue: IndicatorValue | number | null;
  currentPrice?: number;
}

export interface TechnicalIndicator {
  type: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BOLLINGER';
  value: IndicatorValue | number | null;
  signal: 'buy' | 'sell' | 'hold';
  strength: number; // 0-1
  params: Record<string, any>;
  explanation: IndicatorExplanation;
  metadata: {
    window?: number;
    [key: string]: any;
  };
  allValues?: any; // For charting
  allSignals?: string[]; // For charting
  error?: string;
}

export interface StockIndicatorsResponse {
  ticker: string;
  currentPrice: number;
  indicators: {
    SMA?: TechnicalIndicator;
    EMA?: TechnicalIndicator;
    RSI?: TechnicalIndicator;
    MACD?: TechnicalIndicator;
    BOLLINGER?: TechnicalIndicator;
  };
  timestamp: string;
}

/**
 * Get technical indicators for a stock
 */
export const getStockIndicators = async (ticker: string): Promise<StockIndicatorsResponse> => {
  const response = await get<StockIndicatorsResponse>(`/stocks/${ticker}/indicators`);
  return response;
};

/**
 * Stock Recommendation Types
 */
export interface StockRecommendationRequest {
  ticker: string;
  horizon: number; // years
  riskTolerance?: 'low' | 'medium' | 'high';
}

export interface IndicatorSignal {
  type: string;
  value?: number | any;
  signal: 'buy' | 'sell' | 'hold';
  params?: Record<string, any>;
  error?: string;
  allSignals?: string[];
}

export interface GeminiInsights {
  recommendation?: 'BUY' | 'SELL' | 'HOLD';
  confidence?: number;
  enhancedExplanation?: string;
  riskAssessment?: string;
  actionableInsights?: string;
  educationalContext?: string;
}

export interface RecommendationComparison {
  calculated: 'BUY' | 'SELL' | 'HOLD';
  calculatedConfidence: number;
  gemini: 'BUY' | 'SELL' | 'HOLD';
  geminiConfidence: number;
  match: boolean;
  agreement: 'Agree' | 'Disagree';
}

export interface StockRecommendationResponse {
  ticker: string;
  currentPrice: number;
  horizon: number;
  riskTolerance: string;
  recommendedStrategy: string;
  strategyName: string;
  strategyDescription: string;
  strategyFrequency: string;
  strategyConfidence: number;
  strategyReasoning: string;
  finalRecommendation: 'buy' | 'sell' | 'hold';
  confidence: number;
  recommendationText: string;
  reason: string;
  indicators: Record<string, IndicatorSignal>;
  timestamp: string;
  geminiInsights?: GeminiInsights;
  geminiEnabled?: boolean;
  recommendationComparison?: RecommendationComparison;
}

/**
 * Get stock recommendation based on ticker and horizon
 */
export const getStockRecommendation = async (
  data: StockRecommendationRequest
): Promise<StockRecommendationResponse> => {
  const response = await post<StockRecommendationResponse>('/stocks/recommend', data);
  return response;
};

