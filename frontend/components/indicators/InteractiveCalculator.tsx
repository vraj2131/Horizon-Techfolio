'use client';

import { useState } from 'react';
import { Calculator, Play, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import type { IndicatorData } from './IndicatorCard';

interface InteractiveCalculatorProps {
  indicator: IndicatorData;
}

export function InteractiveCalculator({ indicator }: InteractiveCalculatorProps) {
  const [step, setStep] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const calculateSMA = (values: number[], window: number) => {
    const sma = [];
    for (let i = window - 1; i < values.length; i++) {
      const sum = values.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / window);
    }
    return sma;
  };

  const calculateEMA = (values: number[], window: number) => {
    const alpha = 2 / (window + 1);
    const ema = [values[0]];
    for (let i = 1; i < values.length; i++) {
      ema.push((values[i] * alpha) + (ema[i - 1] * (1 - alpha)));
    }
    return ema;
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy': return 'text-green-400';
      case 'sell': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'buy': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'sell': return <TrendingDown className="w-5 h-5 text-red-400" />;
      default: return <Activity className="w-5 h-5 text-blue-400" />;
    }
  };

  const getSignalBadge = (signal: string) => {
    switch (signal) {
      case 'buy': return <Badge variant="success">BUY</Badge>;
      case 'sell': return <Badge variant="error">SELL</Badge>;
      default: return <Badge variant="info">HOLD</Badge>;
    }
  };

  let calculatedValues: number[] = [];
  if (indicator.id === 'sma') {
    calculatedValues = calculateSMA(indicator.example.prices, indicator.example.window);
  } else if (indicator.id === 'ema') {
    calculatedValues = calculateEMA(indicator.example.prices, indicator.example.window);
  } else {
    calculatedValues = indicator.example.values;
  }

  const latestValue = calculatedValues[calculatedValues.length - 1];
  const priceDifference = indicator.example.currentPrice - latestValue;
  const percentDifference = ((priceDifference / latestValue) * 100).toFixed(1);

  return (
    <GlassCard className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-400" />
          Interactive Calculator
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setStep(0);
            setShowResult(false);
          }}
        >
          Reset
        </Button>
      </div>

      <div className="space-y-4">
        {/* Step 1: Show prices */}
        <div className={step >= 0 ? 'opacity-100' : 'opacity-50'}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-sm text-blue-400 font-bold">
              1
            </span>
            <span className="text-white font-semibold">Historical Prices</span>
          </div>
          <div className="ml-8 p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400 mb-2">Last {indicator.example.prices.length} closing prices:</p>
            <div className="flex flex-wrap gap-2">
              {indicator.example.prices.slice(-10).map((price, i) => (
                <span key={i} className="px-2 py-1 bg-blue-500/20 rounded text-sm text-blue-300">
                  ${price}
                </span>
              ))}
              <span className="text-slate-500">...</span>
            </div>
          </div>
        </div>

        {/* Step 2: Show calculation */}
        <div className={step >= 1 ? 'opacity-100' : 'opacity-50'}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-sm text-blue-400 font-bold">
              2
            </span>
            <span className="text-white font-semibold">Calculation Process</span>
          </div>
          <div className="ml-8 p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400 mb-2 font-mono whitespace-pre-wrap">
              {indicator.calculation}
            </p>
            {indicator.id === 'sma' && (
              <div className="mt-3 p-3 bg-slate-700/50 rounded">
                <p className="text-sm text-slate-300 mb-2">Example: Last {indicator.example.window} prices</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {indicator.example.prices.slice(-indicator.example.window).map((p, i) => (
                    <span key={i} className="text-xs text-blue-300">${p}</span>
                  ))}
                </div>
                <p className="text-sm text-white">
                  Sum: ${indicator.example.prices.slice(-indicator.example.window).reduce((a, b) => a + b, 0).toFixed(2)}
                </p>
                <p className="text-sm text-white">
                  {indicator.shortName} = ${indicator.example.prices.slice(-indicator.example.window).reduce((a, b) => a + b, 0).toFixed(2)} / {indicator.example.window} = <span className="text-green-400 font-bold">${latestValue.toFixed(2)}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Show result */}
        <div className={step >= 2 ? 'opacity-100' : 'opacity-50'}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-sm text-blue-400 font-bold">
              3
            </span>
            <span className="text-white font-semibold">Current Indicator Value</span>
          </div>
          <div className="ml-8 p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Latest {indicator.shortName}</p>
                <p className="text-2xl font-bold text-white">${latestValue.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Current Price</p>
                <p className="text-2xl font-bold text-white">${indicator.example.currentPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Show signal */}
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="opacity-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-sm text-green-400 font-bold">
                4
              </span>
              <span className="text-white font-semibold">Signal Generated</span>
            </div>
            <div className="ml-8 p-4 bg-slate-800/50 rounded-lg border-2 border-green-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getSignalIcon(indicator.example.signal)}
                  <div>
                    <p className="text-sm text-slate-400">Signal</p>
                    <p className={`text-xl font-bold ${getSignalColor(indicator.example.signal)}`}>
                      {indicator.example.signal.toUpperCase()}
                    </p>
                  </div>
                </div>
                {getSignalBadge(indicator.example.signal)}
              </div>
              <p className="text-sm text-slate-300">
                Price is <span className="font-semibold text-white">{percentDifference}%</span> {priceDifference > 0 ? 'above' : 'below'} the {indicator.shortName}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                {indicator.signals[indicator.example.signal]}
              </p>
            </div>
          </motion.div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Previous
          </Button>
          {step < 2 ? (
            <Button
              onClick={() => {
                setStep(step + 1);
                if (step === 1) setShowResult(true);
              }}
              className="flex-1"
            >
              {step === 0 ? 'Show Calculation' : 'Calculate Signal'}
            </Button>
          ) : (
            <Button
              onClick={() => {
                setStep(0);
                setShowResult(false);
              }}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

