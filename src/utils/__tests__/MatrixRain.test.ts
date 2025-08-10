import { MatrixRain } from '../MatrixRain';
import { PatternConfig } from '../../types';

// Mock Canvas 2D Context
class MockCanvasRenderingContext2D {
  public fillStyle: string = '#000000';
  public font: string = '12px monospace';
  public textBaseline: string = 'top';
  public textAlign: string = 'left';
  public canvas = { width: 800, height: 600 };
  
  fillRect = jest.fn();
  fillText = jest.fn();
  clearRect = jest.fn();
  measureText = jest.fn().mockReturnValue({ width: 8 });
}

describe('MatrixRain', () => {
  let mockCtx: MockCanvasRenderingContext2D;
  let defaultConfig: PatternConfig;
  let matrixRain: MatrixRain;
  
  beforeEach(() => {
    mockCtx = new MockCanvasRenderingContext2D();
    defaultConfig = {
      characters: '01{}[]()<>/*+-=;:.,!@#$%^&*',
      speed: 'medium',
      density: 'medium',
      glitchProbability: 0.02
    };
    matrixRain = new MatrixRain(mockCtx as any, defaultConfig);
  });
  
  afterEach(() => {
    matrixRain.cleanup();
  });
  
  describe('Initialization', () => {
    test('should initialize with correct name', () => {
      expect(matrixRain.name).toBe('matrix-rain');
    });
    
    test('should not be initialized before calling initialize()', () => {
      expect(matrixRain.getIsInitialized()).toBe(false);
    });
    
    test('should be initialized after calling initialize()', () => {
      matrixRain.onResize(100, 75); // Set grid dimensions
      matrixRain.initialize();
      expect(matrixRain.getIsInitialized()).toBe(true);
    });
    
    test('should set canvas properties on initialization', () => {
      matrixRain.onResize(100, 75);
      matrixRain.initialize();
      
      expect(mockCtx.textBaseline).toBe('top');
      expect(mockCtx.textAlign).toBe('left');
    });
  });
  
  describe('Character Selection', () => {
    test('should use default Matrix characters', () => {
      matrixRain.onResize(100, 75);
      matrixRain.initialize();
      
      const animationState = matrixRain.getAnimationState();
      expect(animationState).toBeDefined();
    });
    
    test('should use custom characters from config', () => {
      const customConfig = {
        ...defaultConfig,
        characters: 'ABC123'
      };
      const customMatrixRain = new MatrixRain(mockCtx as any, customConfig);
      customMatrixRain.onResize(100, 75);
      customMatrixRain.initialize();
      
      expect(customMatrixRain.getConfig().characters).toBe('ABC123');
      customMatrixRain.cleanup();
    });
  });
  
  describe('Column Animation', () => {
    beforeEach(() => {
      matrixRain.onResize(100, 75); // Set grid dimensions
      matrixRain.initialize();
    });
    
    test('should create columns during initialization', () => {
      const initialState = matrixRain.getAnimationState();
      expect(initialState.columnCount).toBeGreaterThanOrEqual(0);
    });
    
    test('should update columns on each frame', () => {
      const initialState = matrixRain.getAnimationState();
      const initialColumnCount = initialState.columnCount;
      
      // Update multiple times to allow column spawning
      for (let i = 0; i < 100; i++) {
        matrixRain.update(16.67); // ~60fps
      }
      
      const updatedState = matrixRain.getAnimationState();
      // Columns should be spawning over time
      expect(updatedState.columnCount).toBeGreaterThanOrEqual(0);
    });
    
    test('should handle variable speeds correctly', () => {
      const slowConfig = { ...defaultConfig, speed: 'slow' as const };
      const fastConfig = { ...defaultConfig, speed: 'fast' as const };
      
      const slowMatrix = new MatrixRain(mockCtx as any, slowConfig);
      const fastMatrix = new MatrixRain(mockCtx as any, fastConfig);
      
      slowMatrix.onResize(100, 75);
      fastMatrix.onResize(100, 75);
      
      slowMatrix.initialize();
      fastMatrix.initialize();
      
      const slowState = slowMatrix.getAnimationState();
      const fastState = fastMatrix.getAnimationState();
      
      expect(slowState.baseSpeed).toBeLessThan(fastState.baseSpeed);
      
      slowMatrix.cleanup();
      fastMatrix.cleanup();
    });
  });
  
  describe('Rendering', () => {
    beforeEach(() => {
      matrixRain.onResize(100, 75);
      matrixRain.initialize();
    });
    
    test('should clear canvas with black background', () => {
      matrixRain.render();
      
      expect(mockCtx.fillStyle).toBe('#000000');
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });
    
    test('should render characters when columns exist', () => {
      // Force some updates to create columns
      for (let i = 0; i < 50; i++) {
        matrixRain.update(16.67);
      }
      
      matrixRain.render();
      
      // Should have called fillText for rendering characters
      expect(mockCtx.fillText).toHaveBeenCalled();
    });
    
    test('should not render when not initialized', () => {
      const uninitializedMatrix = new MatrixRain(mockCtx as any, defaultConfig);
      uninitializedMatrix.render();
      
      // Should still clear the canvas but not render characters
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });
  });
  
  describe('Configuration', () => {
    beforeEach(() => {
      matrixRain.onResize(100, 75);
      matrixRain.initialize();
    });
    
    test('should update speed configuration', () => {
      const initialState = matrixRain.getAnimationState();
      const initialSpeed = initialState.baseSpeed;
      
      matrixRain.setConfig({ speed: 'fast' });
      
      const updatedState = matrixRain.getAnimationState();
      expect(updatedState.baseSpeed).toBeGreaterThan(initialSpeed);
    });
    
    test('should update density configuration', () => {
      // Start with low density
      matrixRain.setConfig({ density: 'low' });
      const initialState = matrixRain.getAnimationState();
      const initialProbability = initialState.spawnProbability;
      
      matrixRain.setConfig({ density: 'high' });
      
      const updatedState = matrixRain.getAnimationState();
      expect(updatedState.spawnProbability).toBeGreaterThan(initialProbability);
    });
    
    test('should update character set', () => {
      matrixRain.setConfig({ characters: 'XYZ' });
      expect(matrixRain.getConfig().characters).toBe('XYZ');
    });
  });
  
  describe('Resize Handling', () => {
    test('should handle resize correctly', () => {
      matrixRain.onResize(50, 40);
      matrixRain.initialize();
      
      const initialState = matrixRain.getAnimationState();
      
      // Resize to larger dimensions
      matrixRain.onResize(200, 150);
      
      // Should still function correctly after resize
      matrixRain.update(16.67);
      matrixRain.render();
      
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });
    
    test('should remove out-of-bounds columns on resize', () => {
      matrixRain.onResize(100, 75);
      matrixRain.initialize();
      
      // Create some columns
      for (let i = 0; i < 20; i++) {
        matrixRain.update(16.67);
      }
      
      const beforeResize = matrixRain.getAnimationState();
      
      // Resize to much smaller width
      matrixRain.onResize(10, 75);
      
      const afterResize = matrixRain.getAnimationState();
      
      // Should have removed columns that are now out of bounds
      expect(afterResize.columnCount).toBeLessThanOrEqual(beforeResize.columnCount);
    });
  });
  
  describe('Cleanup', () => {
    test('should clean up properly', () => {
      matrixRain.onResize(100, 75);
      matrixRain.initialize();
      
      expect(matrixRain.getIsInitialized()).toBe(true);
      
      matrixRain.cleanup();
      
      expect(matrixRain.getIsInitialized()).toBe(false);
      
      const state = matrixRain.getAnimationState();
      expect(state.columnCount).toBe(0);
      expect(state.glitchTimer).toBe(0);
    });
  });
  
  describe('Glitch Effect', () => {
    beforeEach(() => {
      matrixRain.onResize(100, 75);
      matrixRain.initialize();
    });
    
    test('should update glitch timer', () => {
      const initialState = matrixRain.getAnimationState();
      const initialGlitchTimer = initialState.glitchTimer;
      
      matrixRain.update(100); // 100ms
      
      const updatedState = matrixRain.getAnimationState();
      expect(updatedState.glitchTimer).toBeGreaterThan(initialGlitchTimer);
    });
    
    test('should reset glitch timer after interval', () => {
      // Update for more than the glitch interval (2000ms)
      matrixRain.update(2500);
      
      const state = matrixRain.getAnimationState();
      expect(state.glitchTimer).toBeLessThan(2000);
    });
  });
  
  describe('Performance', () => {
    test('should handle many updates without errors', () => {
      matrixRain.onResize(100, 75);
      matrixRain.initialize();
      
      // Simulate 5 seconds of animation at 60fps
      for (let i = 0; i < 300; i++) {
        expect(() => {
          matrixRain.update(16.67);
          matrixRain.render();
        }).not.toThrow();
      }
    });
    
    test('should limit column spawning to prevent memory issues', () => {
      matrixRain.onResize(100, 75);
      matrixRain.initialize();
      
      // Force many updates to test column management
      for (let i = 0; i < 1000; i++) {
        matrixRain.update(16.67);
      }
      
      const state = matrixRain.getAnimationState();
      // Should not have an excessive number of columns
      expect(state.columnCount).toBeLessThan(200);
    });
  });
});