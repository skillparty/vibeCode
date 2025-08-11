import { renderHook, act } from '@testing-library/react';
import { useInactivityDetector } from '../useInactivityDetector';

describe('useInactivityDetector - Basic Tests', () => {
  let mockOnInactive: jest.Mock;

  beforeEach(() => {
    mockOnInactive = jest.fn();
    jest.clearAllMocks();
  });

  it('should initialize correctly', () => {
    const { result } = renderHook(() =>
      useInactivityDetector(mockOnInactive)
    );

    expect(result.current.isActive).toBe(false);
    expect(typeof result.current.forceActivate).toBe('function');
    expect(typeof result.current.forceDeactivate).toBe('function');
    expect(typeof result.current.resetTimer).toBe('function');
  });

  it('should handle force activation', () => {
    const { result } = renderHook(() =>
      useInactivityDetector(mockOnInactive)
    );

    expect(result.current.isActive).toBe(false);

    act(() => {
      result.current.forceActivate();
    });

    // Check if the callback was called
    expect(mockOnInactive).toHaveBeenCalledTimes(1);
    
    // The state should be updated
    expect(result.current.isActive).toBe(true);
  });

  it('should handle force deactivation', () => {
    const mockOnDeactivate = jest.fn();
    const { result } = renderHook(() =>
      useInactivityDetector(mockOnInactive, {
        onDeactivate: mockOnDeactivate
      })
    );

    // First activate
    act(() => {
      result.current.forceActivate();
    });

    expect(result.current.isActive).toBe(true);

    // Then deactivate
    act(() => {
      result.current.forceDeactivate();
    });

    expect(mockOnDeactivate).toHaveBeenCalledTimes(1);
    expect(result.current.isActive).toBe(false);
  });

  it('should provide resetTimer functionality', () => {
    const { result } = renderHook(() =>
      useInactivityDetector(mockOnInactive)
    );

    // Should not throw
    act(() => {
      result.current.resetTimer();
    });

    expect(typeof result.current.resetTimer).toBe('function');
  });

  it('should handle event listeners setup and cleanup', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useInactivityDetector(mockOnInactive)
    );

    // Should have added event listeners
    expect(addEventListenerSpy).toHaveBeenCalled();

    // Cleanup
    unmount();

    // Should have removed event listeners
    expect(removeEventListenerSpy).toHaveBeenCalled();

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});