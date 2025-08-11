import { useState, useEffect, useCallback } from 'react';

interface UseFullscreenOptions {
  onEnter?: () => void;
  onExit?: () => void;
  onError?: (error: Error) => void;
}

interface UseFullscreenReturn {
  isFullscreen: boolean;
  isSupported: boolean;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
}

/**
 * Custom hook for managing fullscreen mode with cross-browser compatibility
 * Handles different browser prefixes and provides a consistent API
 */
export const useFullscreen = (
  element?: HTMLElement,
  options: UseFullscreenOptions = {}
): UseFullscreenReturn => {
  const { onEnter, onExit, onError } = options;
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if fullscreen API is supported
  const isSupported = !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled
  );

  // Get the target element (default to document.documentElement)
  const targetElement = element || document.documentElement;

  // Cross-browser fullscreen request
  const requestFullscreen = useCallback(async (elem: HTMLElement): Promise<void> => {
    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        await (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      } else {
        throw new Error('Fullscreen API not supported');
      }
    } catch (error) {
      const fullscreenError = new Error(`Failed to enter fullscreen: ${error}`);
      onError?.(fullscreenError);
      throw fullscreenError;
    }
  }, [onError]);

  // Cross-browser fullscreen exit
  const exitFullscreenDocument = useCallback(async (): Promise<void> => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      } else {
        throw new Error('Fullscreen exit API not supported');
      }
    } catch (error) {
      const fullscreenError = new Error(`Failed to exit fullscreen: ${error}`);
      onError?.(fullscreenError);
      throw fullscreenError;
    }
  }, [onError]);

  // Get current fullscreen element (cross-browser)
  const getFullscreenElement = useCallback((): Element | null => {
    return (
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement ||
      null
    );
  }, []);

  // Enter fullscreen mode
  const enterFullscreen = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      const error = new Error('Fullscreen API not supported');
      onError?.(error);
      throw error;
    }

    if (getFullscreenElement()) {
      return; // Already in fullscreen
    }

    await requestFullscreen(targetElement);
  }, [isSupported, targetElement, requestFullscreen, getFullscreenElement, onError]);

  // Exit fullscreen mode
  const exitFullscreen = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      const error = new Error('Fullscreen API not supported');
      onError?.(error);
      throw error;
    }

    if (!getFullscreenElement()) {
      return; // Not in fullscreen
    }

    await exitFullscreenDocument();
  }, [isSupported, exitFullscreenDocument, getFullscreenElement, onError]);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(async (): Promise<void> => {
    if (getFullscreenElement()) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen, getFullscreenElement]);

  // Handle fullscreen change events (cross-browser)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = getFullscreenElement();
      const newIsFullscreen = !!fullscreenElement;
      
      setIsFullscreen(newIsFullscreen);
      
      if (newIsFullscreen) {
        onEnter?.();
      } else {
        onExit?.();
      }
    };

    // Add event listeners for all browser variants
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ];

    events.forEach(event => {
      document.addEventListener(event, handleFullscreenChange);
    });

    // Initial state check
    handleFullscreenChange();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFullscreenChange);
      });
    };
  }, [onEnter, onExit, getFullscreenElement]);

  // Handle fullscreen error events (cross-browser)
  useEffect(() => {
    const handleFullscreenError = (event: Event) => {
      const error = new Error(`Fullscreen error: ${event.type}`);
      onError?.(error);
    };

    const errorEvents = [
      'fullscreenerror',
      'webkitfullscreenerror',
      'mozfullscreenerror',
      'MSFullscreenError'
    ];

    errorEvents.forEach(event => {
      document.addEventListener(event, handleFullscreenError);
    });

    return () => {
      errorEvents.forEach(event => {
        document.removeEventListener(event, handleFullscreenError);
      });
    };
  }, [onError]);

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen
  };
};

export default useFullscreen;