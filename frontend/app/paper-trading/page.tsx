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
  Play,
  Pause,
  Square,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Package
} from 'lucide-react';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils/formatters';
import { useToast } from '@/lib/hooks/useToast';
import { get, post } from '@/lib/api/client';

interface PaperTradingSession {
  sessionId: string;
  portfolioId: string;
  status: 'active' | 'paused' | 'stopped';
  startTime: string;
  endTime?: string;
  initialCapital: number;
  currentValue: number;
  totalReturn: number;
  positions: any[];
  trades: any[];
}

export default function PaperTradingPage() {
  const router = useRouter();
  const { user, isAuthenticated, verifyToken } = useAuthStore();
  const { showToast } = useToast();

  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<PaperTradingSession | null>(null);
  const [portfolioId, setPortfolioId] = useState('');
  const [initialCapital, setInitialCapital] = useState('10000');

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

        // Check for active session
        if (user?.userId) {
          await fetchActiveSession();
        }
      } catch (error) {
        console.error('Paper trading page initialization failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [user?.userId, isAuthenticated]);

  const fetchActiveSession = async () => {
    if (!user?.userId) return;

    try {
      const response = await get<any>(`/portfolio/${user.userId}/paper-trading/active`);
      if (response.session) {
        setSession(response.session);
      }
    } catch (error: any) {
      // No active session or error
      console.error('Failed to fetch active session:', error);
    }
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!portfolioId.trim()) {
      showToast('Please enter a portfolio ID', 'error');
      return;
    }

    const capital = parseFloat(initialCapital);
    if (isNaN(capital) || capital <= 0) {
      showToast('Please enter a valid initial capital', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await post<any>('/portfolio/paper-trading/start', {
        portfolioId: portfolioId.trim(),
        initialCapital: capital
      });

      setSession(response.session);
      showToast('Paper trading session started!', 'success');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to start paper trading';
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    if (!session) return;

    try {
      await post(`/portfolio/paper-trading/${session.sessionId}/pause`, {});
      setSession({ ...session, status: 'paused' });
      showToast('Paper trading session paused', 'info');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to pause session';
      showToast(errorMsg, 'error');
    }
  };

  const handleResume = async () => {
    if (!session) return;

    try {
      await post(`/portfolio/paper-trading/${session.sessionId}/resume`, {});
      setSession({ ...session, status: 'active' });
      showToast('Paper trading session resumed', 'success');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to resume session';
      showToast(errorMsg, 'error');
    }
  };

  const handleStop = async () => {
    if (!session) return;

    if (!confirm('Are you sure you want to stop this session? This action cannot be undone.')) {
      return;
    }

    try {
      await post(`/portfolio/paper-trading/${session.sessionId}/stop`, {});
      showToast('Paper trading session stopped', 'info');
      setSession(null);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to stop session';
      showToast(errorMsg, 'error');
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loading size="lg" text="Loading paper trading..." />
      </div>
    );
  }

  const totalReturn = session ? ((session.currentValue - session.initialCapital) / session.initialCapital) * 100 : 0;

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
                  Paper Trading
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Practice trading with virtual money
                </p>
              </div>
            </div>

            {session && (
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    session.status === 'active'
                      ? 'success'
                      : session.status === 'paused'
                      ? 'warning'
                      : 'secondary'
                  }
                >
                  {session.status.toUpperCase()}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!session ? (
          /* Start Session Form */
          <div className="max-w-2xl mx-auto">
            <GlassCard className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Start Paper Trading
                </h2>
                <p className="text-slate-400">
                  Practice your trading strategies with virtual money in real-time
                </p>
              </div>

              <form onSubmit={handleStart} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Portfolio ID *
                  </label>
                  <Input
                    type="text"
                    value={portfolioId}
                    onChange={(e) => setPortfolioId(e.target.value)}
                    placeholder="Enter portfolio ID to trade"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Use a portfolio ID from your dashboard
                  </p>
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
                      disabled={isLoading}
                      className="pl-8"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loading size="sm" className="mr-2" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Paper Trading
                    </>
                  )}
                </Button>
              </form>
            </GlassCard>
          </div>
        ) : (
          /* Active Session Dashboard */
          <div className="space-y-6">
            {/* Session Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-sm text-slate-400">Current Value</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(session.currentValue)}
                </p>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <DollarSign className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-sm text-slate-400">Initial Capital</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(session.initialCapital)}
                </p>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    {totalReturn >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400">Total Return</p>
                </div>
                <p className={`text-3xl font-bold ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercent(totalReturn)}
                </p>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Package className="w-5 h-5 text-indigo-400" />
                  </div>
                  <p className="text-sm text-slate-400">Positions</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {session.positions?.length || 0}
                </p>
              </GlassCard>
            </div>

            {/* Controls */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Session Controls
                  </h3>
                  <p className="text-sm text-slate-400">
                    Started {formatDate(session.startTime)}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {session.status === 'active' ? (
                    <Button
                      onClick={handlePause}
                      variant="ghost"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      onClick={handleResume}
                      className="bg-gradient-to-r from-blue-500 to-purple-600"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleStop}
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Session
                  </Button>
                </div>
              </div>
            </GlassCard>

            {/* Positions */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Current Positions
              </h3>

              {session.positions && session.positions.length > 0 ? (
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
                      {session.positions.map((position: any, index: number) => {
                        const pnl = position.profitLoss || 0;
                        const pnlPercent = position.profitLossPercent || 0;
                        const isPositive = pnl >= 0;

                        return (
                          <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="py-3 px-4">
                              <span className="font-medium text-white">{position.ticker}</span>
                            </td>
                            <td className="text-right py-3 px-4 text-white">
                              {position.quantity}
                            </td>
                            <td className="text-right py-3 px-4 text-white">
                              {formatCurrency(position.averageCost)}
                            </td>
                            <td className="text-right py-3 px-4 text-white">
                              {formatCurrency(position.currentPrice)}
                            </td>
                            <td className="text-right py-3 px-4 text-white">
                              {formatCurrency(position.marketValue)}
                            </td>
                            <td className="text-right py-3 px-4">
                              <div className={isPositive ? 'text-green-400' : 'text-red-400'}>
                                <div className="font-medium">
                                  {isPositive ? '+' : ''}{formatCurrency(pnl)}
                                </div>
                                <div className="text-xs">
                                  {formatPercent(pnlPercent)}
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
                <p className="text-center text-slate-400 py-8">
                  No positions yet. Trades will execute automatically based on your strategy.
                </p>
              )}
            </GlassCard>

            {/* Recent Trades */}
            {session.trades && session.trades.length > 0 && (
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Recent Trades ({session.trades.length})
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Ticker</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Quantity</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Price</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.trades.slice(0, 10).map((trade: any, index: number) => (
                        <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="py-3 px-4 text-sm text-slate-300">
                            {formatDate(trade.timestamp)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={trade.type === 'BUY' ? 'success' : 'danger'}>
                              {trade.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-white">{trade.ticker}</span>
                          </td>
                          <td className="text-right py-3 px-4 text-white">
                            {trade.quantity}
                          </td>
                          <td className="text-right py-3 px-4 text-white">
                            {formatCurrency(trade.price)}
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
      </main>
    </div>
  );
}

