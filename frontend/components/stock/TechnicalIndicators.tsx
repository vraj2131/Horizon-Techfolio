'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';
import type { TechnicalIndicator } from '@/lib/api/stocks';

interface TechnicalIndicatorsProps {
  indicators: {
    SMA?: TechnicalIndicator;
    EMA?: TechnicalIndicator;
    RSI?: TechnicalIndicator;
    MACD?: TechnicalIndicator;
    BOLLINGER?: TechnicalIndicator;
  };
  currentPrice: number;
}

const indicatorIcons = {
  SMA: BarChart3,
  EMA: TrendingUp,
  RSI: Activity,
  MACD: TrendingDown,
  BOLLINGER: BarChart3
};

const indicatorNames = {
  SMA: 'Simple Moving Average',
  EMA: 'Exponential Moving Average',
  RSI: 'Relative Strength Index',
  MACD: 'Moving Average Convergence Divergence',
  BOLLINGER: 'Bollinger Bands'
};

export function TechnicalIndicators({ indicators, currentPrice }: TechnicalIndicatorsProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (type: string) => {
    setExpanded(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const getSignalBadge = (signal: string, strength: number) => {
    const strengthLabel = strength > 0.7 ? 'Strong' : strength > 0.4 ? 'Moderate' : 'Weak';
    
    switch (signal) {
      case 'buy':
        return <Badge variant="success" className="animate-pulse">{strengthLabel} Buy</Badge>;
      case 'sell':
        return <Badge variant="error" className="animate-pulse">{strengthLabel} Sell</Badge>;
      default:
        return <Badge variant="info">Hold</Badge>;
    }
  };

  const formatIndicatorValue = (indicator: TechnicalIndicator): string => {
    if (indicator.error) return 'N/A';
    
    if (indicator.type === 'MACD') {
      const value = indicator.value as any;
      if (value && typeof value === 'object') {
        const macd = typeof value.macd === 'number' ? value.macd.toFixed(2) : 'N/A';
        const signal = typeof value.signal === 'number' ? value.signal.toFixed(2) : 'N/A';
        return `MACD: ${macd}, Signal: ${signal}`;
      }
    }
    
    if (indicator.type === 'BOLLINGER') {
      const value = indicator.value as any;
      if (value && typeof value === 'object') {
        const upper = typeof value.upper === 'number' ? formatCurrency(value.upper) : 'N/A';
        const lower = typeof value.lower === 'number' ? formatCurrency(value.lower) : 'N/A';
        return `Upper: ${upper}, Lower: ${lower}`;
      }
    }
    
    if (typeof indicator.value === 'number') {
      if (indicator.type === 'RSI') {
        return `${indicator.value.toFixed(2)}`;
      }
      return formatCurrency(indicator.value);
    }
    
    return 'N/A';
  };

  const renderIndicatorCard = (type: keyof typeof indicators, indicator?: TechnicalIndicator) => {
    // Ensure type is uppercase to match indicatorIcons keys
    const typeUpper = type.toUpperCase() as keyof typeof indicatorIcons;
    const Icon = indicatorIcons[typeUpper];
    const indicatorName = indicatorNames[typeUpper] || type;

    if (!indicator || indicator.error) {
      return (
        <GlassCard key={type} className="p-6 border border-red-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg">
                  <Icon className="w-5 h-5 text-red-400" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-white">{indicatorName}</h3>
                <p className="text-sm text-slate-400">{type}</p>
              </div>
            </div>
            <Badge variant="error">Error</Badge>
          </div>
          <p className="text-sm text-red-400">{indicator?.error || 'Failed to calculate'}</p>
        </GlassCard>
      );
    }
    const isExpanded = expanded[type];

    return (
      <GlassCard key={type} className="p-6 border-t-4 border-transparent hover:border-blue-500/50 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            {Icon && (
              <div className={`p-2 rounded-lg bg-gradient-to-br ${
                indicator.signal === 'buy' ? 'from-green-500/20 to-green-600/20' :
                indicator.signal === 'sell' ? 'from-red-500/20 to-red-600/20' :
                'from-blue-500/20 to-blue-600/20'
              }`}>
                <Icon className={`w-5 h-5 ${
                  indicator.signal === 'buy' ? 'text-green-400' :
                  indicator.signal === 'sell' ? 'text-red-400' :
                  'text-blue-400'
                }`} />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-white">{indicatorName}</h3>
                {getSignalBadge(indicator.signal, indicator.strength)}
              </div>
              <p className="text-sm text-slate-400 mb-2">
                Value: <span className="text-white font-medium">{formatIndicatorValue(indicator)}</span>
              </p>
              {indicator.params && (
                <p className="text-xs text-slate-500">
                  {type === 'SMA' || type === 'EMA' ? `${indicator.params.window}-day` : ''}
                  {type === 'RSI' ? `${indicator.params.window}-period (${indicator.params.oversold}-${indicator.params.overbought})` : ''}
                  {type === 'MACD' ? `${indicator.params.fastPeriod}/${indicator.params.slowPeriod}/${indicator.params.signalPeriod}` : ''}
                  {type === 'BOLLINGER' ? `${indicator.params.window}-day, ${indicator.params.multiplier}σ` : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => toggleExpand(type)}
            className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-semibold text-white">Current Signal</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {indicator.explanation.signalExplanation}
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-semibold text-white">How It Works</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {indicator.explanation.description}
              </p>
            </div>

            {indicator.type === 'RSI' && typeof indicator.value === 'number' && (
              <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">RSI Scale</span>
                  <span className="text-xs text-slate-400">
                    {indicator.value < indicator.params.oversold ? 'Oversold' : 
                     indicator.value > indicator.params.overbought ? 'Overbought' : 
                     'Neutral'}
                  </span>
                </div>
                <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                    style={{ width: '100%' }}
                  />
                  <div 
                    className="absolute top-0 left-0 h-full w-1 bg-white"
                    style={{ left: `${indicator.value}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-400">
                  <span>0</span>
                  <span className={indicator.value < indicator.params.oversold ? 'text-red-400 font-semibold' : ''}>
                    {indicator.params.oversold} (Oversold)
                  </span>
                  <span className={indicator.value > indicator.params.overbought ? 'text-red-400 font-semibold' : ''}>
                    {indicator.params.overbought} (Overbought)
                  </span>
                  <span>100</span>
                </div>
              </div>
            )}

            {indicator.type === 'BOLLINGER' && typeof indicator.value === 'object' && indicator.value && 'upper' in indicator.value && (
              <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Upper Band:</span>
                    <span className="text-white font-medium">
                      {typeof (indicator.value as any)?.upper === 'number' 
                        ? formatCurrency((indicator.value as any).upper) 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Middle Band (SMA):</span>
                    <span className="text-white font-medium">
                      {typeof (indicator.value as any)?.middle === 'number' 
                        ? formatCurrency((indicator.value as any).middle) 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lower Band:</span>
                    <span className="text-white font-medium">
                      {typeof (indicator.value as any)?.lower === 'number' 
                        ? formatCurrency((indicator.value as any).lower) 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-700">
                    <span className="text-slate-400">Current Price:</span>
                    <span className={`font-medium ${
                      typeof (indicator.value as any)?.upper === 'number' && currentPrice > (indicator.value as any).upper 
                        ? 'text-red-400' 
                        : typeof (indicator.value as any)?.lower === 'number' && currentPrice < (indicator.value as any).lower 
                        ? 'text-green-400' 
                        : 'text-blue-400'
                    }`}>
                      {formatCurrency(currentPrice)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {indicator.type === 'MACD' && typeof indicator.value === 'object' && indicator.value && 'macd' in indicator.value && (
              <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">MACD Line:</span>
                    <span className="text-white font-medium">
                      {typeof (indicator.value as any)?.macd === 'number' 
                        ? (indicator.value as any).macd.toFixed(2) 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Signal Line:</span>
                    <span className="text-white font-medium">
                      {typeof (indicator.value as any)?.signal === 'number' 
                        ? (indicator.value as any).signal.toFixed(2) 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Histogram:</span>
                    <span className={`font-medium ${
                      typeof (indicator.value as any)?.histogram === 'number' && (indicator.value as any).histogram > 0 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {typeof (indicator.value as any)?.histogram === 'number' 
                        ? (indicator.value as any).histogram.toFixed(2) 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-700 text-xs text-slate-400">
                    {typeof (indicator.value as any)?.macd === 'number' && typeof (indicator.value as any)?.signal === 'number'
                      ? ((indicator.value as any).macd > (indicator.value as any).signal
                          ? 'MACD above signal line = Bullish momentum' 
                          : 'MACD below signal line = Bearish momentum')
                      : 'MACD data unavailable'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Technical Indicators</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {renderIndicatorCard('SMA', indicators.SMA)}
        {renderIndicatorCard('EMA', indicators.EMA)}
        {renderIndicatorCard('RSI', indicators.RSI)}
        {renderIndicatorCard('MACD', indicators.MACD)}
        {renderIndicatorCard('BOLLINGER', indicators.BOLLINGER)}
      </div>
    </div>
  );
}

