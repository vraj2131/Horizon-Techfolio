'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Brain,
  BarChart3,
  TrendingUp,
  Activity,
  TrendingDown
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { IndicatorCard, type IndicatorData } from '@/components/indicators/IndicatorCard';
import { InteractiveCalculator } from '@/components/indicators/InteractiveCalculator';
import { motion, AnimatePresence } from 'framer-motion';

const indicators: IndicatorData[] = [
  {
    id: 'sma',
    name: 'Simple Moving Average',
    shortName: 'SMA',
    icon: <BarChart3 className="w-8 h-8 text-blue-400" />,
    description: 'The average closing price over a specific number of periods. It smooths out price fluctuations to show the overall trend direction.',
    howItWorks: 'SMA calculates the average of closing prices over a rolling window (e.g., 20 days). Each day, it takes the last N closing prices, sums them, and divides by N. This creates a smooth line that shows the general trend without day-to-day noise.',
    calculation: 'SMA = (Price₁ + Price₂ + Price₃ + ... + Priceₙ) / n\n\nWhere n is the window size (e.g., 20 days)',
    signals: {
      buy: 'When price crosses ABOVE the SMA, it suggests upward momentum and a potential BUY signal.',
      sell: 'When price crosses BELOW the SMA, it indicates downward momentum and a potential SELL signal.',
      hold: 'When price is trading near the SMA, it acts as a support/resistance level. No clear signal - HOLD.'
    },
    example: {
      prices: [150, 152, 151, 153, 154, 155, 153, 156, 158, 157, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 170, 171, 169, 172, 173],
      window: 20,
      values: [158.5, 159.2, 159.8, 160.4, 161.1, 161.7],
      currentPrice: 173,
      currentValue: 161.7,
      signal: 'buy'
    },
    tips: [
      'Larger windows (50, 200 days) show longer-term trends',
      'Smaller windows (10, 20 days) are more responsive to recent changes',
      'Price above SMA = bullish trend, below = bearish trend',
      'SMA acts as support (when price is above) or resistance (when price is below)'
    ]
  },
  {
    id: 'ema',
    name: 'Exponential Moving Average',
    shortName: 'EMA',
    icon: <TrendingUp className="w-8 h-8 text-purple-400" />,
    description: 'Similar to SMA but gives more weight to recent prices. It reacts faster to price changes, making it better for catching short-term trends.',
    howItWorks: 'EMA uses exponential smoothing, giving more importance to recent prices than older ones. It starts with the first price, then each new EMA value is calculated by giving weight to the new price (typically 15-20%) and the previous EMA (85-80%). This makes EMA more responsive to current market conditions.',
    calculation: 'EMA = (Current Price × α) + (Previous EMA × (1 - α))\n\nWhere α (alpha) = 2 / (window + 1)\nFor 12-day EMA: α = 2 / (12 + 1) = 0.1538 (15.38%)',
    signals: {
      buy: 'When price crosses ABOVE the EMA, it suggests strong recent momentum and a BUY signal.',
      sell: 'When price crosses BELOW the EMA, it indicates weakening momentum and a SELL signal.',
      hold: 'When price is trading near the EMA, recent momentum is balanced. HOLD position.'
    },
    example: {
      prices: [150, 152, 151, 153, 154, 155, 153, 156, 158, 157, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 170, 171, 169, 172, 173],
      window: 12,
      values: [150, 150.3, 150.5, 150.9, 151.2, 151.6, 151.8, 152.3, 152.9, 153.2, 153.8, 154.5, 155.2, 156.1, 157.0, 158.0, 159.0, 160.1, 161.2, 162.4, 163.6, 164.8, 165.6, 166.9, 168.2],
      currentPrice: 173,
      currentValue: 168.2,
      signal: 'buy'
    },
    tips: [
      'EMA reacts faster than SMA to price changes',
      'Best for short to medium-term trading strategies',
      'When EMA is above SMA, recent momentum is stronger',
      'Use EMA for momentum-based strategies, SMA for trend confirmation'
    ]
  },
  {
    id: 'rsi',
    name: 'Relative Strength Index',
    shortName: 'RSI',
    icon: <Activity className="w-8 h-8 text-green-400" />,
    description: 'Measures the speed and magnitude of price changes on a 0-100 scale. It helps identify overbought (too high) and oversold (too low) conditions.',
    howItWorks: 'RSI compares average gains to average losses over a period (typically 14 days). It calculates: RSI = 100 - (100 / (1 + RS)), where RS = Average Gain / Average Loss. Values above 70 suggest overbought conditions (potential sell), while values below 30 suggest oversold conditions (potential buy).',
    calculation: 'RSI = 100 - (100 / (1 + RS))\n\nRS = Average Gain / Average Loss\n\nAverage Gain = Sum of gains over N periods / N\nAverage Loss = Sum of losses over N periods / N',
    signals: {
      buy: 'When RSI is BELOW 30 (oversold), the stock may be undervalued and ready to bounce back - BUY signal.',
      sell: 'When RSI is ABOVE 70 (overbought), the stock may be overvalued and ready to pull back - SELL signal.',
      hold: 'When RSI is between 30-70, momentum is neutral. HOLD and wait for clearer signals.'
    },
    example: {
      prices: [150, 152, 151, 153, 154, 155, 153, 156, 158, 157, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 170, 171, 169, 172, 173],
      window: 14,
      values: [45, 48, 52, 55, 58, 62, 65, 68, 72, 75, 78, 68, 65, 70, 72],
      currentPrice: 173,
      currentValue: 72,
      signal: 'hold'
    },
    tips: [
      'RSI above 70 = overbought (potential sell, but can stay high in strong trends)',
      'RSI below 30 = oversold (potential buy, but can stay low in strong downtrends)',
      'RSI divergence (price making new highs, RSI not) can signal trend weakness',
      'Use RSI with other indicators for stronger signals'
    ]
  },
  {
    id: 'macd',
    name: 'Moving Average Convergence Divergence',
    shortName: 'MACD',
    icon: <TrendingDown className="w-8 h-8 text-orange-400" />,
    description: 'Shows the relationship between two EMAs (fast and slow). It helps identify momentum changes and trend reversals through crossovers.',
    howItWorks: 'MACD calculates the difference between a fast EMA (12-day) and slow EMA (26-day). The MACD line is plotted along with a signal line (9-day EMA of MACD). When MACD crosses above the signal line, it generates a buy signal. When it crosses below, it generates a sell signal. The histogram shows the difference between MACD and signal lines.',
    calculation: 'MACD Line = Fast EMA (12-day) - Slow EMA (26-day)\nSignal Line = EMA of MACD Line (9-day)\nHistogram = MACD Line - Signal Line',
    signals: {
      buy: 'When MACD line crosses ABOVE the signal line, it indicates increasing upward momentum - BUY signal.',
      sell: 'When MACD line crosses BELOW the signal line, it suggests weakening momentum - SELL signal.',
      hold: 'When MACD and signal lines are parallel or converging, momentum is stable. HOLD position.'
    },
    example: {
      prices: [150, 152, 151, 153, 154, 155, 153, 156, 158, 157, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 170, 171, 169, 172, 173],
      window: 26,
      values: [1.2, 1.5, 1.8, 2.1, 2.4, 2.7],
      currentPrice: 173,
      currentValue: 2.7,
      signal: 'buy'
    },
    tips: [
      'MACD above zero = bullish momentum, below zero = bearish momentum',
      'Histogram bars getting larger = momentum increasing',
      'Histogram bars getting smaller = momentum decreasing',
      'MACD crossover signals are strongest when confirmed by other indicators'
    ]
  },
  {
    id: 'bollinger',
    name: 'Bollinger Bands',
    shortName: 'Bollinger Bands',
    icon: <BarChart3 className="w-8 h-8 text-cyan-400" />,
    description: 'Creates upper and lower bands around a moving average (typically SMA) based on volatility. Price touching the bands can signal overbought/oversold conditions.',
    howItWorks: 'Bollinger Bands consist of three lines: a middle band (SMA, typically 20-day), an upper band (SMA + 2 standard deviations), and a lower band (SMA - 2 standard deviations). When price touches the upper band, it may be overbought. When it touches the lower band, it may be oversold. The bands expand during high volatility and contract during low volatility.',
    calculation: 'Middle Band = SMA (typically 20-day)\nUpper Band = Middle Band + (2 × Standard Deviation)\nLower Band = Middle Band - (2 × Standard Deviation)',
    signals: {
      buy: 'When price touches or crosses the LOWER band, it suggests oversold conditions and potential bounce - BUY signal.',
      sell: 'When price touches or crosses the UPPER band, it indicates overbought conditions and potential pullback - SELL signal.',
      hold: 'When price is trading between the bands, it\'s in a normal range. HOLD and wait for band touches.'
    },
    example: {
      prices: [150, 152, 151, 153, 154, 155, 153, 156, 158, 157, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 170, 171, 169, 172, 173],
      window: 20,
      values: [158.5, 159.2, 159.8, 160.4, 161.1, 161.7],
      currentPrice: 173,
      currentValue: 161.7,
      signal: 'hold'
    },
    tips: [
      'Bands expanding = increasing volatility, bands contracting = decreasing volatility',
      'Price squeezing through bands (bands getting narrow) often precedes big moves',
      'Price can stay at upper/lower bands for extended periods in strong trends',
      'Use with other indicators - bands alone don\'t guarantee reversals'
    ]
  }
];

