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
  Search,
  TrendingUp,
  TrendingDown,
  Target,
  Link2
} from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';
import { useToast } from '@/lib/hooks/useToast';
import { post } from '@/lib/api/client';

interface CoupledTradeRecommendation {
  ticker1: string;
  ticker2: string;
  correlation: number;
  method: string;
  confidence: number;
  recommendedAction: 'BUY' | 'SELL' | 'HOLD';
  reason: string;
  potentialReturn: number;
}

export default function CoupledTradesPage() {
  const router = useRouter();
  const { user, isAuthenticated, verifyToken } = useAuthStore();
  const { showToast } = useToast();

  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CoupledTradeRecommendation[]>([]);
  
  // Form state
  const [ticker1, setTicker1] = useState('');
  const [ticker2, setTicker2] = useState('');
  const [method, setMethod] = useState('correlation');

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
        console.error('Coupled trades page initialization failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [isAuthenticated]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticker1.trim() || !ticker2.trim()) {
      showToast('Please enter both stock tickers', 'error');
      return;
    }

    if (ticker1.toUpperCase() === ticker2.toUpperCase()) {
      showToast('Please select two different stocks', 'error');
      return;
    }

    setIsLoading(true);
    setRecommendations([]);

    try {
      const response = await post<any>('/coupled-trade/analyze', {
        ticker1: ticker1.toUpperCase(),
        ticker2: ticker2.toUpperCase(),
        method
      });

      setRecommendations(response.recommendations || [response.recommendation]);
      showToast('Analysis completed!', 'success');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to analyze coupled trades';
      showToast(errorMsg, 'error');
      console.error('Coupled trades error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loading size="lg" text="Loading..." />
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
                  Coupled Trades
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Analyze correlated stock pairs for trading opportunities
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Analysis Configuration */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6">
                Analyze Stock Pair
              </h3>

              <form onSubmit={handleAnalyze} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    First Stock Ticker *
                  </label>
                  <Input
                    type="text"
                    value={ticker1}
                    onChange={(e) => setTicker1(e.target.value.toUpperCase())}
                    placeholder="e.g., AAPL"
                    maxLength={10}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Second Stock Ticker *
                  </label>
                  <Input
                    type="text"
                    value={ticker2}
                    onChange={(e) => setTicker2(e.target.value.toUpperCase())}
                    placeholder="e.g., MSFT"
                    maxLength={10}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Analysis Method *
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="correlation">Correlation Analysis</option>
                    <option value="cointegration">Cointegration Test</option>
                    <option value="pairs_trading">Pairs Trading</option>
                    <option value="spread_analysis">Spread Analysis</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-2">
                    Different methods analyze stock relationships in various ways
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !ticker1 || !ticker2}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loading size="sm" className="mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Analyze Pair
                    </>
                  )}
                </Button>
              </form>

              {/* Method Explanation */}
              <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <h4 className="text-sm font-semibold text-white mb-2">
                  About {method === 'correlation' ? 'Correlation' : method === 'cointegration' ? 'Cointegration' : method === 'pairs_trading' ? 'Pairs Trading' : 'Spread Analysis'}
                </h4>
                <p className="text-xs text-slate-400">
                  {method === 'correlation' && 'Measures how closely two stocks move together over time.'}
                  {method === 'cointegration' && 'Tests if two stocks maintain a stable long-term relationship.'}
                  {method === 'pairs_trading' && 'Identifies opportunities to profit from price divergences between correlated stocks.'}
                  {method === 'spread_analysis' && 'Analyzes the price difference between two stocks over time.'}
                </p>
              </div>
            </GlassCard>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {recommendations.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Link2 className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Ready to analyze
                  </h3>
                  <p className="text-slate-400">
                    Enter two stock tickers to discover trading opportunities based on their correlation patterns.
                  </p>
                </div>
              </GlassCard>
            ) : (
              <div className="space-y-6">
                {recommendations.map((rec, index) => (
                  <GlassCard key={index} className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-white">
                            {rec.ticker1} × {rec.ticker2}
                          </h3>
                          <Link2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{rec.method}</Badge>
                          <Badge
                            variant={
                              rec.recommendedAction === 'BUY'
                                ? 'success'
                                : rec.recommendedAction === 'SELL'
                                ? 'danger'
                                : 'secondary'
                            }
                          >
                            {rec.recommendedAction}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-slate-400 mb-1">Correlation</p>
                        <p className="text-3xl font-bold text-white">
                          {(rec.correlation * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-slate-800/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-blue-400" />
                          <p className="text-xs text-slate-400">Confidence</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold text-white">
                            {(rec.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${rec.confidence * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-slate-800/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {rec.potentialReturn >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <p className="text-xs text-slate-400">Potential Return</p>
                        </div>
                        <p className={`text-2xl font-bold ${rec.potentialReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPercent(rec.potentialReturn)}
                        </p>
                      </div>
                    </div>

                    {/* Analysis */}
                    <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                      <h4 className="text-sm font-semibold text-white mb-2">
                        Analysis
                      </h4>
                      <p className="text-sm text-slate-300">
                        {rec.reason}
                      </p>
                    </div>

                    {/* Trade Recommendation */}
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Target className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-1">
                            Trading Recommendation
                          </h4>
                          <p className="text-sm text-slate-300">
                            {rec.recommendedAction === 'BUY' && `Consider buying both ${rec.ticker1} and ${rec.ticker2} to capitalize on their correlated movement.`}
                            {rec.recommendedAction === 'SELL' && `Consider selling or shorting one or both stocks as the correlation suggests potential downward movement.`}
                            {rec.recommendedAction === 'HOLD' && `Current market conditions suggest holding existing positions without significant changes.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))}

                {/* Popular Pairs Suggestion */}
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Popular Stock Pairs to Analyze
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      ['AAPL', 'MSFT'],
                      ['GOOGL', 'META'],
                      ['JPM', 'BAC'],
                      ['TSLA', 'NVDA'],
                      ['XOM', 'CVX'],
                      ['KO', 'PEP'],
                      ['DIS', 'NFLX'],
                      ['AMZN', 'WMT']
                    ].map(([t1, t2], idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setTicker1(t1);
                          setTicker2(t2);
                        }}
                        className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm font-medium text-white hover:border-blue-500/50 hover:bg-slate-800 transition-all"
                      >
                        {t1} × {t2}
                      </button>
                    ))}
                  </div>
                </GlassCard>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

