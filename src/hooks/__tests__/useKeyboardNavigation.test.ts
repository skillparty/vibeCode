import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from '../useKeyboardNavigation';
import { useScreensaver } from '../../contexts/ScreensaverContext';

// Mock the useScreensaver hook
jest.mock('../../contexts/ScreensaverContext');
const mockUseScreensaver = useScreensaver as jest.MockedFunction<typeof useScreensaver>;

// Mock document methods
const mockRequestFullscreen = jest.fn().mockResolvedValue(undefined);
const mockExitFullscreen = jest.fn().mockResolvedValue(undefined);
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

describe('useKeyboardNavigation', () => {
  const mockActions = {
    nextQuote: jest.fn(),
    previousQuote: jest.fn(),
    setPaused: jest.fn(),
    setFullscreen: jest.fn(),
    setActive: jest.fn(),
    setCurrentQuote: jest.fn(),
    toggleAutoMode: jest.fn(),
    togglePresentationMode: jest.fn()
  };

  const mockState = {
    config: {
      presentationMode: false,
      transitionSpeed: 10000,
      currentTheme: 'matrix' as const,
      transitionEffect: 'fade' as const,
      autoMode: true,
      enableParticles: true,
      fontSize: 'medium' as const,
      dayNightMode: 'auto' as const,
      motionSensitivity: 'normal' as const
    },
    state: {
      isActive: false,
      currentQuote: 0,
      currentPattern: 'matrix',
      isFullscreen: false,
      isPaused: false
    },
    quotes: [],
    currentQuote: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestFullscreen.mockClear();
    mockExitFullscreen.mockClear();
    mockUseScreensaver.mockReturnValue({
      state: mockState,
      actions: mockActions,
      dispatch: jest.fn()
    });
  });

  afterEach(() => {
    // Clean up event listeners
    document.removeEventListener('keydown', jest.fn());
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      
      expect(result.current.handleKeyDown).toBeDefined();
      expect(result.current.isKeyboardNavigationActive).toBe(false);
      expect(result.current.focusedElement).toBe(null);
    });

    it('should set up global event listeners when enabled', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      renderHook(() => useKeyboardNavigation({ enableGlobalShortcuts: true }));
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), { passive: false });
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    });

    it('should not set up event listeners when disabled', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      renderHook(() => useKeyboardNavigation({ enableGlobalShortcuts: false }));
      
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function), { passive: false });
    });
  });

  describe('quote navigation', () => {
    it('should handle arrow right key to advance quote', () => {
      const { result } = renderHook(() => useKeyboardNavigation({ enableQuoteNavigation: true }));
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.nextQuote).toHaveBeenCalled();
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle space key to advance quote', () => {
      const { result } = renderHook(() => useKeyboardNavigation({ enableQuoteNavigation: true }));
      
      const keyEvent = new KeyboardEvent('keydown', { key: ' ' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.nextQuote).toHaveBeenCalled();
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle arrow left key to go to previous quote', () => {
      const { result } = renderHook(() => useKeyboardNavigation({ enableQuoteNavigation: true }));
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.previousQuote).toHaveBeenCalled();
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should not handle quote navigation when disabled', () => {
      const { result } = renderHook(() => useKeyboardNavigation({ enableQuoteNavigation: false }));
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.nextQuote).not.toHaveBeenCalled();
    });
  });

  describe('playback controls', () => {
    it('should handle P key to toggle pause', () => {
      const { result } = renderHook(() => useKeyboardNavigation({ enablePlaybackControls: true }));
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'P' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.setPaused).toHaveBeenCalledWith(true); // !isPaused
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle lowercase p key to toggle pause', () => {
      const { result } = renderHook(() => useKeyboardNavigation({ enablePlaybackControls: true }));
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'p' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.setPaused).toHaveBeenCalledWith(true);
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should not handle playback controls when disabled', () => {
      const { result } = renderHook(() => useKeyboardNavigation({ enablePlaybackControls: false }));
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'p' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.setPaused).not.toHaveBeenCalled();
    });
  });

  describe('fullscreen shortcuts', () => {
    it('should handle F11 key for fullscreen toggle', async () => {
      const { result } = renderHook(() => useKeyboardNavigation({ enableFullscreenShortcuts: true }));
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'F11' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      
      await act(async () => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(keyEvent.preventDefault).toHaveBeenCalled();
      expect(mockRequestFullscreen).toHaveBeenCalled();
    });

    it('should handle f key for fullscreen toggle', async () => {
      const { result } = renderHook(() => useKeyboardNavigation({ enableFullscreenShortcuts: true }));
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'f' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      Object.defineProperty(keyEvent, 'target', { value: document.body });
      
      await act(async () => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(keyEvent.preventDefault).toHaveBeenCalled();
      expect(mockRequestFullscreen).toHaveBeenCalled();
    });

    it('should not handle f key when target is input field', async () => {
      const { result } = renderHook(() => useKeyboardNavigation({ enableFullscreenShortcuts: true }));
      
      const inputElement = document.createElement('input');
      const keyEvent = new KeyboardEvent('keydown', { key: 'f' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      Object.defineProperty(keyEvent, 'target', { value: inputElement });
      
      await act(async () => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockRequestFullscreen).not.toHaveBeenCalled();
    });

    it('should exit fullscreen when already in fullscreen', async () => {
      Object.defineProperty(document, 'fullscreenElement', { value: document.documentElement });
      
      const { result } = renderHook(() => useKeyboardNavigation({ enableFullscreenShortcuts: true }));
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'F11' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      
      await act(async () => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockExitFullscreen).toHaveBeenCalled();
    });
  });

  describe('escape key handling', () => {
    it('should handle escape key to exit screensaver', async () => {
      mockState.state.isActive = true;
      
      const { result } = renderHook(() => useKeyboardNavigation({ enableGlobalShortcuts: true }));
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      
      await act(async () => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(keyEvent.preventDefault).toHaveBeenCalled();
      expect(mockActions.setActive).toHaveBeenCalledWith(false);
    });

    it('should exit fullscreen on escape when in fullscreen', async () => {
      mockState.state.isFullscreen = true;
      Object.defineProperty(document, 'fullscreenElement', { value: document.documentElement });
      
      const { result } = renderHook(() => useKeyboardNavigation({ enableGlobalShortcuts: true }));
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      
      await act(async () => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockExitFullscreen).toHaveBeenCalled();
      expect(mockActions.setFullscreen).toHaveBeenCalledWith(false);
    });
  });

  describe('additional shortcuts', () => {
    it('should handle r key to reset to first quote', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'r' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      Object.defineProperty(keyEvent, 'target', { value: document.body });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.setCurrentQuote).toHaveBeenCalledWith(0);
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle m key to toggle presentation mode', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'm' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      Object.defineProperty(keyEvent, 'target', { value: document.body });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.togglePresentationMode).toHaveBeenCalled();
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle enter key in presentation mode', () => {
      mockState.config.presentationMode = true;
      
      const { result } = renderHook(() => useKeyboardNavigation());
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      Object.defineProperty(keyEvent, 'target', { value: document.body });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.nextQuote).toHaveBeenCalled();
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should toggle auto mode on enter when not in presentation mode', () => {
      mockState.config.presentationMode = false;
      
      const { result } = renderHook(() => useKeyboardNavigation());
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      Object.defineProperty(keyEvent, 'target', { value: document.body });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.toggleAutoMode).toHaveBeenCalled();
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('input field detection', () => {
    it('should skip keyboard shortcuts when focus is in input field', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      
      const inputElement = document.createElement('input');
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      Object.defineProperty(keyEvent, 'target', { value: inputElement });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.nextQuote).not.toHaveBeenCalled();
    });

    it('should skip keyboard shortcuts when focus is in textarea', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      
      const textareaElement = document.createElement('textarea');
      const keyEvent = new KeyboardEvent('keydown', { key: 'p' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      Object.defineProperty(keyEvent, 'target', { value: textareaElement });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.setPaused).not.toHaveBeenCalled();
    });

    it('should skip keyboard shortcuts when focus is in contenteditable element', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      
      const editableElement = document.createElement('div');
      editableElement.contentEditable = 'true';
      const keyEvent = new KeyboardEvent('keydown', { key: 'm' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      Object.defineProperty(keyEvent, 'target', { value: editableElement });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.togglePresentationMode).not.toHaveBeenCalled();
    });

    it('should allow F11 and Escape even in input fields', async () => {
      const { result } = renderHook(() => useKeyboardNavigation({ enableFullscreenShortcuts: true }));
      
      const inputElement = document.createElement('input');
      const f11Event = new KeyboardEvent('keydown', { key: 'F11' });
      Object.defineProperty(f11Event, 'preventDefault', { value: jest.fn() });
      Object.defineProperty(f11Event, 'target', { value: inputElement });
      
      await act(async () => {
        result.current.handleKeyDown(f11Event);
      });
      
      expect(f11Event.preventDefault).toHaveBeenCalled();
      
      // Test Escape key as well
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      Object.defineProperty(escapeEvent, 'preventDefault', { value: jest.fn() });
      Object.defineProperty(escapeEvent, 'target', { value: inputElement });
      
      await act(async () => {
        result.current.handleKeyDown(escapeEvent);
      });
      
      expect(escapeEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('custom key press handler', () => {
    it('should call custom onKeyPress handler', () => {
      const onKeyPress = jest.fn();
      const { result } = renderHook(() => useKeyboardNavigation({ onKeyPress }));
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      Object.defineProperty(keyEvent, 'target', { value: document.body });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(onKeyPress).toHaveBeenCalledWith('ArrowRight', keyEvent);
    });
  });

  describe('modifier keys', () => {
    it('should skip handling when ctrl key is pressed', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.nextQuote).not.toHaveBeenCalled();
    });

    it('should skip handling when alt key is pressed', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'f', altKey: true });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockRequestFullscreen).not.toHaveBeenCalled();
    });

    it('should skip handling when meta key is pressed', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'p', metaKey: true });
      Object.defineProperty(keyEvent, 'preventDefault', { value: jest.fn() });
      
      act(() => {
        result.current.handleKeyDown(keyEvent);
      });
      
      expect(mockActions.setPaused).not.toHaveBeenCalled();
    });
  });
});