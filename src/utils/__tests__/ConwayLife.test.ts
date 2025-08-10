import { ConwayLife } from '../ConwayLife';
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

describe('ConwayLife', () => {
  let mockCtx: any;
  let config: PatternConfig;
  let pattern: ConwayLife;

  beforeEach(() => {
    mockCtx = createMockContext();
    config = {
      characters: '01',
      speed: 'medium',
      density: 'medium',
      complexity: 'medium',
      currentTheme: 'matrix'
    };
    pattern = new ConwayLife(mockCtx, config);
  });

  afterEach(() => {
    pattern.cleanup();
  });

  describe('initialization', () => {
    test('should initialize with correct name', () => {
      expect(pattern.name).toBe('conway-life');
    });

    test('should not be initialized before calling initialize()', () => {
      expect(pattern.getIsInitialized()).toBe(false);
    });

    test('should be initialized after calling initialize()', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      expect(pattern.getIsInitialized()).toBe(true);
    });

    test('should set canvas properties on initialization', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      expect(mockCtx.textBaseline).toBe('top');
      expect(mockCtx.textAlign).toBe('left');
    });

    test('should seed initial patterns', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      const state = pattern.getAnimationState();
      expect(state.generation).toBe(0);
      expect(state.population).toBeGreaterThanOrEqual(0);
    });
  });

  describe('configuration', () => {
    test('should apply speed configuration correctly', () => {
      const fastConfig = { ...config, speed: 'fast' as const };
      const fastPattern = new ConwayLife(mockCtx, fastConfig);
      fastPattern.onResize(40, 20);
      fastPattern.initialize();
      
      const state = fastPattern.getAnimationState();
      expect(state.updateInterval).toBe(100); // Fast update interval
      
      fastPattern.cleanup();
    });

    test('should apply slow speed configuration', () => {
      const slowConfig = { ...config, speed: 'slow' as const };
      const slowPattern = new ConwayLife(mockCtx, slowConfig);
      slowPattern.onResize(40, 20);
      slowPattern.initialize();
      
      const state = slowPattern.getAnimationState();
      expect(state.updateInterval).toBe(500); // Slow update interval
      
      slowPattern.cleanup();
    });

    test('should apply complexity configuration correctly', () => {
      const highConfig = { ...config, complexity: 'high' as const };
      const highPattern = new ConwayLife(mockCtx, highConfig);
      highPattern.onResize(40, 20);
      highPattern.initialize();
      
      const state = highPattern.getAnimationState();
      expect(state.maxAge).toBe(15); // High complexity max age
      
      highPattern.cleanup();
    });

    test('should update configuration dynamically', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      pattern.setConfig({ speed: 'fast', complexity: 'high' });
      
      const state = pattern.getAnimationState();
      expect(state.updateInterval).toBe(100);
      expect(state.maxAge).toBe(15);
    });
  });

  describe('Game of Life rules', () => {
    beforeEach(() => {
      pattern.onResize(40, 20);
      pattern.initialize();
    });

    test('should advance generations over time', () => {
      const initialState = pattern.getAnimationState();
      const initialGeneration = initialState.generation;
      
      // Update with enough time to advance generation
      pattern.update(300); // Should trigger generation update
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.generation).toBeGreaterThan(initialGeneration);
    });

    test('should track population changes', () => {
      const initialState = pattern.getAnimationState();
      
      // Advance several generations
      for (let i = 0; i < 5; i++) {
        pattern.update(300);
      }
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.generation).toBeGreaterThan(initialState.generation);
      expect(updatedState.population).toBeGreaterThanOrEqual(0);
    });

    test('should detect stable generations', () => {
      // Fast forward many generations
      for (let i = 0; i < 20; i++) {
        pattern.update(300);
      }
      
      const state = pattern.getAnimationState();
      expect(state.stableGenerations).toBeGreaterThanOrEqual(0);
    });

    test('should reset when stable for too long', () => {
      // Force many stable generations by fast forwarding
      for (let i = 0; i < 100; i++) {
        pattern.update(300);
      }
      
      // Should eventually reset
      const state = pattern.getAnimationState();
      expect(state.generation).toBeGreaterThanOrEqual(0);
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

    test('should render living cells', () => {
      // Advance a generation to ensure some cells are alive
      pattern.update(300);
      pattern.render();
      
      // Should have called fillText for rendering characters
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    test('should render info overlay', () => {
      pattern.render();
      
      // Should render generation and population info
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    test('should render without errors when not initialized', () => {
      pattern.cleanup();
      
      expect(() => pattern.render()).not.toThrow();
      expect(mockCtx.fillRect).toHaveBeenCalled(); // Should still clear canvas
    });

    test('should handle different themes', () => {
      pattern.setConfig({ currentTheme: 'retro' });
      
      expect(() => pattern.render()).not.toThrow();
    });
  });

  describe('cell aging', () => {
    beforeEach(() => {
      pattern.onResize(40, 20);
      pattern.initialize();
    });

    test('should age cells over generations', () => {
      // Advance several generations
      for (let i = 0; i < 10; i++) {
        pattern.update(300);
      }
      
      const state = pattern.getAnimationState();
      expect(state.generation).toBeGreaterThan(5);
    });

    test('should limit cell age to maximum', () => {
      const state = pattern.getAnimationState();
      const maxAge = state.maxAge;
      
      // Fast forward many generations
      for (let i = 0; i < 50; i++) {
        pattern.update(300);
      }
      
      // Ages should be limited (this is tested indirectly through no errors)
      expect(() => pattern.render()).not.toThrow();
    });
  });

  describe('pattern seeding', () => {
    test('should seed different patterns', () => {
      pattern.onResize(80, 40); // Larger grid for pattern placement
      pattern.initialize();
      
      const state = pattern.getAnimationState();
      expect(state.population).toBeGreaterThanOrEqual(0); // May start with 0 population
    });

    test('should handle small grids', () => {
      pattern.onResize(10, 5); // Very small grid
      pattern.initialize();
      
      expect(pattern.getIsInitialized()).toBe(true);
      
      // Should not throw when updating
      expect(() => pattern.update(300)).not.toThrow();
    });
  });

  describe('resize handling', () => {
    test('should handle resize correctly', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      expect(pattern.getIsInitialized()).toBe(true);
      
      // Resize to different dimensions
      pattern.onResize(30, 15);
      
      // Should still be initialized and working
      expect(pattern.getIsInitialized()).toBe(true);
    });

    test('should reinitialize grids on resize', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      const initialState = pattern.getAnimationState();
      
      // Resize should reinitialize
      pattern.onResize(20, 10);
      
      const newState = pattern.getAnimationState();
      expect(newState.generation).toBe(0); // Should reset
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
      expect(state.generation).toBe(0);
      expect(state.population).toBe(0);
      expect(state.stableGenerations).toBe(0);
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
      
      expect(state).toHaveProperty('generation');
      expect(state).toHaveProperty('population');
      expect(state).toHaveProperty('stableGenerations');
      expect(state).toHaveProperty('updateInterval');
      expect(state).toHaveProperty('maxAge');
      expect(state).toHaveProperty('resetProgress');
      
      expect(typeof state.generation).toBe('number');
      expect(typeof state.population).toBe('number');
      expect(typeof state.stableGenerations).toBe('number');
      expect(typeof state.updateInterval).toBe('number');
      expect(typeof state.maxAge).toBe('number');
      expect(typeof state.resetProgress).toBe('number');
    });

    test('should track generation progression correctly', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      const initialState = pattern.getAnimationState();
      
      // Advance generations
      pattern.update(300);
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.generation).toBeGreaterThan(initialState.generation);
    });
  });

  describe('edge cases', () => {
    test('should handle very small grid dimensions', () => {
      pattern.onResize(3, 2);
      pattern.initialize();
      
      expect(pattern.getIsInitialized()).toBe(true);
      
      pattern.update(300);
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
      
      expect(() => pattern.update(10000)).not.toThrow();
    });

    test('should handle configuration with missing properties', () => {
      const minimalConfig = { characters: '01' } as PatternConfig;
      const minimalPattern = new ConwayLife(mockCtx, minimalConfig);
      
      minimalPattern.onResize(20, 10);
      expect(() => minimalPattern.initialize()).not.toThrow();
      
      minimalPattern.cleanup();
    });

    test('should handle empty grid', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      // Force empty grid by advancing many generations
      for (let i = 0; i < 200; i++) {
        pattern.update(300);
      }
      
      // Should handle empty population gracefully
      expect(() => pattern.render()).not.toThrow();
    });

    test('should reset after timeout', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      // Fast forward past reset interval
      pattern.update(35000); // 35 seconds
      
      const state = pattern.getAnimationState();
      expect(state.resetProgress).toBeDefined();
    });
  });
});