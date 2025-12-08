/**
 * Unit Tests for Curated Portfolios Configuration
 * Tests the curated portfolio options and helper functions
 */

const {
  curatedPortfolios,
  getPortfoliosByHorizon,
  getCuratedPortfolio,
  getAvailableHorizons,
  getPortfolioTypes,
  getAllCuratedPortfolios
} = require('../../config/curatedPortfolios');

describe('Curated Portfolios Configuration', () => {
  describe('curatedPortfolios object', () => {
    it('should have portfolios for horizons 1, 2, and 5', () => {
      expect(curatedPortfolios['1']).toBeDefined();
      expect(curatedPortfolios['2']).toBeDefined();
      expect(curatedPortfolios['5']).toBeDefined();
    });

    it('should have growth, balanced, defensive options for each horizon', () => {
      ['1', '2', '5'].forEach(horizon => {
        expect(curatedPortfolios[horizon].growth).toBeDefined();
        expect(curatedPortfolios[horizon].balanced).toBeDefined();
        expect(curatedPortfolios[horizon].defensive).toBeDefined();
      });
    });

    it('should have 4-5 tickers in each portfolio', () => {
      Object.values(curatedPortfolios).forEach(horizonPortfolios => {
        Object.values(horizonPortfolios).forEach(portfolio => {
          expect(portfolio.tickers.length).toBeGreaterThanOrEqual(4);
          expect(portfolio.tickers.length).toBeLessThanOrEqual(5);
        });
      });
    });

    it('should have required fields for each portfolio', () => {
      Object.values(curatedPortfolios).forEach(horizonPortfolios => {
        Object.values(horizonPortfolios).forEach(portfolio => {
          expect(portfolio.id).toBeDefined();
          expect(portfolio.name).toBeDefined();
          expect(portfolio.description).toBeDefined();
          expect(portfolio.horizon).toBeDefined();
          expect(portfolio.type).toBeDefined();
          expect(portfolio.tickers).toBeDefined();
          expect(portfolio.rebalanceFrequency).toBeDefined();
          expect(portfolio.riskLevel).toBeDefined();
          expect(portfolio.expectedVolatility).toBeDefined();
        });
      });
    });
  });

  describe('getPortfoliosByHorizon()', () => {
    it('should return all options for horizon 1', () => {
      const options = getPortfoliosByHorizon(1);
      expect(options).toBeDefined();
      expect(options.growth).toBeDefined();
      expect(options.balanced).toBeDefined();
      expect(options.defensive).toBeDefined();
    });

    it('should return all options for horizon 2', () => {
      const options = getPortfoliosByHorizon(2);
      expect(options).toBeDefined();
      expect(options.growth.horizon).toBe(2);
    });

    it('should return all options for horizon 5', () => {
      const options = getPortfoliosByHorizon(5);
      expect(options).toBeDefined();
      expect(options.growth.horizon).toBe(5);
    });

    it('should accept string horizon', () => {
      const options = getPortfoliosByHorizon('2');
      expect(options).toBeDefined();
      expect(options.balanced).toBeDefined();
    });

    it('should return null for invalid horizon', () => {
      const options = getPortfoliosByHorizon(10);
      expect(options).toBeNull();
    });
  });

  describe('getCuratedPortfolio()', () => {
    it('should return specific portfolio by horizon and type', () => {
      const portfolio = getCuratedPortfolio(1, 'growth');
      expect(portfolio).toBeDefined();
      expect(portfolio.horizon).toBe(1);
      expect(portfolio.type).toBe('growth');
    });

    it('should return correct portfolio for 2-year balanced', () => {
      const portfolio = getCuratedPortfolio(2, 'balanced');
      expect(portfolio).toBeDefined();
      expect(portfolio.id).toBe('2y-balanced');
      expect(portfolio.name).toContain('Balanced');
    });

    it('should return correct portfolio for 5-year defensive', () => {
      const portfolio = getCuratedPortfolio(5, 'defensive');
      expect(portfolio).toBeDefined();
      expect(portfolio.id).toBe('5y-defensive');
      expect(portfolio.riskLevel).toBe('low');
    });

    it('should be case-insensitive for type', () => {
      const portfolio1 = getCuratedPortfolio(1, 'GROWTH');
      const portfolio2 = getCuratedPortfolio(1, 'Growth');
      const portfolio3 = getCuratedPortfolio(1, 'growth');
      
      expect(portfolio1).toEqual(portfolio3);
      expect(portfolio2).toEqual(portfolio3);
    });

    it('should return null for invalid type', () => {
      const portfolio = getCuratedPortfolio(1, 'invalid');
      expect(portfolio).toBeNull();
    });

    it('should return null for invalid horizon', () => {
      const portfolio = getCuratedPortfolio(99, 'growth');
      expect(portfolio).toBeNull();
    });
  });

  describe('getAvailableHorizons()', () => {
    it('should return array of horizons', () => {
      const horizons = getAvailableHorizons();
      expect(Array.isArray(horizons)).toBe(true);
      expect(horizons).toContain('1');
      expect(horizons).toContain('2');
      expect(horizons).toContain('5');
    });
  });

  describe('getPortfolioTypes()', () => {
    it('should return array of portfolio types', () => {
      const types = getPortfolioTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types).toContain('growth');
      expect(types).toContain('balanced');
      expect(types).toContain('defensive');
      expect(types.length).toBe(3);
    });
  });

  describe('getAllCuratedPortfolios()', () => {
    it('should return flat array of all portfolios', () => {
      const all = getAllCuratedPortfolios();
      expect(Array.isArray(all)).toBe(true);
      // 3 horizons x 3 types = 9 portfolios
      expect(all.length).toBe(9);
    });

    it('should include all horizons in the result', () => {
      const all = getAllCuratedPortfolios();
      const horizons = [...new Set(all.map(p => p.horizon))];
      expect(horizons).toContain(1);
      expect(horizons).toContain(2);
      expect(horizons).toContain(5);
    });

    it('should include all types in the result', () => {
      const all = getAllCuratedPortfolios();
      const types = [...new Set(all.map(p => p.type))];
      expect(types).toContain('growth');
      expect(types).toContain('balanced');
      expect(types).toContain('defensive');
    });
  });

  describe('Portfolio Content Validation', () => {
    it('should have valid ticker symbols', () => {
      const all = getAllCuratedPortfolios();
      const validTickerPattern = /^[A-Z]{1,5}(-[A-Z])?$/;
      
      all.forEach(portfolio => {
        portfolio.tickers.forEach(ticker => {
          expect(ticker).toMatch(validTickerPattern);
        });
      });
    });

    it('should have unique tickers within each portfolio', () => {
      const all = getAllCuratedPortfolios();
      
      all.forEach(portfolio => {
        const uniqueTickers = [...new Set(portfolio.tickers)];
        expect(uniqueTickers.length).toBe(portfolio.tickers.length);
      });
    });

    it('should have matching horizon in portfolio and id', () => {
      const all = getAllCuratedPortfolios();
      
      all.forEach(portfolio => {
        expect(portfolio.id).toContain(`${portfolio.horizon}y`);
      });
    });

    it('should have appropriate risk levels for types', () => {
      const all = getAllCuratedPortfolios();
      
      all.forEach(portfolio => {
        if (portfolio.type === 'defensive') {
          expect(portfolio.riskLevel).toBe('low');
        }
        if (portfolio.type === 'growth' && portfolio.horizon === 1) {
          expect(portfolio.riskLevel).toBe('high');
        }
      });
    });
  });
});

