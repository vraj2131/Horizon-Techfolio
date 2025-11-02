/**
 * Unit tests for StrategyService
 */

const StrategyService = require('../../src/services/StrategyService');
const { createMockPriceData } = require('../helpers/testHelpers');

describe('StrategyService', () => {
  let strategyService;
  let priceData;

  beforeEach(() => {
    strategyService = new StrategyService();
    
    priceData = new Map();
    priceData.set('AAPL', createMockPriceData('AAPL', 50, 100, 0.02));
    priceData.set('MSFT', createMockPriceData('MSFT', 50, 150, 0.02));
    priceData.set('GOOGL', createMockPriceData('GOOGL', 50, 200, 0.02));
  });

  describe('constructor', () => {
    it('should initialize with all pre-built strategies', () => {
      const strategies = strategyService.getAvailableStrategies();
      expect(strategies.length).toBe(4);
      
      const strategyNames = strategies.map(s => s.name);
      expect(strategyNames).toContain('Trend Following');
      expect(strategyNames).toContain('Mean Reversion');
      expect(strategyNames).toContain('Momentum');
      expect(strategyNames).toContain('Conservative');
    });
  });

  describe('getStrategy', () => {
    it('should return strategy by name', () => {
      const strategy = strategyService.getStrategy('trend_following');
      expect(strategy).toBeDefined();
      expect(strategy.name).toBe('Trend Following');
    });

    it('should return null for unknown strategy', () => {
      const strategy = strategyService.getStrategy('unknown');
      expect(strategy).toBeNull();
    });
  });

  describe('getAvailableStrategies', () => {
    it('should return array of strategy info', () => {
      const strategies = strategyService.getAvailableStrategies();
      
      expect(Array.isArray(strategies)).toBe(true);
      expect(strategies.length).toBe(4);
      
      strategies.forEach(strategy => {
        expect(strategy.key).toBeDefined();
        expect(strategy.name).toBeDefined();
        expect(strategy.description).toBeDefined();
        expect(strategy.frequency).toBeDefined();
        expect(Array.isArray(strategy.indicators)).toBe(true);
      });
    });
  });

  describe('recommendStrategy', () => {
    it('should recommend conservative strategy for long horizon', () => {
      const recommendation = strategyService.recommendStrategy({
        horizon: 5,
        riskTolerance: 'low',
        portfolioSize: 20
      });
      
      expect(recommendation.strategy).toBe('conservative');
      expect(recommendation.frequency).toBe('monthly');
      expect(recommendation.confidence).toBeGreaterThan(0);
    });

    it('should recommend momentum strategy for short horizon and high risk', () => {
      const recommendation = strategyService.recommendStrategy({
        horizon: 1,
        riskTolerance: 'high',
        portfolioSize: 20
      });
      
      expect(recommendation.strategy).toBe('momentum');
      expect(recommendation.frequency).toBe('weekly');
      expect(recommendation.confidence).toBeGreaterThan(0);
    });

    it('should recommend trend following for medium horizon', () => {
      const recommendation = strategyService.recommendStrategy({
        horizon: 2,
        riskTolerance: 'medium',
        portfolioSize: 20
      });
      
      expect(recommendation.strategy).toBe('mean_reversion');
      expect(recommendation.frequency).toBe('daily');
      expect(recommendation.confidence).toBeGreaterThan(0);
    });

    it('should include reasoning in recommendation', () => {
      const recommendation = strategyService.recommendStrategy({
        horizon: 2,
        riskTolerance: 'medium',
        portfolioSize: 20
      });
      
      expect(recommendation.reasoning).toBeDefined();
      expect(typeof recommendation.reasoning).toBe('string');
      expect(recommendation.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('generateAllStrategySignals', () => {
    it('should generate signals for all strategies', () => {
      const allSignals = strategyService.generateAllStrategySignals(priceData);
      
      expect(allSignals.size).toBe(4);
      expect(allSignals.has('trend_following')).toBe(true);
      expect(allSignals.has('mean_reversion')).toBe(true);
      expect(allSignals.has('momentum')).toBe(true);
      expect(allSignals.has('conservative')).toBe(true);
    });

    it('should generate signals for each ticker in each strategy', () => {
      const allSignals = strategyService.generateAllStrategySignals(priceData);
      
      for (const [strategyName, signals] of allSignals) {
        expect(signals.size).toBe(3); // 3 tickers
        expect(signals.has('AAPL')).toBe(true);
        expect(signals.has('MSFT')).toBe(true);
        expect(signals.has('GOOGL')).toBe(true);
      }
    });
  });

  describe('compareStrategies', () => {
    it('should compare all strategies', () => {
      const comparison = strategyService.compareStrategies(priceData);
      
      expect(comparison.trend_following).toBeDefined();
      expect(comparison.mean_reversion).toBeDefined();
      expect(comparison.momentum).toBeDefined();
      expect(comparison.conservative).toBeDefined();
    });

    it('should include signal distribution for each strategy', () => {
      const comparison = strategyService.compareStrategies(priceData);
      
      Object.values(comparison).forEach(strategyData => {
        expect(strategyData.signalDistribution).toBeDefined();
        expect(strategyData.signalDistribution.buy).toBeDefined();
        expect(strategyData.signalDistribution.hold).toBeDefined();
        expect(strategyData.signalDistribution.sell).toBeDefined();
        expect(strategyData.averageConfidence).toBeDefined();
        expect(strategyData.totalSignals).toBeDefined();
      });
    });
  });

  describe('getStrategyPerformance', () => {
    it('should return performance for valid strategy', () => {
      const performance = strategyService.getStrategyPerformance('trend_following', priceData);
      
      expect(performance.strategy).toBe('trend_following');
      expect(performance.totalSignals).toBe(3);
      expect(performance.signalDistribution).toBeDefined();
      expect(performance.averageConfidence).toBeDefined();
      expect(performance.lastUpdated).toBeDefined();
    });

    it('should throw error for invalid strategy', () => {
      expect(() => {
        strategyService.getStrategyPerformance('invalid', priceData);
      }).toThrowError('Strategy invalid not found');
    });
  });

  describe('createCustomStrategy', () => {
    it('should create custom strategy', () => {
      const customStrategy = strategyService.createCustomStrategy(
        'Custom Test',
        [{ type: 'SMA', params: { window: 10 } }],
        'Custom entry rule',
        'Custom exit rule',
        'daily'
      );
      
      expect(customStrategy).toBeDefined();
      expect(customStrategy.name).toBe('Custom Test');
      expect(customStrategy.entryRule).toBe('Custom entry rule');
      expect(customStrategy.exitRule).toBe('Custom exit rule');
      expect(customStrategy.rebalance_freq).toBe('daily');
    });

    it('should add custom strategy to available strategies', () => {
      strategyService.createCustomStrategy('Custom Test', [], '', '', 'daily');
      
      const strategies = strategyService.getAvailableStrategies();
      const customStrategy = strategies.find(s => s.name === 'Custom Test');
      expect(customStrategy).toBeDefined();
    });
  });

  describe('getStrategyStatistics', () => {
    it('should return strategy statistics', () => {
      const stats = strategyService.getStrategyStatistics();
      
      expect(stats.totalStrategies).toBe(4);
      expect(Array.isArray(stats.strategies)).toBe(true);
      expect(stats.strategies.length).toBe(4);
      expect(stats.lastUpdated).toBeDefined();
    });
  });

  describe('generateRecommendationReasoning', () => {
    it('should generate reasoning for different scenarios', () => {
      const shortTermHighRisk = {
        horizon: 1,
        riskTolerance: 'high',
        portfolioSize: 20
      };
      
      const longTermLowRisk = {
        horizon: 5,
        riskTolerance: 'low',
        portfolioSize: 20
      };
      
      const reasoning1 = strategyService.generateRecommendationReasoning(shortTermHighRisk, 'momentum');
      const reasoning2 = strategyService.generateRecommendationReasoning(longTermLowRisk, 'conservative');
      
      expect(typeof reasoning1).toBe('string');
      expect(typeof reasoning2).toBe('string');
      expect(reasoning1.length).toBeGreaterThan(0);
      expect(reasoning2.length).toBeGreaterThan(0);
    });
  });
});
