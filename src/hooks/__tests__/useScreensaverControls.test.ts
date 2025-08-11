import { renderHook, act } from '@testing-library/react';
import { useScreensaverControls } from '../useScreensaverControls';

// Mock the individual hooks
jest.mock('../useFullscreen');
jest.mock('../usePageVisibility');

import { useFullscreen } from '../useFullscreen';
import { usePageVisibility } from '../usePageVisibility';

const mockUseFullscreen = useFullscreen as jest.MockedFunction<typeof useFullscreen>;
const mockUsePageVisibility = usePageVisibility as jest.MockedFunction<typeof usePageVisibility>;

// Mock document methods
const mockAddEventListener = jest.spyOn(document, 'addEventListener');
const mockRemoveEventListener = jest.spyOn(document, 'removeEventListener');

describe('useScreensaverControls', () => {
  const mockEnterFullscreen = jest.fn();
  const mockExitFullscreen = jest.fn();
  const mockToggleFullscreen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseFullscreen.mockReturnValue({
      isFullscreen: false,
      isSupported: true,
      enterFullscreen: mockEnterFullscreen,
      exitFullscreen: mockExitFullscreen,
      toggleFullscreen: mockToggleFullscreen
    });

    mockUsePageVisibility.mockReturnValue({
      isVisible: true,
      visibilityState: 'visible'
    });

    mockEnterFullscreen.mockResolvedValue(undefined);
    mockExitFullscreen.mockResolvedValue(undefined);
    mockToggleFullscreen.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useScreensaverControls());

      expect(result.current.isFullscreen).toBe(false);
      expect(result.current.isPageVisible).toBe(true);
      expect(result.current.isFullscreenSupported).toBe(true);
      expect(result.current.visibilityState).toBe('visible');
      expect(typeof result.current.enterFullscreen).toBe('function');
      expect(typeof result.current.exitFullscreen).toBe('function');
      expect(typeof result.current.toggleFullscreen).toBe('function');
    });

    it('should set up keyboard event listeners when enabled', () => {
      renderHook(() => useScreensaverControls({ enableKeyboardShortcuts: true }));

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should not set up keyboard event listeners when disabled', () => {
      renderHook(() => useScreensaverControls({ enableKeyboardShortcuts: false }));

      expect(mockAddEventListener).not.toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() => useScreensaverControls());

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  describe('fullscreen integration', () => {
    it('should call useFullscreen with correct options', () => {
      const onFullscreenEnter = jest.fn();
      const onFullscreenExit = jest.fn();
      const onFullscreenError = jest.fn();

      renderHook(() => useScreensaverControls({
        onFullscreenEnter,
        onFullscreenExit,
        onFullscreenError
      }));

      expect(mockUseFullscreen).toHaveBeenCalledWith(undefined, {
        onEnter: onFullscreenEnter,
        onExit: onFullscreenExit,
        onError: onFullscreenError
      });
    });

    it('should expose fullscreen methods', async () => {
      const { result } = renderHook(() => useScreensaverControls());

      await act(async () => {
        await result.current.enterFullscreen();
      });

      expect(mockEnterFullscreen).toHaveBeenCalledWith();

      await act(async () => {
        await result.current.exitFullscreen();
      });

      expect(mockExitFullscreen).toHaveBeenCalledWith();

      await act(async () => {
        await result.current.toggleFullscreen();
      });

      expect(mockToggleFullscreen).toHaveBeenCalledWith();
    });

    it('should reflect fullscreen state changes', () => {
      mockUseFullscreen.mockReturnValue({
        isFullscreen: true,
        isSupported: true,
        enterFullscreen: mockEnterFullscreen,
        exitFullscreen: mockExitFullscreen,
        toggleFullscreen: mockToggleFullscreen
      });

      const { result } = renderHook(() => useScreensaverControls());

      expect(result.current.isFullscreen).toBe(true);
    });
  });

  describe('page visibility integration', () => {
    it('should call usePageVisibility with correct options', () => {
      const onPageVisible = jest.fn();
      const onPageHidden = jest.fn();

      renderHook(() => useScreensaverControls({
        onPageVisible,
        onPageHidden
      }));

      expect(mockUsePageVisibility).toHaveBeenCalledWith({
        onVisible: onPageVisible,
        onHidden: onPageHidden
      });
    });

    it('should reflect page visibility state changes', () => {
      mockUsePageVisibility.mockReturnValue({
        isVisible: false,
        visibilityState: 'hidden'
      });

      const { result } = renderHook(() => useScreensaverControls());

      expect(result.current.isPageVisible).toBe(false);
      expect(result.current.visibilityState).toBe('hidden');
    });
  });

  describe('keyboard shortcuts', () => {
    it('should handle F11 key for fullscreen toggle', async () => {
      renderHook(() => useScreensaverControls());

      const keydownEvent = new KeyboardEvent('keydown', { key: 'F11' });
      Object.defineProperty(keydownEvent, 'preventDefault', {
        value: jest.fn()
      });

      await act(async () => {
        document.dispatchEvent(keydownEvent);
      });

      expect(keydownEvent.preventDefault).toHaveBeenCalledWith();
      expect(mockToggleFullscreen).toHaveBeenCalledWith();
    });

    it('should handle f key for fullscreen toggle when not in input field', async () => {
      renderHook(() => useScreensaverControls());

      const keydownEvent = new KeyboardEvent('keydown', { key: 'f' });
      Object.defineProperty(keydownEvent, 'preventDefault', {
        value: jest.fn()
      });
      Object.defineProperty(keydownEvent, 'target', {
        value: document.body
      });

      await act(async () => {
        document.dispatchEvent(keydownEvent);
      });

      expect(keydownEvent.preventDefault).toHaveBeenCalledWith();
      expect(mockToggleFullscreen).toHaveBeenCalledWith();
    });

    it('should not handle f key when in input field', async () => {
      renderHook(() => useScreensaverControls());

      const inputElement = document.createElement('input');
      const keydownEvent = new KeyboardEvent('keydown', { key: 'f' });
      Object.defineProperty(keydownEvent, 'preventDefault', {
        value: jest.fn()
      });
      Object.defineProperty(keydownEvent, 'target', {
        value: inputElement
      });

      await act(async () => {
        document.dispatchEvent(keydownEvent);
      });

      expect(keydownEvent.preventDefault).not.toHaveBeenCalledWith();
      expect(mockToggleFullscreen).not.toHaveBeenCalledWith();
    });

    it('should handle Escape key to exit fullscreen when in fullscreen', async () => {
      mockUseFullscreen.mockReturnValue({
        isFullscreen: true,
        isSupported: true,
        enterFullscreen: mockEnterFullscreen,
        exitFullscreen: mockExitFullscreen,
        toggleFullscreen: mockToggleFullscreen
      });

      renderHook(() => useScreensaverControls());

      const keydownEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      Object.defineProperty(keydownEvent, 'preventDefault', {
        value: jest.fn()
      });

      await act(async () => {
        document.dispatchEvent(keydownEvent);
      });

      expect(keydownEvent.preventDefault).toHaveBeenCalledWith();
      expect(mockExitFullscreen).toHaveBeenCalledWith();
    });

    it('should not handle Escape key when not in fullscreen', async () => {
      renderHook(() => useScreensaverControls());

      const keydownEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      Object.defineProperty(keydownEvent, 'preventDefault', {
        value: jest.fn()
      });

      await act(async () => {
        document.dispatchEvent(keydownEvent);
      });

      expect(keydownEvent.preventDefault).not.toHaveBeenCalledWith();
      expect(mockExitFullscreen).not.toHaveBeenCalledWith();
    });

    it('should handle keyboard shortcut errors gracefully', async () => {
      const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
      mockToggleFullscreen.mockRejectedValue(new Error('Fullscreen failed'));

      renderHook(() => useScreensaverControls());

      const keydownEvent = new KeyboardEvent('keydown', { key: 'F11' });
      Object.defineProperty(keydownEvent, 'preventDefault', {
        value: jest.fn()
      });

      await act(async () => {
        document.dispatchEvent(keydownEvent);
      });

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to toggle fullscreen via F11:',
        expect.any(Error)
      );

      mockConsoleWarn.mockRestore();
    });
  });

  describe('options handling', () => {
    it('should pass through all callback options correctly', () => {
      const options = {
        onFullscreenEnter: jest.fn(),
        onFullscreenExit: jest.fn(),
        onPageVisible: jest.fn(),
        onPageHidden: jest.fn(),
        onFullscreenError: jest.fn(),
        enableKeyboardShortcuts: false
      };

      renderHook(() => useScreensaverControls(options));

      expect(mockUseFullscreen).toHaveBeenCalledWith(undefined, {
        onEnter: options.onFullscreenEnter,
        onExit: options.onFullscreenExit,
        onError: options.onFullscreenError
      });

      expect(mockUsePageVisibility).toHaveBeenCalledWith({
        onVisible: options.onPageVisible,
        onHidden: options.onPageHidden
      });

      // Should not set up keyboard listeners when disabled
      expect(mockAddEventListener).not.toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should use default options when none provided', () => {
      renderHook(() => useScreensaverControls());

      expect(mockUseFullscreen).toHaveBeenCalledWith(undefined, {
        onEnter: undefined,
        onExit: undefined,
        onError: undefined
      });

      expect(mockUsePageVisibility).toHaveBeenCalledWith({
        onVisible: undefined,
        onHidden: undefined
      });

      // Should set up keyboard listeners by default
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });
});