import { useCallback, useEffect } from 'react';
import { useFullscreen } from './useFullscreen';
import { usePageVisibility } from './usePageVisibility';

interface UseScreensaverControlsOptions {
  onFullscreenEnter?: () => void;
  onFullscreenExit?: () => void;
  onPageVisible?: () => void;
  onPageHidden?: () => void;
  onFullscreenError?: (error: Error) => void;
  enableKeyboardShortcuts?: boolean;
}

interface UseScreensaverControlsReturn {
  isFullscreen: boolean;
  isPageVisible: boolean;
  isFullscreenSupported: boolean;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  visibilityState: DocumentVisibilityState;
}

/**
 * Combined hook for screensaver controls including fullscreen and page visibility
 * Provides keyboard shortcuts and integrated state management
 */
export const useScreensaverControls = (
  options: UseScreensaverControlsOptions = {}
): UseScreensaverControlsReturn => {
  const {
    onFullscreenEnter,
    onFullscreenExit,
    onPageVisible,
    onPageHidden,
    onFullscreenError,
    enableKeyboardShortcuts = true
  } = options;

  // Fullscreen functionality
  const {
    isFullscreen,
    isSupported: isFullscreenSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen
  } = useFullscreen(undefined, {
    onEnter: onFullscreenEnter,
    onExit: onFullscreenExit,
    onError: onFullscreenError
  });

  // Page visibility functionality
  const { isVisible: isPageVisible, visibilityState } = usePageVisibility({
    onVisible: onPageVisible,
    onHidden: onPageHidden
  });

  // Keyboard shortcut handler
  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    if (!enableKeyboardShortcuts) return;

    // Handle F11 key (standard fullscreen shortcut)
    if (event.key === 'F11') {
      event.preventDefault();
      try {
        await toggleFullscreen();
      } catch (error) {
        console.warn('Failed to toggle fullscreen via F11:', error);
      }
      return;
    }

    // Handle 'f' key for fullscreen toggle (when not in input fields)
    if (event.key === 'f' || event.key === 'F') {
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.contentEditable === 'true';
      
      if (!isInputField) {
        event.preventDefault();
        try {
          await toggleFullscreen();
        } catch (error) {
          console.warn('Failed to toggle fullscreen via F key:', error);
        }
      }
      return;
    }

    // Handle Escape key to exit fullscreen
    if (event.key === 'Escape' && isFullscreen) {
      event.preventDefault();
      try {
        await exitFullscreen();
      } catch (error) {
        console.warn('Failed to exit fullscreen via Escape:', error);
      }
      return;
    }
  }, [enableKeyboardShortcuts, toggleFullscreen, exitFullscreen, isFullscreen]);

  // Set up keyboard event listeners
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enableKeyboardShortcuts]);

  return {
    isFullscreen,
    isPageVisible,
    isFullscreenSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    visibilityState
  };
};

export default useScreensaverControls;