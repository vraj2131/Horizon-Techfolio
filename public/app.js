/**
 * Main Application Logic
 * Pure JavaScript - no frameworks
 */

// Application State
let currentUser = null;
let currentPortfolioId = null;

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Set default dates for backtest
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    document.getElementById('backtest-start-date').value = oneYearAgo.toISOString().split('T')[0];
    document.getElementById('backtest-end-date').value = today.toISOString().split('T')[0];

    // Attach form handlers
    document.getElementById('create-user-form').addEventListener('submit', handleCreateUser);
    document.getElementById('portfolio-form').addEventListener('submit', handleCreatePortfolio);
    document.getElementById('search-stocks-form').addEventListener('submit', handleSearchStocks);
    document.getElementById('backtest-form').addEventListener('submit', handleRunBacktest);

    // Load dashboard data
    loadDashboard();
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionId).classList.add('active');

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event?.target?.classList.add('active');
}

// Dashboard
async function loadDashboard() {
    // For now, just show placeholder
    // In a real app, you'd load user data from localStorage or session
    document.getElementById('user-info').innerHTML = '<p>Create a user to get started.</p>';
    document.getElementById('portfolios-list').innerHTML = '<p>No portfolios yet.</p>';
}

// User Management
async function handleCreateUser(e) {
    e.preventDefault();
    const resultDiv = document.getElementById('user-result');
    resultDiv.className = 'result';
    resultDiv.innerHTML = '<span class="loading"></span> Creating user...';

    try {
        const userId = document.getElementById('user-id').value.trim();
        const name = document.getElementById('user-name').value.trim();
        const email = document.getElementById('user-email').value.trim() || null;

        const result = await api.createUser(userId, name, email);
        
        currentUser = { userId, name, email };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        resultDiv.className = 'result success show';
        resultDiv.innerHTML = `
            <h4>✅ User Created Successfully!</h4>
            <p><strong>User ID:</strong> ${result.userId}</p>
            <p><strong>Name:</strong> ${result.name}</p>
            ${result.email ? `<p><strong>Email:</strong> ${result.email}</p>` : ''}
        `;

        // Clear form
        e.target.reset();
        
        // Update dashboard
        updateUserInfo(result);
        loadDashboard();
    } catch (error) {
        resultDiv.className = 'result error show';
        resultDiv.innerHTML = `<h4>❌ Error</h4><p>${error.message}</p>`;
    }
}

function updateUserInfo(user) {
    document.getElementById('user-info').innerHTML = `
        <p><strong>User ID:</strong> ${user.userId}</p>
        <p><strong>Name:</strong> ${user.name}</p>
        ${user.email ? `<p><strong>Email:</strong> ${user.email}</p>` : ''}
    `;
}

// Portfolio Management
async function handleCreatePortfolio(e) {
    e.preventDefault();
    const resultDiv = document.getElementById('portfolio-result');
    resultDiv.className = 'result';
    resultDiv.innerHTML = '<span class="loading"></span> Creating portfolio...';

    try {
        const userId = document.getElementById('portfolio-user-id').value.trim();
        const tickersInput = document.getElementById('tickers').value.trim();
        const horizon = document.getElementById('horizon').value;

        if (!tickersInput) {
            throw new Error('Please enter at least one ticker symbol');
        }

        const tickers = tickersInput.split(',').map(t => t.trim().toUpperCase()).filter(t => t);

        if (tickers.length === 0) {
            throw new Error('Please enter valid ticker symbols');
        }

        if (tickers.length > 20) {
            throw new Error('Maximum 20 tickers allowed');
        }

        const result = await api.initializePortfolio(userId, tickers, horizon);
        
        currentPortfolioId = result.portfolioId;
        localStorage.setItem('currentPortfolioId', currentPortfolioId);

        resultDiv.className = 'result success show';
        resultDiv.innerHTML = `
            <h4>✅ Portfolio Created Successfully!</h4>
            <p><strong>Portfolio ID:</strong> ${result.portfolioId}</p>
            <p><strong>Horizon:</strong> ${result.horizon} year(s)</p>
            <p><strong>Securities:</strong> ${result.securities.length}</p>
            <button onclick="loadPortfolioData('${result.portfolioId}')">View Portfolio</button>
        `;

        // Show portfolio management section
        document.getElementById('portfolio-management').style.display = 'block';
        loadPortfolioData(result.portfolioId);
    } catch (error) {
        resultDiv.className = 'result error show';
        resultDiv.innerHTML = `<h4>❌ Error</h4><p>${error.message}</p>`;
    }
}

function showPortfolioTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.portfolio-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');

    // Load tab data
    if (currentPortfolioId) {
        loadPortfolioTabData(tabName, currentPortfolioId);
    }
}

async function loadPortfolioData(portfolioId) {
    currentPortfolioId = portfolioId;
    showPortfolioTab('signals');
    await Promise.all([
        loadPortfolioTabData('signals', portfolioId),
        loadPortfolioTabData('strategy', portfolioId),
        loadPortfolioTabData('performance', portfolioId),
        loadPortfolioTabData('paper-trading', portfolioId)
    ]);
}

async function loadPortfolioTabData(tabName, portfolioId) {
    const contentDiv = document.getElementById(`${tabName}-content`);
    contentDiv.innerHTML = '<span class="loading"></span> Loading...';

    try {
        let data;
        switch(tabName) {
            case 'signals':
                data = await api.getPortfolioSignals(portfolioId);
                displaySignals(data);
                break;
            case 'strategy':
                data = await api.getPortfolioStrategy(portfolioId);
                displayStrategy(data);
                break;
            case 'performance':
                data = await api.getPortfolioPerformance(portfolioId);
                displayPerformance(data);
                break;
            case 'paper-trading':
                data = await api.getPaperTradingStatus(portfolioId);
                displayPaperTrading(data);
                break;
        }
    } catch (error) {
        contentDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

function displaySignals(data) {
    const contentDiv = document.getElementById('signals-content');
    
    if (!data.signals || data.signals.length === 0) {
        contentDiv.innerHTML = '<p>No signals available.</p>';
        return;
    }

    let html = '<table><thead><tr><th>Ticker</th><th>Signal</th><th>Strength</th><th>Price</th></tr></thead><tbody>';
    
    data.signals.forEach(signal => {
        const signalClass = signal.signal.toLowerCase();
        html += `
            <tr>
                <td><strong>${signal.ticker}</strong></td>
                <td><span class="signal-badge ${signalClass}">${signal.signal}</span></td>
                <td>${signal.strength || 'N/A'}</td>
                <td>$${signal.price ? signal.price.toFixed(2) : 'N/A'}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    contentDiv.innerHTML = html;
}

function displayStrategy(data) {
    const contentDiv = document.getElementById('strategy-content');
    
    let html = '<div class="card">';
    html += `<h4>${data.strategy || 'N/A'}</h4>`;
    
    if (data.frequency) {
        html += `<p><strong>Trading Frequency:</strong> ${data.frequency}</p>`;
    }
    
    if (data.recommendation) {
        html += `<p><strong>Recommendation:</strong> ${data.recommendation}</p>`;
    }
    
    if (data.reasoning) {
        html += `<p><strong>Reasoning:</strong> ${data.reasoning}</p>`;
    }
    
    html += '</div>';
    contentDiv.innerHTML = html;
}

function displayPerformance(data) {
    const contentDiv = document.getElementById('performance-content');
    
    let html = '<div class="card">';
    
    if (data.totalValue !== undefined) {
        html += `<p><strong>Total Portfolio Value:</strong> $${data.totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>`;
    }
    
    if (data.totalReturn !== undefined) {
        html += `<p><strong>Total Return:</strong> ${data.totalReturn.toFixed(2)}%</p>`;
    }
    
    if (data.positions && data.positions.length > 0) {
        html += '<h5>Positions:</h5><table><thead><tr><th>Ticker</th><th>Shares</th><th>Cost Basis</th><th>P&L</th></tr></thead><tbody>';
        data.positions.forEach(pos => {
            html += `
                <tr>
                    <td>${pos.ticker}</td>
                    <td>${pos.shares}</td>
                    <td>$${pos.avgCost ? pos.avgCost.toFixed(2) : '0.00'}</td>
                    <td>${pos.pnl ? pos.pnl.toFixed(2) : '0.00'}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
    }
    
    html += '</div>';
    contentDiv.innerHTML = html;
}

function displayPaperTrading(data) {
    const contentDiv = document.getElementById('paper-trading-content');
    
    let html = '<div class="card">';
    html += `<p><strong>Status:</strong> ${data.status || 'N/A'}</p>`;
    html += `<p><strong>Initial Value:</strong> $${data.initialValue ? data.initialValue.toLocaleString() : 'N/A'}</p>`;
    html += `<p><strong>Current Value:</strong> $${data.currentValue ? data.currentValue.toLocaleString() : 'N/A'}</p>`;
    html += `<p><strong>Total Return:</strong> ${data.totalReturn ? data.totalReturn.toFixed(2) + '%' : 'N/A'}</p>`;
    html += '</div>';
    
    contentDiv.innerHTML = html;
}

// Stock Search
async function handleSearchStocks(e) {
    e.preventDefault();
    const resultDiv = document.getElementById('stocks-result');
    resultDiv.className = 'result';
    resultDiv.innerHTML = '<span class="loading"></span> Searching stocks...';

    try {
        const symbolsInput = document.getElementById('stock-symbols').value.trim();
        
        if (!symbolsInput) {
            throw new Error('Please enter at least one stock symbol');
        }

        const symbols = symbolsInput.split(',').map(s => s.trim().toUpperCase()).filter(s => s);

        if (symbols.length === 0) {
            throw new Error('Please enter valid stock symbols');
        }

        const result = await api.searchStocks(symbols);
        
        resultDiv.className = 'result info show';
        
        let html = `<h4>Stock Search Results</h4>`;
        html += `<p><strong>Total:</strong> ${result.total} | <strong>Valid:</strong> ${result.valid} | <strong>Invalid:</strong> ${result.invalid}</p>`;
        
        if (result.results && result.results.length > 0) {
            html += '<table><thead><tr><th>Symbol</th><th>Status</th><th>Name</th><th>Exchange</th><th>Sector</th></tr></thead><tbody>';
            
            result.results.forEach(stock => {
                if (stock.valid) {
                    const meta = stock.metadata || {};
                    html += `
                        <tr>
                            <td><strong>${stock.symbol}</strong></td>
                            <td><span class="signal-badge buy">Valid</span></td>
                            <td>${meta.name || 'N/A'}</td>
                            <td>${meta.exchange || 'N/A'}</td>
                            <td>${meta.sector || 'N/A'}</td>
                        </tr>
                    `;
                } else {
                    html += `
                        <tr>
                            <td><strong>${stock.symbol}</strong></td>
                            <td><span class="signal-badge sell">Invalid</span></td>
                            <td colspan="3">${stock.error || 'Not found'}</td>
                        </tr>
                    `;
                }
            });
            
            html += '</tbody></table>';
        }
        
        resultDiv.innerHTML = html;
    } catch (error) {
        resultDiv.className = 'result error show';
        resultDiv.innerHTML = `<h4>❌ Error</h4><p>${error.message}</p>`;
    }
}

// Backtesting
async function handleRunBacktest(e) {
    e.preventDefault();
    const resultDiv = document.getElementById('backtest-result');
    resultDiv.className = 'result';
    resultDiv.innerHTML = '<span class="loading"></span> Running backtest...';

    try {
        const portfolioId = document.getElementById('backtest-portfolio-id').value.trim();
        const startDate = document.getElementById('backtest-start-date').value;
        const endDate = document.getElementById('backtest-end-date').value;

        const result = await api.runBacktest(portfolioId, startDate, endDate);
        
        resultDiv.className = 'result success show';
        
        let html = '<h4>✅ Backtest Results</h4>';
        
        if (result.metrics) {
            const metrics = result.metrics;
            html += '<div class="card">';
            html += `<p><strong>CAGR:</strong> ${metrics.cagr ? metrics.cagr.toFixed(2) + '%' : 'N/A'}</p>`;
            html += `<p><strong>Sharpe Ratio:</strong> ${metrics.sharpe ? metrics.sharpe.toFixed(2) : 'N/A'}</p>`;
            html += `<p><strong>Max Drawdown:</strong> ${metrics.maxDrawdown ? metrics.maxDrawdown.toFixed(2) + '%' : 'N/A'}</p>`;
            html += `<p><strong>Total Return:</strong> ${metrics.totalReturn ? metrics.totalReturn.toFixed(2) + '%' : 'N/A'}</p>`;
            html += '</div>';
        }
        
        resultDiv.innerHTML = html;
    } catch (error) {
        resultDiv.className = 'result error show';
        resultDiv.innerHTML = `<h4>❌ Error</h4><p>${error.message}</p>`;
    }
}

// Make functions available globally
window.showSection = showSection;
window.showPortfolioTab = showPortfolioTab;
window.loadPortfolioData = loadPortfolioData;

