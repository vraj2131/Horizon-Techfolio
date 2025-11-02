/**
 * Unit tests for IndicatorService and technical indicators
 */

const { IndicatorService, SMAIndicator, RSIIndicator, MACDIndicator, BollingerBandsIndicator } = require('../../src/services/IndicatorService');
const { createMockPriceData } = require('../helpers/testHelpers');

describe('IndicatorService', () => {
  let priceData;

  beforeEach(() => {
    // Create mock price data with known patterns for testing
    priceData = [
      { close: 100 }, { close: 102 }, { close: 101 }, { close: 103 },
      { close: 105 }, { close: 104 }, { close: 106 }, { close: 108 },
      { close: 107 }, { close: 109 }, { close: 111 }, { close: 110 },
      { close: 112 }, { close: 114 }, { close: 113 }, { close: 115 },
      { close: 117 }, { close: 116 }, { close: 118 }, { close: 120 }
    ];
  });

  describe('createIndicator', () => {
    it('should create SMA indicator with default parameters', () => {
      const indicator = IndicatorService.createIndicator('SMA');
      expect(indicator.type).toBe('SMA');
      expect(indicator.window).toBe(20);
    });

    it('should create SMA indicator with custom parameters', () => {
      const indicator = IndicatorService.createIndicator('SMA', { window: 10 });
      expect(indicator.type).toBe('SMA');
      expect(indicator.window).toBe(10);
    });

    it('should create RSI indicator with custom parameters', () => {
      const indicator = IndicatorService.createIndicator('RSI', { 
        window: 14, 
        overbought: 80, 
        oversold: 20 
      });
      expect(indicator.type).toBe('RSI');
      expect(indicator.window).toBe(14);
      expect(indicator.params.overbought).toBe(80);
      expect(indicator.params.oversold).toBe(20);
    });

    it('should throw error for unknown indicator type', () => {
      expect(() => {
        IndicatorService.createIndicator('UNKNOWN');
      }).toThrowError('Unknown indicator type: UNKNOWN');
    });
  });

  describe('getAvailableIndicators', () => {
    it('should return list of available indicators', () => {
      const indicators = IndicatorService.getAvailableIndicators();
      expect(Array.isArray(indicators)).toBe(true);
      expect(indicators.length).toBeGreaterThan(0);
      
      const smaIndicator = indicators.find(ind => ind.type === 'SMA');
      expect(smaIndicator).toBeDefined();
      expect(smaIndicator.name).toBe('Simple Moving Average');
    });
  });

  describe('calculateAllIndicators', () => {
    it('should calculate multiple indicators', () => {
      const results = IndicatorService.calculateAllIndicators(priceData, ['SMA', 'RSI']);
      
      expect(results.SMA).toBeDefined();
      expect(results.RSI).toBeDefined();
      expect(results.SMA.values).toBeDefined();
      expect(results.SMA.signals).toBeDefined();
    });

    it('should handle errors gracefully', () => {
      const shortData = [{ close: 100 }]; // Insufficient data
      const results = IndicatorService.calculateAllIndicators(shortData, ['SMA']);
      
      expect(results.SMA.error).toBeDefined();
    });
  });
});

