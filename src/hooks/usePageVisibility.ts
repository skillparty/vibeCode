import { useState, useEffect, useCallback } from 'react';

interface UsePageVisibilityOptions {
  onVisible?: () => void;
  onHidden?: () => void;
}

interface UsePageVisibilityReturn {
  isVisible: boolean;
  visibilityState: DocumentVisibilityState;
}

/**
 * Custom hook for handling Page Visibility API
 * Detects when the page/tab becomes visible or hidden
 * Useful for pausing animations and conserving resources
 */
export const usePageVisibility = (
  options: UsePageVisibilityOptions = {}
): UsePageVisibilityReturn => {
  const { onVisible, onHidden } = options;
  
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>(
    document.visibilityState
  );

  const handleVisibilityChange = useCallback(() => {
    const newIsVisible = !document.hidden;
    const newVisibilityState = document.visibilityState;
    
    setIsVisible(newIsVisible);
    setVisibilityState(newVisibilityState);
    
    if (newIsVisible) {
      onVisible?.();
    } else {
      onHidden?.();
    }
  }, [onVisible, onHidden]);

  useEffect(() => {
    // Check if Page Visibility API is supported
    if (typeof document.hidden === 'undefined') {
      console.warn('Page Visibility API not supported');
      return;
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set initial state
    handleVisibilityChange();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return {
    isVisible,
    visibilityState
  };
};

export default usePageVisibility;