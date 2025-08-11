import { renderHook, act } from '@testing-library/react';
import { useScreensaverActivation } from '../useScreensaverActivation';

// Mock the inactivity detector
jest.mock('../useInactivityDetector', () => ({
  useInactivityDetector: jest.fn((onInactive, options) => {
    const mockResetTimer = jest.fn();
    
    // Simulate inactivity detection
    setTimeout(() => {
      onInactive();
    }, options?.timeout || 180000);
    
    return {
      resetTimer: mockResetTimer,
      isActive: false,
      forceActivate: jest.fn(),
      forceDeactivate: jest.fn()
    };
  })
}));

// Mock requestAnimationFrame and performance.now
const mockPerformanceNow = jest.fn();
const mockRequestAnimationFrame = jest.fn();
const mockCancelAnimationFrame = jest.fn();

Object.defineProperty(window, 'performance', {
  value: { now: mockPerformanceNow }
});

Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame
});

// Mock timers
jest.useFakeTimers();

describe('useScreensaverActivation', () => {
  let mockOnActivate: jest.Mock;
  let mockOnDeactivate: jest.Mock;
  let mockOnTransitionStart: jest.Mock;
  let mockOnTransitionEnd: jest.Mock;

  beforeEach(() => {
    mockOnActivate = jest.fn();
    mockOnDeactivate = jest.fn();
    mockOnTransitionStart = jest.fn();
    mockOnTransitionEnd = jest.fn();
    
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    // Reset mocks
    mockPerformanceNow.mockReturnValue(0);
    mockRequestAnimationFrame.mockImplementation((callback) => {
      setTimeout(callback, 16); // ~60fps
      return 1;
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Initial state', () => {
    it('should initialize with inactive state', () => {
      const { result } = renderHook(() => useScreensaverActivation());

      expect(result.current.isActive).toBe(false);
      expect(result.current.isTransitioning).toBe(false);
      expect(result.current.transitionProgress).toBe(0);
    });

    it('should provide control methods', () => {
      const { result } = renderHook(() => useScreensaverActivation());

      expect(typeof result.current.activate).toBe('function');
      expect(typeof result.current.deactivate).toBe('function');
      expect(typeof result.current.resetTimer).toBe('function');
    });
  });

  describe('Manual activation', () => {
    it('should activate screensaver manually', () => {
      const { result } = renderHook(() =>
        useScreensaverActivation({
          onActivate: mockOnActivate,
          onTransitionStart: mockOnTransitionStart,
          transitionDuration: 1000
        })
      );

      act(() => {
        result.current.activate();
      });

      expect(result.current.isTransitioning).toBe(true);
      expect(mockOnTransitionStart).toHaveBeenCalledWith(true);
    });

    it('should not activate if already active', () => {
      const { result } = renderHook(() =>
        useScreensaverActivation({
          onTransitionStart: mockOnTransitionStart
        })
      );

      // Activate first time
      act(() => {
        result.current.activate();
      });

      const firstCallCount = mockOnTransitionStart.mock.calls.length;

      // Try to activate again
      act(() => {
        result.current.activate();
      });

      expect(mockOnTransitionStart).toHaveBeenCalledTimes(firstCallCount);
    });
  });

  describe('Manual deactivation', () => {
    it('should deactivate screensaver manually', async () => {
      const { result } = renderHook(() =>
        useScreensaverActivation({
          onDeactivate: mockOnDeactivate,
          onTransitionStart: mockOnTransitionStart,
          transitionDuration: 1000
        })
      );

      // First activate
      act(() => {
        result.current.activate();
      });

      // Complete activation transition
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Then deactivate
      act(() => {
        result.current.deactivate();
      });

      expect(result.current.isTransitioning).toBe(true);
      expect(mockOnTransitionStart).toHaveBeenCalledWith(false);
    });
  });

  describe('Transition animations', () => {
    it('should animate transition progress', () => {
      let currentTime = 0;
      mockPerformanceNow.mockImplementation(() => currentTime);

      const { result } = renderHook(() =>
        useScreensaverActivation({
          transitionDuration: 1000
        })
      );

      act(() => {
        result.current.activate();
      });

      expect(result.current.isTransitioning).toBe(true);
      expect(result.current.transitionProgress).toBe(0);

      // Simulate animation frame at 50% completion
      currentTime = 500;
      act(() => {
        jest.advanceTimersByTime(16);
      });

      expect(result.current.transitionProgress).toBeGreaterThan(0);
      expect(result.current.transitionProgress).toBeLessThan(1);
    });

    it('should complete transition after duration', () => {
      const { result } = renderHook(() =>
        useScreensaverActivation({
          transitionDuration: 1000,
          onActivate: mockOnActivate,
          onTransitionEnd: mockOnTransitionEnd
        })
      );

      act(() => {
        result.current.activate();
      });

      // Complete transition
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      expect(result.current.isTransitioning).toBe(false);
      expect(result.current.isActive).toBe(true);
      expect(result.current.transitionProgress).toBe(1);
      expect(mockOnActivate).toHaveBeenCalledTimes(1);
      expect(mockOnTransitionEnd).toHaveBeenCalledWith(true);
    });

    it('should use easing function for smooth transitions', () => {
      let currentTime = 0;
      mockPerformanceNow.mockImplementation(() => currentTime);

      const { result } = renderHook(() =>
        useScreensaverActivation({
          transitionDuration: 1000
        })
      );

      act(() => {
        result.current.activate();
      });

      // Check progress at different points
      const progressPoints: number[] = [];

      // 25% through
      currentTime = 250;
      act(() => {
        jest.advanceTimersByTime(16);
      });
      progressPoints.push(result.current.transitionProgress);

      // 50% through
      currentTime = 500;
      act(() => {
        jest.advanceTimersByTime(16);
      });
      progressPoints.push(result.current.transitionProgress);

      // 75% through
      currentTime = 750;
      act(() => {
        jest.advanceTimersByTime(16);
      });
      progressPoints.push(result.current.transitionProgress);

      // Should show easing (not linear progression)
      expect(progressPoints[0]).toBeLessThan(0.25); // Slow start
      expect(progressPoints[2]).toBeGreaterThan(0.75); // Fast end
    });

    it('should handle fallback timeout for failed animations', () => {
      // Mock requestAnimationFrame to not call callback
      mockRequestAnimationFrame.mockImplementation(() => 1);

      const { result } = renderHook(() =>
        useScreensaverActivation({
          transitionDuration: 1000,
          onActivate: mockOnActivate
        })
      );

      act(() => {
        result.current.activate();
      });

      // Fast-forward past fallback timeout
      act(() => {
        jest.advanceTimersByTime(1200);
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.isTransitioning).toBe(false);
      expect(mockOnActivate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Page visibility handling', () => {
    it('should pause transition when page becomes hidden', () => {
      const { result } = renderHook(() =>
        useScreensaverActivation({
          transitionDuration: 1000
        })
      );

      act(() => {
        result.current.activate();
      });

      expect(result.current.isTransitioning).toBe(true);

      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });

      act(() => {
        const event = new Event('visibilitychange');
        document.dispatchEvent(event);
      });

      expect(result.current.isTransitioning).toBe(false);
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('should ensure proper state when page becomes visible', () => {
      const { result } = renderHook(() =>
        useScreensaverActivation({
          transitionDuration: 1000
        })
      );

      // Activate and complete transition
      act(() => {
        result.current.activate();
        jest.advanceTimersByTime(1100);
      });

      expect(result.current.isActive).toBe(true);

      // Simulate page becoming visible
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false
      });

      act(() => {
        const event = new Event('visibilitychange');
        document.dispatchEvent(event);
      });

      expect(result.current.transitionProgress).toBe(1);
    });
  });

  describe('Integration with inactivity detector', () => {
    it('should provide resetTimer method from inactivity detector', () => {
      const { result } = renderHook(() => useScreensaverActivation());

      expect(typeof result.current.resetTimer).toBe('function');
      
      // Should not throw when called
      act(() => {
        result.current.resetTimer();
      });
    });
  });

  describe('Cleanup', () => {
    it('should clean up timers and animation frames on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useScreensaverActivation({
          transitionDuration: 1000
        })
      );

      act(() => {
        result.current.activate();
      });

      unmount();

      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() => useScreensaverActivation());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Configuration options', () => {
    it('should use custom transition duration', () => {
      const customDuration = 2000;
      const { result } = renderHook(() =>
        useScreensaverActivation({
          transitionDuration: customDuration,
          onActivate: mockOnActivate
        })
      );

      act(() => {
        result.current.activate();
      });

      // Should not complete at default duration
      act(() => {
        jest.advanceTimersByTime(1100);
      });
      expect(result.current.isActive).toBe(false);

      // Should complete at custom duration
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.isActive).toBe(true);
      expect(mockOnActivate).toHaveBeenCalledTimes(1);
    });

    it('should call all callback functions', () => {
      const { result } = renderHook(() =>
        useScreensaverActivation({
          onActivate: mockOnActivate,
          onDeactivate: mockOnDeactivate,
          onTransitionStart: mockOnTransitionStart,
          onTransitionEnd: mockOnTransitionEnd,
          transitionDuration: 1000
        })
      );

      // Test activation callbacks
      act(() => {
        result.current.activate();
      });
      expect(mockOnTransitionStart).toHaveBeenCalledWith(true);

      act(() => {
        jest.advanceTimersByTime(1100);
      });
      expect(mockOnActivate).toHaveBeenCalledTimes(1);
      expect(mockOnTransitionEnd).toHaveBeenCalledWith(true);

      // Test deactivation callbacks
      act(() => {
        result.current.deactivate();
      });
      expect(mockOnTransitionStart).toHaveBeenCalledWith(false);

      act(() => {
        jest.advanceTimersByTime(1100);
      });
      expect(mockOnDeactivate).toHaveBeenCalledTimes(1);
      expect(mockOnTransitionEnd).toHaveBeenCalledWith(false);
    });
  });
});