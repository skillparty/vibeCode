import { renderHook, act } from '@testing-library/react';
import { useAccessibilityAnnouncements } from '../useAccessibilityAnnouncements';

// Mock timers
jest.useFakeTimers();

describe('useAccessibilityAnnouncements', () => {
  beforeEach(() => {
    // Clear any existing live regions
    const existingRegions = document.querySelectorAll('[aria-live]');
    existingRegions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
    
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('initialization', () => {
    it('should create live regions on mount', () => {
      renderHook(() => useAccessibilityAnnouncements());
      
      const politeRegion = document.querySelector('[aria-live="polite"]');
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      
      expect(politeRegion).toBeInTheDocument();
      expect(assertiveRegion).toBeInTheDocument();
      expect(politeRegion).toHaveAttribute('aria-atomic', 'true');
      expect(assertiveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should apply visually hidden styles to live regions', () => {
      renderHook(() => useAccessibilityAnnouncements());
      
      const politeRegion = document.querySelector('[aria-live="polite"]') as HTMLElement;
      
      expect(politeRegion.style.position).toBe('absolute');
      expect(politeRegion.style.width).toBe('1px');
      expect(politeRegion.style.height).toBe('1px');
      expect(politeRegion.style.overflow).toBe('hidden');
    });

    it('should initialize with empty current announcement', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements());
      
      expect(result.current.currentAnnouncement).toBe('');
    });
  });

  describe('announce function', () => {
    it('should announce message to polite region by default', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements());
      
      act(() => {
        result.current.announce('Test message');
      });
      
      // Fast-forward debounce delay
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      // Fast-forward processing delay
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe('Test message');
      expect(result.current.currentAnnouncement).toBe('Test message');
    });

    it('should announce message to assertive region when specified', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements());
      
      act(() => {
        result.current.announce('Urgent message', 'assertive');
      });
      
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      expect(assertiveRegion?.textContent).toBe('Urgent message');
    });

    it('should debounce rapid announcements', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements({ debounceDelay: 200 }));
      
      act(() => {
        result.current.announce('First message');
        result.current.announce('Second message');
        result.current.announce('Third message');
      });
      
      // Only advance part of the debounce delay
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe('');
      
      // Complete the debounce delay
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      // Should only announce the last message
      expect(politeRegion?.textContent).toBe('Third message');
    });

    it('should ignore empty messages', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements());
      
      act(() => {
        result.current.announce('');
        result.current.announce('   ');
      });
      
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe('');
    });

    it('should trim whitespace from messages', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements());
      
      act(() => {
        result.current.announce('  Test message  ');
      });
      
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe('Test message');
    });
  });

  describe('specialized announcement functions', () => {
    it('should announce status with "Status:" prefix', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements());
      
      act(() => {
        result.current.announceStatus('Loading complete');
      });
      
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe('Status: Loading complete');
    });

    it('should announce navigation with context', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements());
      
      act(() => {
        result.current.announceNavigation('Next quote', 'Quote 2 of 10');
      });
      
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe('Next quote - Quote 2 of 10');
    });

    it('should announce navigation without context', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements());
      
      act(() => {
        result.current.announceNavigation('Previous quote');
      });
      
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe('Previous quote');
    });

    it('should announce errors with "Error:" prefix and assertive priority', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements());
      
      act(() => {
        result.current.announceError('Connection failed');
      });
      
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      expect(assertiveRegion?.textContent).toBe('Error: Connection failed');
    });
  });

  describe('announcement queue processing', () => {
    it('should process announcements in order', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements({ debounceDelay: 0 }));
      
      act(() => {
        result.current.announce('First message');
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      act(() => {
        result.current.announce('Second message');
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe('Second message');
    });

    it('should clear region before setting new content', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements({ debounceDelay: 0 }));
      
      const politeRegion = document.querySelector('[aria-live="polite"]');
      
      act(() => {
        result.current.announce('First message');
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      expect(politeRegion?.textContent).toBe('First message');
      
      act(() => {
        result.current.announce('Second message');
      });
      
      // The region should be cleared first
      expect(politeRegion?.textContent).toBe('');
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      expect(politeRegion?.textContent).toBe('Second message');
    });
  });

  describe('clearAnnouncements function', () => {
    it('should clear all announcements and regions', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements());
      
      act(() => {
        result.current.announce('Test message');
      });
      
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      expect(result.current.currentAnnouncement).toBe('Test message');
      
      act(() => {
        result.current.clearAnnouncements();
      });
      
      expect(result.current.currentAnnouncement).toBe('');
      
      const politeRegion = document.querySelector('[aria-live="polite"]');
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      
      expect(politeRegion?.textContent).toBe('');
      expect(assertiveRegion?.textContent).toBe('');
    });

    it('should cancel pending debounced announcements', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements({ debounceDelay: 200 }));
      
      act(() => {
        result.current.announce('Test message');
      });
      
      act(() => {
        result.current.clearAnnouncements();
      });
      
      act(() => {
        jest.advanceTimersByTime(200);
      });
      
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe('');
    });
  });

  describe('configuration options', () => {
    it('should use assertive politeness by default when specified', () => {
      const { result } = renderHook(() => 
        useAccessibilityAnnouncements({ politeness: 'assertive' })
      );
      
      act(() => {
        result.current.announce('Test message');
      });
      
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      expect(assertiveRegion?.textContent).toBe('Test message');
    });

    it('should use custom debounce delay', () => {
      const { result } = renderHook(() => 
        useAccessibilityAnnouncements({ debounceDelay: 500 })
      );
      
      act(() => {
        result.current.announce('Test message');
      });
      
      act(() => {
        jest.advanceTimersByTime(400);
      });
      
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe('');
      
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      expect(politeRegion?.textContent).toBe('Test message');
    });
  });

  describe('cleanup', () => {
    it('should remove live regions on unmount when clearOnUnmount is true', () => {
      const { unmount } = renderHook(() => 
        useAccessibilityAnnouncements({ clearOnUnmount: true })
      );
      
      expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
      expect(document.querySelector('[aria-live="assertive"]')).toBeInTheDocument();
      
      unmount();
      
      expect(document.querySelector('[aria-live="polite"]')).not.toBeInTheDocument();
      expect(document.querySelector('[aria-live="assertive"]')).not.toBeInTheDocument();
    });

    it('should not remove live regions on unmount when clearOnUnmount is false', () => {
      const { unmount } = renderHook(() => 
        useAccessibilityAnnouncements({ clearOnUnmount: false })
      );
      
      expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
      expect(document.querySelector('[aria-live="assertive"]')).toBeInTheDocument();
      
      unmount();
      
      expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
      expect(document.querySelector('[aria-live="assertive"]')).toBeInTheDocument();
    });

    it('should clear pending timers on unmount', () => {
      const { result, unmount } = renderHook(() => 
        useAccessibilityAnnouncements({ debounceDelay: 200 })
      );
      
      act(() => {
        result.current.announce('Test message');
      });
      
      unmount();
      
      // Should not throw or cause issues
      act(() => {
        jest.advanceTimersByTime(200);
      });
    });
  });

  describe('error handling', () => {
    it('should handle missing live regions gracefully', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements());
      
      // Remove live regions manually
      const regions = document.querySelectorAll('[aria-live]');
      regions.forEach(region => {
        if (region.parentNode) {
          region.parentNode.removeChild(region);
        }
      });
      
      // Should not throw
      expect(() => {
        act(() => {
          result.current.announce('Test message');
        });
        
        act(() => {
          jest.advanceTimersByTime(100);
        });
        
        act(() => {
          jest.advanceTimersByTime(10);
        });
      }).not.toThrow();
    });
  });
});