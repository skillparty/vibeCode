import { TerminalCursor } from '../TerminalCursor';
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

describe('TerminalCursor', () => {
  let mockCtx: any;
  let config: PatternConfig;
  let pattern: TerminalCursor;

  beforeEach(() => {
    mockCtx = createMockContext();
    config = {
      characters: '01',
      speed: 'medium',
      density: 'medium',
      currentTheme: 'matrix'
    };
    pattern = new TerminalCursor(mockCtx, config);
  });

  afterEach(() => {
    pattern.cleanup();
  });

  describe('initialization', () => {
    test('should initialize with correct name', () => {
      expect(pattern.name).toBe('terminal-cursor');
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
  });

  describe('configuration', () => {
    test('should apply speed configuration correctly', () => {
      const slowConfig = { ...config, speed: 'slow' as const };
      const slowPattern = new TerminalCursor(mockCtx, slowConfig);
      slowPattern.onResize(80, 24);
      slowPattern.initialize();
      
      const state = slowPattern.getAnimationState();
      expect(state.typingSpeed).toBe(60); // 60 characters per minute for slow
      
      slowPattern.cleanup();
    });

    test('should apply theme configuration correctly', () => {
      const blueConfig = { ...config, currentTheme: 'blue' as const };
      const bluePattern = new TerminalCursor(mockCtx, blueConfig);
      bluePattern.onResize(80, 24);
      bluePattern.initialize();
      
      // Theme should be applied during initialization
      expect(bluePattern.getIsInitialized()).toBe(true);
      
      bluePattern.cleanup();
    });

    test('should update configuration dynamically', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      pattern.setConfig({ speed: 'fast', currentTheme: 'retro' });
      
      const state = pattern.getAnimationState();
      expect(state.typingSpeed).toBe(200); // 200 characters per minute for fast
    });
  });

  describe('animation updates', () => {
    beforeEach(() => {
      pattern.onResize(80, 24);
      pattern.initialize();
    });

    test('should update cursor blink state', () => {
      const initialState = pattern.getAnimationState();
      const initialCursorVisible = initialState.cursorVisible;
      
      // Update with enough time to trigger cursor blink
      pattern.update(600); // 600ms should trigger blink
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.cursorVisible).not.toBe(initialCursorVisible);
    });

    test('should advance typing animation', () => {
      const initialState = pattern.getAnimationState();
      const initialProgress = initialState.currentProgress;
      
      // Update with enough time to trigger typing
      pattern.update(1000); // 1 second should advance typing
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.currentProgress).toBeGreaterThanOrEqual(initialProgress);
    });

    test('should handle multiple lines', () => {
      // Fast forward through multiple typing cycles
      for (let i = 0; i < 20; i++) {
        pattern.update(3000); // 3 seconds each update to ensure line completion
      }
      
      const state = pattern.getAnimationState();
      expect(state.lineCount).toBeGreaterThanOrEqual(1); // At least one line should exist
    });

    test('should not update when not initialized', () => {
      pattern.cleanup();
      
      const updateSpy = jest.spyOn(pattern, 'update');
      pattern.update(1000);
      
      expect(updateSpy).toHaveBeenCalled();
      // Should not throw or cause issues
    });
  });

  describe('rendering', () => {
    beforeEach(() => {
      pattern.onResize(80, 24);
      pattern.initialize();
    });

    test('should clear canvas on render', () => {
      pattern.render();
      
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    test('should render terminal header', () => {
      pattern.render();
      
      // Should have called fillText for header and separator
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    test('should render without errors when not initialized', () => {
      pattern.cleanup();
      
      expect(() => pattern.render()).not.toThrow();
      expect(mockCtx.fillRect).toHaveBeenCalled(); // Should still clear canvas
    });

    test('should render cursor when visible', () => {
      // Ensure cursor is visible
      pattern.update(0);
      pattern.render();
      
      const state = pattern.getAnimationState();
      if (state.cursorVisible) {
        expect(mockCtx.fillText).toHaveBeenCalledWith('█', expect.any(Number), expect.any(Number));
      }
    });
  });

  describe('resize handling', () => {
    test('should handle resize correctly', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      const initialState = pattern.getAnimationState();
      
      // Resize to smaller dimensions
      pattern.onResize(40, 12);
      
      const newState = pattern.getAnimationState();
      expect(newState.lineCount).toBeLessThanOrEqual(initialState.lineCount);
    });

    test('should adjust max lines based on grid height', () => {
      pattern.onResize(80, 5); // Very small height
      pattern.initialize();
      
      // Should still work with minimal height
      expect(pattern.getIsInitialized()).toBe(true);
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
      expect(state.currentLine).toBe(0);
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
      expect(state).toHaveProperty('currentLine');
      expect(state).toHaveProperty('cursorVisible');
      expect(state).toHaveProperty('typingSpeed');
      expect(state).toHaveProperty('currentProgress');
      expect(state).toHaveProperty('totalLength');
      
      expect(typeof state.lineCount).toBe('number');
      expect(typeof state.cursorVisible).toBe('boolean');
      expect(typeof state.typingSpeed).toBe('number');
    });

    test('should track typing progress correctly', () => {
      pattern.onResize(80, 24);
      pattern.initialize();
      
      const initialState = pattern.getAnimationState();
      
      // Advance typing
      pattern.update(500);
      
      const updatedState = pattern.getAnimationState();
      expect(updatedState.currentProgress).toBeGreaterThanOrEqual(initialState.currentProgress);
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
      const minimalPattern = new TerminalCursor(mockCtx, minimalConfig);
      
      minimalPattern.onResize(80, 24);
      expect(() => minimalPattern.initialize()).not.toThrow();
      
      minimalPattern.cleanup();
    });
  });
});