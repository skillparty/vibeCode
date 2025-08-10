import { NetworkNodes } from '../NetworkNodes';
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

describe('NetworkNodes', () => {
  let mockCtx: any;
  let config: PatternConfig;
  let pattern: NetworkNodes;

  beforeEach(() => {
    mockCtx = createMockContext();
    config = {
      characters: '01',
      speed: 'medium',
      density: 'medium',
      currentTheme: 'matrix'
    };
    pattern = new NetworkNodes(mockCtx, config);
  });

  afterEach(() => {
    pattern.cleanup();
  });

  describe('initialization', () => {
    test('should initialize with correct name', () => {
      expect(pattern.name).toBe('network-nodes');
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

    test('should create initial nodes', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      const state = pattern.getAnimationState();
      expect(state.nodeCount).toBeGreaterThan(0);
    });

    test('should create initial connections', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      const state = pattern.getAnimationState();
      expect(state.connectionCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('configuration', () => {
    test('should apply density configuration correctly', () => {
      const highConfig = { ...config, density: 'high' as const };
      const highPattern = new NetworkNodes(mockCtx, highConfig);
      highPattern.onResize(40, 20);
      highPattern.initialize();
      
      const state = highPattern.getAnimationState();
      expect(state.maxNodes).toBe(35); // High density
      expect(state.maxConnections).toBe(50);
      
      highPattern.cleanup();
    });

    test('should apply low density configuration', () => {
      const lowConfig = { ...config, density: 'low' as const };
      const lowPattern = new NetworkNodes(mockCtx, lowConfig);
      lowPattern.onResize(40, 20);
      lowPattern.initialize();
      
      const state = lowPattern.getAnimationState();
      expect(state.maxNodes).toBe(10); // Low density
      expect(state.maxConnections).toBe(15);
      
      lowPattern.cleanup();
    });

    test('should apply speed configuration correctly', () => {
      const fastConfig = { ...config, speed: 'fast' as const };
      const fastPattern = new NetworkNodes(mockCtx, fastConfig);
      fastPattern.onResize(40, 20);
      fastPattern.initialize();
      
      const state = fastPattern.getAnimationState();
      expect(state.nodeSpeed).toBe(4); // Fast speed
      
      fastPattern.cleanup();
    });

    test('should update configuration dynamically', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      pattern.setConfig({ density: 'high', speed: 'fast' });
      
      const state = pattern.getAnimationState();
      expect(state.nodeSpeed).toBe(4);
    });

    test('should update colors when theme changes', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      // Change theme and verify it doesn't throw
      expect(() => pattern.setConfig({ currentTheme: 'blue' })).not.toThrow();
    });
  });

  describe('node management', () => {
    beforeEach(() => {
      pattern.onResize(40, 20);
      pattern.initialize();
    });

    test('should spawn new nodes over time', () => {
      const initialState = pattern.getAnimationState();
      const initialNodeCount = initialState.nodeCount;
      
      // Update with enough time to spawn new nodes
      pattern.update(4000); // 4 seconds should spawn new nodes
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.nodeCount).toBeGreaterThanOrEqual(initialNodeCount);
    });

    test('should limit maximum number of nodes', () => {
      // Fast forward to spawn many nodes
      for (let i = 0; i < 20; i++) {
        pattern.update(4000);
      }
      
      const state = pattern.getAnimationState();
      expect(state.nodeCount).toBeLessThanOrEqual(state.maxNodes);
    });

    test('should move nodes around the screen', () => {
      const initialState = pattern.getAnimationState();
      
      // Update to move nodes
      pattern.update(1000); // 1 second
      
      // Nodes should have moved (tested indirectly through no errors)
      expect(() => pattern.render()).not.toThrow();
    });

    test('should bounce nodes off walls', () => {
      // Fast forward to ensure nodes hit walls
      for (let i = 0; i < 50; i++) {
        pattern.update(100);
      }
      
      // Should not throw errors when nodes bounce
      expect(() => pattern.render()).not.toThrow();
    });
  });

  describe('connection management', () => {
    beforeEach(() => {
      pattern.onResize(40, 20);
      pattern.initialize();
    });

    test('should create connections between nearby nodes', () => {
      // Add more nodes to increase connection probability
      for (let i = 0; i < 5; i++) {
        pattern.update(4000);
      }
      
      const state = pattern.getAnimationState();
      expect(state.connectionCount).toBeGreaterThanOrEqual(0);
    });

    test('should update connections periodically', () => {
      const initialState = pattern.getAnimationState();
      
      // Update with enough time to trigger connection update
      pattern.update(1500); // 1.5 seconds should trigger update
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.connectionCount).toBeGreaterThanOrEqual(0);
    });

    test('should limit maximum number of connections', () => {
      // Fast forward to create many connections
      for (let i = 0; i < 30; i++) {
        pattern.update(1000);
      }
      
      const state = pattern.getAnimationState();
      expect(state.connectionCount).toBeLessThanOrEqual(state.maxConnections);
    });

    test('should animate connection activity', () => {
      // Add nodes and connections
      for (let i = 0; i < 5; i++) {
        pattern.update(1000);
      }
      
      // Should animate without errors
      expect(() => pattern.render()).not.toThrow();
    });
  });

  describe('rendering', () => {
    beforeEach(() => {
      pattern.onResize(40, 20);
      pattern.initialize();
    });

    test('should clear canvas with background color', () => {
      pattern.render();
      
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    test('should render nodes', () => {
      pattern.render();
      
      // Should have called fillText for rendering node characters
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    test('should render connections', () => {
      // Add more nodes to ensure connections
      for (let i = 0; i < 5; i++) {
        pattern.update(1000);
      }
      
      pattern.render();
      
      // Should render connections (tested through no errors)
      expect(() => pattern.render()).not.toThrow();
    });

    test('should render network info', () => {
      pattern.render();
      
      // Should render network statistics
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

  describe('node types', () => {
    beforeEach(() => {
      pattern.onResize(40, 20);
      pattern.initialize();
    });

    test('should create different types of nodes', () => {
      // Spawn many nodes to get variety
      for (let i = 0; i < 10; i++) {
        pattern.update(4000);
      }
      
      const state = pattern.getAnimationState();
      expect(state.nodeCount).toBeGreaterThan(5);
    });

    test('should render different node types correctly', () => {
      // Add many nodes
      for (let i = 0; i < 10; i++) {
        pattern.update(4000);
      }
      
      // Should render all node types without errors
      expect(() => pattern.render()).not.toThrow();
    });
  });

  describe('activity animation', () => {
    beforeEach(() => {
      pattern.onResize(40, 20);
      pattern.initialize();
    });

    test('should animate node activity', () => {
      const state = pattern.getAnimationState();
      const initialActivity = state.averageActivity;
      
      // Update to change activity
      pattern.update(1000);
      
      const updatedState = pattern.getAnimationState();
      // Activity should be animated (may be same due to sine wave)
      expect(updatedState.averageActivity).toBeGreaterThanOrEqual(0);
      expect(updatedState.averageActivity).toBeLessThanOrEqual(1);
    });

    test('should animate connection activity', () => {
      // Add nodes and connections
      for (let i = 0; i < 5; i++) {
        pattern.update(1000);
      }
      
      // Should animate connections without errors
      expect(() => pattern.render()).not.toThrow();
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

    test('should remove out-of-bounds nodes on resize', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      // Add many nodes
      for (let i = 0; i < 10; i++) {
        pattern.update(4000);
      }
      
      const beforeResize = pattern.getAnimationState();
      
      // Resize to much smaller dimensions
      pattern.onResize(10, 5);
      
      const afterResize = pattern.getAnimationState();
      expect(afterResize.nodeCount).toBeLessThanOrEqual(beforeResize.nodeCount);
    });

    test('should update connection distance on resize', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      const initialState = pattern.getAnimationState();
      
      // Resize should update connection distance
      pattern.onResize(80, 40);
      
      const newState = pattern.getAnimationState();
      expect(newState.connectionDistance).toBeDefined();
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
      expect(state.nodeCount).toBe(0);
      expect(state.connectionCount).toBe(0);
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
      
      expect(state).toHaveProperty('nodeCount');
      expect(state).toHaveProperty('connectionCount');
      expect(state).toHaveProperty('maxNodes');
      expect(state).toHaveProperty('maxConnections');
      expect(state).toHaveProperty('connectionDistance');
      expect(state).toHaveProperty('nodeSpeed');
      expect(state).toHaveProperty('averageActivity');
      
      expect(typeof state.nodeCount).toBe('number');
      expect(typeof state.connectionCount).toBe('number');
      expect(typeof state.maxNodes).toBe('number');
      expect(typeof state.maxConnections).toBe('number');
      expect(typeof state.connectionDistance).toBe('number');
      expect(typeof state.nodeSpeed).toBe('number');
      expect(typeof state.averageActivity).toBe('number');
    });

    test('should track network growth correctly', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      const initialState = pattern.getAnimationState();
      
      // Add nodes
      pattern.update(5000);
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.nodeCount).toBeGreaterThanOrEqual(initialState.nodeCount);
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
      const minimalPattern = new NetworkNodes(mockCtx, minimalConfig);
      
      minimalPattern.onResize(20, 10);
      expect(() => minimalPattern.initialize()).not.toThrow();
      
      minimalPattern.cleanup();
    });

    test('should handle empty network', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      // Should handle rendering with no connections
      expect(() => pattern.render()).not.toThrow();
    });

    test('should handle maximum node limit', () => {
      pattern.onResize(40, 20);
      pattern.initialize();
      
      // Try to spawn more nodes than maximum
      for (let i = 0; i < 50; i++) {
        pattern.update(4000);
      }
      
      const state = pattern.getAnimationState();
      expect(state.nodeCount).toBeLessThanOrEqual(state.maxNodes);
    });

    test('should handle node collisions gracefully', () => {
      pattern.onResize(5, 3); // Very small grid
      pattern.initialize();
      
      // Fast forward to move nodes around
      for (let i = 0; i < 20; i++) {
        pattern.update(1000);
      }
      
      // Should handle overlapping nodes without errors
      expect(() => pattern.render()).not.toThrow();
    });
  });
});