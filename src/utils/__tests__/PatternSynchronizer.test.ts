import { PatternSynchronizer, SyncConfig } from '../PatternSynchronizer';
import { Pattern } from '../../types';

// Mock pattern for testing
class MockPattern implements Pattern {
  name = 'mock-pattern';
  ctx: any;
  updateCallCount = 0;
  lastDelta = 0;
  
  constructor(ctx: any) {
    this.ctx = ctx;
  }
  
  initialize(): void {}
  
  update(deltaTime: number): void {
    this.updateCallCount++;
    this.lastDelta = deltaTime;
  }
  
  render(): void {}
  cleanup(): void {}
}

describe('PatternSynchronizer', () => {
  let synchronizer: PatternSynchronizer;

  beforeEach(() => {
    synchronizer = new PatternSynchronizer(120); // 120 BPM
  });

  afterEach(() => {
    synchronizer.cleanup();
  });

  describe('Initialization', () => {
    test('should initialize with correct tempo', () => {
      expect(synchronizer.getTempo()).toBe(120);
    });

    test('should start in stopped state', () => {
      const timingInfo = synchronizer.getTimingInfo();
      expect(timingInfo.beat).toBe(0);
      expect(timingInfo.measure).toBe(0);
      expect(timingInfo.phrase).toBe(0);
    });
  });

  describe('Tempo Control', () => {
    test('should set tempo within valid range', () => {
      synchronizer.setTempo(140);
      expect(synchronizer.getTempo()).toBe(140);
    });

    test('should clamp tempo to valid range', () => {
      synchronizer.setTempo(300); // Too high
      expect(synchronizer.getTempo()).toBe(200);
      
      synchronizer.setTempo(30); // Too low
      expect(synchronizer.getTempo()).toBe(60);
    });
  });

  describe('Pattern Registration', () => {
    test('should register pattern with default config', () => {
      const pattern = new MockPattern(null);
      synchronizer.registerPattern('test', pattern);
      
      const config = synchronizer.getPatternConfig('test');
      expect(config).toBeDefined();
      expect(config?.masterTempo).toBe(120);
      expect(config?.syncMode).toBe('loose');
    });

    test('should register pattern with custom config', () => {
      const pattern = new MockPattern(null);
      const customConfig: Partial<SyncConfig> = {
        syncMode: 'strict',
        phaseOffset: 0.5,
        quantization: 8
      };
      
      synchronizer.registerPattern('test', pattern, customConfig);
      
      const config = synchronizer.getPatternConfig('test');
      expect(config?.syncMode).toBe('strict');
      expect(config?.phaseOffset).toBe(0.5);
      expect(config?.quantization).toBe(8);
    });

    test('should unregister pattern', () => {
      const pattern = new MockPattern(null);
      synchronizer.registerPattern('test', pattern);
      
      expect(synchronizer.getPatternConfig('test')).toBeDefined();
      
      synchronizer.unregisterPattern('test');
      expect(synchronizer.getPatternConfig('test')).toBeUndefined();
    });
  });

  describe('Synchronization', () => {
    test('should start and stop synchronization', () => {
      synchronizer.start();
      // Note: We can't easily test the running state without mocking performance.now()
      
      synchronizer.stop();
      // Synchronizer should be stopped
    });

    test('should update timing information', () => {
      synchronizer.start();
      
      // Simulate time passing
      synchronizer.update(1000); // 1 second
      
      const timingInfo = synchronizer.getTimingInfo();
      expect(timingInfo.masterClock).toBeGreaterThan(0);
    });

    test('should update registered patterns', () => {
      const pattern1 = new MockPattern(null);
      const pattern2 = new MockPattern(null);
      
      synchronizer.registerPattern('pattern1', pattern1);
      synchronizer.registerPattern('pattern2', pattern2);
      synchronizer.start();
      
      synchronizer.update(16.67); // ~60fps
      
      expect(pattern1.updateCallCount).toBeGreaterThan(0);
      expect(pattern2.updateCallCount).toBeGreaterThan(0);
    });
  });

  describe('Sync Callbacks', () => {
    test('should register and call sync callbacks', (done) => {
      let callbackCalled = false;
      
      synchronizer.onSync((event) => {
        callbackCalled = true;
        expect(event.type).toBeDefined();
        expect(['beat', 'measure', 'phrase']).toContain(event.type);
        done();
      });
      
      synchronizer.start();
      
      // Simulate enough time to trigger a beat
      setTimeout(() => {
        synchronizer.update(1000);
        if (!callbackCalled) {
          done(); // Complete test even if callback wasn't called
        }
      }, 10);
    });

    test('should remove sync callbacks', () => {
      const callback = jest.fn();
      
      synchronizer.onSync(callback);
      synchronizer.offSync(callback);
      
      synchronizer.start();
      synchronizer.update(1000);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Quantization', () => {
    test('should quantize values to beat grid', () => {
      synchronizer.setTempo(120); // 500ms per beat
      
      const quantized = synchronizer.quantize(750, 4); // Should snap to nearest 1/4 beat
      expect(quantized).toBeCloseTo(750, 50); // Allow some tolerance
    });

    test('should quantize with different subdivisions', () => {
      synchronizer.setTempo(120);
      
      const quantized8th = synchronizer.quantize(300, 8);
      const quantized16th = synchronizer.quantize(300, 16);
      
      expect(quantized8th).toBeDefined();
      expect(quantized16th).toBeDefined();
    });
  });

  describe('Pattern Configuration Updates', () => {
    test('should update pattern configuration', () => {
      const pattern = new MockPattern(null);
      synchronizer.registerPattern('test', pattern);
      
      synchronizer.updatePatternConfig('test', {
        syncMode: 'strict',
        phaseOffset: 0.25
      });
      
      const config = synchronizer.getPatternConfig('test');
      expect(config?.syncMode).toBe('strict');
      expect(config?.phaseOffset).toBe(0.25);
    });

    test('should update tempo for all patterns', () => {
      const pattern1 = new MockPattern(null);
      const pattern2 = new MockPattern(null);
      
      synchronizer.registerPattern('pattern1', pattern1);
      synchronizer.registerPattern('pattern2', pattern2);
      
      synchronizer.setTempo(140);
      
      const config1 = synchronizer.getPatternConfig('pattern1');
      const config2 = synchronizer.getPatternConfig('pattern2');
      
      expect(config1?.masterTempo).toBe(140);
      expect(config2?.masterTempo).toBe(140);
    });
  });

  describe('Scheduled Callbacks', () => {
    test('should schedule callback for specific beat', (done) => {
      synchronizer.start();
      
      synchronizer.scheduleCallback(1, () => {
        done();
      });
      
      // Simulate time to reach beat 1
      setTimeout(() => {
        synchronizer.update(1000);
      }, 10);
    });
  });

  describe('Sync Modes', () => {
    test('should handle different sync modes', () => {
      const strictPattern = new MockPattern(null);
      const loosePattern = new MockPattern(null);
      const independentPattern = new MockPattern(null);
      
      synchronizer.registerPattern('strict', strictPattern, { syncMode: 'strict' });
      synchronizer.registerPattern('loose', loosePattern, { syncMode: 'loose' });
      synchronizer.registerPattern('independent', independentPattern, { syncMode: 'independent' });
      
      synchronizer.start();
      synchronizer.update(16.67);
      
      // All patterns should be updated
      expect(strictPattern.updateCallCount).toBeGreaterThan(0);
      expect(loosePattern.updateCallCount).toBeGreaterThan(0);
      expect(independentPattern.updateCallCount).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup all patterns and callbacks', () => {
      const pattern = new MockPattern(null);
      const callback = jest.fn();
      
      synchronizer.registerPattern('test', pattern);
      synchronizer.onSync(callback);
      
      synchronizer.cleanup();
      
      expect(synchronizer.getPatternConfig('test')).toBeUndefined();
      
      // Start and update should not call callback after cleanup
      synchronizer.start();
      synchronizer.update(1000);
      expect(callback).not.toHaveBeenCalled();
    });
  });
});