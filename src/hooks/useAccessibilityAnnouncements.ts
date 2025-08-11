import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAccessibilityAnnouncementsOptions {
  politeness?: 'polite' | 'assertive';
  clearOnUnmount?: boolean;
  debounceDelay?: number;
}

interface UseAccessibilityAnnouncementsReturn {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceStatus: (status: string) => void;
  announceNavigation: (action: string, context?: string) => void;
  announceError: (error: string) => void;
  clearAnnouncements: () => void;
  currentAnnouncement: string;
}

/**
 * Hook for managing accessibility announcements via ARIA live regions
 * Provides screen reader support with proper announcement timing and priorities
 */
export const useAccessibilityAnnouncements = (
  options: UseAccessibilityAnnouncementsOptions = {}
): UseAccessibilityAnnouncementsReturn => {
  const {
    politeness = 'polite',
    clearOnUnmount = true,
    debounceDelay = 100
  } = options;

  const [currentAnnouncement, setCurrentAnnouncement] = useState('');
  const [announcementQueue, setAnnouncementQueue] = useState<Array<{ message: string; priority: 'polite' | 'assertive' }>>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const assertiveRegionRef = useRef<HTMLDivElement | null>(null);

  // Create live regions if they don't exist
  useEffect(() => {
    // Create polite live region
    if (!liveRegionRef.current) {
      const politeRegion = document.createElement('div');
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.setAttribute('class', 'visually-hidden');
      politeRegion.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `;
      document.body.appendChild(politeRegion);
      liveRegionRef.current = politeRegion;
    }

    // Create assertive live region
    if (!assertiveRegionRef.current) {
      const assertiveRegion = document.createElement('div');
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.setAttribute('class', 'visually-hidden');
      assertiveRegion.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `;
      document.body.appendChild(assertiveRegion);
      assertiveRegionRef.current = assertiveRegion;
    }

    return () => {
      if (clearOnUnmount) {
        if (liveRegionRef.current) {
          document.body.removeChild(liveRegionRef.current);
          liveRegionRef.current = null;
        }
        if (assertiveRegionRef.current) {
          document.body.removeChild(assertiveRegionRef.current);
          assertiveRegionRef.current = null;
        }
      }
    };
  }, [clearOnUnmount]);

  // Process announcement queue
  const processQueue = useCallback(() => {
    if (announcementQueue.length === 0) return;

    const { message, priority } = announcementQueue[0];
    const targetRegion = priority === 'assertive' ? assertiveRegionRef.current : liveRegionRef.current;

    if (targetRegion) {
      // Clear the region first to ensure the announcement is read
      targetRegion.textContent = '';
      
      // Use a small delay to ensure screen readers pick up the change
      setTimeout(() => {
        if (targetRegion) {
          targetRegion.textContent = message;
          setCurrentAnnouncement(message);
        }
      }, 10);
    }

    // Remove processed announcement from queue
    setAnnouncementQueue(prev => prev.slice(1));
  }, [announcementQueue]);

  // Process queue when it changes
  useEffect(() => {
    if (announcementQueue.length > 0) {
      processQueue();
    }
  }, [announcementQueue, processQueue]);

  // Generic announce function
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = politeness) => {
    if (!message.trim()) return;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce announcements to prevent spam
    debounceTimerRef.current = setTimeout(() => {
      setAnnouncementQueue(prev => [...prev, { message: message.trim(), priority }]);
    }, debounceDelay);
  }, [politeness, debounceDelay]);

  // Announce status changes
  const announceStatus = useCallback((status: string) => {
    announce(`Status: ${status}`, 'polite');
  }, [announce]);

  // Announce navigation actions
  const announceNavigation = useCallback((action: string, context?: string) => {
    const message = context ? `${action} - ${context}` : action;
    announce(message, 'polite');
  }, [announce]);

  // Announce errors
  const announceError = useCallback((error: string) => {
    announce(`Error: ${error}`, 'assertive');
  }, [announce]);

  // Clear all announcements
  const clearAnnouncements = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    setAnnouncementQueue([]);
    setCurrentAnnouncement('');
    
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = '';
    }
    if (assertiveRegionRef.current) {
      assertiveRegionRef.current.textContent = '';
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    announce,
    announceStatus,
    announceNavigation,
    announceError,
    clearAnnouncements,
    currentAnnouncement
  };
};

export default useAccessibilityAnnouncements;