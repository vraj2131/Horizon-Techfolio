'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Target,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Brain
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';
import { getStockRecommendation, StockRecommendationResponse } from '@/lib/api/stocks';
import { useToast } from '@/lib/hooks/useToast';

export default function RecommendationsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [ticker, setTicker] = useState('');
  const [horizon, setHorizon] = useState<number>(2);
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium');
  const [recommendation, setRecommendation] = useState<StockRecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticker.trim()) {
      showToast('Please enter a stock ticker', 'error');
      return;
    }

    if (horizon < 1 || horizon > 10) {
      showToast('Horizon must be between 1 and 10 years', 'error');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const result = await getStockRecommendation({
        ticker: ticker.trim().toUpperCase(),
        horizon,
        riskTolerance
      });
      setRecommendation(result);
      showToast('Recommendation generated successfully!', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to get recommendation';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'buy':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'sell':
        return <XCircle className="w-6 h-6 text-red-400" />;
      default:
        return <AlertCircle className="w-6 h-6 text-blue-400" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'buy':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'sell':
        return 'from-red-500/20 to-rose-500/20 border-red-500/30';
      default:
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
    }
  };

  const getIndicatorBadge = (signal: string) => {
    switch (signal) {
      case 'buy':
        return <Badge variant="success" className="text-xs">Buy</Badge>;
      case 'sell':
        return <Badge variant="error" className="text-xs">Sell</Badge>;
      default:
        return <Badge variant="info" className="text-xs">Hold</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Stock Recommendations
                </h1>
                <p className="text-sm text-slate-400">AI-powered analysis based on technical indicators</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Form */}
        <GlassCard className="p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Get Stock Recommendation</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Stock Ticker
                </label>
                <Input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="e.g., AAPL"
                  className="w-full"
                  maxLength={10}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Investment Horizon (Years)
                </label>
                <Input
                  type="number"
                  value={horizon}
                  onChange={(e) => setHorizon(parseInt(e.target.value) || 2)}
                  min={1}
                  max={10}
                  className="w-full"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">1-10 years</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Risk Tolerance
                </label>
                <select
                  value={riskTolerance}
                  onChange={(e) => setRiskTolerance(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  Get Recommendation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </GlassCard>

        {/* Recommendation Result */}
        {recommendation && (
          <div className="space-y-6">
            {/* Main Recommendation */}
            <GlassCard className={`p-8 border-t-4 ${getRecommendationColor(recommendation.finalRecommendation)}`}>
              <div className="flex items-start gap-4 mb-6">
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  {getRecommendationIcon(recommendation.finalRecommendation)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-white">
                      {recommendation.ticker}
                    </h2>
                    <Badge variant={recommendation.finalRecommendation === 'buy' ? 'success' : recommendation.finalRecommendation === 'sell' ? 'error' : 'info'}>
                      {recommendation.finalRecommendation.toUpperCase()}
                    </Badge>
                    <Badge variant="info">
                      {(recommendation.confidence * 100).toFixed(0)}% Confidence
                    </Badge>
                  </div>
                  <p className="text-lg text-slate-300 mb-2">
                    Current Price: <span className="text-white font-semibold">{formatCurrency(recommendation.currentPrice)}</span>
                  </p>
                  <p className="text-sm text-slate-400">
                    Horizon: {recommendation.horizon} year{recommendation.horizon > 1 ? 's' : ''} • 
                    Risk Tolerance: {recommendation.riskTolerance.charAt(0).toUpperCase() + recommendation.riskTolerance.slice(1)}
                  </p>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-base text-slate-300 leading-relaxed whitespace-pre-line">
                  {recommendation.recommendationText}
                </p>
              </div>
            </GlassCard>

            {/* Strategy Information */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Recommended Strategy</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Strategy Name</p>
                  <p className="text-lg font-semibold text-white">{recommendation.strategyName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Description</p>
                  <p className="text-slate-300">{recommendation.strategyDescription}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Frequency</p>
                    <p className="text-sm font-medium text-white capitalize">{recommendation.strategyFrequency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Strategy Confidence</p>
                    <p className="text-sm font-medium text-white">{formatPercent((recommendation.strategyConfidence - 1) * 100)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Recommendation Confidence</p>
                    <p className="text-sm font-medium text-white">{formatPercent((recommendation.confidence - 1) * 100)}</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white mb-1">Why This Strategy?</p>
                      <p className="text-sm text-slate-300">{recommendation.strategyReasoning}</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(recommendation.indicators).map(([key, indicator]) => (
                  <div key={key} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{indicator.type}</span>
                      {getIndicatorBadge(indicator.signal)}
                    </div>
                    {indicator.error ? (
                      <p className="text-xs text-red-400">{indicator.error}</p>
                    ) : (
                      <div className="space-y-1">
                        {typeof indicator.value === 'number' && (
                          <p className="text-xs text-slate-400">
                            Value: <span className="text-white">{indicator.value.toFixed(2)}</span>
                          </p>
                        )}
                        {indicator.params && (
                          <p className="text-xs text-slate-500">
                            {Object.entries(indicator.params).map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-2">Reasoning:</p>
                <p className="text-sm text-slate-300">{recommendation.reason}</p>
              </div>
            </GlassCard>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="secondary"
                onClick={() => router.push(`/stock/${recommendation.ticker}`)}
                className="w-full"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Stock Details
              </Button>
              <Button
                onClick={() => router.push(`/trading?ticker=${recommendation.ticker}`)}
                className="w-full"
              >
                {recommendation.finalRecommendation === 'buy' ? (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Buy {recommendation.ticker}
                  </>
                ) : recommendation.finalRecommendation === 'sell' ? (
                  <>
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Sell {recommendation.ticker}
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 mr-2" />
                    View Holdings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

