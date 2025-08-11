import { PerformanceMonitor, PerformanceMetrics } from '../PerformanceMonitor';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
Object.defineProperty(global.performance, 'now', {
  value: mockPerformanceNow,
  writable: true
});

// Mock performance.memory
Object.defineProperty(global.performance, 'memory', {
  value: {
    usedJSHeapSize: 25 * 1024 * 1024, // 25MB
    totalJSHeapSize: 50 * 1024 * 1024,
    jsHeapSizeLimit: 100 * 1024 * 1024
  },
  writable: true
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let mockCallback: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockPerformanceNow.mockReturnValue(0);
    
    monitor = new PerformanceMonitor({
      targetFps: 60,
      minFps: 30,
      memoryThreshold: 50,
      enableAutoOptimization: true
    });
    
    mockCallback = jest.fn();
    monitor.addCallback(mockCallback);
  });
  
  afterEach(() => {
    monitor.stop();
    jest.useRealTimers();
  });
  
  describe('Basic Functionality', () => {
    test('should initialize with default configuration', () => {
      const defaultMonitor = new PerformanceMonitor();
      const metrics = defaultMonitor.getMetrics();
      
      expect(metrics.fps).toBe(60);
      expect(metrics.isPerformanceDegraded).toBe(false);
      expect(metrics.degradationLevel).toBe(0);
    });
    
    test('should start and stop monitoring', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      monitor.start();
      expect(consoleSpy).toHaveBeenCalledWith('Performance monitoring started');
      
      monitor.stop();
      expect(consoleSpy).toHaveBeenCalledWith('Performance monitoring stopped');
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('FPS Tracking', () => {
    test('should calculate FPS correctly', () => {
      monitor.start();
      
      // Simulate 60fps (16.67ms per frame)
      mockPerformanceNow.mockReturnValue(0);
      monitor.update(0);
      
      mockPerformanceNow.mockReturnValue(16.67);
      monitor.update(16.67);
      
      const metrics = monitor.getMetrics();
      expect(metrics.fps).toBeCloseTo(60, 0);
    });
    
    test('should detect low FPS', () => {
      monitor.start();
      
      // Simulate 30fps (33.33ms per frame)
      mockPerformanceNow.mockReturnValue(0);
      monitor.update(0);
      
      mockPerformanceNow.mockReturnValue(33.33);
      monitor.update(33.33);
      
      const metrics = monitor.getMetrics();
      expect(metrics.fps).toBeCloseTo(30, 0);
    });
    
    test('should calculate average FPS over time', () => {
      monitor.start();
      
      const frameTimes = [16.67, 20, 16.67, 25, 16.67]; // Mixed frame times
      let currentTime = 0;
      
      frameTimes.forEach(frameTime => {
        currentTime += frameTime;
        mockPerformanceNow.mockReturnValue(currentTime);
        monitor.update(currentTime);
      });
      
      const metrics = monitor.getMetrics();
      expect(metrics.averageFps).toBeGreaterThan(40);
      expect(metrics.averageFps).toBeLessThanOrEqual(60);
    });
  });
  
  describe('Performance Degradation', () => {
    test('should trigger degradation when FPS drops below threshold', () => {
      monitor.start();
      
      // Simulate consistently low FPS with proper timing
      let currentTime = 0;
      for (let i = 0; i < 20; i++) {
        currentTime += 40; // 25fps
        mockPerformanceNow.mockReturnValue(currentTime);
        monitor.update(currentTime);
        
        // Advance timers to allow optimization cooldown
        if (i === 10) {
          jest.advanceTimersByTime(3000);
        }
      }
      
      const metrics = monitor.getMetrics();
      expect(metrics.isPerformanceDegraded).toBe(true);
      expect(metrics.degradationLevel).toBeGreaterThan(0);
    });
    
    test('should restore performance when FPS improves', () => {
      monitor.start();
      
      // First degrade performance
      let currentTime = 0;
      for (let i = 0; i < 15; i++) {
        currentTime += 40; // 25fps
        mockPerformanceNow.mockReturnValue(currentTime);
        monitor.update(currentTime);
      }
      
      // Allow optimization to trigger
      jest.advanceTimersByTime(3000);
      
      // Then improve performance
      for (let i = 0; i < 15; i++) {
        currentTime += 16.67; // 60fps
        mockPerformanceNow.mockReturnValue(currentTime);
        monitor.update(currentTime);
      }
      
      // Allow restoration to trigger
      jest.advanceTimersByTime(3000);
      
      const metrics = monitor.getMetrics();
      expect(metrics.isPerformanceDegraded).toBe(false);
    });
    
    test('should force degradation for testing', () => {
      monitor.forceDegradation(2);
      
      const metrics = monitor.getMetrics();
      expect(metrics.isPerformanceDegraded).toBe(true);
      expect(metrics.degradationLevel).toBe(2);
    });
  });
  
  describe('Memory Monitoring', () => {
    test('should track memory usage', () => {
      monitor.start();
      
      // Wait for memory monitoring to kick in
      jest.advanceTimersByTime(1100);
      
      const metrics = monitor.getMetrics();
      expect(metrics.memoryUsage).toBeCloseTo(25, 0); // 25MB
    });
    
    test('should trigger memory optimization when threshold exceeded', () => {
      // Set high memory usage
      (global.performance as any).memory.usedJSHeapSize = 60 * 1024 * 1024; // 60MB
      
      monitor.start();
      jest.advanceTimersByTime(1100);
      
      // Simulate frame update to trigger memory check
      mockPerformanceNow.mockReturnValue(16.67);
      monitor.update(16.67);
      
      expect(mockCallback).toHaveBeenCalled();
    });
  });
  
  describe('Callbacks and Events', () => {
    test('should notify callbacks on performance changes', () => {
      monitor.start();
      
      mockPerformanceNow.mockReturnValue(16.67);
      monitor.update(16.67);
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          fps: expect.any(Number),
          averageFps: expect.any(Number),
          memoryUsage: expect.any(Number),
          isPerformanceDegraded: expect.any(Boolean),
          degradationLevel: expect.any(Number)
        })
      );
    });
    
    test('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      monitor.addCallback(errorCallback);
      monitor.start();
      
      mockPerformanceNow.mockReturnValue(16.67);
      monitor.update(16.67);
      
      expect(consoleSpy).toHaveBeenCalledWith('Performance callback error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
    
    test('should remove callbacks correctly', () => {
      monitor.removeCallback(mockCallback);
      monitor.start();
      
      mockPerformanceNow.mockReturnValue(16.67);
      monitor.update(16.67);
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
  
  describe('Performance Recommendations', () => {
    test('should provide recommendations for low FPS', () => {
      monitor.start();
      
      // Simulate low FPS with proper timing
      let currentTime = 0;
      for (let i = 0; i < 15; i++) {
        currentTime += 50; // 20fps
        mockPerformanceNow.mockReturnValue(currentTime);
        monitor.update(currentTime);
      }
      
      const recommendations = monitor.getRecommendations();
      expect(recommendations).toContain('Consider reducing pattern complexity');
      expect(recommendations).toContain('Disable particle effects');
    });
    
    test('should provide recommendations for high memory usage', () => {
      // Set high memory usage
      (global.performance as any).memory.usedJSHeapSize = 45 * 1024 * 1024; // 45MB (90% of 50MB threshold)
      
      monitor.start();
      jest.advanceTimersByTime(1100);
      
      const recommendations = monitor.getRecommendations();
      expect(recommendations).toContain('Memory usage is high - consider pattern cleanup');
    });
  });
  
  describe('Data Export and Analysis', () => {
    test('should export performance data', () => {
      monitor.start();
      
      mockPerformanceNow.mockReturnValue(16.67);
      monitor.update(16.67);
      
      const data = monitor.exportData();
      
      expect(data).toHaveProperty('config');
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('frameTimes');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('recommendations');
    });
    
    test('should generate performance summary', () => {
      monitor.start();
      
      mockPerformanceNow.mockReturnValue(16.67);
      monitor.update(16.67);
      
      const summary = monitor.getPerformanceSummary();
      
      expect(summary).toContain('FPS:');
      expect(summary).toContain('Memory:');
      expect(summary).toContain('Degraded:');
    });
  });
  
  describe('Reset and Cleanup', () => {
    test('should reset performance state', () => {
      monitor.start();
      monitor.forceDegradation(2);
      
      monitor.reset();
      
      const metrics = monitor.getMetrics();
      expect(metrics.isPerformanceDegraded).toBe(false);
      expect(metrics.degradationLevel).toBe(0);
    });
  });
});

// Performance integration tests
describe('PerformanceMonitor Integration', () => {
  test('should maintain 60fps target for sustained period', () => {
    const monitor = new PerformanceMonitor({
      targetFps: 60,
      enableAutoOptimization: false
    });
    
    monitor.start();
    
    let currentTime = 0;
    const targetFrames = 60; // 1 second at 60fps
    
    for (let i = 0; i < targetFrames; i++) {
      currentTime += 16.67; // 60fps
      mockPerformanceNow.mockReturnValue(currentTime);
      monitor.update(currentTime);
    }
    
    const metrics = monitor.getMetrics();
    expect(metrics.averageFps).toBeGreaterThanOrEqual(55);
    monitor.stop();
  });
  
  test('should handle performance degradation gracefully', () => {
    const monitor = new PerformanceMonitor({
      targetFps: 60,
      minFps: 30,
      degradationThreshold: 45,
      enableAutoOptimization: true
    });
    
    const degradationCallback = jest.fn();
    monitor.addCallback(degradationCallback);
    
    monitor.start();
    
    // Simulate performance drop with proper timing
    let currentTime = 0;
    for (let i = 0; i < 25; i++) {
      currentTime += 30; // 33fps
      mockPerformanceNow.mockReturnValue(currentTime);
      monitor.update(currentTime);
      
      // Allow optimization to trigger
      if (i === 15) {
        jest.advanceTimersByTime(3000);
      }
    }
    
    expect(degradationCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        isPerformanceDegraded: true,
        degradationLevel: expect.any(Number)
      })
    );
    
    monitor.stop();
  });
});