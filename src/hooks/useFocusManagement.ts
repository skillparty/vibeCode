import { useCallback, useEffect, useRef, useState } from 'react';

interface UseFocusManagementOptions {
  trapFocus?: boolean;
  restoreFocus?: boolean;
  initialFocus?: string | HTMLElement;
  skipLinks?: string[];
}

interface UseFocusManagementReturn {
  focusableElements: HTMLElement[];
  currentFocusIndex: number;
  focusFirst: () => void;
  focusLast: () => void;
  focusNext: () => void;
  focusPrevious: () => void;
  focusElement: (element: HTMLElement | string) => void;
  setFocusTrap: (enabled: boolean) => void;
  isFocusTrapped: boolean;
}

/**
 * Hook for managing focus within components for accessibility
 * Provides focus trapping, restoration, and navigation utilities
 */
export const useFocusManagement = (
  containerRef: React.RefObject<HTMLElement>,
  options: UseFocusManagementOptions = {}
): UseFocusManagementReturn => {
  const {
    trapFocus = false,
    restoreFocus = true,
    initialFocus,
    skipLinks = []
  } = options;

  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);
  const [isFocusTrapped, setIsFocusTrapped] = useState(trapFocus);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Selector for focusable elements
  const focusableSelector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    'audio[controls]',
    'video[controls]',
    'iframe',
    'object',
    'embed',
    'area[href]',
    'summary'
  ].join(', ');

  // Get all focusable elements within container
  const updateFocusableElements = useCallback(() => {
    if (!containerRef.current) return;

    const elements = Array.from(
      containerRef.current.querySelectorAll(focusableSelector)
    ) as HTMLElement[];

    // Filter out elements that should be skipped
    const filteredElements = elements.filter(element => {
      // Skip hidden elements
      if (element.offsetParent === null && element.tagName !== 'AREA') {
        return false;
      }

      // Skip elements with aria-hidden="true"
      if (element.getAttribute('aria-hidden') === 'true') {
        return false;
      }

      // Skip elements in skip list
      const elementId = element.id || element.getAttribute('data-focus-id');
      if (elementId && skipLinks.includes(elementId)) {
        return false;
      }

      return true;
    });

    setFocusableElements(filteredElements);
    
    // Update current focus index
    const activeElement = document.activeElement as HTMLElement;
    const activeIndex = filteredElements.indexOf(activeElement);
    setCurrentFocusIndex(activeIndex);
  }, [containerRef, skipLinks]);

  // Focus first focusable element
  const focusFirst = useCallback(() => {
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      setCurrentFocusIndex(0);
    }
  }, [focusableElements]);

  // Focus last focusable element
  const focusLast = useCallback(() => {
    if (focusableElements.length > 0) {
      const lastIndex = focusableElements.length - 1;
      focusableElements[lastIndex].focus();
      setCurrentFocusIndex(lastIndex);
    }
  }, [focusableElements]);

  // Focus next element
  const focusNext = useCallback(() => {
    if (focusableElements.length === 0) return;

    const nextIndex = (currentFocusIndex + 1) % focusableElements.length;
    focusableElements[nextIndex].focus();
    setCurrentFocusIndex(nextIndex);
  }, [focusableElements, currentFocusIndex]);

  // Focus previous element
  const focusPrevious = useCallback(() => {
    if (focusableElements.length === 0) return;

    const prevIndex = currentFocusIndex <= 0 
      ? focusableElements.length - 1 
      : currentFocusIndex - 1;
    focusableElements[prevIndex].focus();
    setCurrentFocusIndex(prevIndex);
  }, [focusableElements, currentFocusIndex]);

  // Focus specific element
  const focusElement = useCallback((element: HTMLElement | string) => {
    let targetElement: HTMLElement | null = null;

    if (typeof element === 'string') {
      // Find by ID, data-focus-id, or selector
      targetElement = containerRef.current?.querySelector(`#${element}`) as HTMLElement ||
                     containerRef.current?.querySelector(`[data-focus-id="${element}"]`) as HTMLElement ||
                     containerRef.current?.querySelector(element) as HTMLElement;
    } else {
      targetElement = element;
    }

    if (targetElement && focusableElements.includes(targetElement)) {
      targetElement.focus();
      const index = focusableElements.indexOf(targetElement);
      setCurrentFocusIndex(index);
    }
  }, [containerRef, focusableElements]);

  // Set focus trap state
  const setFocusTrap = useCallback((enabled: boolean) => {
    setIsFocusTrapped(enabled);
  }, []);

  // Handle focus trap
  const handleFocusTrap = useCallback((event: KeyboardEvent) => {
    if (!isFocusTrapped || event.key !== 'Tab') return;

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab - move to previous element
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        setCurrentFocusIndex(focusableElements.length - 1);
      }
    } else {
      // Tab - move to next element
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        setCurrentFocusIndex(0);
      }
    }
  }, [isFocusTrapped, focusableElements]);

  // Store previous active element when focus trap is enabled
  useEffect(() => {
    if (isFocusTrapped && restoreFocus) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
    }
  }, [isFocusTrapped, restoreFocus]);

  // Set initial focus when focus trap is enabled
  useEffect(() => {
    if (isFocusTrapped) {
      updateFocusableElements();
      
      if (initialFocus) {
        if (typeof initialFocus === 'string') {
          focusElement(initialFocus);
        } else {
          initialFocus.focus();
        }
      } else {
        focusFirst();
      }
    }
  }, [isFocusTrapped, initialFocus, focusElement, focusFirst, updateFocusableElements]);

  // Restore focus when focus trap is disabled
  useEffect(() => {
    return () => {
      if (restoreFocus && previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [restoreFocus]);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Update focusable elements when DOM changes
    const observer = new MutationObserver(updateFocusableElements);
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'tabindex', 'aria-hidden']
    });

    // Handle focus trap
    document.addEventListener('keydown', handleFocusTrap);

    // Update focusable elements on focus changes
    const handleFocusChange = () => {
      const activeElement = document.activeElement as HTMLElement;
      const activeIndex = focusableElements.indexOf(activeElement);
      setCurrentFocusIndex(activeIndex);
    };

    document.addEventListener('focusin', handleFocusChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', handleFocusTrap);
      document.removeEventListener('focusin', handleFocusChange);
    };
  }, [containerRef, handleFocusTrap, updateFocusableElements, focusableElements]);

  // Initial setup
  useEffect(() => {
    updateFocusableElements();
  }, [updateFocusableElements]);

  return {
    focusableElements,
    currentFocusIndex,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    focusElement,
    setFocusTrap,
    isFocusTrapped
  };
};

export default useFocusManagement;