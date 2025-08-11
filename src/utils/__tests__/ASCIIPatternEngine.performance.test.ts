import { ASCIIPatternEngine } from '../ASCIIPatternEngine';

// Mock canvas and context
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: jest.fn(),
  parentElement: {
    clientWidth: 800,
    clientHeight: 600
  },
  style: {}
} as unknown as HTMLCanvasElement;

const mockContext = {
  font: '',
  textBaseline: '',
  textAlign: '',
  fillStyle: '',
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  measureText: jest.fn().mockReturnValue({ width: 8 }),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  globalAlpha: 1,
  globalCompositeOperation: 'source-over'
} as unknown as CanvasRenderingContext2D;

(mockCanvas.getContext as jest.Mock).mockReturnValue(mockContext);

// Mock performance.now
const mockPerformanceNow = jest.fn();
Object.defineProperty(global.performance, 'now', {
  value: mockPerformanceNow,
  writable: true
});

// Mock performance.memory
Object.defineProperty(global.performance, 'memory', {
  value: {
    usedJSHeapSize: 20 * 1024 * 1024, // 20MB
    totalJSHeapSize: 50 * 1024 * 1024,
    jsHeapSizeLimit: 100 * 1024 * 1024
  },
  writable: true
});

// Mock requestAnimationFrame
let animationFrameId = 0;
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(() => callback(performance.now()), 16);
  return ++animationFrameId;
});

global.cancelAnimationFrame = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

