import { renderHook, act } from '@testing-library/react';
import { usePageVisibility } from '../usePageVisibility';

// Mock document properties
Object.defineProperty(document, 'hidden', {
  writable: true,
  value: false
});

Object.defineProperty(document, 'visibilityState', {
  writable: true,
  value: 'visible' as DocumentVisibilityState
});

// Mock addEventListener and removeEventListener
const mockAddEventListener = jest.spyOn(document, 'addEventListener');
const mockRemoveEventListener = jest.spyOn(document, 'removeEventListener');

describe('usePageVisibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset to visible state
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false
    });
    
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible' as DocumentVisibilityState
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct default values when page is visible', () => {
      const { result } = renderHook(() => usePageVisibility());

      expect(result.current.isVisible).toBe(true);
      expect(result.current.visibilityState).toBe('visible');
    });

    it('should initialize with correct values when page is hidden', () => {
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });
      
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden' as DocumentVisibilityState
      });

      const { result } = renderHook(() => usePageVisibility());

      expect(result.current.isVisible).toBe(false);
      expect(result.current.visibilityState).toBe('hidden');
    });

    it('should set up event listener on mount', () => {
      renderHook(() => usePageVisibility());

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });

    it('should clean up event listener on unmount', () => {
      const { unmount } = renderHook(() => usePageVisibility());

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });
  });

  describe('visibility state changes', () => {
    it('should update state when page becomes hidden', () => {
      const onHidden = jest.fn();
      const { result } = renderHook(() => usePageVisibility({ onHidden }));

      // Initially visible
      expect(result.current.isVisible).toBe(true);

      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });
      
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden' as DocumentVisibilityState
      });

      act(() => {
        const visibilityChangeEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityChangeEvent);
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.visibilityState).toBe('hidden');
      expect(onHidden).toHaveBeenCalledWith();
    });

    it('should update state when page becomes visible', () => {
      // Start with hidden page
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });
      
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden' as DocumentVisibilityState
      });

      const onVisible = jest.fn();
      const { result } = renderHook(() => usePageVisibility({ onVisible }));

      // Initially hidden
      expect(result.current.isVisible).toBe(false);

      // Simulate page becoming visible
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false
      });
      
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'visible' as DocumentVisibilityState
      });

      act(() => {
        const visibilityChangeEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityChangeEvent);
      });

      expect(result.current.isVisible).toBe(true);
      expect(result.current.visibilityState).toBe('visible');
      expect(onVisible).toHaveBeenCalledWith();
    });

    it('should handle prerender visibility state', () => {
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });
      
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'prerender' as DocumentVisibilityState
      });

      const { result } = renderHook(() => usePageVisibility());

      expect(result.current.isVisible).toBe(false);
      expect(result.current.visibilityState).toBe('prerender');
    });
  });

  describe('callback handling', () => {
    it('should call onVisible callback when page becomes visible', () => {
      const onVisible = jest.fn();
      const onHidden = jest.fn();

      // Start with hidden page
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });

      renderHook(() => usePageVisibility({ onVisible, onHidden }));

      // Clear initial calls
      onVisible.mockClear();
      onHidden.mockClear();

      // Simulate page becoming visible
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false
      });

      act(() => {
        const visibilityChangeEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityChangeEvent);
      });

      expect(onVisible).toHaveBeenCalledWith();
      expect(onHidden).not.toHaveBeenCalled();
    });

    it('should call onHidden callback when page becomes hidden', () => {
      const onVisible = jest.fn();
      const onHidden = jest.fn();

      renderHook(() => usePageVisibility({ onVisible, onHidden }));

      // Clear initial calls
      onVisible.mockClear();
      onHidden.mockClear();

      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });

      act(() => {
        const visibilityChangeEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityChangeEvent);
      });

      expect(onHidden).toHaveBeenCalledWith();
      expect(onVisible).not.toHaveBeenCalled();
    });

    it('should not call callbacks if they are not provided', () => {
      const { result } = renderHook(() => usePageVisibility());

      // Should not throw when callbacks are undefined
      expect(() => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          value: true
        });

        act(() => {
          const visibilityChangeEvent = new Event('visibilitychange');
          document.dispatchEvent(visibilityChangeEvent);
        });
      }).not.toThrow();

      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('API support detection', () => {
    it('should handle unsupported Page Visibility API gracefully', () => {
      // Mock console.warn to avoid noise in tests
      const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

      // Remove Page Visibility API support
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: undefined
      });

      const { result } = renderHook(() => usePageVisibility());

      expect(mockConsoleWarn).toHaveBeenCalledWith('Page Visibility API not supported');
      
      // Should still return reasonable defaults
      expect(result.current.isVisible).toBe(true);
      expect(result.current.visibilityState).toBe('visible');

      mockConsoleWarn.mockRestore();
    });
  });

  describe('multiple visibility state changes', () => {
    it('should handle rapid visibility changes correctly', () => {
      const onVisible = jest.fn();
      const onHidden = jest.fn();
      const { result } = renderHook(() => usePageVisibility({ onVisible, onHidden }));

      // Clear initial calls
      onVisible.mockClear();
      onHidden.mockClear();

      // Rapid changes: visible -> hidden -> visible -> hidden
      const changes = [
        { hidden: true, state: 'hidden' as DocumentVisibilityState },
        { hidden: false, state: 'visible' as DocumentVisibilityState },
        { hidden: true, state: 'hidden' as DocumentVisibilityState }
      ];

      changes.forEach(({ hidden, state }) => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          value: hidden
        });
        
        Object.defineProperty(document, 'visibilityState', {
          writable: true,
          value: state
        });

        act(() => {
          const visibilityChangeEvent = new Event('visibilitychange');
          document.dispatchEvent(visibilityChangeEvent);
        });
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.visibilityState).toBe('hidden');
      expect(onVisible).toHaveBeenCalledTimes(1);
      expect(onHidden).toHaveBeenCalledTimes(2);
    });
  });
});