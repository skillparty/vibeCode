import { renderHook, act } from '@testing-library/react';
import { useSimpleConfigPersistence } from '../useSimpleConfigPersistence';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useSimpleConfigPersistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should initialize with default configuration', () => {
    const { result } = renderHook(() => useSimpleConfigPersistence());

    expect(result.current.config.currentTheme).toBe('matrix');
    expect(result.current.config.transitionSpeed).toBe(10000);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load saved configuration from localStorage', () => {
    const savedConfig = {
      currentTheme: 'terminal',
      transitionSpeed: 15000
    };

    localStorageMock.setItem('screensaver-config', JSON.stringify(savedConfig));

    const { result } = renderHook(() => useSimpleConfigPersistence());

    expect(result.current.config.currentTheme).toBe('terminal');
    expect(result.current.config.transitionSpeed).toBe(15000);
    // Should merge with defaults
    expect(result.current.config.autoMode).toBe(true);
  });

  it('should update and save configuration', () => {
    const { result } = renderHook(() => useSimpleConfigPersistence());

    act(() => {
      const success = result.current.updateConfig({
        currentTheme: 'retro',
        transitionSpeed: 8000
      });
      expect(success).toBe(true);
    });

    expect(result.current.config.currentTheme).toBe('retro');
    expect(result.current.config.transitionSpeed).toBe(8000);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'screensaver-config',
      expect.stringContaining('"currentTheme":"retro"')
    );
  });

  it('should reset to defaults', () => {
    const { result } = renderHook(() => useSimpleConfigPersistence());

    // First update config
    act(() => {
      result.current.updateConfig({ currentTheme: 'blue' });
    });

    expect(result.current.config.currentTheme).toBe('blue');

    // Then reset
    act(() => {
      const success = result.current.resetConfig();
      expect(success).toBe(true);
    });

    expect(result.current.config.currentTheme).toBe('matrix');
    expect(result.current.config.transitionSpeed).toBe(10000);
  });

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useSimpleConfigPersistence());

    act(() => {
      const success = result.current.updateConfig({ currentTheme: 'blue' });
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe('Failed to save configuration');
  });

  it('should handle invalid JSON gracefully', () => {
    localStorageMock.setItem('screensaver-config', 'invalid-json');

    const { result } = renderHook(() => useSimpleConfigPersistence());

    expect(result.current.config.currentTheme).toBe('matrix'); // Should use default
    expect(result.current.error).toBe('Failed to load configuration');
  });
});