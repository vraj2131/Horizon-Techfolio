'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw, 
  Clock,
  ArrowLeft
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';
import { getWatchlist, WatchlistStock } from '@/lib/api/stocks';
import { format } from 'date-fns';

export default function WatchlistPage() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [marketStatus, setMarketStatus] = useState<string>('closed');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'ticker' | 'price' | 'change' | 'changePercent'>('ticker');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadWatchlist = async (showRefreshing = false) => {
    try {
      // Show cached data immediately if available (for faster perceived load time)
      if (!showRefreshing) {
        const cached = localStorage.getItem('watchlist_cache');
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            const cacheAge = Date.now() - (cachedData.timestamp || 0);
            // Use cached data if less than 5 minutes old
            if (cacheAge < 5 * 60 * 1000) {
              setWatchlist(cachedData.watchlist || []);
              setMarketStatus(cachedData.marketStatus || 'closed');
              setLastUpdated(cachedData.lastUpdated);
              setIsLoading(false); // Show cached data immediately
            }
          } catch (e) {
            // Ignore cache parse errors
          }
        }
      }

      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await getWatchlist();
      setWatchlist(response.watchlist);
      setMarketStatus(response.marketStatus);
      setLastUpdated(response.lastUpdated);
      
      // Cache the response
      localStorage.setItem('watchlist_cache', JSON.stringify({
        watchlist: response.watchlist,
        marketStatus: response.marketStatus,
        lastUpdated: response.lastUpdated,
        timestamp: Date.now()
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to load watchlist');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      loadWatchlist(true);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // Default to descending for new field
    }
  };

  const filteredAndSortedWatchlist = watchlist
    .filter(stock => 
      stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      
      switch (sortBy) {
        case 'ticker':
          return multiplier * a.ticker.localeCompare(b.ticker);
        case 'price':
          return multiplier * (a.price - b.price);
        case 'change':
          return multiplier * (a.change - b.change);
        case 'changePercent':
          return multiplier * (a.changePercent - b.changePercent);
        default:
          return 0;
      }
    });

  const gainers = watchlist
    .filter(s => s.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3);

  const losers = watchlist
    .filter(s => s.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loading size="lg" text="Loading watchlist..." />
      </div>
    );
  }

  const getMarketStatusBadge = () => {
    switch (marketStatus) {
      case 'open':
        return <Badge variant="success" className="animate-pulse">Market Open</Badge>;
      case 'closed':
        return <Badge variant="info">Market Closed</Badge>;
      case 'weekend':
        return <Badge variant="info">Weekend</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                  Market Watchlist
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Track all 20 stocks in real-time
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {getMarketStatusBadge()}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadWatchlist(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Stocks */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Stocks</p>
                <p className="text-3xl font-bold text-white">{watchlist.length}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </GlassCard>

          {/* Top Gainer */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">Top Gainer</p>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            {gainers[0] ? (
              <>
                <p className="text-xl font-bold text-white mb-1">{gainers[0].ticker}</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatPercent(gainers[0].changePercent)}
                </p>
              </>
            ) : (
              <p className="text-slate-500">No gainers today</p>
            )}
          </GlassCard>

          {/* Top Loser */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">Top Loser</p>
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            {losers[0] ? (
              <>
                <p className="text-xl font-bold text-white mb-1">{losers[0].ticker}</p>
                <p className="text-2xl font-bold text-red-400">
                  {formatPercent(losers[0].changePercent)}
                </p>
              </>
            ) : (
              <p className="text-slate-500">No losers today</p>
            )}
          </GlassCard>
        </div>

        {/* Search and Sort */}
        <GlassCard className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="ticker">Sort by Ticker</option>
                <option value="price">Sort by Price</option>
                <option value="change">Sort by Change ($)</option>
                <option value="changePercent">Sort by Change (%)</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white hover:bg-slate-700/50 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Stock List */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/30">
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Change %
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    Volume
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                    High / Low
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredAndSortedWatchlist.map((stock, index) => (
                  <tr
                    key={stock.ticker}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/stock/${stock.ticker}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-white">{stock.ticker}</div>
                        <div className="text-sm text-slate-400">{stock.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="font-medium text-white">{formatCurrency(stock.price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`font-medium ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change, 2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Badge variant={stock.changePercent >= 0 ? 'success' : 'danger'}>
                        {formatPercent(stock.changePercent)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-400 text-sm hidden md:table-cell">
                      {stock.volume.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-400 text-sm hidden lg:table-cell">
                      {formatCurrency(stock.high)} / {formatCurrency(stock.low)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div className="px-6 py-3 bg-slate-800/20 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Last updated: {format(new Date(lastUpdated), 'MMM dd, yyyy')}</span>
              </div>
              <span>{filteredAndSortedWatchlist.length} of {watchlist.length} stocks</span>
            </div>
          )}
        </GlassCard>
      </main>
    </div>
  );
}