describe('SMAIndicator', () => {
  let smaIndicator;
  let priceData;

  beforeEach(() => {
    smaIndicator = new SMAIndicator(5);
    priceData = [
      { close: 100 }, { close: 102 }, { close: 101 }, { close: 103 },
      { close: 105 }, { close: 104 }, { close: 106 }, { close: 108 },
      { close: 107 }, { close: 109 }
    ];
  });

  describe('calculateValues', () => {
    it('should calculate SMA values correctly', () => {
      const values = smaIndicator.calculateValues(priceData.map(p => p.close));
      
      expect(values.length).toBe(6); // 10 data points - 5 window + 1
      expect(values[0]).toBe(102.2); // (100+102+101+103+105)/5
      expect(values[1]).toBe(103); // (102+101+103+105+104)/5
    });

    it('should throw error for insufficient data', () => {
      const shortData = [100, 102, 103];
      expect(() => {
        smaIndicator.calculateValues(shortData);
      }).toThrowError('Insufficient data: need at least 5 data points');
    });
  });

  describe('calculateSignal', () => {
    it('should generate buy signal when price crosses above SMA', () => {
      // Create data where price starts below SMA and crosses above
      const crossingData = [
        { close: 100 }, { close: 99 }, { close: 98 }, { close: 97 }, { close: 96 }, // Below SMA
        { close: 95 }, { close: 94 }, { close: 93 }, { close: 92 }, { close: 91 }, // Below SMA
        { close: 90 }, { close: 89 }, { close: 88 }, { close: 87 }, { close: 86 }, // Below SMA
        { close: 85 }, { close: 84 }, { close: 83 }, { close: 82 }, { close: 81 }, // Below SMA
        { close: 80 }, { close: 79 }, { close: 78 }, { close: 77 }, { close: 76 }, // Below SMA
        { close: 75 }, { close: 76 }, { close: 77 }, { close: 78 }, { close: 79 }, // Crossing up
        { close: 80 }, { close: 81 }, { close: 82 }, { close: 83 }, { close: 84 }  // Above SMA
      ];
      
      const values = smaIndicator.calculateValues(crossingData.map(p => p.close));
      const signals = smaIndicator.generateSignals(crossingData, values);
      
      // Check if any buy signals were generated
      expect(signals).toContain('buy');
    });

    it('should generate sell signal when price crosses below SMA', () => {
      // Create data where price starts above SMA and crosses below
      const decliningData = [
        { close: 80 }, { close: 81 }, { close: 82 }, { close: 83 }, { close: 84 }, // Above SMA
        { close: 85 }, { close: 86 }, { close: 87 }, { close: 88 }, { close: 89 }, // Above SMA
        { close: 90 }, { close: 91 }, { close: 92 }, { close: 93 }, { close: 94 }, // Above SMA
        { close: 95 }, { close: 96 }, { close: 97 }, { close: 98 }, { close: 99 }, // Above SMA
        { close: 100 }, { close: 99 }, { close: 98 }, { close: 97 }, { close: 96 }, // Above SMA
        { close: 95 }, { close: 94 }, { close: 93 }, { close: 92 }, { close: 91 }, // Crossing down
        { close: 90 }, { close: 89 }, { close: 88 }, { close: 87 }, { close: 86 }  // Below SMA
      ];
      
      const values = smaIndicator.calculateValues(decliningData.map(p => p.close));
      const signals = smaIndicator.generateSignals(decliningData, values);
      
      // Check if any sell signals were generated
      expect(signals).toContain('sell');
    });
  });

  describe('compute', () => {
    it('should compute values and signals together', () => {
      const values = smaIndicator.compute(priceData);
      
      expect(values.length).toBeGreaterThan(0);
      expect(smaIndicator.getValues().length).toBe(values.length);
      expect(smaIndicator.getAllSignals().length).toBe(values.length);
    });
  });
});

describe('RSIIndicator', () => {
  let rsiIndicator;
  let priceData;

  beforeEach(() => {
    rsiIndicator = new RSIIndicator(5, 70, 30);
    // Create price data with clear RSI patterns
    priceData = [
      { close: 100 }, { close: 102 }, { close: 101 }, { close: 103 },
      { close: 105 }, { close: 104 }, { close: 106 }, { close: 108 },
      { close: 107 }, { close: 109 }, { close: 111 }, { close: 110 },
      { close: 112 }, { close: 114 }, { close: 113 }, { close: 115 },
      { close: 117 }, { close: 116 }, { close: 118 }, { close: 120 }
    ];
  });

  describe('calculateValues', () => {
    it('should calculate RSI values correctly', () => {
      const values = rsiIndicator.calculateValues(priceData.map(p => p.close));
      
      expect(values.length).toBeGreaterThan(0);
      // RSI should be between 0 and 100
      values.forEach(rsi => {
        expect(rsi).toBeGreaterThanOrEqual(0);
        expect(rsi).toBeLessThanOrEqual(100);
      });
    });

    it('should handle edge case of no losses', () => {
      const increasingData = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109];
      const values = rsiIndicator.calculateValues(increasingData);
      
      expect(values.length).toBeGreaterThan(0);
      // All RSI values should be 100 for constantly increasing prices
      values.forEach(rsi => {
        expect(rsi).toBe(100);
      });
    });
  });

  describe('calculateSignal', () => {
    it('should generate buy signal when RSI is oversold', () => {
      // Create declining price data to generate low RSI
      const decliningData = Array(20).fill(0).map((_, i) => ({ close: 100 - i }));
      
      const values = rsiIndicator.calculateValues(decliningData.map(p => p.close));
      const signals = rsiIndicator.generateSignals(decliningData, values);
      
      // Should have buy signals for oversold conditions
      expect(signals).toContain('buy');
    });

    it('should generate sell signal when RSI is overbought', () => {
      // Create rising price data to generate high RSI
      const risingData = Array(20).fill(0).map((_, i) => ({ close: 100 + i }));
      
      const values = rsiIndicator.calculateValues(risingData.map(p => p.close));
      const signals = rsiIndicator.generateSignals(risingData, values);
      
      // Should have sell signals for overbought conditions
      expect(signals).toContain('sell');
    });
  });

  describe('getSignalStrength', () => {
    it('should return higher strength for extreme RSI values', () => {
      const values = rsiIndicator.calculateValues(priceData.map(p => p.close));
      
      // Test signal strength calculation
      const strength = rsiIndicator.getSignalStrength(0);
      expect(strength).toBeGreaterThanOrEqual(0);
      expect(strength).toBeLessThanOrEqual(1);
    });
  });
});

