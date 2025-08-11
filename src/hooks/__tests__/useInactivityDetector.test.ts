import { renderHook, act } from '@testing-library/react';
import { useInactivityDetector } from '../useInactivityDetector';

// Mock timers
jest.useFakeTimers();

describe('useInactivityDetector', () => {
  let mockOnInactive: jest.Mock;
  let mockOnActivate: jest.Mock;
  let mockOnDeactivate: jest.Mock;

  beforeEach(() => {
    mockOnInactive = jest.fn();
    mockOnActivate = jest.fn();
    mockOnDeactivate = jest.fn();
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Basic functionality', () => {
    it('should initialize with inactive state', () => {
      const { result } = renderHook(() =>
        useInactivityDetector(mockOnInactive)
      );

      expect(result.current.isActive).toBe(false);
      expect(mockOnInactive).not.toHaveBeenCalled();
    });

    it('should activate screensaver after timeout period', () => {
      const timeout = 5000;
      renderHook(() =>
        useInactivityDetector(mockOnInactive, { 
          timeout,
          onActivate: mockOnActivate 
        })
      );

      // Fast-forward time to just before timeout
      act(() => {
        jest.advanceTimersByTime(timeout - 100);
      });
      expect(mockOnInactive).not.toHaveBeenCalled();
      expect(mockOnActivate).not.toHaveBeenCalled();

      // Fast-forward to timeout
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(mockOnInactive).toHaveBeenCalledTimes(1);
      expect(mockOnActivate).toHaveBeenCalledTimes(1);
    });

    it('should use default 3-minute timeout when not specified', () => {
      renderHook(() => useInactivityDetector(mockOnInactive));

      // Fast-forward to just before 3 minutes
      act(() => {
        jest.advanceTimersByTime(180000 - 100);
      });
      expect(mockOnInactive).not.toHaveBeenCalled();

      // Fast-forward to 3 minutes
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(mockOnInactive).toHaveBeenCalledTimes(1);
    });
  });

  describe('Activity detection', () => {
    it('should reset timer on mouse movement', () => {
      const timeout = 5000;
      renderHook(() =>
        useInactivityDetector(mockOnInactive, { timeout })
      );

      // Fast-forward halfway to timeout
      act(() => {
        jest.advanceTimersByTime(timeout / 2);
      });

      // Simulate mouse movement
      act(() => {
        const event = new MouseEvent('mousemove');
        document.dispatchEvent(event);
        jest.advanceTimersByTime(100); // Account for debounce delay
      });

      // Fast-forward the original remaining time
      act(() => {
        jest.advanceTimersByTime(timeout / 2);
      });
      expect(mockOnInactive).not.toHaveBeenCalled();

      // Fast-forward full timeout from activity
      act(() => {
        jest.advanceTimersByTime(timeout);
      });
      expect(mockOnInactive).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on keyboard input', () => {
      const timeout = 5000;
      renderHook(() =>
        useInactivityDetector(mockOnInactive, { timeout })
      );

      // Fast-forward halfway to timeout
      act(() => {
        jest.advanceTimersByTime(timeout / 2);
      });

      // Simulate keyboard input
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'a' });
        document.dispatchEvent(event);
        jest.advanceTimersByTime(100); // Account for debounce delay
      });

      // Should not activate at original timeout
      act(() => {
        jest.advanceTimersByTime(timeout / 2);
      });
      expect(mockOnInactive).not.toHaveBeenCalled();
    });

    it('should handle multiple activity events with debouncing', () => {
      const timeout = 5000;
      const debounceDelay = 200;
      renderHook(() =>
        useInactivityDetector(mockOnInactive, { 
          timeout,
          debounceDelay 
        })
      );

      // Simulate rapid mouse movements
      act(() => {
        for (let i = 0; i < 10; i++) {
          const event = new MouseEvent('mousemove');
          document.dispatchEvent(event);
          jest.advanceTimersByTime(50); // 50ms between events
        }
      });

      // Only the last event should reset the timer after debounce
      act(() => {
        jest.advanceTimersByTime(debounceDelay);
      });

      // Should not activate at original timeout from first event
      act(() => {
        jest.advanceTimersByTime(timeout - debounceDelay - 500); // Account for debounce and events
      });
      expect(mockOnInactive).not.toHaveBeenCalled();
      
      // Should activate after full timeout from last debounced reset
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(mockOnInactive).toHaveBeenCalledTimes(1);
    });

    it('should support custom event types', () => {
      const timeout = 5000;
      const customEvents = ['click', 'scroll'];
      renderHook(() =>
        useInactivityDetector(mockOnInactive, { 
          timeout,
          events: customEvents 
        })
      );

      // Fast-forward halfway to timeout
      act(() => {
        jest.advanceTimersByTime(timeout / 2);
      });

      // Simulate custom event
      act(() => {
        const event = new Event('click');
        document.dispatchEvent(event);
        jest.advanceTimersByTime(100);
      });

      // Should reset timer
      act(() => {
        jest.advanceTimersByTime(timeout / 2);
      });
      expect(mockOnInactive).not.toHaveBeenCalled();

      // Mouse movement should not reset (not in custom events)
      act(() => {
        const event = new MouseEvent('mousemove');
        document.dispatchEvent(event);
        jest.advanceTimersByTime(100);
      });

      act(() => {
        jest.advanceTimersByTime(timeout);
      });
      expect(mockOnInactive).toHaveBeenCalledTimes(1);
    });
  });

  describe('Screensaver state management', () => {
    it('should deactivate screensaver immediately on activity', () => {
      const timeout = 5000;
      const { result } = renderHook(() =>
        useInactivityDetector(mockOnInactive, { 
          timeout,
          onDeactivate: mockOnDeactivate 
        })
      );

      // Activate screensaver
      act(() => {
        jest.advanceTimersByTime(timeout);
      });
      expect(result.current.isActive).toBe(true);

      // Simulate activity
      act(() => {
        const event = new MouseEvent('mousemove');
        document.dispatchEvent(event);
        jest.advanceTimersByTime(100);
      });

      expect(result.current.isActive).toBe(false);
      expect(mockOnDeactivate).toHaveBeenCalledTimes(1);
    });

    it('should ignore activity from screensaver elements', () => {
      const timeout = 5000;
      renderHook(() =>
        useInactivityDetector(mockOnInactive, { timeout })
      );

      // Activate screensaver
      act(() => {
        jest.advanceTimersByTime(timeout);
      });

      // Create mock screensaver element
      const screensaverElement = document.createElement('div');
      screensaverElement.className = 'screensaver-active';
      document.body.appendChild(screensaverElement);

      // Simulate activity from screensaver element
      act(() => {
        const event = new MouseEvent('mousemove');
        Object.defineProperty(event, 'target', {
          value: screensaverElement,
          enumerable: true
        });
        document.dispatchEvent(event);
        jest.advanceTimersByTime(100);
      });

      // Should not deactivate screensaver
      expect(mockOnInactive).toHaveBeenCalledTimes(1);

      // Cleanup
      document.body.removeChild(screensaverElement);
    });
  });

  describe('Manual control methods', () => {
    it('should provide forceActivate method', () => {
      const { result } = renderHook(() =>
        useInactivityDetector(mockOnInactive, {
          onActivate: mockOnActivate
        })
      );

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.forceActivate();
      });

      expect(result.current.isActive).toBe(true);
      expect(mockOnInactive).toHaveBeenCalledTimes(1);
      expect(mockOnActivate).toHaveBeenCalledTimes(1);
    });

    it('should provide forceDeactivate method', () => {
      const timeout = 5000;
      const { result } = renderHook(() =>
        useInactivityDetector(mockOnInactive, {
          timeout,
          onDeactivate: mockOnDeactivate
        })
      );

      // Activate screensaver first
      act(() => {
        jest.advanceTimersByTime(timeout);
      });
      expect(result.current.isActive).toBe(true);

      // Force deactivate
      act(() => {
        result.current.forceDeactivate();
      });

      expect(result.current.isActive).toBe(false);
      expect(mockOnDeactivate).toHaveBeenCalledTimes(1);
    });

    it('should provide resetTimer method', () => {
      const timeout = 5000;
      const { result } = renderHook(() =>
        useInactivityDetector(mockOnInactive, { timeout })
      );

      // Fast-forward halfway to timeout
      act(() => {
        jest.advanceTimersByTime(timeout / 2);
      });

      // Reset timer manually
      act(() => {
        result.current.resetTimer();
      });

      // Should not activate at original timeout
      act(() => {
        jest.advanceTimersByTime(timeout / 2);
      });
      expect(mockOnInactive).not.toHaveBeenCalled();

      // Should activate after full timeout from reset
      act(() => {
        jest.advanceTimersByTime(timeout);
      });
      expect(mockOnInactive).toHaveBeenCalledTimes(1);
    });
  });

  describe('Page visibility handling', () => {
    it('should pause detection when page is hidden', () => {
      const timeout = 5000;
      renderHook(() =>
        useInactivityDetector(mockOnInactive, { timeout })
      );

      // Fast-forward halfway to timeout
      act(() => {
        jest.advanceTimersByTime(timeout / 2);
      });

      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });
      act(() => {
        const event = new Event('visibilitychange');
        document.dispatchEvent(event);
      });

      // Fast-forward past original timeout
      act(() => {
        jest.advanceTimersByTime(timeout);
      });
      expect(mockOnInactive).not.toHaveBeenCalled();

      // Simulate page becoming visible again
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false
      });
      act(() => {
        const event = new Event('visibilitychange');
        document.dispatchEvent(event);
      });

      // Should activate after timeout from visibility change
      act(() => {
        jest.advanceTimersByTime(timeout);
      });
      expect(mockOnInactive).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup', () => {
    it('should clean up event listeners and timers on unmount', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useInactivityDetector(mockOnInactive)
      );

      // Verify event listeners were added
      expect(addEventListenerSpy).toHaveBeenCalled();

      // Unmount component
      unmount();

      // Verify event listeners were removed
      expect(removeEventListenerSpy).toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should not activate after unmount', () => {
      const timeout = 5000;
      const { unmount } = renderHook(() =>
        useInactivityDetector(mockOnInactive, { timeout })
      );

      // Unmount before timeout
      unmount();

      // Fast-forward past timeout
      act(() => {
        jest.advanceTimersByTime(timeout);
      });

      expect(mockOnInactive).not.toHaveBeenCalled();
    });
  });

  describe('Performance optimization', () => {
    it('should use passive event listeners', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      renderHook(() => useInactivityDetector(mockOnInactive));

      // Verify passive option is used
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({ passive: true, capture: true })
      );

      addEventListenerSpy.mockRestore();
    });

    it('should debounce rapid activity events', () => {
      const timeout = 5000;
      const debounceDelay = 100;
      let resetCount = 0;

      // Mock the internal resetTimer to count calls
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback, delay) => {
        if (delay === timeout) {
          resetCount++;
        }
        return originalSetTimeout(callback, delay);
      }) as any;

      renderHook(() =>
        useInactivityDetector(mockOnInactive, { 
          timeout,
          debounceDelay 
        })
      );

      // Simulate rapid events
      act(() => {
        for (let i = 0; i < 5; i++) {
          const event = new MouseEvent('mousemove');
          document.dispatchEvent(event);
          jest.advanceTimersByTime(50);
        }
        jest.advanceTimersByTime(debounceDelay);
      });

      // Should have minimal timer resets due to debouncing
      expect(resetCount).toBeLessThan(5);

      global.setTimeout = originalSetTimeout;
    });
  });
});