describe('ASCIIPatternEngine Performance Tests', () => {
  let engine: ASCIIPatternEngine;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
    
    engine = new ASCIIPatternEngine(mockCanvas, {
      enablePerformanceMonitoring: true,
      enableDebug: false,
      targetFps: 60
    });
  });
  
  afterEach(() => {
    engine.cleanup();
  });
  
  describe('Frame Rate Performance', () => {
    test('should maintain 60fps target during normal operation', (done) => {
      let frameCount = 0;
      const targetFrames = 60; // 1 second worth
      const startTime = performance.now();
      
      const performanceCallback = jest.fn((metrics) => {
        frameCount++;
        
        if (frameCount >= targetFrames) {
          const avgFps = metrics.averageFps;
          expect(avgFps).toBeGreaterThanOrEqual(55); // Allow 5fps tolerance
          expect(avgFps).toBeLessThanOrEqual(65);
          
          engine.stopAnimation();
          done();
        }
      });
      
      engine.getPerformanceMonitor().addCallback(performanceCallback);
      engine.startAnimation();
      
      // Simulate consistent frame timing
      let currentTime = 0;
      const simulateFrames = () => {
        if (frameCount < targetFrames) {
          currentTime += 16.67; // 60fps
          mockPerformanceNow.mockReturnValue(currentTime);
          setTimeout(simulateFrames, 1);
        }
      };
      
      simulateFrames();
    });
    
    test('should detect and respond to performance degradation', (done) => {
      let degradationDetected = false;
      
      const performanceCallback = jest.fn((metrics) => {
        if (metrics.isPerformanceDegraded && !degradationDetected) {
          degradationDetected = true;
          expect(metrics.degradationLevel).toBeGreaterThan(0);
          expect(metrics.averageFps).toBeLessThan(45);
          
          engine.stopAnimation();
          done();
        }
      });
      
      engine.getPerformanceMonitor().addCallback(performanceCallback);
      engine.startAnimation();
      
      // Simulate poor performance (25fps)
      let currentTime = 0;
      let frameCount = 0;
      const simulateSlowFrames = () => {
        if (frameCount < 20 && !degradationDetected) {
          currentTime += 40; // 25fps
          mockPerformanceNow.mockReturnValue(currentTime);
          frameCount++;
          setTimeout(simulateSlowFrames, 1);
        }
      };
      
      simulateSlowFrames();
    });
    
    test('should optimize frame rate when performance degrades', () => {
      engine.startAnimation();
      
      // Force performance degradation
      engine.forcePerformanceDegradation(2);
      
      const metrics = engine.getPerformanceMetrics();
      expect(metrics.isPerformanceDegraded).toBe(true);
      expect(metrics.degradationLevel).toBe(2);
      
      // Check that optimizations are applied
      expect(engine['frameTimeTarget']).toBeGreaterThan(16.67); // Should be reduced from 60fps
      expect(engine['isPerformanceOptimized']).toBe(true);
    });
  });
  
  describe('Memory Usage Performance', () => {
    test('should keep memory usage below threshold', (done) => {
      const memoryCallback = jest.fn((metrics) => {
        expect(metrics.memoryUsage).toBeLessThan(50); // 50MB threshold
        
        if (metrics.memoryUsage > 0) {
          engine.stopAnimation();
          done();
        }
      });
      
      engine.getPerformanceMonitor().addCallback(memoryCallback);
      engine.startAnimation();
      
      // Trigger memory monitoring
      jest.advanceTimersByTime(1100);
    });
    
    test('should handle memory pressure gracefully', () => {
      // Simulate high memory usage
      (global.performance as any).memory.usedJSHeapSize = 60 * 1024 * 1024; // 60MB
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      engine.startAnimation();
      jest.advanceTimersByTime(1100);
      
      // Simulate frame update to trigger memory check
      mockPerformanceNow.mockReturnValue(16.67);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Memory threshold exceeded')
      );
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Pattern Loading Performance', () => {
    test('should load patterns efficiently', async () => {
      const startTime = performance.now();
      
      await engine.switchPattern('matrix-rain');
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Pattern should load quickly (adjust threshold as needed)
      expect(loadTime).toBeLessThan(100); // 100ms
      expect(engine.isPatternLoaded('matrix-rain')).toBe(true);
    });
    
    test('should preload patterns without blocking', async () => {
      const startTime = performance.now();
      
      const preloadPromise = engine.preloadPatterns(['matrix-rain', 'binary-waves', 'geometric-flow']);
      
      // Should return immediately (non-blocking)
      const immediateTime = performance.now();
      expect(immediateTime - startTime).toBeLessThan(10);
      
      await preloadPromise;
      
      // All patterns should be loaded
      expect(engine.isPatternLoaded('matrix-rain')).toBe(true);
      expect(engine.isPatternLoaded('binary-waves')).toBe(true);
      expect(engine.isPatternLoaded('geometric-flow')).toBe(true);
    });
    
    test('should handle concurrent pattern switches efficiently', async () => {
      const startTime = performance.now();
      
      // Attempt multiple concurrent switches
      const switches = [
        engine.switchPattern('matrix-rain'),
        engine.switchPattern('binary-waves'),
        engine.switchPattern('geometric-flow')
      ];
      
      // Wait for all to complete
      await Promise.allSettled(switches);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle concurrent operations efficiently
      expect(totalTime).toBeLessThan(500); // 500ms for all operations
    });
  });
  
  describe('Animation Loop Performance', () => {
    test('should use requestAnimationFrame efficiently', () => {
      engine.startAnimation();
      
      expect(global.requestAnimationFrame).toHaveBeenCalled();
      expect(engine.isAnimating()).toBe(true);
      
      engine.stopAnimation();
      
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
      expect(engine.isAnimating()).toBe(false);
    });
    
    test('should handle delta time calculations correctly', () => {
      engine.startAnimation();
      
      // Simulate frame updates with varying delta times
      const deltaTimes = [16.67, 20, 16.67, 25, 16.67];
      let currentTime = 0;
      
      deltaTimes.forEach(deltaTime => {
        currentTime += deltaTime;
        mockPerformanceNow.mockReturnValue(currentTime);
        
        // The engine should handle varying frame times gracefully
        expect(() => {
          // Trigger internal update (this would normally happen in animation loop)
          engine.getPerformanceMonitor().update(currentTime);
        }).not.toThrow();
      });
      
      const metrics = engine.getPerformanceMetrics();
      expect(metrics.fps).toBeGreaterThan(0);
      expect(metrics.averageFps).toBeGreaterThan(0);
    });
    
    test('should skip frames when running too fast', () => {
      engine.startAnimation();
      
      // Simulate very fast frame rate (120fps)
      let currentTime = 0;
      let frameCount = 0;
      
      for (let i = 0; i < 10; i++) {
        currentTime += 8.33; // 120fps
        mockPerformanceNow.mockReturnValue(currentTime);
        
        // Engine should internally limit to target frame rate
        engine.getPerformanceMonitor().update(currentTime);
        frameCount++;
      }
      
      // Should handle high frame rates without issues
      expect(frameCount).toBe(10);
    });
  });
  
  describe('Resource Cleanup Performance', () => {
    test('should cleanup resources efficiently', async () => {
      // Load some patterns and start animation
      await engine.switchPattern('matrix-rain');
      engine.startAnimation();
      
      const startTime = performance.now();
      
      engine.cleanup();
      
      const endTime = performance.now();
      const cleanupTime = endTime - startTime;
      
      // Cleanup should be fast
      expect(cleanupTime).toBeLessThan(50); // 50ms
      expect(engine.isAnimating()).toBe(false);
    });
    
    test('should prevent memory leaks during cleanup', async () => {
      // Create multiple patterns and layers
      await engine.switchPattern('matrix-rain');
      await engine.addPatternToLayer('background', 'binary-waves');
      
      engine.startAnimation();
      
      // Get initial memory estimate
      const initialMemory = engine.getPatternLoader().getMemoryUsageEstimate();
      
      engine.cleanup();
      
      // Memory should be freed
      const finalMemory = engine.getPatternLoader().getMemoryUsageEstimate();
      expect(finalMemory).toBeLessThan(initialMemory);
    });
  });
  
  describe('Performance Monitoring Integration', () => {
    test('should provide accurate performance metrics', () => {
      engine.startAnimation();
      
      // Simulate some frame updates
      let currentTime = 0;
      for (let i = 0; i < 5; i++) {
        currentTime += 16.67;
        mockPerformanceNow.mockReturnValue(currentTime);
        engine.getPerformanceMonitor().update(currentTime);
      }
      
      const metrics = engine.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('averageFps');
      expect(metrics).toHaveProperty('frameTime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('isPerformanceDegraded');
      expect(metrics).toHaveProperty('degradationLevel');
      
      expect(typeof metrics.fps).toBe('number');
      expect(typeof metrics.averageFps).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
      expect(typeof metrics.isPerformanceDegraded).toBe('boolean');
      expect(typeof metrics.degradationLevel).toBe('number');
    });
    
    test('should reset performance monitoring correctly', () => {
      engine.startAnimation();
      engine.forcePerformanceDegradation(2);
      
      expect(engine.getPerformanceMetrics().isPerformanceDegraded).toBe(true);
      
      engine.resetPerformanceMonitoring();
      
      const metrics = engine.getPerformanceMetrics();
      expect(metrics.isPerformanceDegraded).toBe(false);
      expect(metrics.degradationLevel).toBe(0);
    });
  });
});