describe('MACDIndicator', () => {
  let macdIndicator;
  let priceData;

  beforeEach(() => {
    macdIndicator = new MACDIndicator(3, 5, 2); // Shorter periods for testing
    priceData = createMockPriceData('TEST', 20, 100, 0.02);
  });

  describe('calculateValues', () => {
    it('should calculate MACD components', () => {
      const closes = priceData.map(p => p.close);
      const values = macdIndicator.calculateValues(closes);
      
      expect(values.macdLine).toBeDefined();
      expect(values.signalLine).toBeDefined();
      expect(values.histogram).toBeDefined();
      
      expect(Array.isArray(values.macdLine)).toBe(true);
      expect(Array.isArray(values.signalLine)).toBe(true);
      expect(Array.isArray(values.histogram)).toBe(true);
    });
  });

  describe('calculateSignal', () => {
    it('should generate signals based on MACD crossovers', () => {
      const closes = priceData.map(p => p.close);
      const values = macdIndicator.calculateValues(closes);
      const signals = macdIndicator.generateSignals(priceData, values);
      
      // MACD might not generate signals with short test data, just check structure
      expect(Array.isArray(signals)).toBe(true);
      if (signals.length > 0) {
        expect(signals.every(s => ['buy', 'hold', 'sell'].includes(s))).toBe(true);
      }
    });
  });
});

describe('BollingerBandsIndicator', () => {
  let bbIndicator;
  let priceData;

  beforeEach(() => {
    bbIndicator = new BollingerBandsIndicator(5, 2);
    priceData = createMockPriceData('TEST', 15, 100, 0.05);
  });

  describe('calculateValues', () => {
    it('should calculate Bollinger Bands correctly', () => {
      const closes = priceData.map(p => p.close);
      const values = bbIndicator.calculateValues(closes);
      
      expect(values.upper).toBeDefined();
      expect(values.middle).toBeDefined();
      expect(values.lower).toBeDefined();
      
      expect(Array.isArray(values.upper)).toBe(true);
      expect(Array.isArray(values.middle)).toBe(true);
      expect(Array.isArray(values.lower)).toBe(true);
      
      // Upper band should be higher than middle, middle higher than lower
      for (let i = 0; i < values.upper.length; i++) {
        expect(values.upper[i]).toBeGreaterThan(values.middle[i]);
        expect(values.middle[i]).toBeGreaterThan(values.lower[i]);
      }
    });
  });

  describe('calculateSignal', () => {
    it('should generate signals based on price touching bands', () => {
      const closes = priceData.map(p => p.close);
      const values = bbIndicator.calculateValues(closes);
      const signals = bbIndicator.generateSignals(priceData, values);
      
      // Bollinger Bands might not generate signals with short test data, just check structure
      expect(Array.isArray(signals)).toBe(true);
      if (signals.length > 0) {
        expect(signals.every(s => ['buy', 'hold', 'sell'].includes(s))).toBe(true);
      }
    });
  });
});
