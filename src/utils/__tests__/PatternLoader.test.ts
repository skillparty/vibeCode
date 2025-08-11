import { PatternLoader } from '../PatternLoader';

// Mock dynamic imports
jest.mock('../MatrixRain', () => ({
  MatrixRain: class MockMatrixRain {
    constructor() {}
    initialize() {}
    update() {}
    render() {}
    cleanup() {}
  }
}));

jest.mock('../BinaryWaves', () => ({
  BinaryWaves: class MockBinaryWaves {
    constructor() {}
    initialize() {}
    update() {}
    render() {}
    cleanup() {}
  }
}));

describe('PatternLoader', () => {
  let loader: PatternLoader;
  
  beforeEach(() => {
    loader = new PatternLoader();
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    loader.cleanup();
  });
  
  describe('Basic Functionality', () => {
    test('should initialize with registered patterns', () => {
      const status = loader.getLoadingStatus();
      
      expect(status).toHaveProperty('matrix-rain', false);
      expect(status).toHaveProperty('binary-waves', false);
      expect(status).toHaveProperty('geometric-flow', false);
      expect(status).toHaveProperty('terminal-cursor', false);
      expect(status).toHaveProperty('code-flow', false);
      expect(status).toHaveProperty('mandelbrot-ascii', false);
      expect(status).toHaveProperty('conway-life', false);
      expect(status).toHaveProperty('network-nodes', false);
    });
    
    test('should check if pattern is loaded', () => {
      expect(loader.isPatternLoaded('matrix-rain')).toBe(false);
    });
  });
  
  describe('Pattern Loading', () => {
    test('should load pattern successfully', async () => {
      const PatternClass = await loader.loadPattern('matrix-rain');
      
      expect(PatternClass).toBeDefined();
      expect(typeof PatternClass).toBe('function');
      expect(loader.isPatternLoaded('matrix-rain')).toBe(true);
    });
    
    test('should return cached pattern on subsequent loads', async () => {
      const PatternClass1 = await loader.loadPattern('matrix-rain');
      const PatternClass2 = await loader.loadPattern('matrix-rain');
      
      expect(PatternClass1).toBe(PatternClass2);
    });
    
    test('should handle loading multiple patterns concurrently', async () => {
      const promises = [
        loader.loadPattern('matrix-rain'),
        loader.loadPattern('binary-waves'),
        loader.loadPattern('matrix-rain') // Duplicate to test caching
      ];
      
      const results = await Promise.all(promises);
      
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
      expect(results[0]).toBe(results[2]); // Should be same instance
    });
    
    test('should throw error for unknown pattern', async () => {
      await expect(loader.loadPattern('unknown-pattern')).rejects.toThrow('Pattern not found: unknown-pattern');
    });
    
    test('should track load times', async () => {
      await loader.loadPattern('matrix-rain');
      
      const loadTimes = loader.getLoadTimes();
      expect(loadTimes).toHaveProperty('matrix-rain');
      expect(typeof loadTimes['matrix-rain']).toBe('number');
      expect(loadTimes['matrix-rain']).toBeGreaterThan(0);
    });
  });
  
  describe('Preloading', () => {
    test('should preload essential patterns', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await loader.preloadEssentialPatterns();
      
      expect(loader.isPatternLoaded('matrix-rain')).toBe(true);
      expect(loader.isPatternLoaded('binary-waves')).toBe(true);
      expect(loader.isPatternLoaded('terminal-cursor')).toBe(true);
      
      expect(consoleSpy).toHaveBeenCalledWith('Starting preload of 3 patterns');
      expect(consoleSpy).toHaveBeenCalledWith('Pattern preloading completed');
      
      consoleSpy.mockRestore();
    });
    
    test('should preload custom pattern list', async () => {
      const patterns = ['matrix-rain', 'geometric-flow'];
      
      await loader.preloadPatterns(patterns);
      
      expect(loader.isPatternLoaded('matrix-rain')).toBe(true);
      expect(loader.isPatternLoaded('geometric-flow')).toBe(true);
      expect(loader.isPatternLoaded('binary-waves')).toBe(false);
    });
    
    test('should handle preload errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock a failing import
      const originalImport = loader['importPattern'];
      loader['importPattern'] = jest.fn().mockImplementation((name) => {
        if (name === 'matrix-rain') {
          return Promise.reject(new Error('Import failed'));
        }
        return originalImport.call(loader, name);
      });
      
      await loader.preloadPatterns(['matrix-rain', 'binary-waves']);
      
      expect(consoleSpy).toHaveBeenCalledWith('Preload failed for pattern: matrix-rain', expect.any(Error));
      expect(loader.isPatternLoaded('matrix-rain')).toBe(false);
      expect(loader.isPatternLoaded('binary-waves')).toBe(true);
      
      consoleSpy.mockRestore();
    });
    
    test('should not start multiple preload operations', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Start first preload
      const preload1 = loader.preloadPatterns(['matrix-rain']);
      
      // Start second preload (should be ignored)
      const preload2 = loader.preloadPatterns(['binary-waves']);
      
      await Promise.all([preload1, preload2]);
      
      // Should only see one "Starting preload" message
      const startMessages = consoleSpy.mock.calls.filter(call => 
        call[0].includes('Starting preload')
      );
      expect(startMessages).toHaveLength(1);
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Memory Management', () => {
    test('should unload pattern', async () => {
      await loader.loadPattern('matrix-rain');
      expect(loader.isPatternLoaded('matrix-rain')).toBe(true);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      loader.unloadPattern('matrix-rain');
      expect(loader.isPatternLoaded('matrix-rain')).toBe(false);
      
      expect(consoleSpy).toHaveBeenCalledWith('Pattern unloaded: matrix-rain');
      
      consoleSpy.mockRestore();
    });
    
    test('should unload all patterns', async () => {
      await loader.preloadEssentialPatterns();
      
      expect(loader.isPatternLoaded('matrix-rain')).toBe(true);
      expect(loader.isPatternLoaded('binary-waves')).toBe(true);
      
      loader.unloadAllPatterns();
      
      expect(loader.isPatternLoaded('matrix-rain')).toBe(false);
      expect(loader.isPatternLoaded('binary-waves')).toBe(false);
    });
    
    test('should estimate memory usage', async () => {
      const initialUsage = loader.getMemoryUsageEstimate();
      expect(initialUsage).toBe(0);
      
      await loader.loadPattern('matrix-rain');
      await loader.loadPattern('binary-waves');
      
      const usageAfterLoad = loader.getMemoryUsageEstimate();
      expect(usageAfterLoad).toBe(100); // 2 patterns * 50KB each
    });
    
    test('should handle unloading non-existent pattern', () => {
      // Should not throw error
      expect(() => loader.unloadPattern('non-existent')).not.toThrow();
    });
  });
  
  describe('Status and Monitoring', () => {
    test('should provide loading status for all patterns', async () => {
      await loader.loadPattern('matrix-rain');
      
      const status = loader.getLoadingStatus();
      
      expect(status['matrix-rain']).toBe(true);
      expect(status['binary-waves']).toBe(false);
    });
    
    test('should provide load times for loaded patterns', async () => {
      await loader.loadPattern('matrix-rain');
      await loader.loadPattern('binary-waves');
      
      const loadTimes = loader.getLoadTimes();
      
      expect(loadTimes).toHaveProperty('matrix-rain');
      expect(loadTimes).toHaveProperty('binary-waves');
      expect(loadTimes).not.toHaveProperty('geometric-flow');
    });
  });
  
  describe('Cleanup', () => {
    test('should cleanup all resources', async () => {
      await loader.preloadEssentialPatterns();
      
      expect(loader.isPatternLoaded('matrix-rain')).toBe(true);
      
      loader.cleanup();
      
      expect(loader.isPatternLoaded('matrix-rain')).toBe(false);
      expect(loader.getMemoryUsageEstimate()).toBe(0);
    });
  });
});

// Integration tests
describe('PatternLoader Integration', () => {
  test('should handle rapid load/unload cycles', async () => {
    const loader = new PatternLoader();
    
    // Rapid loading
    for (let i = 0; i < 5; i++) {
      await loader.loadPattern('matrix-rain');
      expect(loader.isPatternLoaded('matrix-rain')).toBe(true);
      
      loader.unloadPattern('matrix-rain');
      expect(loader.isPatternLoaded('matrix-rain')).toBe(false);
    }
    
    loader.cleanup();
  });
  
  test('should maintain performance during concurrent operations', async () => {
    const loader = new PatternLoader();
    const startTime = performance.now();
    
    // Concurrent loading of multiple patterns
    const patterns = ['matrix-rain', 'binary-waves', 'geometric-flow', 'terminal-cursor'];
    const promises = patterns.map(pattern => loader.loadPattern(pattern));
    
    await Promise.all(promises);
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Should complete within reasonable time (adjust threshold as needed)
    expect(totalTime).toBeLessThan(1000); // 1 second
    
    // All patterns should be loaded
    patterns.forEach(pattern => {
      expect(loader.isPatternLoaded(pattern)).toBe(true);
    });
    
    loader.cleanup();
  });
});