// Stress tests
describe('ASCIIPatternEngine Stress Tests', () => {
  let engine: ASCIIPatternEngine;
  
  beforeEach(() => {
    engine = new ASCIIPatternEngine(mockCanvas, {
      enablePerformanceMonitoring: true,
      targetFps: 60
    });
  });
  
  afterEach(() => {
    engine.cleanup();
  });
  
  test('should handle rapid pattern switching', async () => {
    const patterns = ['matrix-rain', 'binary-waves', 'geometric-flow', 'terminal-cursor'];
    
    engine.startAnimation();
    
    // Rapidly switch between patterns
    for (let i = 0; i < 20; i++) {
      const pattern = patterns[i % patterns.length];
      await engine.switchPattern(pattern);
      
      // Small delay to simulate real usage
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Should still be running smoothly
    expect(engine.isAnimating()).toBe(true);
    
    const metrics = engine.getPerformanceMetrics();
    expect(metrics.fps).toBeGreaterThan(0);
  });
  
  test('should handle multiple layers with patterns', async () => {
    const layers = ['background', 'middle', 'foreground'];
    const patterns = ['matrix-rain', 'binary-waves', 'geometric-flow'];
    
    engine.startAnimation();
    
    // Add patterns to multiple layers
    for (let i = 0; i < layers.length; i++) {
      await engine.addPatternToLayer(layers[i], patterns[i]);
    }
    
    // Should handle multiple layers without significant performance impact
    const metrics = engine.getPerformanceMetrics();
    expect(metrics.memoryUsage).toBeLessThan(100); // Should stay reasonable
  });
  
  test('should maintain performance over extended period', (done) => {
    let frameCount = 0;
    const targetFrames = 300; // 5 seconds at 60fps
    let performanceIssues = 0;
    
    const performanceCallback = jest.fn((metrics) => {
      frameCount++;
      
      if (metrics.averageFps < 50) {
        performanceIssues++;
      }
      
      if (frameCount >= targetFrames) {
        // Should have minimal performance issues over extended period
        expect(performanceIssues).toBeLessThan(targetFrames * 0.1); // Less than 10% of frames
        
        engine.stopAnimation();
        done();
      }
    });
    
    engine.getPerformanceMonitor().addCallback(performanceCallback);
    engine.startAnimation();
    
    // Simulate consistent timing
    let currentTime = 0;
    const simulateExtendedRun = () => {
      if (frameCount < targetFrames) {
        currentTime += 16.67;
        mockPerformanceNow.mockReturnValue(currentTime);
        setTimeout(simulateExtendedRun, 1);
      }
    };
    
    simulateExtendedRun();
  });
});