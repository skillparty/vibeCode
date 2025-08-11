import { useCallback, useEffect, useRef } from 'react';
import { useScreensaver } from '../contexts/ScreensaverContext';

interface UseKeyboardNavigationOptions {
  enableGlobalShortcuts?: boolean;
  enableQuoteNavigation?: boolean;
  enableFullscreenShortcuts?: boolean;
  enablePlaybackControls?: boolean;
  onKeyPress?: (key: string, event: KeyboardEvent) => void;
  preventDefaultKeys?: string[];
}

interface UseKeyboardNavigationReturn {
  handleKeyDown: (event: KeyboardEvent) => void;
  isKeyboardNavigationActive: boolean;
  focusedElement: string | null;
}

/**
 * Comprehensive keyboard navigation hook for screensaver
 * Handles arrow keys, space, enter, escape, and other shortcuts
 * Provides proper focus management and accessibility support
 */
export const useKeyboardNavigation = (
  options: UseKeyboardNavigationOptions = {}
): UseKeyboardNavigationReturn => {
  const {
    enableGlobalShortcuts = true,
    enableQuoteNavigation = true,
    enableFullscreenShortcuts = true,
    enablePlaybackControls = true,
    onKeyPress,
    preventDefaultKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'Escape', 'F11', 'f', 'p', 'P']
  } = options;

  const { state, actions } = useScreensaver();
  const { config, state: screensaverState } = state;
  const focusedElementRef = useRef<string | null>(null);
  const isKeyboardNavigationActiveRef = useRef(false);

  // Check if target is an input field
  const isInputField = useCallback((target: EventTarget | null): boolean => {
    if (!target) return false;
    const element = target as HTMLElement;
    return (
      element.tagName === 'INPUT' ||
      element.tagName === 'TEXTAREA' ||
      element.tagName === 'SELECT' ||
      element.contentEditable === 'true' ||
      element.getAttribute('role') === 'textbox'
    );
  }, []);

  // Handle fullscreen toggle
  const handleFullscreenToggle = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        actions.setFullscreen(true);
      } else {
        await document.exitFullscreen();
        actions.setFullscreen(false);
      }
    } catch (error) {
      console.warn('Fullscreen toggle failed:', error);
    }
  }, [actions]);

  // Handle escape key
  const handleEscape = useCallback(async () => {
    // Exit fullscreen if active
    if (screensaverState.isFullscreen) {
      try {
        await document.exitFullscreen();
        actions.setFullscreen(false);
      } catch (error) {
        console.warn('Failed to exit fullscreen:', error);
      }
    }
    
    // Exit screensaver if active
    if (screensaverState.isActive) {
      actions.setActive(false);
    }

    // Clear focus
    focusedElementRef.current = null;
  }, [screensaverState.isFullscreen, screensaverState.isActive, actions]);

  // Main keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, target, ctrlKey, altKey, metaKey } = event;
    
    // Skip if modifier keys are pressed (except for specific combinations)
    if (ctrlKey || altKey || metaKey) {
      return;
    }

    // Skip if focus is in an input field (unless it's a global shortcut)
    const isInInputField = isInputField(target);
    if (isInInputField && !['F11', 'Escape'].includes(key)) {
      return;
    }

    // Call custom key press handler
    onKeyPress?.(key, event);

    // Set keyboard navigation as active
    isKeyboardNavigationActiveRef.current = true;

    // Handle different key types
    switch (key) {
      // Quote navigation
      case 'ArrowRight':
      case ' ': // Space key
        if (enableQuoteNavigation && !isInInputField) {
          event.preventDefault();
          actions.nextQuote();
          focusedElementRef.current = 'next-quote';
        }
        break;

      case 'ArrowLeft':
        if (enableQuoteNavigation && !isInInputField) {
          event.preventDefault();
          actions.previousQuote();
          focusedElementRef.current = 'previous-quote';
        }
        break;

      // Vertical navigation (for future use with multiple quote display)
      case 'ArrowUp':
        if (!isInInputField) {
          event.preventDefault();
          // Future: Navigate to previous quote category or section
          focusedElementRef.current = 'up-navigation';
        }
        break;

      case 'ArrowDown':
        if (!isInInputField) {
          event.preventDefault();
          // Future: Navigate to next quote category or section
          focusedElementRef.current = 'down-navigation';
        }
        break;

      // Enter key - context-dependent action
      case 'Enter':
        if (!isInInputField) {
          event.preventDefault();
          if (config.presentationMode) {
            actions.nextQuote();
          } else {
            // Toggle auto mode
            actions.toggleAutoMode();
          }
          focusedElementRef.current = 'enter-action';
        }
        break;

      // Playback controls
      case 'p':
      case 'P':
        if (enablePlaybackControls && !isInInputField) {
          event.preventDefault();
          actions.setPaused(!screensaverState.isPaused);
          focusedElementRef.current = 'pause-toggle';
        }
        break;

      // Fullscreen shortcuts
      case 'F11':
        if (enableFullscreenShortcuts) {
          event.preventDefault();
          handleFullscreenToggle();
          focusedElementRef.current = 'fullscreen-toggle';
        }
        break;

      case 'f':
      case 'F':
        if (enableFullscreenShortcuts && !isInInputField) {
          event.preventDefault();
          handleFullscreenToggle();
          focusedElementRef.current = 'fullscreen-toggle';
        }
        break;

      // Escape key
      case 'Escape':
        if (enableGlobalShortcuts) {
          event.preventDefault();
          handleEscape();
          focusedElementRef.current = 'escape';
        }
        break;

      // Additional shortcuts
      case 'r':
      case 'R':
        if (!isInInputField) {
          event.preventDefault();
          // Reset to first quote
          actions.setCurrentQuote(0);
          focusedElementRef.current = 'reset';
        }
        break;

      case 'm':
      case 'M':
        if (!isInInputField) {
          event.preventDefault();
          // Toggle presentation mode
          actions.togglePresentationMode();
          focusedElementRef.current = 'mode-toggle';
        }
        break;

      default:
        // Don't prevent default for unhandled keys
        return;
    }

    // Prevent default for handled keys if specified
    if (preventDefaultKeys.includes(key)) {
      event.preventDefault();
    }
  }, [
    enableGlobalShortcuts,
    enableQuoteNavigation,
    enableFullscreenShortcuts,
    enablePlaybackControls,
    onKeyPress,
    preventDefaultKeys,
    isInputField,
    actions,
    config.presentationMode,
    screensaverState.isPaused,
    handleFullscreenToggle,
    handleEscape
  ]);

  // Set up global keyboard event listeners
  useEffect(() => {
    if (!enableGlobalShortcuts) return;

    document.addEventListener('keydown', handleKeyDown, { passive: false });
    
    // Reset keyboard navigation state on mouse activity
    const handleMouseActivity = () => {
      isKeyboardNavigationActiveRef.current = false;
      focusedElementRef.current = null;
    };

    document.addEventListener('mousedown', handleMouseActivity);
    document.addEventListener('mousemove', handleMouseActivity);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseActivity);
      document.removeEventListener('mousemove', handleMouseActivity);
    };
  }, [handleKeyDown, enableGlobalShortcuts]);

  return {
    handleKeyDown,
    isKeyboardNavigationActive: isKeyboardNavigationActiveRef.current,
    focusedElement: focusedElementRef.current
  };
};

export default useKeyboardNavigation;