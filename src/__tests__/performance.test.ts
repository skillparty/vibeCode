import { ASCIIPatternEngine } from '../utils/ASCIIPatternEngine';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';

// Mock canvas context
const mockContext = {
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 10 })),
  canvas: { width: 1920, height: 1080 },
  font: '12px monospace',
  fillStyle: '#00ff00',
} as any;

describe('Performance Tests', () => {
  let engine: ASCIIPatternEngine;
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new ASCIIPatternEngine(mockContext);
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    engine.cleanup();
  });

  describe('60fps Performance Requirements', () => {
    test('should maintain 60fps during matrix pattern animation', async () => {
      const targetFPS = 60;
      const frameBudget = 1000 / targetFPS; // ~16.67ms per frame
      
      engine.initialize();
      engine.switchPattern('matrix');
      
      const frameTimings: number[] = [];
      
      // Simulate 60 frames (1 second at 60fps)
      for (let i = 0; i < 60; i++) {
        const startTime = performance.now();
        
        engine.update(frameBudget);
        engine.render();
        
        const endTime = performance.now();
        const frameTime = endTime - startTime;
        frameTimings.push(frameTime);
      }
      
      // Calculate average frame time
      const avgFrameTime = frameTimings.reduce((sum, time) => sum + time, 0) / frameTimings.length;
      
      // 95% of frames should be under budget
      const framesUnderBudget = frameTimings.filter(time => time <= frameBudget).length;
      const percentageUnderBudget = (framesUnderBudget / frameTimings.length) * 100;
      
      expect(avgFrameTime).toBeLessThan(frameBudget);
      expect(percentageUnderBudget).toBeGreaterThanOrEqual(95);
    });

    test('should maintain performance with multiple patterns', async () => {
      const patterns = ['matrix', 'binary', 'geometric'];
      const frameBudget = 16.67; // 60fps budget
      
      for (const pattern of patterns) {
        engine.initialize();
        engine.switchPattern(pattern);
        
        const frameTimings: number[] = [];
        
        // Test 30 frames per pattern
        for (let i = 0; i < 30; i++) {
          const startTime = performance.now();
          
          engine.update(frameBudget);
          engine.render();
          
          const endTime = performance.now();
          frameTimings.push(endTime - startTime);
        }
        
        const avgFrameTime = frameTimings.reduce((sum, time) => sum + time, 0) / frameTimings.length;
        expect(avgFrameTime).toBeLessThan(frameBudget);
        
        engine.cleanup();
      }
    });

    test('should handle high resolution displays efficiently', () => {
      const highResContext = {
        ...mockContext,
        canvas: { width: 3840, height: 2160 }, // 4K resolution
      };
      
      const highResEngine = new ASCIIPatternEngine(highResContext);
      const frameBudget = 16.67;
      
      highResEngine.initialize();
      highResEngine.switchPattern('matrix');
      
      const startTime = performance.now();
      
      // Render 10 frames at 4K
      for (let i = 0; i < 10; i++) {
        highResEngine.update(frameBudget);
        highResEngine.render();
      }
      
      const endTime = performance.now();
      const avgFrameTime = (endTime - startTime) / 10;
      
      // Should still maintain reasonable performance at 4K
      expect(avgFrameTime).toBeLessThan(frameBudget * 2); // Allow 2x budget for 4K
      
      highResEngine.cleanup();
    });
  });

  describe('Memory Usage Requirements', () => {
    test('should not leak memory during pattern switches', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      engine.initialize();
      
      // Switch between patterns multiple times
      const patterns = ['matrix', 'binary', 'geometric', 'terminal'];
      for (let cycle = 0; cycle < 5; cycle++) {
        for (const pattern of patterns) {
          engine.switchPattern(pattern);
          
          // Run some frames
          for (let i = 0; i < 10; i++) {
            engine.update(16.67);
            engine.render();
          }
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory growth should be reasonable (less than 10MB)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB
      }
    });

    test('should cleanup resources properly', () => {
      engine.initialize();
      engine.switchPattern('matrix');
      
      // Run animation for a while
      for (let i = 0; i < 100; i++) {
        engine.update(16.67);
        engine.render();
      }
      
      // Cleanup should not throw
      expect(() => engine.cleanup()).not.toThrow();
      
      // Engine should be in clean state
      expect(engine.getCurrentPattern()).toBeNull();
    });

    test('should handle large character arrays efficiently', () => {
      const largeCharacterSet = Array.from({ length: 1000 }, (_, i) => 
        String.fromCharCode(33 + (i % 94))
      );
      
      engine.initialize();
      engine.switchPattern('matrix');
      
      // Set large character set
      const pattern = (engine as any).currentPatternInstance;
      if (pattern && pattern.setCharacters) {
        pattern.setCharacters(largeCharacterSet);
      }
      
      const startTime = performance.now();
      
      // Render frames with large character set
      for (let i = 0; i < 30; i++) {
        engine.update(16.67);
        engine.render();
      }
      
      const endTime = performance.now();
      const avgFrameTime = (endTime - startTime) / 30;
      
      // Should still maintain performance with large character sets
      expect(avgFrameTime).toBeLessThan(20); // Slightly relaxed budget
    });
  });

  describe('Resource Usage Monitoring', () => {
    test('should track performance metrics accurately', () => {
      monitor.startFrame();
      
      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 5) {
        // Busy wait for 5ms
      }
      
      monitor.endFrame();
      
      const metrics = monitor.getMetrics();
      expect(metrics.averageFrameTime).toBeGreaterThan(4);
      expect(metrics.averageFrameTime).toBeLessThan(10);
      expect(metrics.fps).toBeGreaterThan(0);
    });

    test('should detect performance issues', () => {
      // Simulate slow frames
      for (let i = 0; i < 10; i++) {
        monitor.startFrame();
        
        // Simulate work that takes longer than 16.67ms
        const start = performance.now();
        while (performance.now() - start < 20) {
          // Busy wait
        }
        
        monitor.endFrame();
      }
      
      const metrics = monitor.getMetrics();
      expect(metrics.fps).toBeLessThan(60);
      expect(metrics.averageFrameTime).toBeGreaterThan(16.67);
    });

    test('should reset metrics correctly', () => {
      // Generate some metrics
      for (let i = 0; i < 5; i++) {
        monitor.startFrame();
        monitor.endFrame();
      }
      
      let metrics = monitor.getMetrics();
      expect(metrics.frameCount).toBe(5);
      
      monitor.reset();
      metrics = monitor.getMetrics();
      expect(metrics.frameCount).toBe(0);
      expect(metrics.averageFrameTime).toBe(0);
    });
  });

  describe('Stress Testing', () => {
    test('should handle continuous operation for extended periods', async () => {
      engine.initialize();
      engine.switchPattern('matrix');
      
      const startTime = performance.now();
      const testDuration = 1000; // 1 second
      let frameCount = 0;
      
      while (performance.now() - startTime < testDuration) {
        engine.update(16.67);
        engine.render();
        frameCount++;
      }
      
      const endTime = performance.now();
      const actualDuration = endTime - startTime;
      const actualFPS = (frameCount / actualDuration) * 1000;
      
      // Should maintain reasonable FPS during stress test
      expect(actualFPS).toBeGreaterThan(30); // At least 30 FPS
      expect(frameCount).toBeGreaterThan(30); // At least 30 frames in 1 second
    });

    test('should handle rapid pattern switching', () => {
      const patterns = ['matrix', 'binary', 'geometric', 'terminal'];
      
      engine.initialize();
      
      const startTime = performance.now();
      
      // Rapidly switch patterns
      for (let i = 0; i < 100; i++) {
        const pattern = patterns[i % patterns.length];
        engine.switchPattern(pattern);
        
        // Render a few frames
        for (let j = 0; j < 3; j++) {
          engine.update(16.67);
          engine.render();
        }
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete rapid switching in reasonable time
      expect(totalTime).toBeLessThan(5000); // Less than 5 seconds
    });

    test('should handle concurrent animations', () => {
      // Create multiple engine instances
      const engines = Array.from({ length: 3 }, () => new ASCIIPatternEngine(mockContext));
      
      engines.forEach(eng => {
        eng.initialize();
        eng.switchPattern('matrix');
      });
      
      const startTime = performance.now();
      
      // Run all engines concurrently
      for (let i = 0; i < 30; i++) {
        engines.forEach(eng => {
          eng.update(16.67);
          eng.render();
        });
      }
      
      const endTime = performance.now();
      const avgFrameTime = (endTime - startTime) / 30;
      
      // Should handle multiple concurrent animations
      expect(avgFrameTime).toBeLessThan(50); // 50ms budget for 3 concurrent animations
      
      // Cleanup
      engines.forEach(eng => eng.cleanup());
    });
  });

  describe('Browser Compatibility Performance', () => {
    test('should perform well with different canvas contexts', () => {
      const contexts = [
        { ...mockContext, imageSmoothingEnabled: true },
        { ...mockContext, imageSmoothingEnabled: false },
        { ...mockContext, globalCompositeOperation: 'lighter' },
        { ...mockContext, globalCompositeOperation: 'multiply' },
      ];
      
      contexts.forEach((ctx, index) => {
        const testEngine = new ASCIIPatternEngine(ctx);
        testEngine.initialize();
        testEngine.switchPattern('matrix');
        
        const startTime = performance.now();
        
        // Render frames
        for (let i = 0; i < 20; i++) {
          testEngine.update(16.67);
          testEngine.render();
        }
        
        const endTime = performance.now();
        const avgFrameTime = (endTime - startTime) / 20;
        
        expect(avgFrameTime).toBeLessThan(20); // Should work with different context settings
        
        testEngine.cleanup();
      });
    });

    test('should handle different font rendering scenarios', () => {
      const fontConfigs = [
        { fontSize: 8, fontFamily: 'monospace' },
        { fontSize: 12, fontFamily: 'monospace' },
        { fontSize: 16, fontFamily: 'monospace' },
        { fontSize: 12, fontFamily: 'Courier New' },
      ];
      
      fontConfigs.forEach(config => {
        const testContext = {
          ...mockContext,
          font: `${config.fontSize}px ${config.fontFamily}`,
        };
        
        const testEngine = new ASCIIPatternEngine(testContext);
        testEngine.initialize();
        testEngine.switchPattern('matrix');
        
        const startTime = performance.now();
        
        for (let i = 0; i < 15; i++) {
          testEngine.update(16.67);
          testEngine.render();
        }
        
        const endTime = performance.now();
        const avgFrameTime = (endTime - startTime) / 15;
        
        expect(avgFrameTime).toBeLessThan(25); // Should handle different fonts
        
        testEngine.cleanup();
      });
    });
  });
});