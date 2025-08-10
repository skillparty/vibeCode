import { ASCIIPatternEngine, EngineConfig } from '../ASCIIPatternEngine';
import { BasePattern, TestPattern } from '../BasePattern';
import { PatternConfig } from '../../types';

// Mock canvas and context
class MockCanvasRenderingContext2D {
  font = '12px monospace';
  textBaseline = 'top';
  textAlign = 'left';
  fillStyle = '#000000';
  
  measureText = jest.fn().mockReturnValue({ width: 8 });
  fillRect = jest.fn();
  fillText = jest.fn();
  clearRect = jest.fn();
}

class MockCanvas {
  width = 800;
  height = 600;
  style = { width: '800px', height: '600px' };
  parentElement = { clientWidth: 800, clientHeight: 600 };
  
  getContext = jest.fn().mockReturnValue(new MockCanvasRenderingContext2D());
}

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});
global.cancelAnimationFrame = jest.fn();

// Mock performance.now
global.performance = {
  now: jest.fn(() => Date.now())
} as any;

// Mock window.ResizeObserver
(global as any).ResizeObserver = MockResizeObserver;

describe('ASCIIPatternEngine', () => {
  let canvas: MockCanvas;
  let engine: ASCIIPatternEngine;
  
  beforeEach(() => {
    canvas = new MockCanvas();
    engine = new ASCIIPatternEngine(canvas as any);
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    engine.cleanup();
  });
  
  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(engine).toBeInstanceOf(ASCIIPatternEngine);
      expect(canvas.getContext).toHaveBeenCalledWith('2d');
    });
    
    test('should throw error if canvas context is not available', () => {
      const badCanvas = { getContext: jest.fn().mockReturnValue(null) };
      expect(() => new ASCIIPatternEngine(badCanvas as any)).toThrow('Canvas 2D context not supported');
    });
    
    test('should initialize with custom configuration', () => {
      const customConfig: Partial<EngineConfig> = {
        fontSize: 16,
        fontFamily: 'Arial',
        backgroundColor: '#111111',
        foregroundColor: '#ffffff',
        enableDebug: true
      };
      
      const customEngine = new ASCIIPatternEngine(canvas as any, customConfig);
      expect(customEngine).toBeInstanceOf(ASCIIPatternEngine);
      customEngine.cleanup();
    });
    
    test('should calculate grid dimensions correctly', () => {
      const dimensions = engine.getGridDimensions();
      
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
      expect(dimensions.charWidth).toBe(8); // Based on mock measureText
      expect(dimensions.charHeight).toBeGreaterThan(0);
    });
  });
  
  describe('Pattern Management', () => {
    test('should register patterns correctly', () => {
      engine.registerPattern('test', TestPattern);
      
      // Pattern should be registered (internal state, can't directly test)
      // But we can test switching to it
      expect(() => engine.switchPattern('test')).not.toThrow();
    });
    
    test('should switch patterns successfully', async () => {
      engine.registerPattern('test', TestPattern);
      
      await engine.switchPattern('test');
      
      const currentPattern = engine.getCurrentPattern();
      expect(currentPattern).toBeInstanceOf(TestPattern);
      expect(currentPattern?.name).toBe('test');
    });
    
    test('should reject switching to non-existent pattern', async () => {
      await expect(engine.switchPattern('nonexistent')).rejects.toThrow('Pattern not found: nonexistent');
    });
    
    test('should clean up previous pattern when switching', async () => {
      engine.registerPattern('test1', TestPattern);
      engine.registerPattern('test2', TestPattern);
      
      await engine.switchPattern('test1');
      const firstPattern = engine.getCurrentPattern();
      const cleanupSpy = jest.spyOn(firstPattern!, 'cleanup');
      
      await engine.switchPattern('test2');
      
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });
  
  describe('Animation Control', () => {
    test('should start animation loop', () => {
      engine.startAnimation();
      
      expect(engine.isAnimating()).toBe(true);
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });
    
    test('should not start animation if already running', () => {
      engine.startAnimation();
      const firstCallCount = (global.requestAnimationFrame as jest.Mock).mock.calls.length;
      
      engine.startAnimation(); // Try to start again
      
      expect((global.requestAnimationFrame as jest.Mock).mock.calls.length).toBe(firstCallCount);
    });
    
    test('should stop animation loop', () => {
      engine.startAnimation();
      expect(engine.isAnimating()).toBe(true);
      
      engine.stopAnimation();
      
      expect(engine.isAnimating()).toBe(false);
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });
    
    test('should handle stopping animation when not running', () => {
      expect(engine.isAnimating()).toBe(false);
      
      engine.stopAnimation(); // Should not throw
      
      expect(engine.isAnimating()).toBe(false);
    });
  });
  
  describe('Canvas Operations', () => {
    test('should resize canvas correctly', () => {
      const newWidth = 1024;
      const newHeight = 768;
      
      engine.resize(newWidth, newHeight);
      
      expect(canvas.width).toBe(newWidth);
      expect(canvas.height).toBe(newHeight);
      expect(canvas.style.width).toBe(`${newWidth}px`);
      expect(canvas.style.height).toBe(`${newHeight}px`);
    });
    
    test('should resize to parent dimensions when no dimensions provided', () => {
      engine.resize();
      
      expect(canvas.width).toBe(800); // Parent clientWidth
      expect(canvas.height).toBe(600); // Parent clientHeight
    });
    
    test('should recalculate grid dimensions on resize', () => {
      const originalDimensions = engine.getGridDimensions();
      
      engine.resize(1600, 1200);
      
      const newDimensions = engine.getGridDimensions();
      expect(newDimensions.width).toBeGreaterThan(originalDimensions.width);
      expect(newDimensions.height).toBeGreaterThan(originalDimensions.height);
    });
    
    test('should provide access to canvas context', () => {
      const ctx = engine.getContext();
      expect(ctx).toBeInstanceOf(MockCanvasRenderingContext2D);
    });
  });
  
  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const newConfig: Partial<EngineConfig> = {
        fontSize: 20,
        backgroundColor: '#222222'
      };
      
      engine.updateConfig(newConfig);
      
      // Configuration is internal, but we can test that it doesn't throw
      // and that font changes trigger reinitialization
      expect(() => engine.updateConfig(newConfig)).not.toThrow();
    });
  });
  
  describe('Cleanup', () => {
    test('should clean up all resources', () => {
      engine.registerPattern('test', TestPattern);
      engine.switchPattern('test');
      engine.startAnimation();
      
      engine.cleanup();
      
      expect(engine.isAnimating()).toBe(false);
      expect(engine.getCurrentPattern()).toBeNull();
    });
  });
});

