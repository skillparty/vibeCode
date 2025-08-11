import { renderHook, act } from '@testing-library/react';
import { useConfigPersistence, DEFAULT_CONFIG, ConfigPersistenceError } from '../useConfigPersistence';
import { Configuration } from '../../types';

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
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useConfigPersistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default configuration when no saved config exists', () => {
      const { result } = renderHook(() => useConfigPersistence());

      expect(result.current.config).toEqual(DEFAULT_CONFIG);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastError).toBeNull();
    });

    it('should load saved configuration from localStorage', () => {
      const savedConfig: Configuration = {
        ...DEFAULT_CONFIG,
        currentTheme: 'terminal',
        transitionSpeed: 15000
      };

      localStorageMock.setItem('screensaver-config', JSON.stringify(savedConfig));
      localStorageMock.setItem('screensaver-config-version', '1');

      const { result } = renderHook(() => useConfigPersistence());

      expect(result.current.config).toEqual(savedConfig);
    });

    it('should handle invalid JSON in localStorage gracefully', () => {
      localStorageMock.setItem('screensaver-config', 'invalid-json');

      const { result } = renderHook(() => useConfigPersistence());

      expect(result.current.config).toEqual(DEFAULT_CONFIG);
      expect(result.current.lastError).toBe(ConfigPersistenceError.INVALID_DATA);
    });

    it('should validate and correct invalid configuration values', () => {
      const invalidConfig = {
        ...DEFAULT_CONFIG,
        transitionSpeed: 50000, // Above max
        currentTheme: 'invalid-theme',
        fontSize: 'invalid-size'
      };

      localStorageMock.setItem('screensaver-config', JSON.stringify(invalidConfig));

      const { result } = renderHook(() => useConfigPersistence());

      expect(result.current.config.transitionSpeed).toBe(20000); // Clamped to max
      expect(result.current.config.currentTheme).toBe('matrix'); // Reset to default
      expect(result.current.config.fontSize).toBe('medium'); // Reset to default
    });
  });

  describe('configuration updates', () => {
    it('should update configuration and save to localStorage', () => {
      const { result } = renderHook(() => useConfigPersistence());

      act(() => {
        const updateResult = result.current.updateConfig({
          currentTheme: 'retro',
          transitionSpeed: 8000
        });
        expect(updateResult.success).toBe(true);
      });

      expect(result.current.config.currentTheme).toBe('retro');
      expect(result.current.config.transitionSpeed).toBe(8000);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'screensaver-config',
        expect.stringContaining('"currentTheme":"retro"')
      );
    });

    it('should validate updates before applying', () => {
      const { result } = renderHook(() => useConfigPersistence());

      act(() => {
        result.current.updateConfig({
          transitionSpeed: -1000, // Invalid value
          currentTheme: 'invalid' as any // Invalid theme
        });
      });

      expect(result.current.config.transitionSpeed).toBe(5000); // Clamped to min
      expect(result.current.config.currentTheme).toBe('matrix'); // Reset to default
    });
  });

  describe('backup and restore', () => {
    it('should create backup of current configuration', () => {
      const testConfig: Configuration = {
        ...DEFAULT_CONFIG,
        currentTheme: 'blue'
      };

      localStorageMock.setItem('screensaver-config', JSON.stringify(testConfig));

      const { result } = renderHook(() => useConfigPersistence());

      act(() => {
        const backupResult = result.current.createBackup();
        expect(backupResult.success).toBe(true);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'screensaver-config-backup',
        expect.stringContaining('"currentTheme":"blue"')
      );
    });

    it('should restore configuration from backup', () => {
      const backupConfig: Configuration = {
        ...DEFAULT_CONFIG,
        currentTheme: 'terminal',
        transitionSpeed: 12000
      };

      const backupData = {
        config: JSON.stringify(backupConfig),
        version: 1,
        timestamp: Date.now()
      };

      localStorageMock.setItem('screensaver-config-backup', JSON.stringify(backupData));

      const { result } = renderHook(() => useConfigPersistence());

      act(() => {
        const restoreResult = result.current.restoreFromBackup();
        expect(restoreResult.success).toBe(true);
      });

      expect(result.current.config.currentTheme).toBe('terminal');
      expect(result.current.config.transitionSpeed).toBe(12000);
    });

    it('should handle missing backup gracefully', () => {
      const { result } = renderHook(() => useConfigPersistence());

      act(() => {
        const restoreResult = result.current.restoreFromBackup();
        expect(restoreResult.success).toBe(false);
        expect(restoreResult.error).toBe(ConfigPersistenceError.INVALID_DATA);
      });
    });
  });

  describe('reset functionality', () => {
    it('should reset configuration to defaults', () => {
      const { result } = renderHook(() => useConfigPersistence());

      // First update config
      act(() => {
        result.current.updateConfig({
          currentTheme: 'retro',
          transitionSpeed: 15000
        });
      });

      expect(result.current.config.currentTheme).toBe('retro');

      // Then reset
      act(() => {
        const resetResult = result.current.resetToDefaults();
        expect(resetResult.success).toBe(true);
      });

      expect(result.current.config).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('import/export functionality', () => {
    it('should export configuration as JSON string', () => {
      const { result } = renderHook(() => useConfigPersistence());

      act(() => {
        result.current.updateConfig({ currentTheme: 'blue' });
      });

      const exported = result.current.exportConfig();
      expect(exported).toBeTruthy();
      
      const parsed = JSON.parse(exported!);
      expect(parsed.config.currentTheme).toBe('blue');
      expect(parsed.version).toBe(1);
      expect(parsed.timestamp).toBeTruthy();
    });

    it('should import configuration from JSON string', () => {
      const { result } = renderHook(() => useConfigPersistence());

      const importData = {
        config: {
          ...DEFAULT_CONFIG,
          currentTheme: 'terminal',
          transitionSpeed: 7000
        },
        version: 1,
        timestamp: Date.now()
      };

      act(() => {
        const importResult = result.current.importConfig(JSON.stringify(importData));
        expect(importResult.success).toBe(true);
      });

      expect(result.current.config.currentTheme).toBe('terminal');
      expect(result.current.config.transitionSpeed).toBe(7000);
    });

    it('should handle invalid import data gracefully', () => {
      const { result } = renderHook(() => useConfigPersistence());

      act(() => {
        const importResult = result.current.importConfig('invalid-json');
        expect(importResult.success).toBe(false);
        expect(importResult.error).toBe(ConfigPersistenceError.INVALID_DATA);
      });

      expect(result.current.lastError).toBe(ConfigPersistenceError.INVALID_DATA);
    });
  });

  describe('localStorage error handling', () => {
    it('should handle localStorage quota exceeded error', () => {
      const quotaError = new Error('QuotaExceededError');
      (quotaError as any).name = 'QuotaExceededError';
      (quotaError as any).code = 22;
      
      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });

      const { result } = renderHook(() => useConfigPersistence());

      act(() => {
        const saveResult = result.current.updateConfig({ currentTheme: 'blue' });
        expect(saveResult.success).toBe(false);
        expect(saveResult.error).toBe(ConfigPersistenceError.QUOTA_EXCEEDED);
      });
    });

    it('should handle localStorage not available', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const { result } = renderHook(() => useConfigPersistence());

      act(() => {
        const saveResult = result.current.updateConfig({ currentTheme: 'blue' });
        expect(saveResult.success).toBe(false);
        expect(saveResult.error).toBe(ConfigPersistenceError.STORAGE_NOT_AVAILABLE);
      });
    });
  });

  describe('configuration migration', () => {
    it('should migrate configuration from older version', () => {
      const oldConfig = {
        transitionSpeed: 10000,
        currentTheme: 'matrix',
        transitionEffect: 'fade',
        autoMode: true,
        enableParticles: true,
        fontSize: 'medium'
        // Missing newer fields: dayNightMode, motionSensitivity
      };

      localStorageMock.setItem('screensaver-config', JSON.stringify(oldConfig));
      localStorageMock.setItem('screensaver-config-version', '0');

      const { result } = renderHook(() => useConfigPersistence());

      expect(result.current.config.dayNightMode).toBe('auto');
      expect(result.current.config.motionSensitivity).toBe('normal');
      expect(result.current.config.presentationMode).toBe(false);
    });
  });

  describe('storage availability', () => {
    it('should detect when localStorage is available', () => {
      const { result } = renderHook(() => useConfigPersistence());
      expect(result.current.isStorageAvailable).toBe(true);
    });

    it('should handle when localStorage is not available', () => {
      const originalLocalStorage = window.localStorage;
      
      // Mock localStorage as undefined
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true
      });

      const { result } = renderHook(() => useConfigPersistence());
      expect(result.current.isStorageAvailable).toBe(false);

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      });
    });
  });

  describe('auto-save functionality', () => {
    it('should auto-save configuration when it changes', () => {
      const { result } = renderHook(() => useConfigPersistence());

      // Clear previous calls
      localStorageMock.setItem.mockClear();

      act(() => {
        result.current.updateConfig({ currentTheme: 'retro' });
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'screensaver-config',
        expect.stringContaining('"currentTheme":"retro"')
      );
    });

    it('should not auto-save during initial loading', () => {
      localStorageMock.setItem.mockClear();
      
      renderHook(() => useConfigPersistence());

      // Should only call setItem for storage availability test, not for saving config
      const configSaveCalls = localStorageMock.setItem.mock.calls.filter(
        call => call[0] === 'screensaver-config'
      );
      expect(configSaveCalls).toHaveLength(0);
    });
  });
});