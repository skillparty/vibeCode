import { MandelbrotASCII } from '../MandelbrotASCII';
import { PatternConfig } from '../../types';

// Mock canvas context
const createMockContext = () => ({
  fillStyle: '',
  font: '',
  textBaseline: '',
  textAlign: '',
  fillRect: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 8 })),
  canvas: { width: 800, height: 600 }
});

describe('MandelbrotASCII', () => {
  let mockCtx: any;
  let config: PatternConfig;
  let pattern: MandelbrotASCII;

  beforeEach(() => {
    mockCtx = createMockContext();
    config = {
      characters: '01',
      speed: 'medium',
      density: 'medium',
      complexity: 'medium',
      currentTheme: 'matrix'
    };
    pattern = new MandelbrotASCII(mockCtx, config);
  });

  afterEach(() => {
    pattern.cleanup();
  });

  describe('initialization', () => {
    test('should initialize with correct name', () => {
      expect(pattern.name).toBe('mandelbrot-ascii');
    });

    test('should not be initialized before calling initialize()', () => {
      expect(pattern.getIsInitialized()).toBe(false);
    });

    test('should be initialized after calling initialize()', () => {
      pattern.onResize(40, 20); // Smaller size for faster calculation
      pattern.initialize();
      expect(pattern.getIsInitialized()).toBe(true);
    });

    test('should set canvas properties on initialization', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      expect(mockCtx.textBaseline).toBe('top');
      expect(mockCtx.textAlign).toBe('left');
    });

    test('should calculate initial Mandelbrot set', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      const state = pattern.getAnimationState();
      expect(state.zoom).toBeGreaterThan(0);
      expect(state.centerX).toBeDefined();
      expect(state.centerY).toBeDefined();
    });
  });

  describe('configuration', () => {
    test('should apply complexity configuration correctly', () => {
      const highConfig = { ...config, complexity: 'high' as const };
      const highPattern = new MandelbrotASCII(mockCtx, highConfig);
      highPattern.onResize(40, 20);
      highPattern.initialize();
      
      const state = highPattern.getAnimationState();
      expect(state.maxIterations).toBe(100); // High complexity
      
      highPattern.cleanup();
    });

    test('should apply low complexity configuration', () => {
      const lowConfig = { ...config, complexity: 'low' as const };
      const lowPattern = new MandelbrotASCII(mockCtx, lowConfig);
      lowPattern.onResize(40, 20);
      lowPattern.initialize();
      
      const state = lowPattern.getAnimationState();
      expect(state.maxIterations).toBe(25); // Low complexity
      
      lowPattern.cleanup();
    });

    test('should apply speed configuration correctly', () => {
      const fastConfig = { ...config, speed: 'fast' as const };
      const fastPattern = new MandelbrotASCII(mockCtx, fastConfig);
      fastPattern.onResize(40, 20);
      fastPattern.initialize();
      
      // Fast speed should have shorter transition duration
      expect(fastPattern.getIsInitialized()).toBe(true);
      
      fastPattern.cleanup();
    });

    test('should update configuration dynamically', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      const initialState = pattern.getAnimationState();
      
      pattern.setConfig({ complexity: 'high', speed: 'fast' });
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.maxIterations).toBe(100);
    });
  });

  describe('animation updates', () => {
    beforeEach(() => {
      pattern.onResize(40, 20);
      pattern.initialize();
    });

    test('should update zoom over time', () => {
      const initialState = pattern.getAnimationState();
      const initialZoom = initialState.zoom;
      
      // Update with time to change zoom
      pattern.update(1000); // 1 second
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.zoom).not.toBe(initialZoom);
    });

    test('should reverse zoom direction at limits', () => {
      const initialState = pattern.getAnimationState();
      
      // Fast forward to hit zoom limits
      for (let i = 0; i < 100; i++) {
        pattern.update(100);
      }
      
      const finalState = pattern.getAnimationState();
      expect(finalState.zoomDirection).toBeDefined();
      expect(Math.abs(finalState.zoomDirection)).toBe(1);
    });

    test('should transition between interesting points', () => {
      const initialState = pattern.getAnimationState();
      const initialPoint = initialState.currentPoint;
      
      // Fast forward through point transition
      pattern.update(15000); // 15 seconds should trigger transition
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.currentPoint).toBeDefined();
    });

    test('should not update when not initialized', () => {
      pattern.cleanup();
      
      expect(() => pattern.update(1000)).not.toThrow();
    });
  });

  describe('rendering', () => {
    beforeEach(() => {
      pattern.onResize(40, 20);
      pattern.initialize();
    });

    test('should clear canvas with black background', () => {
      pattern.render();
      
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    test('should render Mandelbrot characters', () => {
      pattern.render();
      
      // Should have called fillText for rendering characters
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    test('should render info overlay', () => {
      pattern.render();
      
      // Should render info text
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    test('should render without errors when not initialized', () => {
      pattern.cleanup();
      
      expect(() => pattern.render()).not.toThrow();
      expect(mockCtx.fillRect).toHaveBeenCalled(); // Should still clear canvas
    });

    test('should handle different themes', () => {
      pattern.setConfig({ currentTheme: 'blue' });
      
      expect(() => pattern.render()).not.toThrow();
    });
  });

  describe('Mandelbrot calculation', () => {
    beforeEach(() => {
      pattern.onResize(20, 10); // Small size for fast testing
      pattern.initialize();
    });

    test('should calculate Mandelbrot set correctly', () => {
      // The pattern should be initialized with calculated values
      const state = pattern.getAnimationState();
      
      expect(state.centerX).toBeDefined();
      expect(state.centerY).toBeDefined();
      expect(state.zoom).toBeGreaterThan(0);
      expect(state.maxIterations).toBeGreaterThan(0);
    });

    test('should handle zoom changes', () => {
      const initialState = pattern.getAnimationState();
      
      // Force a zoom change
      pattern.update(2000);
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.zoom).not.toBe(initialState.zoom);
    });

    test('should explore different interesting points', () => {
      const initialState = pattern.getAnimationState();
      const initialPoint = initialState.currentPoint;
      
      // Fast forward to next point
      pattern.update(12000); // Should trigger point transition
      
      const updatedState = pattern.getAnimationState();
      // Point might have changed or be in transition
      expect(updatedState.currentPoint).toBeDefined();
    });
  });

  describe('resize handling', () => {
    test('should handle resize correctly', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      expect(pattern.getIsInitialized()).toBe(true);
      
      // Resize to different dimensions
      pattern.onResize(20, 10);
      
      // Should still be initialized and recalculated
      expect(pattern.getIsInitialized()).toBe(true);
    });

    test('should recalculate on resize', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      // Resize should trigger recalculation
      expect(() => pattern.onResize(30, 15)).not.toThrow();
    });
  });

  describe('cleanup', () => {
    test('should cleanup properly', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      expect(pattern.getIsInitialized()).toBe(true);
      
      pattern.cleanup();
      
      expect(pattern.getIsInitialized()).toBe(false);
      
      const state = pattern.getAnimationState();
      expect(state.zoom).toBe(1); // Should reset to default
      expect(state.currentPoint).toBe(0);
    });

    test('should handle multiple cleanup calls', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      pattern.cleanup();
      pattern.cleanup(); // Second cleanup should not cause issues
      
      expect(pattern.getIsInitialized()).toBe(false);
    });
  });

  describe('animation state', () => {
    test('should provide meaningful animation state', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      const state = pattern.getAnimationState();
      
      expect(state).toHaveProperty('zoom');
      expect(state).toHaveProperty('centerX');
      expect(state).toHaveProperty('centerY');
      expect(state).toHaveProperty('currentPoint');
      expect(state).toHaveProperty('zoomDirection');
      expect(state).toHaveProperty('maxIterations');
      expect(state).toHaveProperty('pointTransitionProgress');
      
      expect(typeof state.zoom).toBe('number');
      expect(typeof state.centerX).toBe('number');
      expect(typeof state.centerY).toBe('number');
      expect(typeof state.currentPoint).toBe('number');
      expect(typeof state.maxIterations).toBe('number');
    });

    test('should track zoom changes correctly', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      const initialState = pattern.getAnimationState();
      
      // Update zoom
      pattern.update(1000);
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.zoom).not.toBe(initialState.zoom);
    });
  });

  describe('edge cases', () => {
    test('should handle very small grid dimensions', () => {
      pattern.onResize(3, 2);
      pattern.initialize();
      
      expect(pattern.getIsInitialized()).toBe(true);
      
      pattern.update(1000);
      pattern.render();
      
      // Should not throw errors
    });

    test('should handle zero delta time', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      expect(() => pattern.update(0)).not.toThrow();
    });

    test('should handle very large delta time', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      expect(() => pattern.update(100000)).not.toThrow();
    });

    test('should handle configuration with missing properties', () => {
      const minimalConfig = { characters: '01' } as PatternConfig;
      const minimalPattern = new MandelbrotASCII(mockCtx, minimalConfig);
      
      minimalPattern.onResize(20, 10);
      expect(() => minimalPattern.initialize()).not.toThrow();
      
      minimalPattern.cleanup();
    });

    test('should handle extreme zoom values', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      // Fast forward to extreme zoom
      for (let i = 0; i < 200; i++) {
        pattern.update(100);
      }
      
      const state = pattern.getAnimationState();
      expect(state.zoom).toBeGreaterThan(0);
      expect(state.zoom).toBeLessThan(1000); // Should have reasonable limits
    });
  });
});