import { renderHook, act } from '@testing-library/react';
import { useScreensaverControls } from '../useScreensaverControls';

// Mock the fullscreen API
const mockRequestFullscreen = jest.fn();
const mockExitFullscreen = jest.fn();

Object.defineProperty(document, 'fullscreenEnabled', {
  writable: true,
  value: true
});

Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null
});

Object.defineProperty(document.documentElement, 'requestFullscreen', {
  writable: true,
  value: mockRequestFullscreen
});

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: mockExitFullscreen
});

// Mock page visibility API
Object.defineProperty(document, 'hidden', {
  writable: true,
  value: false
});

Object.defineProperty(document, 'visibilityState', {
  writable: true,
  value: 'visible' as DocumentVisibilityState
});

describe('Fullscreen and Page Visibility Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestFullscreen.mockResolvedValue(undefined);
    mockExitFullscreen.mockResolvedValue(undefined);
    
    // Reset to default states
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: null
    });
    
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false
    });
    
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible' as DocumentVisibilityState
    });
  });

  describe('combined functionality', () => {
    it('should handle fullscreen and page visibility state changes together', async () => {
      const onFullscreenEnter = jest.fn();
      const onFullscreenExit = jest.fn();
      const onPageVisible = jest.fn();
      const onPageHidden = jest.fn();

      const { result } = renderHook(() => useScreensaverControls({
        onFullscreenEnter,
        onFullscreenExit,
        onPageVisible,
        onPageHidden
      }));

      // Initial state
      expect(result.current.isFullscreen).toBe(false);
      expect(result.current.isPageVisible).toBe(true);

      // Enter fullscreen
      await act(async () => {
        await result.current.enterFullscreen();
      });

      expect(mockRequestFullscreen).toHaveBeenCalledWith();

      // Simulate fullscreen change event
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.documentElement
      });

      act(() => {
        const fullscreenChangeEvent = new Event('fullscreenchange');
        document.dispatchEvent(fullscreenChangeEvent);
      });

      expect(result.current.isFullscreen).toBe(true);
      expect(onFullscreenEnter).toHaveBeenCalledWith();

      // Hide page while in fullscreen
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

      expect(result.current.isPageVisible).toBe(false);
      expect(result.current.isFullscreen).toBe(true); // Still in fullscreen
      expect(onPageHidden).toHaveBeenCalledWith();

      // Show page again
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

      expect(result.current.isPageVisible).toBe(true);
      expect(onPageVisible).toHaveBeenCalledWith();

      // Exit fullscreen
      await act(async () => {
        await result.current.exitFullscreen();
      });

      expect(mockExitFullscreen).toHaveBeenCalledWith();

      // Simulate fullscreen exit event
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null
      });

      act(() => {
        const fullscreenChangeEvent = new Event('fullscreenchange');
        document.dispatchEvent(fullscreenChangeEvent);
      });

      expect(result.current.isFullscreen).toBe(false);
      expect(onFullscreenExit).toHaveBeenCalledWith();
    });

    it('should handle keyboard shortcuts in different states', async () => {
      const { result } = renderHook(() => useScreensaverControls());

      // Test F11 when page is visible
      const f11Event = new KeyboardEvent('keydown', { key: 'F11' });
      Object.defineProperty(f11Event, 'preventDefault', {
        value: jest.fn()
      });

      await act(async () => {
        document.dispatchEvent(f11Event);
      });

      expect(mockRequestFullscreen).toHaveBeenCalledWith();

      // Simulate entering fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.documentElement
      });

      act(() => {
        const fullscreenChangeEvent = new Event('fullscreenchange');
        document.dispatchEvent(fullscreenChangeEvent);
      });

      expect(result.current.isFullscreen).toBe(true);

      // Test Escape to exit fullscreen
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      Object.defineProperty(escapeEvent, 'preventDefault', {
        value: jest.fn()
      });

      await act(async () => {
        document.dispatchEvent(escapeEvent);
      });

      expect(mockExitFullscreen).toHaveBeenCalledWith();
    });

    it('should handle errors in fullscreen operations gracefully', async () => {
      const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
      const onFullscreenError = jest.fn();

      mockRequestFullscreen.mockRejectedValue(new Error('Fullscreen denied'));

      const { result } = renderHook(() => useScreensaverControls({
        onFullscreenError
      }));

      await act(async () => {
        await expect(result.current.enterFullscreen()).rejects.toThrow();
      });

      expect(onFullscreenError).toHaveBeenCalledWith(expect.any(Error));

      mockConsoleWarn.mockRestore();
    });

    it('should maintain state consistency across API failures', async () => {
      const { result } = renderHook(() => useScreensaverControls());

      // Mock fullscreen API as unsupported
      Object.defineProperty(document, 'fullscreenEnabled', {
        writable: true,
        value: false
      });

      expect(result.current.isFullscreenSupported).toBe(false);

      // Attempting to enter fullscreen should fail gracefully
      await act(async () => {
        await expect(result.current.enterFullscreen()).rejects.toThrow();
      });

      expect(result.current.isFullscreen).toBe(false);

      // Page visibility should still work
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });

      act(() => {
        const visibilityChangeEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityChangeEvent);
      });

      expect(result.current.isPageVisible).toBe(false);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle user switching tabs while in fullscreen', async () => {
      const onPageHidden = jest.fn();
      const onPageVisible = jest.fn();

      const { result } = renderHook(() => useScreensaverControls({
        onPageHidden,
        onPageVisible
      }));

      // Enter fullscreen
      await act(async () => {
        await result.current.enterFullscreen();
      });

      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.documentElement
      });

      act(() => {
        const fullscreenChangeEvent = new Event('fullscreenchange');
        document.dispatchEvent(fullscreenChangeEvent);
      });

      expect(result.current.isFullscreen).toBe(true);

      // User switches tabs (page becomes hidden)
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });

      act(() => {
        const visibilityChangeEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityChangeEvent);
      });

      expect(result.current.isPageVisible).toBe(false);
      expect(result.current.isFullscreen).toBe(true); // Still in fullscreen
      expect(onPageHidden).toHaveBeenCalledWith();

      // User returns to tab
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false
      });

      act(() => {
        const visibilityChangeEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityChangeEvent);
      });

      expect(result.current.isPageVisible).toBe(true);
      expect(onPageVisible).toHaveBeenCalledWith();
    });

    it('should handle browser fullscreen exit via ESC key', async () => {
      const onFullscreenExit = jest.fn();

      const { result } = renderHook(() => useScreensaverControls({
        onFullscreenExit
      }));

      // Enter fullscreen
      await act(async () => {
        await result.current.enterFullscreen();
      });

      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.documentElement
      });

      act(() => {
        const fullscreenChangeEvent = new Event('fullscreenchange');
        document.dispatchEvent(fullscreenChangeEvent);
      });

      expect(result.current.isFullscreen).toBe(true);

      // Browser exits fullscreen (user pressed ESC or other browser action)
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null
      });

      act(() => {
        const fullscreenChangeEvent = new Event('fullscreenchange');
        document.dispatchEvent(fullscreenChangeEvent);
      });

      expect(result.current.isFullscreen).toBe(false);
      expect(onFullscreenExit).toHaveBeenCalledWith();
    });

    it('should handle multiple rapid keyboard shortcuts', async () => {
      const { result } = renderHook(() => useScreensaverControls());

      // Rapid F11 presses
      const events = [
        new KeyboardEvent('keydown', { key: 'F11' }),
        new KeyboardEvent('keydown', { key: 'F11' }),
        new KeyboardEvent('keydown', { key: 'F11' })
      ];

      events.forEach(event => {
        Object.defineProperty(event, 'preventDefault', {
          value: jest.fn()
        });
      });

      // Fire events rapidly
      await act(async () => {
        for (const event of events) {
          document.dispatchEvent(event);
          // Small delay to simulate real user interaction
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      });

      // Should handle all events without errors
      expect(mockRequestFullscreen).toHaveBeenCalled();
      events.forEach(event => {
        expect(event.preventDefault).toHaveBeenCalledWith();
      });
    });
  });
});