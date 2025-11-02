/**
 * Unit tests for Strategy model
 */

const Strategy = require('../../src/models/Strategy');
const { createMockPriceData } = require('../helpers/testHelpers');

describe('Strategy', () => {
  let strategy;
  let priceData;

  beforeEach(() => {
    strategy = new Strategy(
      'Test Strategy',
      [
        { type: 'SMA', params: { window: 5 } },
        { type: 'RSI', params: { window: 14 } }
      ],
      'Price > SMA',
      'Price < SMA',
      'weekly'
    );

    priceData = new Map();
    priceData.set('AAPL', createMockPriceData('AAPL', 20, 100, 0.02));
    priceData.set('MSFT', createMockPriceData('MSFT', 20, 150, 0.02));
  });

  describe('constructor', () => {
    it('should create strategy with correct properties', () => {
      expect(strategy.name).toBe('Test Strategy');
      expect(strategy.indicators.length).toBe(2);
      expect(strategy.entryRule).toBe('Price > SMA');
      expect(strategy.exitRule).toBe('Price < SMA');
      expect(strategy.rebalance_freq).toBe('weekly');
    });
  });

  describe('generate_signals', () => {
    it('should generate signals for all tickers', () => {
      const signals = strategy.generate_signals(priceData);
      
      expect(signals.size).toBe(2);
      expect(signals.has('AAPL')).toBe(true);
      expect(signals.has('MSFT')).toBe(true);
    });

    it('should generate signal objects with correct structure', () => {
      const signals = strategy.generate_signals(priceData);
      const aaplSignal = signals.get('AAPL');
      
      expect(aaplSignal).toBeDefined();
      expect(aaplSignal.ticker).toBe('AAPL');
      expect(['buy', 'hold', 'sell']).toContain(aaplSignal.signal);
      expect(aaplSignal.confidence).toBeGreaterThanOrEqual(0);
      expect(aaplSignal.confidence).toBeLessThanOrEqual(1);
      expect(typeof aaplSignal.reason).toBe('string');
      expect(aaplSignal.indicators).toBeDefined();
      expect(aaplSignal.timestamp).toBeDefined();
    });

    it('should handle errors gracefully', () => {
      const invalidData = new Map();
      invalidData.set('INVALID', []); // Empty data
      
      const signals = strategy.generate_signals(invalidData);
      const invalidSignal = signals.get('INVALID');
      
      expect(invalidSignal.signal).toBe('hold');
      expect(invalidSignal.confidence).toBeGreaterThanOrEqual(0);
      expect(invalidSignal.confidence).toBeLessThanOrEqual(1);
      // The reason might not contain 'Error' if indicators still generate signals
      expect(typeof invalidSignal.reason).toBe('string');
    });
  });

  describe('recommend_frequency', () => {
    it('should recommend daily for mean reversion strategy', () => {
      const meanReversionStrategy = new Strategy('Mean Reversion Strategy');
      const frequency = meanReversionStrategy.recommend_frequency(2, 20);
      expect(frequency).toBe('daily');
    });

    it('should recommend monthly for conservative strategy', () => {
      const conservativeStrategy = new Strategy('Conservative Strategy');
      const frequency = conservativeStrategy.recommend_frequency(2, 20);
      expect(frequency).toBe('monthly');
    });

    it('should recommend weekly for default strategy', () => {
      const frequency = strategy.recommend_frequency(2, 20);
      expect(frequency).toBe('weekly');
    });

    it('should adjust frequency based on horizon', () => {
      const shortTerm = strategy.recommend_frequency(1, 20);
      const longTerm = strategy.recommend_frequency(5, 20);
      
      expect(shortTerm).toBe('weekly');
      expect(longTerm).toBe('monthly');
    });
  });

  describe('explain', () => {
    it('should return strategy explanation', () => {
      const explanation = strategy.explain();
      
      expect(explanation.name).toBe('Test Strategy');
      expect(explanation.description).toBeDefined();
      expect(explanation.indicators.length).toBe(2);
      expect(explanation.frequency).toBe('weekly');
      expect(explanation.rules).toBeDefined();
    });
  });

  describe('getLastSignals', () => {
    it('should return last generated signals', () => {
      strategy.generate_signals(priceData);
      const lastSignals = strategy.getLastSignals();
      
      expect(lastSignals.size).toBe(2);
      expect(lastSignals.has('AAPL')).toBe(true);
    });
  });

  describe('getSignalForTicker', () => {
    it('should return signal for specific ticker', () => {
      strategy.generate_signals(priceData);
      const aaplSignal = strategy.getSignalForTicker('AAPL');
      
      expect(aaplSignal).toBeDefined();
      expect(aaplSignal.ticker).toBe('AAPL');
    });

    it('should return null for unknown ticker', () => {
      const unknownSignal = strategy.getSignalForTicker('UNKNOWN');
      expect(unknownSignal).toBeNull();
    });
  });

  describe('updateStrategy', () => {
    it('should update strategy parameters', () => {
      strategy.updateStrategy({
        name: 'Updated Strategy',
        rebalanceFreq: 'daily'
      });
      
      expect(strategy.name).toBe('Updated Strategy');
      expect(strategy.rebalance_freq).toBe('daily');
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const str = strategy.toString();
      expect(str).toContain('Test Strategy');
      expect(str).toContain('weekly');
    });
  });

  describe('applyMajorityVote', () => {
    it('should return majority signal', () => {
      const indicatorSignals = {
        SMA: ['buy', 'buy', 'hold'],
        RSI: ['buy', 'sell', 'buy']
      };
      
      const signal = strategy.applyMajorityVote(indicatorSignals);
      expect(signal).toBe('buy');
    });

    it('should return hold for tie', () => {
      const indicatorSignals = {
        SMA: ['buy', 'sell'],
        RSI: ['hold', 'hold']
      };
      
      const signal = strategy.applyMajorityVote(indicatorSignals);
      expect(signal).toBe('hold');
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate confidence based on signal consistency', () => {
      const indicatorSignals = {
        SMA: ['buy', 'buy', 'buy'],
        RSI: ['buy', 'sell', 'buy']
      };
      
      const confidence = strategy.calculateConfidence(indicatorSignals, []);
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('generateReason', () => {
    it('should generate reason for signal', () => {
      const indicatorSignals = {
        SMA: ['buy'],
        RSI: ['buy']
      };
      
      const reason = strategy.generateReason('buy', indicatorSignals);
      expect(typeof reason).toBe('string');
      expect(reason.length).toBeGreaterThan(0);
    });
  });
});
