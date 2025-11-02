/**
 * Unit tests for Security model
 */

const Security = require('../../src/models/Security');
const { createMockSecurity, createMockPriceData, createMockQuote } = require('../helpers/testHelpers');

describe('Security', () => {
  let security;
  
  beforeEach(() => {
    security = createMockSecurity('AAPL', {
      name: 'Apple Inc.',
      exchange: 'NASDAQ',
      sector: 'Technology',
      inception_date: '1980-12-12'
    });
  });

  describe('constructor', () => {
    it('should create a security with correct properties', () => {
      expect(security.ticker).toBe('AAPL');
      expect(security.name).toBe('Apple Inc.');
      expect(security.exchange).toBe('NASDAQ');
      expect(security.sector).toBe('Technology');
      expect(security.inception_date).toBe('1980-12-12');
    });

    it('should convert ticker to uppercase', () => {
      const lowerSecurity = new Security('aapl');
      expect(lowerSecurity.ticker).toBe('AAPL');
    });
  });

  describe('get_metadata', () => {
    it('should return security metadata', () => {
      const metadata = security.get_metadata();
      
      expect(metadata.ticker).toBe('AAPL');
      expect(metadata.name).toBe('Apple Inc.');
      expect(metadata.exchange).toBe('NASDAQ');
      expect(metadata.sector).toBe('Technology');
      expect(metadata.inception_date).toBe('1980-12-12');
    });
  });

  describe('update_metadata', () => {
    it('should update security metadata', () => {
      const newMetadata = {
        name: 'Apple Computer Inc.',
        sector: 'Consumer Electronics'
      };
      
      security.update_metadata(newMetadata);
      
      expect(security.name).toBe('Apple Computer Inc.');
      expect(security.sector).toBe('Consumer Electronics');
      expect(security.ticker).toBe('AAPL'); // Should not change
    });
  });

  describe('has_sufficient_data', () => {
    it('should return true for sufficient data', () => {
      const priceData = createMockPriceData('AAPL', 100);
      expect(security.has_sufficient_data(priceData, 50)).toBe(true);
    });

    it('should return false for insufficient data', () => {
      const priceData = createMockPriceData('AAPL', 30);
      expect(security.has_sufficient_data(priceData, 50)).toBe(false);
    });

    it('should return false for null data', () => {
      expect(security.has_sufficient_data(null, 50)).toBe(false);
    });
  });

  describe('get_latest_price', () => {
    it('should return the most recent close price', () => {
      const priceData = createMockPriceData('AAPL', 10);
      const latestPrice = security.get_latest_price(priceData);
      
      expect(latestPrice).toBe(priceData[priceData.length - 1].close);
    });

    it('should return null for empty data', () => {
      expect(security.get_latest_price([])).toBeNull();
      expect(security.get_latest_price(null)).toBeNull();
    });
  });

  describe('calculate_price_change', () => {
    it('should calculate price change over specified days', () => {
      const priceData = [
        { close: 100 },
        { close: 110 },
        { close: 105 }
      ];
      
      const change = security.calculate_price_change(priceData, 1);
      expect(change).toBeCloseTo(-4.545, 2); // -4.545% decrease from 110 to 105
    });

    it('should return null for insufficient data', () => {
      const priceData = [{ close: 100 }];
      expect(security.calculate_price_change(priceData, 1)).toBeNull();
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const str = security.toString();
      expect(str).toContain('AAPL');
      expect(str).toContain('Apple Inc.');
      expect(str).toContain('Technology');
    });

    it('should handle missing optional fields', () => {
      const minimalSecurity = new Security('TEST');
      const str = minimalSecurity.toString();
      expect(str).toBe('TEST');
    });
  });

  describe('fetch_history', () => {
    it('should throw error for invalid date range', async () => {
      // Mock the marketDataProvider to throw an error
      security.marketDataProvider.get_prices = jasmine.createSpy('get_prices').and.returnValue(Promise.reject(new Error('No data found')));
      
      try {
        await security.fetch_history('2020-01-01', '2020-01-02');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toContain('No data found');
      }
    });
  });

  describe('fetch_quote', () => {
    it('should throw error for invalid ticker', async () => {
      // Mock the marketDataProvider to throw an error
      security.marketDataProvider.get_quote = jasmine.createSpy('get_quote').and.returnValue(Promise.reject(new Error('Invalid symbol')));
      
      try {
        await security.fetch_quote();
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid symbol');
      }
    });
  });

  describe('validate_symbol', () => {
    it('should return false for invalid symbol', async () => {
      // Mock the marketDataProvider to return false
      security.marketDataProvider.validate_symbol = jasmine.createSpy('validate_symbol').and.returnValue(Promise.resolve(false));
      
      const isValid = await security.validate_symbol();
      expect(isValid).toBe(false);
    });
  });
});
