import { TransitionManager } from '../TransitionManager';
import { Pattern } from '../../types';

// Mock pattern for testing
class MockPattern implements Pattern {
  name = 'mock-pattern';
  ctx: any;
  
  constructor(ctx: any) {
    this.ctx = ctx;
  }
  
  initialize(): void {}
  update(deltaTime: number): void {}
  render(): void {}
  cleanup(): void {}
}

// Mock Canvas 2D context
const createMockContext = () => ({
  fillStyle: '#000000',
  font: '12px monospace',
  textBaseline: 'top',
  textAlign: 'left',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  drawImage: jest.fn(),
  measureText: jest.fn(() => ({ width: 8 })),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(800 * 600 * 4),
    width: 800,
    height: 600
  })),
  putImageData: jest.fn(),
  createImageData: jest.fn((width, height) => ({
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height
  })),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  canvas: { width: 800, height: 600 }
});

// Mock canvas
const createMockCanvas = () => {
  const mockContext = createMockContext();
  return {
    width: 800,
    height: 600,
    getContext: jest.fn(() => mockContext)
  };
};

describe('TransitionManager', () => {
  let transitionManager: TransitionManager;
  let mockCanvas: any;
  let mockContext: any;

  beforeEach(() => {
    mockCanvas = createMockCanvas();
    mockContext = mockCanvas.getContext('2d');
    transitionManager = new TransitionManager(mockCanvas, mockContext);
  });

  describe('Transition State Management', () => {
    test('should initialize with idle state', () => {
      const state = transitionManager.getTransitionState();
      expect(state.type).toBe('idle');
      expect(state.progress).toBe(0);
    });

    test('should not be transitioning initially', () => {
      expect(transitionManager.isTransitioning()).toBe(false);
    });

    test('should start transition correctly', () => {
      const fromPattern = new MockPattern(mockContext);
      const toPattern = new MockPattern(mockContext);
      
      transitionManager.startTransition(fromPattern, toPattern, {
        type: 'fade',
        duration: 1000,
        easing: 'ease-in-out'
      });

      const state = transitionManager.getTransitionState();
      expect(state.type).toBe('transitioning');
      expect(state.effect).toBe('fade');
      expect(state.duration).toBe(1000);
    });
  });

  describe('Transition Effects', () => {
    test('should handle fade transition', () => {
      const fromPattern = new MockPattern(mockContext);
      const toPattern = new MockPattern(mockContext);
      
      transitionManager.startTransition(fromPattern, toPattern, {
        type: 'fade',
        duration: 100,
        easing: 'linear'
      });

      // Update transition
      const completed = transitionManager.updateTransition(50, toPattern);
      expect(completed).toBe(false);
      expect(transitionManager.isTransitioning()).toBe(true);
    });

    test('should complete transition after duration', () => {
      const fromPattern = new MockPattern(mockContext);
      const toPattern = new MockPattern(mockContext);
      
      transitionManager.startTransition(fromPattern, toPattern, {
        type: 'fade',
        duration: 50,
        easing: 'linear'
      });

      // Wait for transition to complete
      setTimeout(() => {
        const completed = transitionManager.updateTransition(100, toPattern);
        expect(completed).toBe(true);
        expect(transitionManager.isTransitioning()).toBe(false);
      }, 60);
    });

    test('should support all transition types', () => {
      const transitionTypes = ['fade', 'morph', 'displacement', 'glitch', 'slide', 'rotate3d'];
      const fromPattern = new MockPattern(mockContext);
      const toPattern = new MockPattern(mockContext);

      transitionTypes.forEach(type => {
        transitionManager.startTransition(fromPattern, toPattern, {
          type: type as any,
          duration: 100,
          easing: 'linear'
        });

        const state = transitionManager.getTransitionState();
        expect(state.effect).toBe(type);
      });
    });
  });

  describe('Force Complete', () => {
    test('should force complete transition', () => {
      const fromPattern = new MockPattern(mockContext);
      const toPattern = new MockPattern(mockContext);
      
      transitionManager.startTransition(fromPattern, toPattern, {
        type: 'fade',
        duration: 1000,
        easing: 'linear'
      });

      expect(transitionManager.isTransitioning()).toBe(true);
      
      transitionManager.forceComplete();
      expect(transitionManager.isTransitioning()).toBe(false);
    });
  });

  describe('Canvas Operations', () => {
    test('should call canvas drawing methods during transition', () => {
      const fromPattern = new MockPattern(mockContext);
      const toPattern = new MockPattern(mockContext);
      
      transitionManager.startTransition(fromPattern, toPattern, {
        type: 'fade',
        duration: 100,
        easing: 'linear'
      });

      transitionManager.updateTransition(50, toPattern);

      // Verify canvas methods were called
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });
});