describe('BasePattern', () => {
  let canvas: MockCanvas;
  let ctx: MockCanvasRenderingContext2D;
  let pattern: TestPattern;
  let config: PatternConfig;
  
  beforeEach(() => {
    canvas = new MockCanvas();
    ctx = new MockCanvasRenderingContext2D();
    config = {
      characters: '01',
      speed: 'medium',
      density: 'medium'
    };
    pattern = new TestPattern(ctx as any, config);
  });
  
  afterEach(() => {
    pattern.cleanup();
  });
  
  describe('Initialization', () => {
    test('should create pattern with correct properties', () => {
      expect(pattern.name).toBe('test');
      expect(pattern.getConfig()).toEqual(config);
      expect(pattern.getIsInitialized()).toBe(false);
    });
    
    test('should initialize pattern correctly', () => {
      pattern.initialize();
      
      expect(pattern.getIsInitialized()).toBe(true);
    });
  });
  
  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const newConfig = { speed: 'fast' as const };
      
      pattern.setConfig(newConfig);
      
      const updatedConfig = pattern.getConfig();
      expect(updatedConfig.speed).toBe('fast');
      expect(updatedConfig.characters).toBe('01'); // Should preserve other properties
    });
  });
  
  describe('Utility Methods', () => {
    beforeEach(() => {
      pattern.onResize(80, 25); // Set up grid dimensions
    });
    
    test('should convert speed settings to multipliers', () => {
      pattern.setConfig({ speed: 'slow' });
      expect((pattern as any).getSpeedMultiplier()).toBe(0.5);
      
      pattern.setConfig({ speed: 'medium' });
      expect((pattern as any).getSpeedMultiplier()).toBe(1.0);
      
      pattern.setConfig({ speed: 'fast' });
      expect((pattern as any).getSpeedMultiplier()).toBe(2.0);
    });
    
    test('should convert density settings to multipliers', () => {
      pattern.setConfig({ density: 'low' });
      expect((pattern as any).getDensityMultiplier()).toBe(0.3);
      
      pattern.setConfig({ density: 'medium' });
      expect((pattern as any).getDensityMultiplier()).toBe(0.6);
      
      pattern.setConfig({ density: 'high' });
      expect((pattern as any).getDensityMultiplier()).toBe(1.0);
    });
    
    test('should generate random characters from character set', () => {
      const char = (pattern as any).getRandomChar();
      expect(['0', '1']).toContain(char);
    });
    
    test('should handle resize correctly', () => {
      pattern.onResize(100, 50);
      
      // Grid dimensions should be updated (internal state)
      expect(() => pattern.onResize(100, 50)).not.toThrow();
    });
  });
  
  describe('Pattern Lifecycle', () => {
    test('should handle full lifecycle correctly', () => {
      // Initialize
      pattern.initialize();
      expect(pattern.getIsInitialized()).toBe(true);
      
      // Update (should not throw)
      expect(() => pattern.update(16.67)).not.toThrow();
      
      // Render (should not throw)
      expect(() => pattern.render()).not.toThrow();
      
      // Cleanup
      pattern.cleanup();
      expect(pattern.getIsInitialized()).toBe(false);
    });
  });
});