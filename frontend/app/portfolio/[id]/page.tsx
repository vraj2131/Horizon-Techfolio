'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { usePortfolioStore } from '@/lib/store/portfolioStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target,
  BarChart3,
  Bell
} from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    portfolios,
    selectedPortfolio,
    selectPortfolio,
    signals,
    strategy,
    performance,
    fetchPortfolios,
    fetchPortfolioSignals,
    fetchPortfolioStrategy,
    fetchPortfolioPerformance,
    isLoading
  } = usePortfolioStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [isInitializing, setIsInitializing] = useState(true);
  const portfolioId = params.id as string;

  useEffect(() => {
    const initialize = async () => {
      try {
        // If portfolios not loaded yet, load them first
        if (portfolios.length === 0 && user?.userId) {
          await fetchPortfolios(user.userId);
        }

        // Find and select the portfolio
        const portfolio = portfolios.find(p => p.portfolioId === portfolioId);
        if (portfolio) {
          selectPortfolio(portfolio);
        } else if (portfolios.length > 0) {
          // Portfolio not found
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Failed to initialize portfolio:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [portfolioId, portfolios, user?.userId]);

  // Load tab data when tab changes
  useEffect(() => {
    if (!selectedPortfolio) return;

    if (activeTab === 'signals' && signals.length === 0) {
      fetchPortfolioSignals(portfolioId).catch(console.error);
    } else if (activeTab === 'strategy' && !strategy) {
      fetchPortfolioStrategy(portfolioId).catch(console.error);
    } else if (activeTab === 'performance' && !performance) {
      fetchPortfolioPerformance(portfolioId).catch(console.error);
    }
  }, [activeTab, selectedPortfolio, portfolioId]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loading size="lg" text="Loading portfolio..." />
      </div>
    );
  }

  if (!selectedPortfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <GlassCard className="p-8 text-center">
          <p className="text-slate-400 mb-4">Portfolio not found</p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </GlassCard>
      </div>
    );
  }

  const pnl = (selectedPortfolio.currentValue || 0) - (selectedPortfolio.initialCapital || 0);
  const pnlPercent = selectedPortfolio.initialCapital > 0
    ? ((selectedPortfolio.currentValue || 0) - selectedPortfolio.initialCapital) / selectedPortfolio.initialCapital * 100
    : 0;
  const isPositive = pnl >= 0;

  const tabs = [
    { id: 'overview', label: 'Overview', Icon: Activity },
    { id: 'signals', label: 'Signals', Icon: Bell },
    { id: 'strategy', label: 'Strategy', Icon: Target },
    { id: 'performance', label: 'Performance', Icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {selectedPortfolio.name || `Portfolio ${portfolioId.slice(0, 8)}`}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={selectedPortfolio.status === 'active' ? 'success' : 'secondary'}>
                    {selectedPortfolio.status}
                  </Badge>
                  {selectedPortfolio.securities && selectedPortfolio.securities.length > 0 && (
                    <p className="text-sm text-slate-400">
                      {selectedPortfolio.securities.length} securities
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push('/trading')}
              >
                Trade
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <GlassCard className="p-6">
            <p className="text-sm text-slate-400 mb-2">Current Value</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(selectedPortfolio.currentValue || 0)}
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <p className="text-sm text-slate-400 mb-2">Initial Capital</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(selectedPortfolio.initialCapital || 0)}
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <p className="text-sm text-slate-400 mb-2">Total P&L</p>
            <div className="flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
              <p className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{formatCurrency(pnl)}
              </p>
            </div>
            <p className={`text-sm mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercent(pnlPercent)}
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <p className="text-sm text-slate-400 mb-2">Positions</p>
            <p className="text-3xl font-bold text-white">
              {selectedPortfolio.positions?.length || 0}
            </p>
          </GlassCard>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-700/50 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.Icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <OverviewTab portfolio={selectedPortfolio} />
          )}
          {activeTab === 'signals' && (
            <SignalsTab signals={signals} isLoading={isLoading} />
          )}
          {activeTab === 'strategy' && (
            <StrategyTab strategy={strategy} isLoading={isLoading} />
          )}
          {activeTab === 'performance' && (
            <PerformanceTab performance={performance} isLoading={isLoading} />
          )}
        </div>
      </main>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ portfolio }: { portfolio: any }) {
  return (
    <div className="space-y-6">
      {/* Securities */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Securities</h3>
        {portfolio.securities && portfolio.securities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {portfolio.securities.map((security: any, idx: number) => {
              const ticker = typeof security === 'string' ? security : security.ticker;
              return (
                <Badge key={`${ticker}-${idx}`} variant="primary" className="px-4 py-2 text-sm">
                  {ticker}
                </Badge>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400">No securities in this portfolio</p>
        )}
      </GlassCard>

      {/* Positions */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Active Positions</h3>
        {portfolio.positions && portfolio.positions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Ticker</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Quantity</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Avg Cost</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Current Price</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Market Value</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">P&L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((position: any, index: number) => {
                  const positionPnL = position.profitLoss || 0;
                  const positionPnLPercent = position.profitLossPercent || 0;
                  const isPositionPositive = positionPnL >= 0;

                  return (
                    <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <span className="font-medium text-white">{position.ticker}</span>
                      </td>
                      <td className="text-right py-3 px-4 text-white">
                        {position.quantity || position.shares || 0}
                      </td>
                      <td className="text-right py-3 px-4 text-white">
                        {formatCurrency(position.averageCost || position.avg_cost || 0)}
                      </td>
                      <td className="text-right py-3 px-4 text-white">
                        {formatCurrency(position.currentPrice || 0)}
                      </td>
                      <td className="text-right py-3 px-4 text-white">
                        {formatCurrency(position.marketValue || 0)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className={isPositionPositive ? 'text-green-400' : 'text-red-400'}>
                          <div className="font-medium">
                            {isPositionPositive ? '+' : ''}{formatCurrency(positionPnL)}
                          </div>
                          <div className="text-xs">
                            {formatPercent(positionPnLPercent)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-400">No active positions</p>
        )}
      </GlassCard>
    </div>
  );
}

// Signals Tab Component
function SignalsTab({ signals, isLoading }: { signals: any[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Loading signals..." />
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Trading Signals</h3>
      {signals && signals.length > 0 ? (
        <div className="space-y-4">
          {signals.map((signal, index) => (
            <div
              key={index}
              className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Badge variant="primary">{signal.ticker}</Badge>
                  <Badge variant={signal.type === 'BUY' ? 'success' : 'danger'}>
                    {signal.type}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400">
                  {new Date(signal.timestamp).toLocaleDateString()}
                </p>
              </div>
              <p className="text-white">{signal.reason}</p>
              {signal.confidence && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Confidence</span>
                    <span>{(signal.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${signal.confidence * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400">No signals available for this portfolio</p>
      )}
    </GlassCard>
  );
}

// Strategy Tab Component
function StrategyTab({ strategy, isLoading }: { strategy: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Loading strategy..." />
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Recommended Strategy</h3>
      {strategy ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Strategy Type</p>
            <Badge variant="primary">{strategy.type || 'N/A'}</Badge>
          </div>
          {strategy.description && (
            <div>
              <p className="text-sm text-slate-400 mb-1">Description</p>
              <p className="text-white">{strategy.description}</p>
            </div>
          )}
          {strategy.indicators && strategy.indicators.length > 0 && (
            <div>
              <p className="text-sm text-slate-400 mb-2">Indicators</p>
              <div className="flex flex-wrap gap-2">
                {strategy.indicators.map((indicator: string, index: number) => (
                  <Badge key={index} variant="secondary">{indicator}</Badge>
                ))}
              </div>
            </div>
          )}
          {strategy.parameters && (
            <div>
              <p className="text-sm text-slate-400 mb-2">Parameters</p>
              <div className="bg-slate-800/30 rounded-lg p-4">
                <pre className="text-sm text-white font-mono">
                  {JSON.stringify(strategy.parameters, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-slate-400">No strategy available for this portfolio</p>
      )}
    </GlassCard>
  );
}

// Performance Tab Component
function PerformanceTab({ performance, isLoading }: { performance: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Loading performance..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {performance ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6">
              <p className="text-sm text-slate-400 mb-2">Total Return</p>
              <p className="text-2xl font-bold text-white">
                {formatPercent(performance.totalReturn || 0)}
              </p>
            </GlassCard>
            
            <GlassCard className="p-6">
              <p className="text-sm text-slate-400 mb-2">Sharpe Ratio</p>
              <p className="text-2xl font-bold text-white">
                {(performance.sharpeRatio || 0).toFixed(2)}
              </p>
            </GlassCard>
            
            <GlassCard className="p-6">
              <p className="text-sm text-slate-400 mb-2">Max Drawdown</p>
              <p className="text-2xl font-bold text-red-400">
                {formatPercent(performance.maxDrawdown || 0)}
              </p>
            </GlassCard>
          </div>

          {performance.metrics && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Detailed Metrics</h3>
              <div className="bg-slate-800/30 rounded-lg p-4">
                <pre className="text-sm text-white font-mono overflow-auto">
                  {JSON.stringify(performance.metrics, null, 2)}
                </pre>
              </div>
            </GlassCard>
          )}
        </>
      ) : (
        <GlassCard className="p-6">
          <p className="text-slate-400">No performance data available for this portfolio</p>
        </GlassCard>
      )}
    </div>
  );
}

