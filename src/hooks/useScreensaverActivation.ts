import { useState, useCallback, useRef, useEffect } from 'react';
import { useInactivityDetector } from './useInactivityDetector';

interface UseScreensaverActivationOptions {
  inactivityTimeout?: number;
  transitionDuration?: number;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onTransitionStart?: (isActivating: boolean) => void;
  onTransitionEnd?: (isActivating: boolean) => void;
}

interface UseScreensaverActivationReturn {
  isActive: boolean;
  isTransitioning: boolean;
  transitionProgress: number;
  activate: () => void;
  deactivate: () => void;
  resetTimer: () => void;
}

/**
 * Higher-level hook that combines inactivity detection with smooth transitions
 * for screensaver activation and deactivation
 */
export const useScreensaverActivation = (
  options: UseScreensaverActivationOptions = {}
): UseScreensaverActivationReturn => {
  const {
    inactivityTimeout = 180000, // 3 minutes
    transitionDuration = 1000, // 1 second
    onActivate,
    onDeactivate,
    onTransitionStart,
    onTransitionEnd
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const transitionStartTimeRef = useRef<number>(0);

  // Clear transition timers and animation frames
  const clearTransition = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Smooth transition animation using requestAnimationFrame
  const animateTransition = useCallback((isActivating: boolean) => {
    const startTime = transitionStartTimeRef.current;
    const currentTime = performance.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / transitionDuration, 1);

    // Easing function for smooth transition (ease-out)
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    setTransitionProgress(isActivating ? easedProgress : 1 - easedProgress);

    if (progress < 1) {
      animationFrameRef.current = requestAnimationFrame(() => 
        animateTransition(isActivating)
      );
    } else {
      // Transition complete
      setIsTransitioning(false);
      setTransitionProgress(isActivating ? 1 : 0);
      setIsActive(isActivating);
      
      onTransitionEnd?.(isActivating);
      
      if (isActivating) {
        onActivate?.();
      } else {
        onDeactivate?.();
      }
    }
  }, [transitionDuration, onActivate, onDeactivate, onTransitionEnd]);

  // Start transition animation
  const startTransition = useCallback((isActivating: boolean) => {
    clearTransition();
    
    setIsTransitioning(true);
    transitionStartTimeRef.current = performance.now();
    
    onTransitionStart?.(isActivating);
    
    // Start animation
    animateTransition(isActivating);
    
    // Fallback timeout in case animation fails
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
      setTransitionProgress(isActivating ? 1 : 0);
      setIsActive(isActivating);
      
      onTransitionEnd?.(isActivating);
      
      if (isActivating) {
        onActivate?.();
      } else {
        onDeactivate?.();
      }
    }, transitionDuration + 100);
  }, [clearTransition, animateTransition, transitionDuration, onTransitionStart, onActivate, onDeactivate, onTransitionEnd]);

  // Handle inactivity (activate screensaver)
  const handleInactivity = useCallback(() => {
    if (!isActive && !isTransitioning) {
      startTransition(true);
    }
  }, [isActive, isTransitioning, startTransition]);

  // Handle activity (deactivate screensaver)
  const handleActivity = useCallback(() => {
    if (isActive || isTransitioning) {
      startTransition(false);
    }
  }, [isActive, isTransitioning, startTransition]);

  // Manual activation
  const activate = useCallback(() => {
    if (!isActive && !isTransitioning) {
      startTransition(true);
    }
  }, [isActive, isTransitioning, startTransition]);

  // Manual deactivation
  const deactivate = useCallback(() => {
    if (isActive || isTransitioning) {
      startTransition(false);
    }
  }, [isActive, isTransitioning, startTransition]);

  // Use inactivity detector
  const { resetTimer } = useInactivityDetector(handleInactivity, {
    timeout: inactivityTimeout,
    onDeactivate: handleActivity,
    debounceDelay: 100
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTransition();
    };
  }, [clearTransition]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && (isActive || isTransitioning)) {
        // Page hidden while screensaver active - pause but don't deactivate
        clearTransition();
        setIsTransitioning(false);
      } else if (!document.hidden && isActive) {
        // Page visible again - ensure screensaver is properly active
        setTransitionProgress(1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, isTransitioning, clearTransition]);

  return {
    isActive,
    isTransitioning,
    transitionProgress,
    activate,
    deactivate,
    resetTimer
  };
};

export default useScreensaverActivation;