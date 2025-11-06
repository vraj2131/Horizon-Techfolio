'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3,
  Lightbulb,
  Calculator,
  Target,
  Brain,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Play
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { motion, AnimatePresence } from 'framer-motion';

export interface IndicatorData {
  id: string;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  description: string;
  howItWorks: string;
  calculation: string;
  signals: {
    buy: string;
    sell: string;
    hold: string;
  };
  example: {
    prices: number[];
    window: number;
    values: number[];
    currentPrice: number;
    currentValue: number;
    signal: 'buy' | 'sell' | 'hold';
  };
  tips: string[];
}

interface IndicatorCardProps {
  indicator: IndicatorData;
  onShowCalculator: (id: string) => void;
  showCalculator: boolean;
}

export function IndicatorCard({ indicator, onShowCalculator, showCalculator }: IndicatorCardProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <GlassCard>
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
            {indicator.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-white">{indicator.name}</h2>
              {getSignalBadge(indicator.example.signal)}
            </div>
            <p className="text-slate-300 text-lg">{indicator.description}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            {
              id: 'how-it-works',
              label: 'How It Works',
              icon: <Lightbulb className="w-4 h-4" />,
              content: (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      Concept
                    </h3>
                    <p className="text-slate-300 leading-relaxed">
                      {indicator.howItWorks}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-blue-400" />
                      Formula
                    </h3>
                    <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap bg-slate-900/50 p-3 rounded">
                      {indicator.calculation}
                    </pre>
                  </div>
                </div>
              )
            },
            {
              id: 'signals',
              label: 'Trading Signals',
              icon: <Target className="w-4 h-4" />,
              content: (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <h3 className="font-semibold text-white">BUY Signal</h3>
                    </div>
                    <p className="text-slate-300">{indicator.signals.buy}</p>
                  </div>
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <h3 className="font-semibold text-white">SELL Signal</h3>
                    </div>
                    <p className="text-slate-300">{indicator.signals.sell}</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-blue-400" />
                      <h3 className="font-semibold text-white">HOLD Signal</h3>
                    </div>
                    <p className="text-slate-300">{indicator.signals.hold}</p>
                  </div>
                </div>
              )
            },
            {
              id: 'tips',
              label: 'Pro Tips',
              icon: <Brain className="w-4 h-4" />,
              content: (
                <div className="space-y-3">
                  {indicator.tips.map((tip, i) => (
                    <div key={i} className="p-4 bg-slate-800/50 rounded-lg flex items-start gap-3">
                      <div className="p-1 bg-blue-500/20 rounded mt-0.5">
                        <ChevronRight className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-slate-300 flex-1">{tip}</p>
                    </div>
                  ))}
                </div>
              )
            }
          ]}
          defaultTab="how-it-works"
        />

        {/* Interactive Calculator Toggle */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <Button
            variant="ghost"
            onClick={() => onShowCalculator(showCalculator ? '' : indicator.id)}
            className="w-full"
          >
            {showCalculator ? (
              <>
                Hide Interactive Calculator
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Show Interactive Calculator
              </>
            )}
            <ChevronRight className={`w-4 h-4 ml-2 transition-transform ${showCalculator ? 'rotate-90' : ''}`} />
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