export default function LearnIndicatorsPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCalculator, setShowCalculator] = useState<string | null>(null);

  const currentIndicator = indicators[currentIndex];

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % indicators.length);
    setShowCalculator(null);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + indicators.length) % indicators.length);
    setShowCalculator(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Learn Technical Indicators
                </h1>
                <p className="text-sm text-slate-400 mt-1">Understand how we generate trading signals</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">
                {currentIndex + 1} / {indicators.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <GlassCard className="mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
              <Brain className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                Master Technical Analysis
              </h2>
              <p className="text-slate-300">
                Unlike other platforms that give you signals without explanation, Horizon teaches you exactly how each indicator works. 
                Learn to understand what the numbers mean and why we're recommending buy, sell, or hold.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Navigation and Indicator Card */}
        <div className="relative">
          {/* Left Arrow */}
          <Button
            variant="ghost"
            size="lg"
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 hidden lg:flex"
            disabled={indicators.length === 1}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          {/* Indicator Card */}
          <AnimatePresence mode="wait">
            <IndicatorCard
              key={currentIndicator.id}
              indicator={currentIndicator}
              onShowCalculator={setShowCalculator}
              showCalculator={showCalculator === currentIndicator.id}
            />
          </AnimatePresence>

          {/* Right Arrow */}
          <Button
            variant="ghost"
            size="lg"
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 hidden lg:flex"
            disabled={indicators.length === 1}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Interactive Calculator */}
        {showCalculator === currentIndicator.id && (
          <InteractiveCalculator indicator={currentIndicator} />
        )}

        {/* Mobile Navigation */}
        <div className="flex items-center justify-between mt-8 lg:hidden">
          <Button
            variant="ghost"
            onClick={goToPrevious}
            disabled={indicators.length === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </Button>
          <span className="text-sm text-slate-400">
            {currentIndex + 1} / {indicators.length}
          </span>
          <Button
            variant="ghost"
            onClick={goToNext}
            disabled={indicators.length === 1}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Indicator Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {indicators.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setShowCalculator(null);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-blue-500'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Footer CTA */}
        <GlassCard className="mt-8 bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Ready to Apply What You Learned?</h3>
            <p className="text-slate-300 mb-4">
              Now that you understand how indicators work, explore real stocks and see these indicators in action.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push('/watchlist')}>
                View Watchlist
              </Button>
              <Button variant="secondary" onClick={() => router.push('/recommendations')}>
                Get Recommendations
              </Button>
            </div>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
