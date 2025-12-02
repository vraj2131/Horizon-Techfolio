'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/lib/store/authStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Calendar,
  Play,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils/formatters';
import { useToast } from '@/lib/hooks/useToast';
import { post } from '@/lib/api/client';

interface BacktestResult {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  averageReturn: number;
  finalValue: number;
  initialCapital: number;
  trades?: any[];
}

export default function BacktestPage() {
  const router = useRouter();
  const { user, isAuthenticated, verifyToken } = useAuthStore();
  const { showToast } = useToast();

  const [isInitializing, setIsInitializing] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  
  // Form state
  const [ticker, setTicker] = useState('AAPL');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [initialCapital, setInitialCapital] = useState('10000');
  const [strategyType, setStrategyType] = useState('sma_crossover');

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = Cookies.get('auth_token');
        if (!token) {
          router.push('/login');
          return;
        }

        if (!isAuthenticated) {
          const valid = await verifyToken();
          if (!valid) {
            router.push('/login');
            return;
          }
        }
      } catch (error) {
        console.error('Backtest page initialization failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [isAuthenticated]);

  const handleRunBacktest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticker.trim()) {
      showToast('Please enter a stock ticker', 'error');
      return;
    }

    const capital = parseFloat(initialCapital);
    if (isNaN(capital) || capital <= 0) {
      showToast('Please enter a valid initial capital', 'error');
      return;
    }

    if (!startDate || !endDate) {
      showToast('Please select both start and end dates', 'error');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      showToast('Start date must be before end date', 'error');
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      const response = await post<any>('/backtest/run', {
        ticker: ticker.toUpperCase(),
        startDate,
        endDate,
        initialCapital: capital,
        strategy: strategyType
      });

      setResult(response.results);
      showToast('Backtest completed successfully!', 'success');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to run backtest';
      showToast(errorMsg, 'error');
      console.error('Backtest error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loading size="lg" text="Loading backtest..." />
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Strategy Backtesting
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Test trading strategies on historical data
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Backtest Configuration */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6">
                Backtest Configuration
              </h3>

              <form onSubmit={handleRunBacktest} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Stock Ticker *
                  </label>
                  <Input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="e.g., AAPL"
                    maxLength={10}
                    disabled={isRunning}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Strategy Type *
                  </label>
                  <select
                    value={strategyType}
                    onChange={(e) => setStrategyType(e.target.value)}
                    disabled={isRunning}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="sma_crossover">SMA Crossover</option>
                    <option value="rsi">RSI Strategy</option>
                    <option value="macd">MACD Strategy</option>
                    <option value="bollinger_bands">Bollinger Bands</option>
                    <option value="momentum">Momentum Strategy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Start Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={isRunning}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    End Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={isRunning}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Initial Capital *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      $
                    </span>
                    <Input
                      type="number"
                      value={initialCapital}
                      onChange={(e) => setInitialCapital(e.target.value)}
                      placeholder="10000"
                      min="100"
                      step="100"
                      disabled={isRunning}
                      className="pl-8"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isRunning}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isRunning ? (
                    <>
                      <Loading size="sm" className="mr-2" />
                      Running Backtest...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Backtest
                    </>
                  )}
                </Button>
              </form>
            </GlassCard>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {!result ? (
              <GlassCard className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Ready to backtest
                  </h3>
                  <p className="text-slate-400">
                    Configure your backtest parameters and click "Run Backtest" to see how your strategy would have performed.
                  </p>
                </div>
              </GlassCard>
            ) : (
              <div className="space-y-6">
                {/* Performance Summary */}
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">
                    Performance Summary
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Total Return</p>
                      <p className={`text-2xl font-bold ${result.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercent(result.totalReturn)}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Sharpe Ratio</p>
                      <p className="text-2xl font-bold text-white">
                        {result.sharpeRatio?.toFixed(2) || 'N/A'}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Max Drawdown</p>
                      <p className="text-2xl font-bold text-red-400">
                        {formatPercent(result.maxDrawdown || 0)}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Win Rate</p>
                      <p className="text-2xl font-bold text-white">
                        {formatPercent(result.winRate || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-blue-400" />
                        <p className="text-xs text-slate-400">Initial Capital</p>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(result.initialCapital)}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <p className="text-xs text-slate-400">Final Value</p>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(result.finalValue)}
                      </p>
                    </div>
                  </div>
                </GlassCard>

                {/* Trading Statistics */}
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">
                    Trading Statistics
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Total Trades</p>
                      <p className="text-2xl font-bold text-white">
                        {result.totalTrades}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Profitable Trades</p>
                      <p className="text-2xl font-bold text-green-400">
                        {result.profitableTrades}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-800/30 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Average Return</p>
                      <p className={`text-2xl font-bold ${result.averageReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercent(result.averageReturn)}
                      </p>
                    </div>
                  </div>
                </GlassCard>

                {/* Recent Trades */}
                {result.trades && result.trades.length > 0 && (
                  <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Recent Trades ({result.trades.length})
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700/50">
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Price</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Quantity</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.trades.slice(0, 10).map((trade: any, index: number) => (
                            <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                              <td className="py-3 px-4 text-sm text-slate-300">
                                {formatDate(trade.date)}
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant={trade.type === 'BUY' ? 'success' : 'danger'}>
                                  {trade.type}
                                </Badge>
                              </td>
                              <td className="text-right py-3 px-4 text-white">
                                {formatCurrency(trade.price)}
                              </td>
                              <td className="text-right py-3 px-4 text-white">
                                {trade.quantity}
                              </td>
                              <td className="text-right py-3 px-4 text-white">
                                {formatCurrency(trade.value)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

