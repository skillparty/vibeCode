import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInactivityDetectorOptions {
  timeout?: number;
  events?: string[];
  debounceDelay?: number;
  onActivate?: () => void;
  onDeactivate?: () => void;
}

interface UseInactivityDetectorReturn {
  isActive: boolean;
  resetTimer: () => void;
  forceActivate: () => void;
  forceDeactivate: () => void;
}

/**
 * Custom hook for detecting user inactivity and managing screensaver activation
 * @param onInactive Callback fired when user becomes inactive (screensaver should activate)
 * @param options Configuration options for inactivity detection
 * @returns Object with current state and control methods
 */
export const useInactivityDetector = (
  onInactive: () => void,
  options: UseInactivityDetectorOptions = {}
): UseInactivityDetectorReturn => {
  const {
    timeout = 180000, // 3 minutes default
    events = ['mousemove', 'keydown', 'keyup', 'click', 'scroll', 'touchstart', 'touchmove'],
    debounceDelay = 100,
    onActivate,
    onDeactivate
  } = options;

  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear existing timers
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // Start inactivity timer
  const startTimer = useCallback(() => {
    clearTimers();
    timerRef.current = setTimeout(() => {
      setIsActive(true);
      onInactive();
      onActivate?.();
    }, timeout);
  }, [timeout, onInactive, onActivate, clearTimers]);

  // Reset the inactivity timer
  const resetTimer = useCallback(() => {
    // If screensaver was active, deactivate it immediately
    setIsActive(prev => {
      if (prev) {
        onDeactivate?.();
        return false;
      }
      return prev;
    });
    
    // Start new timer
    startTimer();
  }, [onDeactivate, startTimer]);

  // Debounced activity handler to optimize performance
  const handleActivity = useCallback((event: Event) => {
    // Ignore activity if it's from the screensaver itself
    if (event.target && (event.target as Element).closest?.('.screensaver-active')) {
      return;
    }

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounced timer
    debounceTimerRef.current = setTimeout(() => {
      resetTimer();
    }, debounceDelay);
  }, [resetTimer, debounceDelay]);

  // Force activate screensaver (for testing or manual activation)
  const forceActivate = useCallback(() => {
    clearTimers();
    setIsActive(true);
    onInactive();
    onActivate?.();
  }, [onInactive, onActivate, clearTimers]);

  // Force deactivate screensaver (for testing or manual deactivation)
  const forceDeactivate = useCallback(() => {
    clearTimers();
    setIsActive(false);
    onDeactivate?.();
    // Restart the timer
    startTimer();
  }, [onDeactivate, clearTimers, startTimer]);

  // Setup event listeners and initial timer
  useEffect(() => {
    // Add event listeners with passive option for better performance
    events.forEach(eventType => {
      document.addEventListener(eventType, handleActivity, { 
        passive: true,
        capture: true // Capture phase to catch events early
      });
    });

    // Start initial timer
    startTimer();

    // Cleanup function
    return () => {
      // Remove event listeners
      events.forEach(eventType => {
        document.removeEventListener(eventType, handleActivity, { capture: true });
      });
      
      // Clear all timers
      clearTimers();
    };
  }, [events, handleActivity, startTimer, clearTimers]);

  // Handle page visibility changes to pause/resume detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, clear timers to prevent activation
        clearTimers();
      } else {
        // Page is visible again, restart detection
        startTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearTimers, startTimer]);

  return {
    isActive,
    resetTimer,
    forceActivate,
    forceDeactivate
  };
};

export default useInactivityDetector;