'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/lib/store/authStore';
import { usePortfolioStore } from '@/lib/store/portfolioStore';
import { useWalletStore } from '@/lib/store/walletStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Plus, TrendingUp, TrendingDown, Activity, DollarSign, Wallet, ArrowRight, ChevronRight, Eye, BookOpen } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';
import CreatePortfolioModal from '@/components/portfolio/CreatePortfolioModal';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, verifyToken, logout } = useAuthStore();
  const { portfolios, isLoading, fetchPortfolios } = usePortfolioStore();
  const { wallet, fetchWallet } = useWalletStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const token = Cookies.get('auth_token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Verify token if not authenticated
        if (!isAuthenticated) {
          const valid = await verifyToken();
          if (!valid) {
            router.push('/login');
            return;
          }
        }

        // Fetch user data
        if (user?.userId) {
          await Promise.all([
            fetchPortfolios(user.userId),
            fetchWallet(user.userId)
          ]);
        }
      } catch (error) {
        console.error('Dashboard initialization failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeDashboard();
  }, [user?.userId, isAuthenticated]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleViewPortfolio = (portfolioId: string) => {
    router.push(`/portfolio/${portfolioId}`);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    // Refresh portfolios
    if (user?.userId) {
      fetchPortfolios(user.userId);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loading size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  // Calculate total portfolio value
  const totalPortfolioValue = portfolios.reduce((sum, p) => sum + (p.currentValue || 0), 0);
  const totalPnL = portfolios.reduce((sum, p) => {
    const pnl = (p.currentValue || 0) - (p.initialCapital || 0);
    return sum + pnl;
  }, 0);
  const totalPnLPercent = totalPortfolioValue > 0 
    ? ((totalPortfolioValue - portfolios.reduce((sum, p) => sum + (p.initialCapital || 0), 0)) / portfolios.reduce((sum, p) => sum + (p.initialCapital || 0), 0)) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Horizon Trading
              </h1>
              <p className="text-sm text-slate-400 mt-1">Welcome back, {user?.username}!</p>
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
                onClick={() => router.push('/trading')}
                className="hidden sm:flex"
              >
                <Activity className="w-4 h-4 mr-2" />
                Trade
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet & Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Wallet Balance */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Wallet className="w-6 h-6 text-blue-400" />
              </div>
              <Button
                size="sm"
                onClick={() => router.push('/trading')}
                className="text-xs"
              >
                Trade
              </Button>
            </div>
            <p className="text-sm text-slate-400 mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(wallet?.balance || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Total Deposited: {formatCurrency(wallet?.totalDeposited || 0)}
            </p>
          </GlassCard>

          {/* Total Portfolio Value */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <Badge variant={totalPnL >= 0 ? 'success' : 'danger'}>
                {totalPnL >= 0 ? '+' : ''}{formatPercent(totalPnLPercent)}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mb-1">Total Portfolio Value</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(totalPortfolioValue)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {totalPnL >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <p className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
              </p>
            </div>
          </GlassCard>

          {/* Active Portfolios */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl">
                <Activity className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-1">Active Portfolios</p>
            <p className="text-3xl font-bold text-white">{portfolios.length}</p>
            <p className="text-xs text-slate-500 mt-2">
              {portfolios.filter(p => p.status === 'active').length} active
            </p>
          </GlassCard>
        </div>

        {/* Portfolios Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Your Portfolios</h2>
              <p className="text-sm text-slate-400 mt-1">
                Manage and monitor your investment portfolios
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Portfolio
            </Button>
          </div>

          {/* Portfolio List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loading size="lg" text="Loading portfolios..." />
            </div>
          ) : portfolios.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No portfolios yet
                </h3>
                <p className="text-slate-400 mb-6">
                  Create your first portfolio to start trading with automated strategies and signals.
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Portfolio
                </Button>
              </div>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {portfolios.map((portfolio) => {
                const pnl = (portfolio.currentValue || 0) - (portfolio.initialCapital || 0);
                const pnlPercent = portfolio.initialCapital > 0
                  ? ((portfolio.currentValue || 0) - portfolio.initialCapital) / portfolio.initialCapital * 100
                  : 0;
                const isPositive = pnl >= 0;

                return (
                  <GlassCard
                    key={portfolio.portfolioId}
                    className="p-6 hover:border-blue-500/50 transition-all cursor-pointer group"
                    onClick={() => handleViewPortfolio(portfolio.portfolioId)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {portfolio.name || `Portfolio ${portfolio.portfolioId.slice(0, 8)}`}
                          </h3>
                          <Badge variant={portfolio.status === 'active' ? 'success' : 'secondary'}>
                            {portfolio.status}
                          </Badge>
                        </div>
                        
                        {/* Securities */}
                        {portfolio.securities && portfolio.securities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {portfolio.securities.slice(0, 5).map((security, idx) => {
                              const ticker = typeof security === 'string' ? security : security.ticker;
                              return (
                                <Badge key={`${ticker}-${idx}`} variant="secondary" className="text-xs">
                                  {ticker}
                                </Badge>
                              );
                            })}
                            {portfolio.securities.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{portfolio.securities.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Current Value</p>
                        <p className="text-xl font-bold text-white">
                          {formatCurrency(portfolio.currentValue || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">P&L</p>
                        <div className="flex items-center gap-2">
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <p className={`text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(pnl)}
                          </p>
                        </div>
                        <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{formatPercent(pnlPercent)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                      <div className="text-xs text-slate-400">
                        Initial: {formatCurrency(portfolio.initialCapital || 0)}
                      </div>
                      <div className="flex items-center text-sm text-blue-400 font-medium">
                        View Details
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard
            className="p-6 hover:border-blue-500/50 transition-all cursor-pointer group"
            onClick={() => router.push('/trading')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  Trade Stocks
                </h3>
                <p className="text-sm text-slate-400">
                  Buy and sell stocks with real-time pricing
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
          </GlassCard>

          <GlassCard
            className="p-6 hover:border-purple-500/50 transition-all cursor-pointer group"
            onClick={() => router.push('/backtest')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                  Backtest Strategy
                </h3>
                <p className="text-sm text-slate-400">
                  Test strategies on historical data
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
          </GlassCard>

          <GlassCard
            className="p-6 hover:border-indigo-500/50 transition-all cursor-pointer group"
            onClick={() => router.push('/paper-trading')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                  Paper Trading
                </h3>
                <p className="text-sm text-slate-400">
                  Practice with virtual money
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </div>
          </GlassCard>
        </div>
      </main>

      {/* Create Portfolio Modal */}
      {showCreateModal && (
        <CreatePortfolioModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          userId={user?.userId || ''}
        />
      )}
    </div>
  );
}

