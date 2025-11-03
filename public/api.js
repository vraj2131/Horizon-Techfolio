/**
 * API Client for HorizonTrader
 * Pure JavaScript - no frameworks
 */

const API_BASE_URL = 'http://localhost:3000';

class APIClient {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // User Management
    async createUser(userId, name, email = null) {
        return this.request('/user', {
            method: 'POST',
            body: JSON.stringify({ userId, name, email })
        });
    }

    async getUser(userId) {
        return this.request(`/user/${userId}`);
    }

    async getUserPortfolios(userId) {
        return this.request(`/user/${userId}/portfolios`);
    }

    // Portfolio Management
    async initializePortfolio(userId, tickers, horizon) {
        return this.request('/portfolio/initialize', {
            method: 'POST',
            body: JSON.stringify({
                userId,
                tickers: Array.isArray(tickers) ? tickers : tickers.split(',').map(t => t.trim()),
                horizon: parseInt(horizon)
            })
        });
    }

    async getPortfolioSignals(portfolioId) {
        return this.request(`/portfolio/${portfolioId}/signals`);
    }

    async getPortfolioStrategy(portfolioId) {
        return this.request(`/portfolio/${portfolioId}/strategy`);
    }

    async getPortfolioPerformance(portfolioId) {
        return this.request(`/portfolio/${portfolioId}/performance`);
    }

    async getPaperTradingStatus(portfolioId) {
        return this.request(`/portfolio/${portfolioId}/paper-trading`);
    }

    // Stock Search
    async searchStocks(symbols) {
        const symbolsArray = Array.isArray(symbols) 
            ? symbols 
            : symbols.split(',').map(s => s.trim());
        
        return this.request('/stocks/search', {
            method: 'POST',
            body: JSON.stringify({ symbols: symbolsArray })
        });
    }

    async getPopularStocks() {
        return this.request('/stocks/popular');
    }

    // Backtesting
    async runBacktest(portfolioId, startDate, endDate) {
        return this.request('/backtest', {
            method: 'POST',
            body: JSON.stringify({
                portfolioId,
                startDate,
                endDate
            })
        });
    }

    // Health Check
    async healthCheck() {
        return this.request('/health');
    }
}

// Create global API client instance
const api = new APIClient();

