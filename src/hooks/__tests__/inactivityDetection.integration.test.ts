import { renderHook, act } from '@testing-library/react';
import { useInactivityDetector } from '../useInactivityDetector';

// Use real timers for integration test
describe('Inactivity Detection Integration', () => {
  let mockOnInactive: jest.Mock;

  beforeEach(() => {
    mockOnInactive = jest.fn();
    jest.clearAllMocks();
  });

  it('should provide all required functionality', () => {
    const { result } = renderHook(() =>
      useInactivityDetector(mockOnInactive, {
        timeout: 1000, // 1 second for testing
        debounceDelay: 50
      })
    );

    // Should provide all required methods and state
    expect(result.current.isActive).toBe(false);
    expect(typeof result.current.resetTimer).toBe('function');
    expect(typeof result.current.forceActivate).toBe('function');
    expect(typeof result.current.forceDeactivate).toBe('function');
  });

  it('should handle manual activation and deactivation', () => {
    const mockOnActivate = jest.fn();
    const mockOnDeactivate = jest.fn();
    
    const { result } = renderHook(() =>
      useInactivityDetector(mockOnInactive, {
        timeout: 5000,
        onActivate: mockOnActivate,
        onDeactivate: mockOnDeactivate
      })
    );

    // Test manual activation
    act(() => {
      result.current.forceActivate();
    });

    expect(result.current.isActive).toBe(true);
    expect(mockOnInactive).toHaveBeenCalledTimes(1);
    expect(mockOnActivate).toHaveBeenCalledTimes(1);

    // Test manual deactivation
    act(() => {
      result.current.forceDeactivate();
    });

    expect(result.current.isActive).toBe(false);
    expect(mockOnDeactivate).toHaveBeenCalledTimes(1);
  });

  it('should handle activity events', () => {
    const { result } = renderHook(() =>
      useInactivityDetector(mockOnInactive, {
        timeout: 5000,
        debounceDelay: 50
      })
    );

    // Activate screensaver first
    act(() => {
      result.current.forceActivate();
    });
    expect(result.current.isActive).toBe(true);

    // Simulate mouse movement
    act(() => {
      const event = new MouseEvent('mousemove');
      document.dispatchEvent(event);
    });

    // Should deactivate immediately (after debounce)
    setTimeout(() => {
      expect(result.current.isActive).toBe(false);
    }, 100);
  });

  it('should support custom event types', () => {
    const customEvents = ['click', 'scroll'];
    const { result } = renderHook(() =>
      useInactivityDetector(mockOnInactive, {
        timeout: 5000,
        events: customEvents,
        debounceDelay: 50
      })
    );

    // Activate screensaver
    act(() => {
      result.current.forceActivate();
    });
    expect(result.current.isActive).toBe(true);

    // Test custom event
    act(() => {
      const event = new Event('click');
      document.dispatchEvent(event);
    });

    // Should reset timer
    expect(typeof result.current.resetTimer).toBe('function');
  });

  it('should handle page visibility changes', () => {
    const { result } = renderHook(() =>
      useInactivityDetector(mockOnInactive, {
        timeout: 5000
      })
    );

    // Should handle visibility change events
    act(() => {
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });
      const event = new Event('visibilitychange');
      document.dispatchEvent(event);
    });

    // Should not throw errors
    expect(result.current.isActive).toBe(false);
  });

  it('should clean up properly on unmount', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useInactivityDetector(mockOnInactive)
    );

    // Verify listeners were added
    expect(addEventListenerSpy).toHaveBeenCalled();

    // Unmount and verify cleanup
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalled();

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});