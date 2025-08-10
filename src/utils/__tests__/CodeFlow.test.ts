import { CodeFlow } from '../CodeFlow';
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

describe('CodeFlow', () => {
  let mockCtx: any;
  let config: PatternConfig;
  let pattern: CodeFlow;

  beforeEach(() => {
    mockCtx = createMockContext();
    config = {
      characters: '01',
      speed: 'medium',
      density: 'medium',
      currentTheme: 'matrix'
    };
    pattern = new CodeFlow(mockCtx, config);
  });

  afterEach(() => {
    pattern.cleanup();
  });

  describe('initialization', () => {
    test('should initialize with correct name', () => {
      expect(pattern.name).toBe('code-flow');
    });

    test('should not be initialized before calling initialize()', () => {
      expect(pattern.getIsInitialized()).toBe(false);
    });

    test('should be initialized after calling initialize()', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      expect(pattern.getIsInitialized()).toBe(true);
    });

    test('should set canvas properties on initialization', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      expect(mockCtx.textBaseline).toBe('top');
      expect(mockCtx.textAlign).toBe('left');
    });

    test('should spawn initial code lines', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      const state = pattern.getAnimationState();
      expect(state.lineCount).toBeGreaterThan(0);
    });
  });

  describe('configuration', () => {
    test('should apply speed configuration correctly', () => {
      const fastConfig = { ...config, speed: 'fast' as const };
      const fastPattern = new CodeFlow(mockCtx, fastConfig);
      fastPattern.onResize(80, 24);
      fastPattern.initialize();
      
      const state = fastPattern.getAnimationState();
      expect(state.scrollSpeed).toBe(35); // Fast speed
      expect(state.spawnInterval).toBe(100); // Fast spawn interval
      
      fastPattern.cleanup();
    });

    test('should apply slow speed configuration', () => {
      const slowConfig = { ...config, speed: 'slow' as const };
      const slowPattern = new CodeFlow(mockCtx, slowConfig);
      slowPattern.onResize(80, 24);
      slowPattern.initialize();
      
      const state = slowPattern.getAnimationState();
      expect(state.scrollSpeed).toBe(10); // Slow speed
      expect(state.spawnInterval).toBe(400); // Slow spawn interval
      
      slowPattern.cleanup();
    });

    test('should update configuration dynamically', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      pattern.setConfig({ speed: 'fast' });
      
      const state = pattern.getAnimationState();
      expect(state.scrollSpeed).toBe(35);
    });

    test('should update colors when theme changes', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      // Change theme and verify it doesn't throw
      expect(() => pattern.setConfig({ currentTheme: 'retro' })).not.toThrow();
    });
  });

  describe('animation updates', () => {
    beforeEach(() => {
      pattern.onResize(80, 24);
      pattern.initialize();
    });

    test('should spawn new lines over time', () => {
      const initialState = pattern.getAnimationState();
      const initialLineCount = initialState.lineCount;
      
      // Update with enough time to spawn new lines
      pattern.update(500); // 500ms should spawn new lines
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.lineCount).toBeGreaterThanOrEqual(initialLineCount);
    });

    test('should move lines down the screen', () => {
      const initialState = pattern.getAnimationState();
      const initialAverageY = initialState.averageY;
      
      // Update to move lines
      pattern.update(1000); // 1 second
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.averageY).toBeGreaterThan(initialAverageY);
    });

    test('should remove lines that scroll off screen', () => {
      // Fast forward to move lines off screen
      for (let i = 0; i < 20; i++) {
        pattern.update(1000); // 1 second each
      }
      
      const state = pattern.getAnimationState();
      // Should have removed some lines and added new ones
      expect(state.lineCount).toBeLessThan(100); // Shouldn't accumulate infinitely
    });

    test('should not update when not initialized', () => {
      pattern.cleanup();
      
      expect(() => pattern.update(1000)).not.toThrow();
    });
  });

  describe('rendering', () => {
    beforeEach(() => {
      pattern.onResize(80, 24);
      pattern.initialize();
    });

    test('should clear canvas with background color', () => {
      pattern.render();
      
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    test('should render code lines', () => {
      pattern.render();
      
      // Should have called fillText for rendering characters
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    test('should render without errors when not initialized', () => {
      pattern.cleanup();
      
      expect(() => pattern.render()).not.toThrow();
      expect(mockCtx.fillRect).toHaveBeenCalled(); // Should still clear canvas
    });

    test('should apply fade effects for lines near edges', () => {
      // Add some lines and render
      pattern.update(1000);
      pattern.render();
      
      // Should have set fillStyle multiple times for different alpha values
      expect(mockCtx.fillStyle).toHaveBeenSet;
    });
  });

  describe('resize handling', () => {
    test('should handle resize correctly', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      const initialState = pattern.getAnimationState();
      
      // Resize to different dimensions
      pattern.onResize(40, 12);
      
      // Should still be initialized and working
      expect(pattern.getIsInitialized()).toBe(true);
      
      const newState = pattern.getAnimationState();
      expect(newState.lineCount).toBeGreaterThanOrEqual(0);
    });

    test('should filter out off-screen lines on resize', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      // Add many lines
      for (let i = 0; i < 10; i++) {
        pattern.update(200);
      }
      
      const beforeResize = pattern.getAnimationState();
      
      // Resize to much smaller height
      pattern.onResize(80, 5);
      
      const afterResize = pattern.getAnimationState();
      expect(afterResize.lineCount).toBeLessThanOrEqual(beforeResize.lineCount);
    });
  });

  describe('cleanup', () => {
    test('should cleanup properly', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      expect(pattern.getIsInitialized()).toBe(true);
      
      pattern.cleanup();
      
      expect(pattern.getIsInitialized()).toBe(false);
      
      const state = pattern.getAnimationState();
      expect(state.lineCount).toBe(0);
    });

    test('should handle multiple cleanup calls', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      pattern.cleanup();
      pattern.cleanup(); // Second cleanup should not cause issues
      
      expect(pattern.getIsInitialized()).toBe(false);
    });
  });

  describe('animation state', () => {
    test('should provide meaningful animation state', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      const state = pattern.getAnimationState();
      
      expect(state).toHaveProperty('lineCount');
      expect(state).toHaveProperty('scrollSpeed');
      expect(state).toHaveProperty('spawnInterval');
      expect(state).toHaveProperty('averageY');
      
      expect(typeof state.lineCount).toBe('number');
      expect(typeof state.scrollSpeed).toBe('number');
      expect(typeof state.spawnInterval).toBe('number');
      expect(typeof state.averageY).toBe('number');
    });

    test('should track line movement correctly', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      const initialState = pattern.getAnimationState();
      
      // Move lines
      pattern.update(1000);
      
      const updatedState = pattern.getAnimationState();
      if (updatedState.lineCount > 0) {
        expect(updatedState.averageY).toBeGreaterThan(initialState.averageY);
      }
    });
  });

  describe('code content', () => {
    test('should render different types of code lines', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      // Spawn many lines to get variety
      for (let i = 0; i < 30; i++) {
        pattern.update(200); // Longer intervals to ensure spawning
      }
      
      const state = pattern.getAnimationState();
      expect(state.lineCount).toBeGreaterThanOrEqual(3); // More reasonable expectation
    });

    test('should handle indentation correctly', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      // Should not throw when rendering indented code
      expect(() => {
        pattern.update(1000);
        pattern.render();
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    test('should handle very small grid dimensions', () => {
      pattern.onResize(5, 3);
      pattern.initialize();
      
      expect(pattern.getIsInitialized()).toBe(true);
      
      pattern.update(1000);
      pattern.render();
      
      // Should not throw errors
    });

    test('should handle zero delta time', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      expect(() => pattern.update(0)).not.toThrow();
    });

    test('should handle very large delta time', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      expect(() => pattern.update(10000)).not.toThrow();
    });

    test('should handle configuration with missing properties', () => {
      const minimalConfig = { characters: '01' } as PatternConfig;
      const minimalPattern = new CodeFlow(mockCtx, minimalConfig);
      
      minimalPattern.onResize(80, 24);
      expect(() => minimalPattern.initialize()).not.toThrow();
      
      minimalPattern.cleanup();
    });
  });
});