import { renderHook, act } from '@testing-library/react';
import { useFullscreen } from '../useFullscreen';

// Mock the fullscreen API
const mockRequestFullscreen = jest.fn();
const mockExitFullscreen = jest.fn();

// Create a mock document with configurable properties
const createMockDocument = () => {
  const mockDoc = {
    fullscreenEnabled: true,
    fullscreenElement: null,
    documentElement: {
      requestFullscreen: mockRequestFullscreen
    },
    exitFullscreen: mockExitFullscreen,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  };
  
  // Replace global document for the test
  Object.defineProperty(global, 'document', {
    value: mockDoc,
    writable: true,
    configurable: true
  });
  
  return mockDoc;
};

describe('useFullscreen', () => {
  let mockDoc: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestFullscreen.mockResolvedValue(undefined);
    mockExitFullscreen.mockResolvedValue(undefined);
    
    // Create fresh mock document for each test
    mockDoc = createMockDocument();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useFullscreen());

      expect(result.current.isFullscreen).toBe(false);
      expect(result.current.isSupported).toBe(true);
      expect(typeof result.current.enterFullscreen).toBe('function');
      expect(typeof result.current.exitFullscreen).toBe('function');
      expect(typeof result.current.toggleFullscreen).toBe('function');
    });

    it('should detect when fullscreen API is not supported', () => {
      mockDoc.fullscreenEnabled = false;

      const { result } = renderHook(() => useFullscreen());

      expect(result.current.isSupported).toBe(false);
    });

    it('should set up event listeners on mount', () => {
      renderHook(() => useFullscreen());

      expect(mockDoc.addEventListener).toHaveBeenCalledWith(
        'fullscreenchange',
        expect.any(Function)
      );
      expect(mockDoc.addEventListener).toHaveBeenCalledWith(
        'fullscreenerror',
        expect.any(Function)
      );
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() => useFullscreen());

      unmount();

      expect(mockDoc.removeEventListener).toHaveBeenCalledWith(
        'fullscreenchange',
        expect.any(Function)
      );
      expect(mockDoc.removeEventListener).toHaveBeenCalledWith(
        'fullscreenerror',
        expect.any(Function)
      );
    });
  });

  describe('enterFullscreen', () => {
    it('should request fullscreen successfully', async () => {
      const { result } = renderHook(() => useFullscreen());

      await act(async () => {
        await result.current.enterFullscreen();
      });

      expect(mockRequestFullscreen).toHaveBeenCalledWith();
    });

    it('should handle fullscreen request errors', async () => {
      const mockError = new Error('Fullscreen not allowed');
      mockRequestFullscreen.mockRejectedValue(mockError);

      const onError = jest.fn();
      const { result } = renderHook(() => useFullscreen(undefined, { onError }));

      await act(async () => {
        await expect(result.current.enterFullscreen()).rejects.toThrow();
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not request fullscreen if API is not supported', async () => {
      mockDoc.fullscreenEnabled = false;

      const onError = jest.fn();
      const { result } = renderHook(() => useFullscreen(undefined, { onError }));

      await act(async () => {
        await expect(result.current.enterFullscreen()).rejects.toThrow();
      });

      expect(mockRequestFullscreen).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not request fullscreen if already in fullscreen', async () => {
      mockDoc.fullscreenElement = mockDoc.documentElement;

      const { result } = renderHook(() => useFullscreen());

      await act(async () => {
        await result.current.enterFullscreen();
      });

      expect(mockRequestFullscreen).not.toHaveBeenCalled();
    });
  });

  describe('exitFullscreen', () => {
    it('should exit fullscreen successfully', async () => {
      mockDoc.fullscreenElement = mockDoc.documentElement;

      const { result } = renderHook(() => useFullscreen());

      await act(async () => {
        await result.current.exitFullscreen();
      });

      expect(mockExitFullscreen).toHaveBeenCalledWith();
    });

    it('should handle fullscreen exit errors', async () => {
      const mockError = new Error('Exit fullscreen failed');
      mockExitFullscreen.mockRejectedValue(mockError);

      mockDoc.fullscreenElement = mockDoc.documentElement;

      const onError = jest.fn();
      const { result } = renderHook(() => useFullscreen(undefined, { onError }));

      await act(async () => {
        await expect(result.current.exitFullscreen()).rejects.toThrow();
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not exit fullscreen if not in fullscreen', async () => {
      const { result } = renderHook(() => useFullscreen());

      await act(async () => {
        await result.current.exitFullscreen();
      });

      expect(mockExitFullscreen).not.toHaveBeenCalled();
    });
  });

  describe('toggleFullscreen', () => {
    it('should enter fullscreen when not in fullscreen', async () => {
      const { result } = renderHook(() => useFullscreen());

      await act(async () => {
        await result.current.toggleFullscreen();
      });

      expect(mockRequestFullscreen).toHaveBeenCalledWith();
    });

    it('should exit fullscreen when in fullscreen', async () => {
      mockDoc.fullscreenElement = mockDoc.documentElement;

      const { result } = renderHook(() => useFullscreen());

      await act(async () => {
        await result.current.toggleFullscreen();
      });

      expect(mockExitFullscreen).toHaveBeenCalledWith();
    });
  });

  describe('fullscreen state changes', () => {
    it('should update state when entering fullscreen', () => {
      const onEnter = jest.fn();
      const { result } = renderHook(() => useFullscreen(undefined, { onEnter }));

      // Simulate fullscreen change event
      mockDoc.fullscreenElement = mockDoc.documentElement;

      act(() => {
        const fullscreenChangeEvent = new Event('fullscreenchange');
        // Simulate the event handler being called
        const eventHandler = mockDoc.addEventListener.mock.calls.find(
          call => call[0] === 'fullscreenchange'
        )[1];
        eventHandler(fullscreenChangeEvent);
      });

      expect(result.current.isFullscreen).toBe(true);
      expect(onEnter).toHaveBeenCalledWith();
    });

    it('should update state when exiting fullscreen', () => {
      const onExit = jest.fn();
      
      // Start in fullscreen
      mockDoc.fullscreenElement = mockDoc.documentElement;
      
      const { result } = renderHook(() => useFullscreen(undefined, { onExit }));

      // Exit fullscreen
      mockDoc.fullscreenElement = null;

      act(() => {
        const fullscreenChangeEvent = new Event('fullscreenchange');
        // Simulate the event handler being called
        const eventHandler = mockDoc.addEventListener.mock.calls.find(
          call => call[0] === 'fullscreenchange'
        )[1];
        eventHandler(fullscreenChangeEvent);
      });

      expect(result.current.isFullscreen).toBe(false);
      expect(onExit).toHaveBeenCalledWith();
    });
  });

  describe('cross-browser compatibility', () => {
    it('should handle webkit prefixed API', async () => {
      // Remove standard API and add webkit prefixed API
      mockDoc.fullscreenEnabled = false;
      mockDoc.webkitFullscreenEnabled = true;
      mockDoc.documentElement.requestFullscreen = undefined;
      mockDoc.exitFullscreen = undefined;

      const mockWebkitRequestFullscreen = jest.fn().mockResolvedValue(undefined);
      const mockWebkitExitFullscreen = jest.fn().mockResolvedValue(undefined);

      mockDoc.documentElement.webkitRequestFullscreen = mockWebkitRequestFullscreen;
      mockDoc.webkitExitFullscreen = mockWebkitExitFullscreen;

      const { result } = renderHook(() => useFullscreen());

      expect(result.current.isSupported).toBe(true);

      await act(async () => {
        await result.current.enterFullscreen();
      });

      expect(mockWebkitRequestFullscreen).toHaveBeenCalledWith();
    });

    it('should handle moz prefixed API', async () => {
      // Remove standard API and add moz prefixed API
      mockDoc.fullscreenEnabled = false;
      mockDoc.mozFullScreenEnabled = true;
      mockDoc.documentElement.requestFullscreen = undefined;
      mockDoc.exitFullscreen = undefined;

      const mockMozRequestFullScreen = jest.fn().mockResolvedValue(undefined);
      const mockMozCancelFullScreen = jest.fn().mockResolvedValue(undefined);

      mockDoc.documentElement.mozRequestFullScreen = mockMozRequestFullScreen;
      mockDoc.mozCancelFullScreen = mockMozCancelFullScreen;

      const { result } = renderHook(() => useFullscreen());

      expect(result.current.isSupported).toBe(true);

      await act(async () => {
        await result.current.enterFullscreen();
      });

      expect(mockMozRequestFullScreen).toHaveBeenCalledWith();
    });
  });
});