'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/lib/store/authStore';
import { useWalletStore } from '@/lib/store/walletStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

interface FilterOptions {
  type: 'all' | 'buy' | 'sell' | 'deposit';
  ticker: string;
  startDate: string;
  endDate: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { user, isAuthenticated, verifyToken } = useAuthStore();
  const { transactions, fetchTransactions, isLoading } = useWalletStore();

  const [isInitializing, setIsInitializing] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    ticker: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const initializeTransactionsPage = async () => {
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
          await fetchTransactions(user.userId);
        }
      } catch (error) {
        console.error('Transactions page initialization failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeTransactionsPage();
  }, [user?.userId, isAuthenticated]);

  const applyFilters = (transactions: any[]) => {
    return transactions.filter((tx: any) => {
      // Search filter
      if (searchTerm && !tx.ticker?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filters.type !== 'all' && tx.type !== filters.type) {
        return false;
      }

      // Ticker filter
      if (filters.ticker && tx.ticker !== filters.ticker.toUpperCase()) {
        return false;
      }

      // Date filters
      if (filters.startDate) {
        const txDateStr = tx.createdAt || tx.timestamp || tx.date;
        if (!txDateStr) return false; // Skip if no date field
        
        const txDate = new Date(txDateStr);
        const startDate = new Date(filters.startDate);
        if (isNaN(txDate.getTime()) || txDate < startDate) return false;
      }

      if (filters.endDate) {
        const txDateStr = tx.createdAt || tx.timestamp || tx.date;
        if (!txDateStr) return false; // Skip if no date field
        
        const txDate = new Date(txDateStr);
        const endDate = new Date(filters.endDate);
        if (isNaN(txDate.getTime()) || txDate > endDate) return false;
      }

      return true;
    });
  };

  const filteredTransactions = applyFilters(transactions);

  // Calculate statistics
  const totalBuyTransactions = transactions.filter((tx: any) => tx.type === 'buy').length;
  const totalSellTransactions = transactions.filter((tx: any) => tx.type === 'sell').length;
  const totalBuyAmount = transactions
    .filter((tx: any) => tx.type === 'buy')
    .reduce((sum: number, tx: any) => sum + Math.abs(tx.total || tx.subtotal || 0), 0);
  const totalSellAmount = transactions
    .filter((tx: any) => tx.type === 'sell')
    .reduce((sum: number, tx: any) => sum + (tx.total || tx.subtotal || 0), 0);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loading size="lg" text="Loading transactions..." />
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
                <h1 className="text-2xl font-bold text-white">Transaction History</h1>
                <p className="text-sm text-slate-400 mt-1">
                  View all your trading activities
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => {
                // TODO: Export to CSV functionality
                alert('Export functionality coming soon!');
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-sm text-slate-400">Total Transactions</p>
            </div>
            <p className="text-3xl font-bold text-white">{transactions.length}</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-sm text-slate-400">Buy Orders</p>
            </div>
            <p className="text-3xl font-bold text-white">{totalBuyTransactions}</p>
            <p className="text-xs text-slate-500 mt-1">
              {formatCurrency(totalBuyAmount)}
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-sm text-slate-400">Sell Orders</p>
            </div>
            <p className="text-3xl font-bold text-white">{totalSellTransactions}</p>
            <p className="text-xs text-slate-500 mt-1">
              {formatCurrency(totalSellAmount)}
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-sm text-slate-400">Net Proceeds</p>
            </div>
            <p className={`text-3xl font-bold ${totalSellAmount - totalBuyAmount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalSellAmount - totalBuyAmount)}
            </p>
          </GlassCard>
        </div>

        {/* Filters and Search */}
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by ticker..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-blue-500/10 text-blue-400' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-700/50">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Transaction Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="all">All Types</option>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                  <option value="deposit">Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ticker
                </label>
                <Input
                  type="text"
                  value={filters.ticker}
                  onChange={(e) => setFilters({ ...filters, ticker: e.target.value.toUpperCase() })}
                  placeholder="e.g., AAPL"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Transactions Table */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Transactions ({filteredTransactions.length})
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loading size="lg" text="Loading transactions..." />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-2">
                {searchTerm || filters.type !== 'all' || filters.ticker || filters.startDate || filters.endDate
                  ? 'No transactions match your filters'
                  : 'No transactions yet'}
              </p>
              {!(searchTerm || filters.type !== 'all' || filters.ticker || filters.startDate || filters.endDate) && (
                <Button
                  onClick={() => router.push('/trading')}
                  className="mt-4"
                >
                  Start Trading
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Ticker</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Quantity</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Price</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction: any, index: number) => (
                    <tr key={transaction.transactionId || index} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-sm text-slate-300">
                        {formatDate(transaction.createdAt || transaction.timestamp || transaction.date)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            transaction.type === 'buy'
                              ? 'success'
                              : transaction.type === 'sell'
                              ? 'danger'
                              : 'secondary'
                          }
                        >
                          {transaction.type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-white">
                          {transaction.ticker || '-'}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-white">
                        {transaction.quantity || '-'}
                      </td>
                      <td className="text-right py-3 px-4 text-white">
                        {transaction.price ? formatCurrency(transaction.price) : '-'}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={transaction.type === 'buy' ? 'text-red-400' : 'text-green-400'}>
                          {transaction.type === 'buy' ? '-' : '+'}{formatCurrency(Math.abs(transaction.total || transaction.subtotal || 0))}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={transaction.status === 'completed' ? 'success' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </main>
    </div>
  );
}

