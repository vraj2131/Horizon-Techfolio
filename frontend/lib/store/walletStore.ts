import { create } from 'zustand';
import * as tradingApi from '../api/trading';
import type { 
  Wallet,
  Transaction,
  Holding,
  BuyStockRequest,
  SellStockRequest,
  DepositFundsRequest,
  TransactionFilters
} from '../types/wallet';

interface WalletState {
  wallet: Wallet | null;
  holdings: Holding[];
  transactions: Transaction[];
  transactionSummary: {
    totalBuys: number;
    totalSells: number;
    totalBuyAmount: number;
    totalSellAmount: number;
    netTrading: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  // Cache timestamps
  lastWalletFetch: number | null;
  lastHoldingsFetch: number | null;
  lastTransactionsFetch: number | null;
}

interface WalletActions {
  fetchWallet: (userId: string) => Promise<void>;
  fetchWalletSummary: (userId: string) => Promise<void>;
  buyStock: (data: BuyStockRequest) => Promise<void>;
  sellStock: (data: SellStockRequest) => Promise<void>;
  depositFunds: (data: DepositFundsRequest) => Promise<void>;
  fetchTransactions: (userId: string, filters?: TransactionFilters) => Promise<void>;
  fetchHoldings: (userId: string) => Promise<void>;
  clearError: () => void;
}

type WalletStore = WalletState & WalletActions;

const CACHE_DURATION = {
  wallet: 30000,      // 30 seconds
  holdings: 60000,    // 60 seconds
  transactions: 60000 // 60 seconds
};

export const useWalletStore = create<WalletStore>((set, get) => ({
  // Initial state
  wallet: null,
  holdings: [],
  transactions: [],
  transactionSummary: null,
  isLoading: false,
  error: null,
  lastWalletFetch: null,
  lastHoldingsFetch: null,
  lastTransactionsFetch: null,

  // Fetch wallet details with caching
  fetchWallet: async (userId: string) => {
    const state = get();
    const now = Date.now();
    
    // Check cache (30 second expiry)
    if (state.wallet && state.lastWalletFetch && (now - state.lastWalletFetch) < CACHE_DURATION.wallet) {
      return; // Use cached data
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const wallet = await tradingApi.getWallet(userId);
      set({
        wallet,
        isLoading: false,
        lastWalletFetch: now
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch wallet';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  },

  // Fetch wallet summary with holdings
  fetchWalletSummary: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const summary = await tradingApi.getWalletSummary(userId);
      set({
        wallet: {
          userId: userId,
          balance: summary.balance,
          totalInvested: summary.totalInvested,
          totalProfitLoss: summary.totalProfitLoss,
          totalTrades: summary.totalTrades,
          winningTrades: 0,
          losingTrades: 0,
          avgTradeSize: 0,
          largestWin: 0,
          largestLoss: 0,
          status: 'active',
          currency: 'USD',
          reservedFunds: 0,
          createdAt: '',
          updatedAt: ''
        } as Wallet,
        holdings: Array.isArray(summary.holdings) ? summary.holdings : [],
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch wallet summary';
      set({ 
        isLoading: false, 
        error: errorMessage,
        holdings: [] // Ensure holdings is always an array
      });
      throw error;
    }
  },

  // Buy stock
  buyStock: async (data: BuyStockRequest) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await tradingApi.buyStock(data);
      // Invalidate cache after trade
      set({
        wallet: response.wallet,
        isLoading: false,
        lastWalletFetch: null, // Force refresh on next fetch
        lastHoldingsFetch: null // Holdings changed
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to buy stock';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  },

  // Sell stock
  sellStock: async (data: SellStockRequest) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await tradingApi.sellStock(data);
      // Invalidate cache after trade
      set({
        wallet: response.wallet,
        isLoading: false,
        lastWalletFetch: null, // Force refresh on next fetch
        lastHoldingsFetch: null // Holdings changed
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to sell stock';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  },

  // Deposit funds
  depositFunds: async (data: DepositFundsRequest) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await tradingApi.depositFunds(data);
      set({
        wallet: response.wallet,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to deposit funds';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  },

  // Fetch transactions with caching
  fetchTransactions: async (userId: string, filters?: TransactionFilters) => {
    const state = get();
    const now = Date.now();
    
    // Check cache (60 second expiry, but invalidate if filters changed)
    if (state.transactions.length > 0 && state.lastTransactionsFetch && 
        (now - state.lastTransactionsFetch) < CACHE_DURATION.transactions && !filters) {
      return; // Use cached data
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await tradingApi.getTransactions(userId, filters);
      set({
        transactions: Array.isArray(response.transactions) ? response.transactions : [],
        transactionSummary: response.summary,
        isLoading: false,
        lastTransactionsFetch: now
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch transactions';
      set({ 
        isLoading: false, 
        error: errorMessage,
        transactions: [] // Ensure transactions is always an array
      });
      throw error;
    }
  },

  // Fetch holdings with caching
  fetchHoldings: async (userId: string) => {
    const state = get();
    const now = Date.now();
    
    // Check cache (60 second expiry)
    if (state.holdings.length > 0 && state.lastHoldingsFetch && 
        (now - state.lastHoldingsFetch) < CACHE_DURATION.holdings) {
      return; // Use cached data
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await tradingApi.getHoldings(userId);
      // Handle both direct array and wrapped response
      const holdingsArray = Array.isArray(response) 
        ? response 
        : (response as any).holdings || [];
      
      set({
        holdings: holdingsArray,
        isLoading: false,
        lastHoldingsFetch: now
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch holdings';
      set({ 
        isLoading: false, 
        error: errorMessage,
        holdings: [] // Ensure holdings is always an array
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));

