import { ASCIIPatternEngine } from '../ASCIIPatternEngine';
import { MatrixRain } from '../MatrixRain';

// Mock canvas and context
class MockCanvasRenderingContext2D {
  font = '12px monospace';
  textBaseline = 'top';
  textAlign = 'left';
  fillStyle = '#000000';
  canvas = { width: 800, height: 600 };
  
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

describe('MatrixRain Integration with ASCIIPatternEngine', () => {
  let canvas: MockCanvas;
  let engine: ASCIIPatternEngine;
  
  beforeEach(() => {
    canvas = new MockCanvas();
    engine = new ASCIIPatternEngine(canvas as any);
  });
  
  afterEach(() => {
    engine.cleanup();
  });
  
  test('should register MatrixRain pattern automatically', () => {
    // The engine should automatically register the matrix-rain pattern
    expect(() => {
      engine.switchPattern('matrix-rain', { type: 'fade', duration: 1000 }, {
        characters: '01{}[]()<>/*+-=;:.,!@#$%^&*',
        speed: 'medium',
        density: 'medium'
      });
    }).not.toThrow();
  });
  
  test('should switch to MatrixRain pattern successfully', async () => {
    const patternConfig = {
      characters: '01{}[]()<>/*+-=;:.,!@#$%^&*',
      speed: 'medium' as const,
      density: 'medium' as const,
      glitchProbability: 0.02
    };
    
    await engine.switchPattern('matrix-rain', { type: 'fade', duration: 1000 }, patternConfig);
    
    const currentPattern = engine.getCurrentPattern();
    expect(currentPattern).toBeInstanceOf(MatrixRain);
    expect(currentPattern?.name).toBe('matrix-rain');
  });
  
  test('should animate MatrixRain pattern without errors', async () => {
    const patternConfig = {
      characters: '01{}[]()<>/*+-=;:.,!@#$%^&*',
      speed: 'fast' as const,
      density: 'high' as const,
      glitchProbability: 0.05
    };
    
    await engine.switchPattern('matrix-rain', { type: 'fade', duration: 1000 }, patternConfig);
    
    // Start animation
    engine.startAnimation();
    
    // Let it run for a bit
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should not throw errors
    expect(() => {
      const currentPattern = engine.getCurrentPattern();
      expect(currentPattern).toBeInstanceOf(MatrixRain);
    }).not.toThrow();
    
    engine.stopAnimation();
  });
  
  test('should handle pattern configuration changes', async () => {
    await engine.switchPattern('matrix-rain', { type: 'fade', duration: 1000 }, {
      characters: '01',
      speed: 'slow' as const,
      density: 'low' as const
    });
    
    const pattern = engine.getCurrentPattern() as MatrixRain;
    expect(pattern).toBeInstanceOf(MatrixRain);
    
    // Change configuration
    pattern.setConfig({
      speed: 'fast',
      density: 'high',
      characters: 'ABC123'
    });
    
    const config = pattern.getConfig();
    expect(config.characters).toBe('ABC123');
    expect(config.speed).toBe('fast');
    expect(config.density).toBe('high');
  });
  
  test('should handle resize events properly', async () => {
    await engine.switchPattern('matrix-rain', { type: 'fade', duration: 1000 }, {
      characters: '01{}[]()<>/*+-=;:.,!@#$%^&*',
      speed: 'medium' as const,
      density: 'medium' as const
    });
    
    const pattern = engine.getCurrentPattern() as MatrixRain;
    expect(pattern).toBeInstanceOf(MatrixRain);
    
    // Trigger resize
    engine.resize(1200, 800);
    
    // Should still work after resize
    expect(() => {
      pattern.update(16.67);
      pattern.render();
    }).not.toThrow();
  });
  
  test('should clean up MatrixRain pattern properly', async () => {
    await engine.switchPattern('matrix-rain', { type: 'fade', duration: 1000 }, {
      characters: '01{}[]()<>/*+-=;:.,!@#$%^&*',
      speed: 'medium' as const,
      density: 'medium' as const
    });
    
    const pattern = engine.getCurrentPattern() as MatrixRain;
    expect(pattern).toBeInstanceOf(MatrixRain);
    expect(pattern.getIsInitialized()).toBe(true);
    
    // Switch to another pattern (this should clean up the current one)
    engine.registerPattern('test', class extends MatrixRain {
      constructor(ctx: any, config: any) {
        super(ctx, config);
      }
    });
    
    await engine.switchPattern('test', { type: 'fade', duration: 1000 }, {
      characters: 'TEST',
      speed: 'medium' as const,
      density: 'medium' as const
    });
    
    // Original pattern should be cleaned up
    expect(pattern.getIsInitialized()).toBe(false);
  });
});