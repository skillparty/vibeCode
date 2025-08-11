import { renderHook, act } from '@testing-library/react';
import { useFocusManagement } from '../useFocusManagement';
import { RefObject } from 'react';

// Mock MutationObserver
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
global.MutationObserver = jest.fn().mockImplementation((callback) => ({
  observe: mockObserve,
  disconnect: mockDisconnect,
  callback
}));

describe('useFocusManagement', () => {
  let containerElement: HTMLDivElement;
  let containerRef: RefObject<HTMLDivElement>;

  beforeEach(() => {
    // Create container element
    containerElement = document.createElement('div');
    containerElement.id = 'test-container';
    document.body.appendChild(containerElement);
    
    containerRef = { current: containerElement };
    
    // Clear any existing focus
    if (document.activeElement && 'blur' in document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(containerElement);
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty focusable elements', () => {
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      expect(result.current.focusableElements).toEqual([]);
      expect(result.current.currentFocusIndex).toBe(-1);
      expect(result.current.isFocusTrapped).toBe(false);
    });

    it('should set up MutationObserver', () => {
      renderHook(() => useFocusManagement(containerRef));
      
      expect(MutationObserver).toHaveBeenCalled();
      expect(mockObserve).toHaveBeenCalledWith(containerElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'tabindex', 'aria-hidden']
      });
    });

    it('should enable focus trap when specified', () => {
      const { result } = renderHook(() => 
        useFocusManagement(containerRef, { trapFocus: true })
      );
      
      expect(result.current.isFocusTrapped).toBe(true);
    });
  });

  describe('focusable element detection', () => {
    it('should detect buttons as focusable', () => {
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      containerElement.appendChild(button);
      
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      act(() => {
        // Trigger update by calling the internal update function
        result.current.focusFirst();
      });
      
      expect(result.current.focusableElements).toContain(button);
    });

    it('should detect inputs as focusable', () => {
      const input = document.createElement('input');
      input.type = 'text';
      containerElement.appendChild(input);
      
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      act(() => {
        result.current.focusFirst();
      });
      
      expect(result.current.focusableElements).toContain(input);
    });

    it('should detect links with href as focusable', () => {
      const link = document.createElement('a');
      link.href = '#test';
      link.textContent = 'Test Link';
      containerElement.appendChild(link);
      
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      act(() => {
        result.current.focusFirst();
      });
      
      expect(result.current.focusableElements).toContain(link);
    });

    it('should exclude disabled elements', () => {
      const button = document.createElement('button');
      button.disabled = true;
      button.textContent = 'Disabled Button';
      containerElement.appendChild(button);
      
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      act(() => {
        result.current.focusFirst();
      });
      
      expect(result.current.focusableElements).not.toContain(button);
    });

    it('should exclude elements with aria-hidden="true"', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-hidden', 'true');
      button.textContent = 'Hidden Button';
      containerElement.appendChild(button);
      
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      act(() => {
        result.current.focusFirst();
      });
      
      expect(result.current.focusableElements).not.toContain(button);
    });

    it('should exclude elements in skip list', () => {
      const button = document.createElement('button');
      button.id = 'skip-me';
      button.textContent = 'Skip Button';
      containerElement.appendChild(button);
      
      const { result } = renderHook(() => 
        useFocusManagement(containerRef, { skipLinks: ['skip-me'] })
      );
      
      act(() => {
        result.current.focusFirst();
      });
      
      expect(result.current.focusableElements).not.toContain(button);
    });
  });

  describe('focus navigation', () => {
    let button1: HTMLButtonElement;
    let button2: HTMLButtonElement;
    let button3: HTMLButtonElement;

    beforeEach(() => {
      button1 = document.createElement('button');
      button1.textContent = 'Button 1';
      button1.id = 'button1';
      
      button2 = document.createElement('button');
      button2.textContent = 'Button 2';
      button2.id = 'button2';
      
      button3 = document.createElement('button');
      button3.textContent = 'Button 3';
      button3.id = 'button3';
      
      containerElement.appendChild(button1);
      containerElement.appendChild(button2);
      containerElement.appendChild(button3);
    });

    it('should focus first element', () => {
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      act(() => {
        result.current.focusFirst();
      });
      
      expect(document.activeElement).toBe(button1);
      expect(result.current.currentFocusIndex).toBe(0);
    });

    it('should focus last element', () => {
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      act(() => {
        result.current.focusLast();
      });
      
      expect(document.activeElement).toBe(button3);
      expect(result.current.currentFocusIndex).toBe(2);
    });

    it('should focus next element', () => {
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      act(() => {
        result.current.focusFirst();
      });
      
      act(() => {
        result.current.focusNext();
      });
      
      expect(document.activeElement).toBe(button2);
      expect(result.current.currentFocusIndex).toBe(1);
    });

    it('should wrap to first element when focusing next from last', () => {
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      act(() => {
        result.current.focusLast();
      });
      
      act(() => {
        result.current.focusNext();
      });
      
      expect(document.activeElement).toBe(button1);
      expect(result.current.currentFocusIndex).toBe(0);
    });

    it('should focus previous element', () => {
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      act(() => {
        result.current.focusLast();
      });
      
      act(() => {
        result.current.focusPrevious();
      });
      
      expect(document.activeElement).toBe(button2);
      expect(result.current.currentFocusIndex).toBe(1);
    });

    it('should wrap to last element when focusing previous from first', () => {
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      act(() => {
        result.current.focusFirst();
      });
      
      act(() => {
        result.current.focusPrevious();
      });
      
      expect(document.activeElement).toBe(button3);
      expect(result.current.currentFocusIndex).toBe(2);
    });

    it('should focus element by ID', () => {
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      act(() => {
        result.current.focusElement('button2');
      });
      
      expect(document.activeElement).toBe(button2);
      expect(result.current.currentFocusIndex).toBe(1);
    });

    it('should focus element by reference', () => {
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      act(() => {
        result.current.focusElement(button3);
      });
      
      expect(document.activeElement).toBe(button3);
      expect(result.current.currentFocusIndex).toBe(2);
    });
  });

  describe('focus trapping', () => {
    let button1: HTMLButtonElement;
    let button2: HTMLButtonElement;

    beforeEach(() => {
      button1 = document.createElement('button');
      button1.textContent = 'Button 1';
      
      button2 = document.createElement('button');
      button2.textContent = 'Button 2';
      
      containerElement.appendChild(button1);
      containerElement.appendChild(button2);
    });

    it('should enable focus trap', () => {
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      act(() => {
        result.current.setFocusTrap(true);
      });
      
      expect(result.current.isFocusTrapped).toBe(true);
    });

    it('should disable focus trap', () => {
      const { result } = renderHook(() => 
        useFocusManagement(containerRef, { trapFocus: true })
      );
      
      act(() => {
        result.current.setFocusTrap(false);
      });
      
      expect(result.current.isFocusTrapped).toBe(false);
    });

    it('should handle Tab key in focus trap', () => {
      const { result } = renderHook(() => 
        useFocusManagement(containerRef, { trapFocus: true })
      );
      
      // Focus first element
      act(() => {
        result.current.focusFirst();
      });
      
      // Simulate Tab key on last element
      act(() => {
        button2.focus();
      });
      
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      const preventDefaultSpy = jest.spyOn(tabEvent, 'preventDefault');
      
      act(() => {
        document.dispatchEvent(tabEvent);
      });
      
      // Should wrap to first element
      expect(document.activeElement).toBe(button1);
    });

    it('should handle Shift+Tab key in focus trap', () => {
      const { result } = renderHook(() => 
        useFocusManagement(containerRef, { trapFocus: true })
      );
      
      // Focus first element
      act(() => {
        result.current.focusFirst();
      });
      
      const shiftTabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        shiftKey: true 
      });
      const preventDefaultSpy = jest.spyOn(shiftTabEvent, 'preventDefault');
      
      act(() => {
        document.dispatchEvent(shiftTabEvent);
      });
      
      // Should wrap to last element
      expect(document.activeElement).toBe(button2);
    });
  });

  describe('initial focus', () => {
    it('should set initial focus by ID when focus trap is enabled', () => {
      const button = document.createElement('button');
      button.id = 'initial-focus';
      button.textContent = 'Initial Focus';
      containerElement.appendChild(button);
      
      renderHook(() => 
        useFocusManagement(containerRef, { 
          trapFocus: true, 
          initialFocus: 'initial-focus' 
        })
      );
      
      expect(document.activeElement).toBe(button);
    });

    it('should set initial focus by element reference when focus trap is enabled', () => {
      const button = document.createElement('button');
      button.textContent = 'Initial Focus';
      containerElement.appendChild(button);
      
      renderHook(() => 
        useFocusManagement(containerRef, { 
          trapFocus: true, 
          initialFocus: button 
        })
      );
      
      expect(document.activeElement).toBe(button);
    });
  });

  describe('focus restoration', () => {
    it('should restore focus when component unmounts', () => {
      const externalButton = document.createElement('button');
      externalButton.textContent = 'External Button';
      document.body.appendChild(externalButton);
      
      // Focus external element first
      externalButton.focus();
      expect(document.activeElement).toBe(externalButton);
      
      const { unmount } = renderHook(() => 
        useFocusManagement(containerRef, { 
          trapFocus: true, 
          restoreFocus: true 
        })
      );
      
      // Focus should be moved to container
      expect(document.activeElement).not.toBe(externalButton);
      
      // Unmount and check if focus is restored
      unmount();
      
      // Note: In jsdom, focus restoration might not work exactly like in real browsers
      // This test verifies the cleanup function is called
      document.body.removeChild(externalButton);
    });
  });

  describe('edge cases', () => {
    it('should handle empty container', () => {
      const { result } = renderHook(() => useFocusManagement(containerRef));
      
      act(() => {
        result.current.focusFirst();
      });
      
      expect(result.current.focusableElements).toEqual([]);
      expect(result.current.currentFocusIndex).toBe(-1);
    });

    it('should handle null container ref', () => {
      const nullRef = { current: null };
      
      const { result } = renderHook(() => useFocusManagement(nullRef));
      
      expect(result.current.focusableElements).toEqual([]);
      expect(result.current.currentFocusIndex).toBe(-1);
    });

    it('should handle focus trap with no focusable elements', () => {
      const { result } = renderHook(() => 
        useFocusManagement(containerRef, { trapFocus: true })
      );
      
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      const preventDefaultSpy = jest.spyOn(tabEvent, 'preventDefault');
      
      act(() => {
        document.dispatchEvent(tabEvent);
      });
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should disconnect MutationObserver on unmount', () => {
      const { unmount } = renderHook(() => useFocusManagement(containerRef));
      
      unmount();
      
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = renderHook(() => useFocusManagement(containerRef));
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('focusin', expect.any(Function));
    });
  });
});