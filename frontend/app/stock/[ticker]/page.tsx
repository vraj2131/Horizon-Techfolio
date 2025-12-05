'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  ShoppingCart,
  Package,
  Brain,
  Sparkles
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';
import { getStockDetails, getStockIndicators, getStockRecommendation, StockDetails, StockIndicatorsResponse, StockRecommendationResponse } from '@/lib/api/stocks';
import { useWalletStore } from '@/lib/store/walletStore';
import { TechnicalIndicators } from '@/components/stock/TechnicalIndicators';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/hooks/useToast';

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = (params.ticker as string)?.toUpperCase();
  const [stock, setStock] = useState<StockDetails | null>(null);
  const [indicators, setIndicators] = useState<StockIndicatorsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingIndicators, setIsLoadingIndicators] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tradingViewLoaded, setTradingViewLoaded] = useState(false);
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
  const [selectedHorizon, setSelectedHorizon] = useState<number | null>(null);
  const [insights, setInsights] = useState<StockRecommendationResponse | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const { wallet, buyStock, sellStock, isLoading: isTrading } = useWalletStore();
  const { showToast } = useToast();

  useEffect(() => {
    const loadStockDetails = async () => {
      if (!ticker) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getStockDetails(ticker);
        setStock(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load stock details');
      } finally {
        setIsLoading(false);
      }
    };

    loadStockDetails();
  }, [ticker]);

  // Load technical indicators
  useEffect(() => {
    const loadIndicators = async () => {
      if (!ticker) return;
      
      setIsLoadingIndicators(true);
      try {
        const data = await getStockIndicators(ticker);
        setIndicators(data);
      } catch (err: any) {
        console.error('Failed to load indicators:', err);
        // Don't show error for indicators, just log it
      } finally {
        setIsLoadingIndicators(false);
      }
    };

    loadIndicators();
  }, [ticker]);

  const handleGenerateInsights = async (horizon: number) => {
    if (!ticker) return;
    
    setSelectedHorizon(horizon);
    setIsLoadingInsights(true);
    setInsights(null);

    try {
      const result = await getStockRecommendation({
        ticker,
        horizon,
        riskTolerance: 'medium'
      });
      setInsights(result);
      showToast('Insights generated successfully!', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate insights';
      showToast(errorMessage, 'error');
      setInsights(null);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleCloseInsightsModal = () => {
    setIsInsightsModalOpen(false);
    setSelectedHorizon(null);
    setInsights(null);
  };

  // Initialize TradingView widget when script is loaded
  useEffect(() => {
    if (!tradingViewLoaded || !chartContainerRef.current || !ticker) return;

    // Clean up previous widget if it exists
    if (widgetRef.current) {
      widgetRef.current.remove();
      widgetRef.current = null;
    }

    // Create new TradingView widget
    if (window.TradingView && chartContainerRef.current) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      widgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: ticker,
        interval: 'D',
        timezone: 'America/New_York',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#1e293b',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        container_id: 'tradingview-widget',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        studies: [
          {
            name: 'Volume',
            id: 'volume@tv-basicstudies'
          },
          {
            name: 'RSI',
            id: 'RSI@tv-basicstudies'
          }
        ]
      });
    }

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        widgetRef.current = null;
      }
    };
  }, [tradingViewLoaded, ticker]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loading size="lg" text="Loading stock details..." />
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <GlassCard className="p-8 max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-slate-400 mb-6">{error || 'Stock not found'}</p>
          <Button onClick={() => router.push('/watchlist')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Watchlist
          </Button>
        </GlassCard>
      </div>
    );
  }

  const isPositive = stock.change >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* TradingView Script */}
      <Script
        src="https://s3.tradingview.com/tv.js"
        strategy="lazyOnload"
        onLoad={() => setTradingViewLoaded(true)}
      />

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/watchlist')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  {stock.ticker}
                </h1>
                <p className="text-sm text-slate-400 mt-1">{stock.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsInsightsModalOpen(true)}
              >
                <Brain className="w-4 h-4 mr-2" />
                Generate Insights
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push(`/trading?ticker=${stock.ticker}`)}
              >
                <Activity className="w-4 h-4 mr-2" />
                Trade
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Price Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <GlassCard className="p-6">
            <p className="text-sm text-slate-400 mb-2">Current Price</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(stock.currentPrice)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <Badge variant={isPositive ? 'success' : 'danger'}>
                {formatPercent(stock.changePercent)}
              </Badge>
              <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{formatCurrency(stock.change)}
              </span>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <p className="text-sm text-slate-400 mb-2">Previous Close</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(stock.previousClose)}
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <p className="text-sm text-slate-400 mb-2">52W High</p>
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(stock.high52w)}
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <p className="text-sm text-slate-400 mb-2">52W Low</p>
            <p className="text-2xl font-bold text-red-400">
              {formatCurrency(stock.low52w)}
            </p>
          </GlassCard>
        </div>

        {/* Daily Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <GlassCard className="p-4">
            <p className="text-xs text-slate-400 mb-1">Open</p>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(stock.open)}
            </p>
          </GlassCard>

          <GlassCard className="p-4">
            <p className="text-xs text-slate-400 mb-1">High</p>
            <p className="text-lg font-semibold text-green-400">
              {formatCurrency(stock.high)}
            </p>
          </GlassCard>

          <GlassCard className="p-4">
            <p className="text-xs text-slate-400 mb-1">Low</p>
            <p className="text-lg font-semibold text-red-400">
              {formatCurrency(stock.low)}
            </p>
          </GlassCard>

          <GlassCard className="p-4">
            <p className="text-xs text-slate-400 mb-1">Volume</p>
            <p className="text-lg font-semibold text-white">
              {stock.volume.toLocaleString()}
            </p>
          </GlassCard>
        </div>

        {/* TradingView Chart */}
        <GlassCard className="p-0 overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Price Chart</h2>
              </div>
              <Badge variant="info" showIcon={false}>
                {stock.date}
              </Badge>
            </div>
          </div>
          <div 
            id="tradingview-widget"
            ref={chartContainerRef}
            className="h-[600px] w-full"
            style={{ minHeight: '600px' }}
          />
        </GlassCard>

        {/* Technical Indicators */}
        {isLoadingIndicators ? (
          <GlassCard className="p-8 mb-6">
            <Loading text="Loading technical indicators..." />
          </GlassCard>
        ) : indicators && (
          <div className="mb-6">
            <TechnicalIndicators 
              indicators={indicators.indicators} 
              currentPrice={indicators.currentPrice || stock.currentPrice}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Buy {stock.ticker}</h3>
                <p className="text-sm text-slate-400">Available: {formatCurrency(wallet?.balance || 0)}</p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => router.push(`/trading?ticker=${stock.ticker}&action=buy`)}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy Now
            </Button>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <Package className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Sell {stock.ticker}</h3>
                <p className="text-sm text-slate-400">Check your holdings</p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => router.push(`/trading?ticker=${stock.ticker}&action=sell`)}
            >
              <Package className="w-4 h-4 mr-2" />
              Sell Now
            </Button>
          </GlassCard>
        </div>
      </main>

      {/* Generate Insights Modal */}
      <Modal
        isOpen={isInsightsModalOpen}
        onClose={handleCloseInsightsModal}
        title="Generate Insights"
        size="xl"
      >
        <div className="space-y-6">
          {!insights && !isLoadingInsights && (
            <div>
              <p className="text-slate-300 mb-6 text-center">
                Select your investment horizon to generate AI-powered insights based on technical indicators
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 5].map((years) => (
                  <button
                    key={years}
                    onClick={() => handleGenerateInsights(years)}
                    className="p-6 bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-lg hover:border-blue-500/50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-colors">
                        <Sparkles className="w-6 h-6 text-blue-400" />
                      </div>
                      <Badge variant="info">{years} Year{years > 1 ? 's' : ''}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {years} Year{years > 1 ? 's' : ''} Horizon
                    </h3>
                    <p className="text-sm text-slate-400">
                      {years === 1 && 'Short-term strategy focused on momentum and trends'}
                      {years === 2 && 'Medium-term balanced approach with mean reversion'}
                      {years === 5 && 'Long-term conservative strategy for steady growth'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoadingInsights && (
            <div className="py-12 text-center">
              <Loading size="lg" text="Analyzing indicators and generating insights..." />
            </div>
          )}

          {insights && (
            <div className="space-y-6">
              {/* Main Recommendation */}
              <div className={`p-6 rounded-lg border-t-4 ${
                insights.finalRecommendation === 'buy' 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : insights.finalRecommendation === 'sell'
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-blue-500/10 border-blue-500/30'
              }`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-slate-800/50 rounded-xl">
                    {insights.finalRecommendation === 'buy' ? (
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    ) : insights.finalRecommendation === 'sell' ? (
                      <TrendingDown className="w-6 h-6 text-red-400" />
                    ) : (
                      <Activity className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">
                        {insights.finalRecommendation.toUpperCase()}
                      </h3>
                      <Badge variant={insights.finalRecommendation === 'buy' ? 'success' : insights.finalRecommendation === 'sell' ? 'error' : 'info'}>
                        {(insights.confidence * 100).toFixed(0)}% Confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">
                      Current Price: <span className="text-white font-semibold">{formatCurrency(insights.currentPrice)}</span>
                    </p>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed">{insights.recommendationText}</p>
              </div>

              {/* Strategy Information */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Recommended Strategy</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Strategy</p>
                    <p className="text-lg font-semibold text-white">{insights.strategyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Description</p>
                    <p className="text-slate-300 text-sm">{insights.strategyDescription}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Frequency</p>
                      <p className="text-sm font-medium text-white capitalize">{insights.strategyFrequency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Strategy Confidence</p>
                      <p className="text-sm font-medium text-white">{(insights.strategyConfidence * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Recommendation Confidence</p>
                      <p className="text-sm font-medium text-white">{(insights.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Brain className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white mb-1">Why This Strategy?</p>
                        <p className="text-sm text-slate-300">{insights.strategyReasoning}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Indicator Analysis */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Indicator Analysis</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {Object.entries(insights.indicators).map(([key, indicator]) => (
                    <div key={key} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-white">{indicator.type}</span>
                        <Badge 
                          variant={indicator.signal === 'buy' ? 'success' : indicator.signal === 'sell' ? 'error' : 'info'}
                          className="text-xs"
                        >
                          {indicator.signal}
                        </Badge>
                      </div>
                      {indicator.error ? (
                        <p className="text-xs text-red-400">{indicator.error}</p>
                      ) : (
                        typeof indicator.value === 'number' && (
                          <p className="text-xs text-slate-400">
                            Value: <span className="text-white">{indicator.value.toFixed(2)}</span>
                          </p>
                        )
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-1">Reasoning:</p>
                  <p className="text-sm text-slate-300">{insights.reason}</p>
                </div>
              </GlassCard>

              {/* Gemini AI-Enhanced Insights */}
              {insights.geminiInsights && insights.geminiEnabled ? (
                <GlassCard className="p-6 border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">AI-Enhanced Insights</h3>
                      <p className="text-xs text-slate-400">Powered by Gemini AI</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {insights.geminiInsights.enhancedExplanation && (
                      <div className="p-4 bg-slate-800/50 rounded-lg">
                        <p className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-blue-400" />
                          Enhanced Explanation
                        </p>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {insights.geminiInsights.enhancedExplanation}
                        </p>
                      </div>
                    )}

                    {insights.geminiInsights.riskAssessment && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <p className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-amber-400" />
                          Risk Assessment
                        </p>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {insights.geminiInsights.riskAssessment}
                        </p>
                      </div>
                    )}

                    {insights.geminiInsights.actionableInsights && (
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          Actionable Insights
                        </p>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {insights.geminiInsights.actionableInsights}
                        </p>
                      </div>
                    )}

                    {insights.geminiInsights.educationalContext && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-blue-400" />
                          Educational Context
                        </p>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {insights.geminiInsights.educationalContext}
                        </p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              ) : insights.geminiEnabled === false ? (
                <GlassCard className="p-4 border border-slate-700/50 bg-slate-800/20">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Sparkles className="w-4 h-4" />
                    <p className="text-sm">
                      AI-Enhanced Insights are currently unavailable. Please ensure GEMINI_API_KEY is set in your backend .env file.
                    </p>
                  </div>
                </GlassCard>
              ) : null}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                <Button
                  variant="secondary"
                  onClick={() => {
                    handleCloseInsightsModal();
                    router.push(`/trading?ticker=${insights.ticker}`);
                  }}
                  className="flex-1"
                >
                  {insights.finalRecommendation === 'buy' ? (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Buy {insights.ticker}
                    </>
                  ) : insights.finalRecommendation === 'sell' ? (
                    <>
                      <TrendingDown className="w-4 h-4 mr-2" />
                      Sell {insights.ticker}
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 mr-2" />
                      View Trading
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCloseInsightsModal}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

// Extend Window interface for TradingView
declare global {
  interface Window {
    TradingView: any;
  }
}

