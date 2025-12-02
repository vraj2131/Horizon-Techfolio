'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/lib/store/authStore';
import { useWalletStore } from '@/lib/store/walletStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
// Removed Tabs import - using custom tab switcher
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Search,
  Eye,
  BookOpen
} from 'lucide-react';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils/formatters';
import { useToast } from '@/lib/hooks/useToast';

export default function TradingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, verifyToken } = useAuthStore();
  const { 
    wallet, 
    holdings, 
    fetchWallet, 
    fetchHoldings, 
    buyStock, 
    sellStock,
    isLoading 
  } = useWalletStore();
  const { showToast } = useToast();

  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState('buy');
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedHolding, setSelectedHolding] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Read URL parameters and pre-fill form
  useEffect(() => {
    const urlTicker = searchParams.get('ticker');
    const urlAction = searchParams.get('action');
    
    if (urlTicker) {
      const tickerUpper = urlTicker.toUpperCase();
      setTicker(tickerUpper);
      
      // If action is 'sell', also select the holding if it exists
      if (urlAction === 'sell' && holdings.length > 0) {
        const holding = holdings.find((h: any) => h.ticker === tickerUpper);
        if (holding) {
          setSelectedHolding(holding);
        }
      }
    }
    
    if (urlAction === 'buy' || urlAction === 'sell') {
      setActiveTab(urlAction);
    }
  }, [searchParams, holdings]);

  useEffect(() => {
    const initializeTradingPage = async () => {
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

        if (user?.userId) {
          await Promise.all([
            fetchWallet(user.userId),
            fetchHoldings(user.userId)
          ]);
        }
      } catch (error) {
        console.error('Trading page initialization failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeTradingPage();
  }, [user?.userId, isAuthenticated]);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticker.trim()) {
      showToast('Please enter a stock ticker', 'error');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid quantity', 'error');
      return;
    }

    if (!user?.userId) {
      showToast('User not authenticated', 'error');
      return;
    }

    // Verify token before trading
    const token = Cookies.get('auth_token');
    if (!token) {
      showToast('Session expired. Please log in again.', 'error');
      router.push('/login');
      return;
    }

    // Re-verify token if not authenticated
    if (!isAuthenticated) {
      const valid = await verifyToken();
      if (!valid) {
        showToast('Session expired. Please log in again.', 'error');
        router.push('/login');
        return;
      }
    }

    try {
      await buyStock({
        userId: user.userId,
        ticker: ticker.toUpperCase(),
        quantity: qty
      });
      showToast(`Successfully bought ${qty} shares of ${ticker.toUpperCase()}`, 'success');
      
      // Reset form
      setTicker('');
      setQuantity('');
      
      // Refresh data
      await Promise.all([
        fetchWallet(user.userId),
        fetchHoldings(user.userId)
      ]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to buy stock';
      showToast(errorMsg, 'error');
    }
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();

    const holding = selectedHolding || holdings.find((h: any) => h.ticker === ticker.toUpperCase());
    
    if (!holding) {
      showToast('Please select a stock from your holdings', 'error');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid quantity', 'error');
      return;
    }

    if (qty > holding.quantity) {
      showToast(`You only have ${holding.quantity} shares of ${holding.ticker}`, 'error');
      return;
    }

    if (!user?.userId) {
      showToast('User not authenticated', 'error');
      return;
    }

    // Verify token before trading
    const token = Cookies.get('auth_token');
    if (!token) {
      showToast('Session expired. Please log in again.', 'error');
      router.push('/login');
      return;
    }

    // Re-verify token if not authenticated
    if (!isAuthenticated) {
      const valid = await verifyToken();
      if (!valid) {
        showToast('Session expired. Please log in again.', 'error');
        router.push('/login');
        return;
      }
    }

    try {
      await sellStock({
        userId: user.userId,
        ticker: holding.ticker,
        quantity: qty
      });
      showToast(`Successfully sold ${qty} shares of ${holding.ticker}`, 'success');
      
      // Reset form
      setTicker('');
      setQuantity('');
      setSelectedHolding(null);
      
      // Refresh data
      await Promise.all([
        fetchWallet(user.userId),
        fetchHoldings(user.userId)
      ]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to sell stock';
      showToast(errorMsg, 'error');
    }
  };

  const handleSelectHolding = (holding: any) => {
    setSelectedHolding(holding);
    setTicker(holding.ticker);
    setActiveTab('sell');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loading size="lg" text="Loading trading page..." />
      </div>
    );
  }

  const filteredHoldings = (Array.isArray(holdings) ? holdings : []).filter((h: any) =>
    h.ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalHoldingsValue = (Array.isArray(holdings) ? holdings : []).reduce((sum: number, h: any) => 
    sum + (h.totalValue || h.marketValue || 0), 0
  );
  const totalPnL = (Array.isArray(holdings) ? holdings : []).reduce((sum: number, h: any) => 
    sum + (h.profitLoss || 0), 0
  );

  // Tab configuration
  const tabs = [
    { id: 'buy', label: 'Buy', Icon: ShoppingCart },
    { id: 'sell', label: 'Sell', Icon: Package }
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Trade Stocks
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Buy and sell stocks with real-time pricing
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push('/learn')}
                className="hidden sm:flex"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Learn
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/watchlist')}
                className="hidden sm:flex"
              >
                <Eye className="w-4 h-4 mr-2" />
                Watchlist
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => router.push('/transactions')}
              >
                View Transactions
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Wallet className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-sm text-slate-400">Available Balance</p>
            </div>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(wallet?.balance || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Total Deposited: {formatCurrency(wallet?.totalDeposited || 0)}
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-sm text-slate-400">Holdings Value</p>
            </div>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(totalHoldingsValue)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {(Array.isArray(holdings) ? holdings : []).length} positions
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                {totalPnL >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-400" />
                )}
              </div>
              <p className="text-sm text-slate-400">Total P&L</p>
            </div>
            <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
            </p>
            <p className={`text-xs mt-2 ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercent((totalHoldingsValue - totalPnL) > 0 ? (totalPnL / (totalHoldingsValue - totalPnL)) * 100 : 0)}
            </p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trading Form */}
          <div>
            <GlassCard className="p-6">
              {/* Custom Tab Switcher */}
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

              {activeTab === 'buy' ? (
                <form onSubmit={handleBuy} className="mt-6 space-y-6">
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
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Quantity *
                    </label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Number of shares"
                      min="1"
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !ticker || !quantity}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {isLoading ? (
                      <>
                        <Loading size="sm" className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy Stock
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSell} className="mt-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Stock Ticker *
                    </label>
                    <Input
                      type="text"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      placeholder="Select from holdings below"
                      maxLength={10}
                      disabled={isLoading}
                      readOnly
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Click a holding below to select it
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Quantity *
                    </label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Number of shares"
                      min="1"
                      max={selectedHolding?.quantity || undefined}
                      disabled={isLoading || !selectedHolding}
                    />
                    {selectedHolding && (
                      <p className="text-xs text-slate-400 mt-1">
                        Available: {selectedHolding.quantity} shares
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !ticker || !quantity || !selectedHolding}
                    className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                  >
                    {isLoading ? (
                      <>
                        <Loading size="sm" className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4 mr-2" />
                        Sell Stock
                      </>
                    )}
                  </Button>
                </form>
              )}
            </GlassCard>
          </div>

          {/* Holdings Table */}
          <div>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Your Holdings</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="pl-10 w-48"
                  />
                </div>
              </div>

              {!(Array.isArray(holdings) && holdings.length > 0) ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-400 mb-2">No holdings yet</p>
                  <p className="text-sm text-slate-500">
                    Buy your first stock to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredHoldings.map((holding: any, index: number) => {
                    // Safely extract values with fallbacks
                    const quantity = holding.quantity || 0;
                    const averageCost = holding.averageCost || 0;
                    const currentPrice = holding.currentPrice || 0;
                    const marketValue = holding.marketValue || holding.totalValue || 0;
                    const pnl = holding.profitLoss || 0;
                    const pnlPercent = holding.profitLossPercent || 0;
                    const isPositive = pnl >= 0;
                    const isSelected = selectedHolding?.ticker === holding.ticker;

                    return (
                      <div
                        key={index}
                        onClick={() => handleSelectHolding(holding)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-500/10 border-blue-500/50'
                            : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-lg font-bold text-white">
                                {holding.ticker}
                              </h4>
                              {isSelected && (
                                <Badge variant="primary" className="text-xs">Selected</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-400">
                              {quantity} shares @ {formatCurrency(averageCost)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">
                              {formatCurrency(marketValue)}
                            </p>
                            <div className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                              {isPositive ? '+' : ''}{formatCurrency(pnl)}
                              <span className="text-xs ml-1">
                                ({formatPercent(pnlPercent)})
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Current: {formatCurrency(currentPrice)}</span>
                          {activeTab === 'sell' && (
                            <span className="text-blue-400">Click to sell →</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
}

