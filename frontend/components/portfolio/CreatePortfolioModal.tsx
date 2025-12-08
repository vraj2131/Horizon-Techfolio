'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GlassCard } from '@/components/ui/GlassCard';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { usePortfolioStore } from '@/lib/store/portfolioStore';
import { getAvailableStocks } from '@/lib/api/stocks';
import { Search, X, Plus, TrendingUp, Briefcase, Shield, Zap, Target, PieChart, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';
import type { CuratedPortfolioOption, CreateCuratedPortfolioResponse } from '@/lib/types/portfolio';

interface CreatePortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

interface StockOption {
  ticker: string;
  name?: string;
  exchange?: string;
  sector?: string;
  inception_date?: string;
  [key: string]: any;
}

type PortfolioType = 'growth' | 'balanced' | 'defensive';
type Horizon = 1 | 2 | 5;

const horizonLabels: Record<number, string> = {
  1: '1 Year (Short-Term)',
  2: '2 Years (Medium-Term)',
  5: '5 Years (Long-Term)'
};

const portfolioTypeConfig: Record<PortfolioType, { icon: typeof Zap; color: string; bgColor: string }> = {
  growth: { icon: Zap, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/30' },
  balanced: { icon: Target, color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30' },
  defensive: { icon: Shield, color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/30' }
};

export default function CreatePortfolioModal({
  isOpen,
  onClose,
  onSuccess,
  userId
}: CreatePortfolioModalProps) {
  const { 
    createCustomPortfolio, 
    createCuratedPortfolio, 
    fetchCuratedOptions, 
    curatedOptions, 
    lastCuratedResult,
    clearLastCuratedResult,
    isLoading 
  } = usePortfolioStore();
  const { showToast } = useToast();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'custom' | 'curated'>('custom');
  
  // Custom portfolio state
  const [portfolioName, setPortfolioName] = useState('');
  const [initialCapital, setInitialCapital] = useState('10000');
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [availableStocks, setAvailableStocks] = useState<StockOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);
  const [customHorizon, setCustomHorizon] = useState<Horizon>(2);

  // Curated portfolio state
  const [selectedHorizon, setSelectedHorizon] = useState<Horizon>(2);
  const [selectedType, setSelectedType] = useState<PortfolioType | null>(null);
  const [curatedCapital, setCuratedCapital] = useState('10000');
  const [showAllocationResult, setShowAllocationResult] = useState(false);

  // Popular stock suggestions
  const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM'];

  useEffect(() => {
    if (isOpen) {
      loadAvailableStocks();
      fetchCuratedOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setActiveTab('custom');
      setPortfolioName('');
      setInitialCapital('10000');
      setSelectedStocks([]);
      setSearchTerm('');
      setCustomHorizon(2);
      setSelectedHorizon(2);
      setSelectedType(null);
      setCuratedCapital('10000');
      setShowAllocationResult(false);
      clearLastCuratedResult();
    }
  }, [isOpen]);

  const loadAvailableStocks = async () => {
    setIsLoadingStocks(true);
    try {
      const response = await getAvailableStocks();
      if (response.stocks && Array.isArray(response.stocks)) {
        const stocksList = response.stocks.map((stock: any) => {
          if (typeof stock === 'string') {
            return { ticker: stock };
          } else if (stock && typeof stock === 'object' && stock.ticker) {
            return {
              ticker: stock.ticker,
              name: stock.name,
              exchange: stock.exchange,
              sector: stock.sector
            };
          }
          return null;
        }).filter(Boolean) as StockOption[];
        
        setAvailableStocks(stocksList);
      } else {
        setAvailableStocks(popularStocks.map(ticker => ({ ticker })));
      }
    } catch (error) {
      console.error('Failed to load available stocks:', error);
      setAvailableStocks(popularStocks.map(ticker => ({ ticker })));
    } finally {
      setIsLoadingStocks(false);
    }
  };

  const handleAddStock = (ticker: string) => {
    if (!selectedStocks.includes(ticker) && selectedStocks.length < 10) {
      setSelectedStocks([...selectedStocks, ticker]);
      setSearchTerm('');
    }
  };

  const handleRemoveStock = (ticker: string) => {
    setSelectedStocks(selectedStocks.filter(s => s !== ticker));
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStocks.length === 0) {
      showToast('Please select at least one stock', 'error');
      return;
    }

    const capital = parseFloat(initialCapital);
    if (isNaN(capital) || capital < 100) {
      showToast('Initial capital must be at least $100', 'error');
      return;
    }

    try {
      await createCustomPortfolio({
        userId,
        portfolioName: portfolioName.trim() || 'Custom Portfolio',
        tickers: selectedStocks,
        horizon: customHorizon,
        initialCapital: capital
      });

      showToast('Custom portfolio created successfully!', 'success');
      onSuccess();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create portfolio';
      showToast(errorMsg, 'error');
    }
  };

  const handleCuratedSubmit = async () => {
    if (!selectedType) {
      showToast('Please select a portfolio type', 'error');
      return;
    }

    const capital = parseFloat(curatedCapital);
    if (isNaN(capital) || capital < 100) {
      showToast('Initial capital must be at least $100', 'error');
      return;
    }

    try {
      const result = await createCuratedPortfolio({
        userId,
        horizon: selectedHorizon,
        portfolioType: selectedType,
        initialCapital: capital
      });

      setShowAllocationResult(true);
      showToast('Curated portfolio created with equal-weight allocation!', 'success');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create curated portfolio';
      showToast(errorMsg, 'error');
    }
  };

  const handleClose = () => {
    if (showAllocationResult) {
      onSuccess();
    }
    onClose();
  };

  const filteredStocks = availableStocks.filter(stock =>
    stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedStocks.includes(stock.ticker)
  ).slice(0, 8);

  // Get curated options for selected horizon
  const getCuratedOptionsForHorizon = (): CuratedPortfolioOption[] => {
    if (!curatedOptions?.options) return [];
    const key = `${selectedHorizon}year` as keyof typeof curatedOptions.options;
    return curatedOptions.options[key] || [];
  };

  const curatedOptionsForHorizon = getCuratedOptionsForHorizon();

  // Allocation result view
  if (showAllocationResult && lastCuratedResult) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Portfolio Created Successfully!"
        size="lg"
      >
        <div className="space-y-6">
          {/* Summary Header */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl p-4 border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <PieChart className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{lastCuratedResult.curatedOption.name}</h3>
                <p className="text-sm text-slate-400">{lastCuratedResult.curatedOption.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-xs text-slate-400">Initial Capital</p>
                <p className="text-lg font-bold text-white">${lastCuratedResult.initialCapital.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Total Invested</p>
                <p className="text-lg font-bold text-emerald-400">${lastCuratedResult.totalInvested.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Residual Cash</p>
                <p className="text-lg font-bold text-blue-400">${lastCuratedResult.residualCash.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Allocation Details */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">Equal-Weight Allocations</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lastCuratedResult.allocations.map((alloc) => (
                <div key={alloc.ticker} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <Badge variant="primary">{alloc.ticker}</Badge>
                    <span className="text-sm text-slate-400">{alloc.shares} shares @ ${alloc.pricePerShare.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">${alloc.investedAmount.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{alloc.actualAllocation.toFixed(1)}% of invested</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ticker Errors (if any) */}
          {lastCuratedResult.tickerErrors && lastCuratedResult.tickerErrors.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Some stocks could not be allocated</span>
              </div>
              <div className="space-y-1">
                {lastCuratedResult.tickerErrors.map(err => (
                  <p key={err.ticker} className="text-xs text-slate-400">
                    <span className="font-medium">{err.ticker}:</span> {err.error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <div>
              <p className="text-xs text-slate-400">Stocks Allocated</p>
              <p className="text-lg font-semibold text-white">
                {lastCuratedResult.summary.stocksAllocated} / {lastCuratedResult.summary.totalStocksInPortfolio}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Investment Efficiency</p>
              <p className="text-lg font-semibold text-emerald-400">
                {lastCuratedResult.summary.investmentEfficiency.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-4 border-t border-slate-700/50">
            <Button
              onClick={handleClose}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              View My Portfolios
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Portfolio"
      size="lg"
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'custom'
              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 text-white'
              : 'bg-slate-800/30 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Create Your Own
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('curated')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'curated'
              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 text-white'
              : 'bg-slate-800/30 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Choose Curated
        </button>
      </div>

      {/* Custom Portfolio Tab */}
      {activeTab === 'custom' && (
        <form onSubmit={handleCustomSubmit} className="space-y-5">
          {/* Portfolio Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Portfolio Name
            </label>
            <Input
              type="text"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              placeholder="e.g., Tech Growth Portfolio"
              maxLength={50}
              disabled={isLoading}
            />
          </div>

          {/* Horizon Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Investment Horizon *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 5] as Horizon[]).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setCustomHorizon(h)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    customHorizon === h
                      ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                      : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                  disabled={isLoading}
                >
                  {h} Year{h > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Initial Capital */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Initial Capital *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <Input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                placeholder="10000"
                min="100"
                step="100"
                className="pl-8"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Minimum: $100</p>
          </div>

          {/* Stock Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Stocks * ({selectedStocks.length}/10)
            </label>
            
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search stocks..."
                className="pl-10"
                disabled={isLoading || selectedStocks.length >= 10}
              />
            </div>

            {selectedStocks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                {selectedStocks.map(ticker => (
                  <Badge key={ticker} variant="primary" className="flex items-center gap-2 pl-3 pr-2 py-1.5">
                    {ticker}
                    <button
                      type="button"
                      onClick={() => handleRemoveStock(ticker)}
                      className="hover:text-red-400 transition-colors"
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {isLoadingStocks ? (
              <div className="flex justify-center py-6">
                <Loading size="sm" text="Loading stocks..." />
              </div>
            ) : (
              <>
                {searchTerm && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-400 mb-2">Search Results</p>
                    <div className="grid grid-cols-4 gap-2">
                      {filteredStocks.length > 0 ? (
                        filteredStocks.map(stock => (
                          <button
                            key={stock.ticker}
                            type="button"
                            onClick={() => handleAddStock(stock.ticker)}
                            disabled={isLoading || selectedStocks.length >= 10}
                            className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm font-medium text-white hover:border-blue-500/50 hover:bg-slate-800 transition-all disabled:opacity-50"
                          >
                            {stock.ticker}
                          </button>
                        ))
                      ) : (
                        <p className="col-span-4 text-sm text-slate-400 text-center py-3">No stocks found</p>
                      )}
                    </div>
                  </div>
                )}

                {!searchTerm && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <p className="text-xs text-slate-400">Popular Stocks</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {popularStocks
                        .filter(ticker => !selectedStocks.includes(ticker))
                        .slice(0, 8)
                        .map(ticker => (
                          <button
                            key={ticker}
                            type="button"
                            onClick={() => handleAddStock(ticker)}
                            disabled={isLoading || selectedStocks.length >= 10}
                            className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm font-medium text-white hover:border-blue-500/50 hover:bg-slate-800 transition-all disabled:opacity-50"
                          >
                            {ticker}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || selectedStocks.length === 0}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Portfolio
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Curated Portfolio Tab */}
      {activeTab === 'curated' && (
        <div className="space-y-5">
          {/* Horizon Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Investment Horizon *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 5] as Horizon[]).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setSelectedHorizon(h);
                    setSelectedType(null);
                  }}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                    selectedHorizon === h
                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                      : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                  disabled={isLoading}
                >
                  <span className="block font-bold">{h} Year{h > 1 ? 's' : ''}</span>
                  <span className="text-xs opacity-75">
                    {h === 1 ? 'Short-Term' : h === 2 ? 'Medium-Term' : 'Long-Term'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Capital Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Investment Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <Input
                type="number"
                value={curatedCapital}
                onChange={(e) => setCuratedCapital(e.target.value)}
                placeholder="10000"
                min="100"
                step="100"
                className="pl-8"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Funds will be distributed equally across all stocks</p>
          </div>

          {/* Portfolio Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Choose Portfolio Type *
            </label>
            
            {isLoading && !curatedOptionsForHorizon.length ? (
              <div className="flex justify-center py-8">
                <Loading size="sm" text="Loading options..." />
              </div>
            ) : (
              <div className="space-y-3">
                {curatedOptionsForHorizon.map((option) => {
                  const config = portfolioTypeConfig[option.type as PortfolioType];
                  const Icon = config?.icon || Target;
                  const isSelected = selectedType === option.type;
                  
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedType(option.type as PortfolioType)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? `${config?.bgColor || 'bg-blue-500/10 border-blue-500/30'} ring-1 ring-blue-500/50`
                          : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
                      }`}
                      disabled={isLoading}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? config?.bgColor : 'bg-slate-700/50'}`}>
                          <Icon className={`w-5 h-5 ${isSelected ? config?.color : 'text-slate-400'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                              {option.name}
                            </h4>
                            <Badge 
                              variant={option.riskLevel === 'low' ? 'success' : option.riskLevel === 'high' ? 'warning' : 'primary'}
                              className="text-xs"
                            >
                              {option.riskLevel} risk
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400 mb-2">{option.description}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {option.tickers.map(ticker => (
                              <span 
                                key={ticker} 
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  isSelected 
                                    ? 'bg-white/10 text-white' 
                                    : 'bg-slate-700/50 text-slate-400'
                                }`}
                              >
                                {ticker}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Box */}
          {selectedType && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-sm text-blue-300">
                <strong>Equal-Weight Allocation:</strong> Your ${parseFloat(curatedCapital || '0').toLocaleString()} will be distributed evenly across {curatedOptionsForHorizon.find(o => o.type === selectedType)?.tickers.length || 5} stocks. Any remaining cash (due to share price constraints) will stay in your account.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCuratedSubmit}
              disabled={isLoading || !selectedType}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {isLoading ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  Allocating...
                </>
              ) : (
                <>
                  <PieChart className="w-4 h-4 mr-2" />
                  Create Curated Portfolio
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
