/**
 * Integration Tests for Portfolio Routes
 * Tests portfolio endpoints using supertest
 */

const request = require('supertest');
const app = require('../../src/app');
const DBService = require('../../src/db/dbService');

describe('Portfolio Routes Integration Tests', () => {
  let testUserId;
  let testPortfolioId;

  beforeAll(async () => {
    // Create a test user
    testUserId = `test_user_${Date.now()}`;
    await DBService.saveUser(testUserId, {
      userId: testUserId,
      name: 'Test User',
      email: 'test@example.com'
    }, 'testpassword123');
  });

  describe('POST /portfolio/initialize', () => {
    it('should create a new portfolio with valid data', async () => {
      const response = await request(app)
        .post('/portfolio/initialize')
        .send({
          userId: testUserId,
          tickers: ['AAPL', 'MSFT'],
          horizon: 2
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.portfolioId).toBeDefined();
      expect(response.body.horizon).toBe(2);
      expect(response.body.securities).toBeDefined();
      
      testPortfolioId = response.body.portfolioId;
    });

    it('should return 400 when userId is missing', async () => {
      const response = await request(app)
        .post('/portfolio/initialize')
        .send({
          tickers: ['AAPL'],
          horizon: 1
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when tickers array is empty', async () => {
      const response = await request(app)
        .post('/portfolio/initialize')
        .send({
          userId: testUserId,
          tickers: [],
          horizon: 1
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when horizon is invalid', async () => {
      const response = await request(app)
        .post('/portfolio/initialize')
        .send({
          userId: testUserId,
          tickers: ['AAPL'],
          horizon: 10
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when tickers exceed maximum', async () => {
      const tickers = Array(21).fill('AAPL');
      const response = await request(app)
        .post('/portfolio/initialize')
        .send({
          userId: testUserId,
          tickers,
          horizon: 1
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /portfolio/:id/signals', () => {
    it('should return signals for valid portfolio', async () => {
      if (!testPortfolioId) {
        pending('No test portfolio created');
        return;
      }

      const response = await request(app)
        .get(`/portfolio/${testPortfolioId}/signals`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.portfolioId).toBe(testPortfolioId);
      expect(response.body.signals).toBeDefined();
      expect(Array.isArray(response.body.signals)).toBe(true);
    });

    it('should return 500 for non-existent portfolio', async () => {
      const response = await request(app)
        .get('/portfolio/nonexistent123/signals')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /portfolio/:id/strategy', () => {
    it('should return strategy recommendation for valid portfolio', async () => {
      if (!testPortfolioId) {
        pending('No test portfolio created');
        return;
      }

      const response = await request(app)
        .get(`/portfolio/${testPortfolioId}/strategy`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.portfolioId).toBe(testPortfolioId);
      expect(response.body.strategy).toBeDefined();
      expect(response.body.recommendation).toBeDefined();
    });
  });

  describe('GET /portfolio/:id/performance', () => {
    it('should return performance metrics for valid portfolio', async () => {
      if (!testPortfolioId) {
        pending('No test portfolio created');
        return;
      }

      const response = await request(app)
        .get(`/portfolio/${testPortfolioId}/performance`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.portfolioId).toBe(testPortfolioId);
    });
  });

  // ==================== Custom Portfolio Tests ====================
  describe('POST /portfolio/custom', () => {
    it('should create a custom portfolio with valid data', async () => {
      const response = await request(app)
        .post('/portfolio/custom')
        .send({
          userId: testUserId,
          portfolioName: 'My Custom Portfolio',
          tickers: ['AAPL', 'GOOGL', 'MSFT'],
          horizon: 1,
          initialCapital: 10000
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.portfolioId).toBeDefined();
      expect(response.body.type).toBe('custom');
      expect(response.body.name).toBe('My Custom Portfolio');
      expect(response.body.horizon).toBe(1);
      expect(response.body.initialCapital).toBe(10000);
      expect(response.body.cash).toBe(10000); // Custom portfolios start with all cash
      expect(response.body.securities).toBeDefined();
      expect(Array.isArray(response.body.positions)).toBe(true);
    });

    it('should create custom portfolio with default name if not provided', async () => {
      const response = await request(app)
        .post('/portfolio/custom')
        .send({
          userId: testUserId,
          tickers: ['NVDA'],
          horizon: 2,
          initialCapital: 5000
        })
        .expect(201);

      expect(response.body.name).toBe('Custom Portfolio');
    });

    it('should return 400 when initial capital is below minimum', async () => {
      const response = await request(app)
        .post('/portfolio/custom')
        .send({
          userId: testUserId,
          tickers: ['AAPL'],
          horizon: 1,
          initialCapital: 50 // Below $100 minimum
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when tickers exceed 10', async () => {
      const response = await request(app)
        .post('/portfolio/custom')
        .send({
          userId: testUserId,
          tickers: Array(11).fill('AAPL'),
          horizon: 1,
          initialCapital: 10000
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  // ==================== Curated Portfolio Tests ====================
  describe('GET /portfolio/curated/options', () => {
    it('should return all curated portfolio options', async () => {
      const response = await request(app)
        .get('/portfolio/curated/options')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.horizons).toBeDefined();
      expect(response.body.portfolioTypes).toBeDefined();
      expect(response.body.options).toBeDefined();
      expect(response.body.options['1year']).toBeDefined();
      expect(response.body.options['2year']).toBeDefined();
      expect(response.body.options['5year']).toBeDefined();
    });

    it('should return options for specific horizon', async () => {
      const response = await request(app)
        .get('/portfolio/curated/options?horizon=1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.horizon).toBe(1);
      expect(response.body.options).toBeDefined();
      expect(Array.isArray(response.body.options)).toBe(true);
      expect(response.body.options.length).toBeGreaterThan(0);
    });

    it('should include growth, balanced, defensive options', async () => {
      const response = await request(app)
        .get('/portfolio/curated/options?horizon=2')
        .expect(200);

      const types = response.body.options.map(opt => opt.type);
      expect(types).toContain('growth');
      expect(types).toContain('balanced');
      expect(types).toContain('defensive');
    });

    it('should include tickers and metadata in options', async () => {
      const response = await request(app)
        .get('/portfolio/curated/options?horizon=5')
        .expect(200);

      const option = response.body.options[0];
      expect(option.id).toBeDefined();
      expect(option.name).toBeDefined();
      expect(option.description).toBeDefined();
      expect(option.tickers).toBeDefined();
      expect(Array.isArray(option.tickers)).toBe(true);
      expect(option.tickers.length).toBeGreaterThanOrEqual(4);
      expect(option.riskLevel).toBeDefined();
    });
  });

  describe('POST /portfolio/curated', () => {
    it('should create a curated portfolio with equal-weight allocation', async () => {
      const response = await request(app)
        .post('/portfolio/curated')
        .send({
          userId: testUserId,
          horizon: 2,
          portfolioType: 'balanced',
          initialCapital: 50000
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.portfolioId).toBeDefined();
      expect(response.body.type).toBe('curated');
      expect(response.body.horizon).toBe(2);
      expect(response.body.initialCapital).toBe(50000);
      expect(response.body.totalInvested).toBeDefined();
      expect(response.body.residualCash).toBeDefined();
      expect(response.body.allocations).toBeDefined();
      expect(Array.isArray(response.body.allocations)).toBe(true);
      
      // Verify equal-weight allocation
      if (response.body.allocations.length > 0) {
        const targetAllocation = response.body.allocations[0].targetAllocation;
        response.body.allocations.forEach(alloc => {
          expect(alloc.ticker).toBeDefined();
          expect(alloc.shares).toBeGreaterThan(0);
          expect(alloc.pricePerShare).toBeGreaterThan(0);
          expect(alloc.investedAmount).toBeGreaterThan(0);
          // All allocations should have the same target (equal-weight)
          expect(alloc.targetAllocation).toBe(targetAllocation);
        });
      }
    });

    it('should return curatedOption metadata', async () => {
      const response = await request(app)
        .post('/portfolio/curated')
        .send({
          userId: testUserId,
          horizon: 1,
          portfolioType: 'growth',
          initialCapital: 25000
        })
        .expect(201);

      expect(response.body.curatedOption).toBeDefined();
      expect(response.body.curatedOption.id).toBeDefined();
      expect(response.body.curatedOption.name).toBeDefined();
      expect(response.body.curatedOption.description).toBeDefined();
      expect(response.body.curatedOption.type).toBe('growth');
    });

    it('should include summary statistics', async () => {
      const response = await request(app)
        .post('/portfolio/curated')
        .send({
          userId: testUserId,
          horizon: 5,
          portfolioType: 'defensive',
          initialCapital: 100000
        })
        .expect(201);

      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.stocksAllocated).toBeDefined();
      expect(response.body.summary.totalStocksInPortfolio).toBeDefined();
      expect(response.body.summary.averageAllocationPerStock).toBeDefined();
      expect(response.body.summary.investmentEfficiency).toBeDefined();
      expect(response.body.summary.investmentEfficiency).toBeLessThanOrEqual(100);
    });

    it('should return 400 for invalid portfolio type', async () => {
      const response = await request(app)
        .post('/portfolio/curated')
        .send({
          userId: testUserId,
          horizon: 2,
          portfolioType: 'invalid_type',
          initialCapital: 10000
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid horizon', async () => {
      const response = await request(app)
        .post('/portfolio/curated')
        .send({
          userId: testUserId,
          horizon: 10,
          portfolioType: 'growth',
          initialCapital: 10000
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when capital is below minimum', async () => {
      const response = await request(app)
        .post('/portfolio/curated')
        .send({
          userId: testUserId,
          horizon: 1,
          portfolioType: 'balanced',
          initialCapital: 50
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});

