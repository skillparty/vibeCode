import { renderHook, act } from '@testing-library/react';
import { useConfigPersistence } from '../useConfigPersistence';
import { useFavoritesPersistence } from '../useFavoritesPersistence';
import { ConfigurationManager } from '../../utils/ConfigurationManager';

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
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    hasOwnProperty: jest.fn((key: string) => key in store)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Persistence Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    ConfigurationManager.resetInstance();
  });

  describe('Configuration and Favorites Integration', () => {
    it('should work together with hooks and manager', () => {
      // Test with hooks
      const { result: configResult } = renderHook(() => useConfigPersistence());
      const { result: favoritesResult } = renderHook(() => useFavoritesPersistence());

      // Update configuration via hook
      act(() => {
        configResult.current.updateConfig({ currentTheme: 'retro' });
      });

      // Add favorites via hook
      act(() => {
        favoritesResult.current.addFavorite(5);
        favoritesResult.current.addFavorite(10);
      });

      // Verify hook state
      expect(configResult.current.config.currentTheme).toBe('retro');
      expect(favoritesResult.current.isFavorite(5)).toBe(true);
      expect(favoritesResult.current.isFavorite(10)).toBe(true);

      // Test with manager (should load from localStorage)
      const manager = ConfigurationManager.getInstance();
      const managerConfig = manager.getConfiguration();
      const managerFavorites = manager.getFavorites();

      expect(managerConfig.currentTheme).toBe('retro');
      expect(managerFavorites.has(5)).toBe(true);
      expect(managerFavorites.has(10)).toBe(true);
    });

    it('should handle export/import across different persistence methods', () => {
      const manager = ConfigurationManager.getInstance();

      // Set up initial state via manager
      manager.updateConfiguration({ currentTheme: 'blue', transitionSpeed: 8000 });
      manager.addFavorite(1);
      manager.addFavorite(3);
      manager.addFavorite(7);

      // Export settings
      const exported = manager.exportSettings();
      expect(exported).toBeTruthy();

      // Clear everything
      localStorageMock.clear();
      ConfigurationManager.resetInstance();

      // Import via new manager instance
      const newManager = ConfigurationManager.getInstance();
      const importResult = newManager.importSettings(exported!);
      expect(importResult.success).toBe(true);

      // Verify imported data
      const config = newManager.getConfiguration();
      const favorites = newManager.getFavorites();

      expect(config.currentTheme).toBe('blue');
      expect(config.transitionSpeed).toBe(8000);
      expect(favorites.size).toBe(3);
      expect(favorites.has(1)).toBe(true);
      expect(favorites.has(3)).toBe(true);
      expect(favorites.has(7)).toBe(true);

      // Test with hooks (should load from localStorage)
      const { result: configResult } = renderHook(() => useConfigPersistence());
      const { result: favoritesResult } = renderHook(() => useFavoritesPersistence());

      expect(configResult.current.config.currentTheme).toBe('blue');
      expect(configResult.current.config.transitionSpeed).toBe(8000);
      expect(favoritesResult.current.isFavorite(1)).toBe(true);
      expect(favoritesResult.current.isFavorite(3)).toBe(true);
      expect(favoritesResult.current.isFavorite(7)).toBe(true);
    });

    it('should handle backup and restore operations', () => {
      const { result: configResult } = renderHook(() => useConfigPersistence());

      // Set up initial configuration
      act(() => {
        configResult.current.updateConfig({ 
          currentTheme: 'terminal',
          transitionSpeed: 12000 
        });
      });

      // Create backup
      act(() => {
        const backupResult = configResult.current.createBackup();
        expect(backupResult.success).toBe(true);
      });

      // Change configuration
      act(() => {
        configResult.current.updateConfig({ 
          currentTheme: 'matrix',
          transitionSpeed: 5000 
        });
      });

      expect(configResult.current.config.currentTheme).toBe('matrix');
      expect(configResult.current.config.transitionSpeed).toBe(5000);

      // Restore from backup
      act(() => {
        const restoreResult = configResult.current.restoreFromBackup();
        expect(restoreResult.success).toBe(true);
      });

      expect(configResult.current.config.currentTheme).toBe('terminal');
      expect(configResult.current.config.transitionSpeed).toBe(12000);
    });

    it('should handle localStorage errors gracefully across all methods', () => {
      const quotaError = new Error('QuotaExceededError');
      (quotaError as any).name = 'QuotaExceededError';
      (quotaError as any).code = 22;

      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });

      // Test hook error handling
      const { result: configResult } = renderHook(() => useConfigPersistence());
      const { result: favoritesResult } = renderHook(() => useFavoritesPersistence());

      act(() => {
        const configUpdateResult = configResult.current.updateConfig({ currentTheme: 'blue' });
        expect(configUpdateResult.success).toBe(false);
      });

      act(() => {
        const favoriteAddResult = favoritesResult.current.addFavorite(5);
        expect(favoriteAddResult.success).toBe(false);
      });

      // Test manager error handling
      const manager = ConfigurationManager.getInstance();
      const managerResult = manager.updateConfiguration({ currentTheme: 'retro' });
      expect(managerResult.success).toBe(false);

      const favoriteResult = manager.addFavorite(10);
      expect(favoriteResult.success).toBe(false);
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate data consistently across all persistence methods', () => {
      const invalidConfig = {
        transitionSpeed: 50000, // Above max
        currentTheme: 'invalid-theme',
        fontSize: 'invalid-size',
        autoMode: 'not-boolean' as any
      };

      // Test hook validation
      const { result: configResult } = renderHook(() => useConfigPersistence());
      
      act(() => {
        configResult.current.updateConfig(invalidConfig);
      });

      expect(configResult.current.config.transitionSpeed).toBe(20000); // Clamped
      expect(configResult.current.config.currentTheme).toBe('matrix'); // Default
      expect(configResult.current.config.fontSize).toBe('medium'); // Default
      expect(configResult.current.config.autoMode).toBe(true); // Default

      // Test manager validation
      const manager = ConfigurationManager.getInstance();
      manager.updateConfiguration(invalidConfig);
      const managerConfig = manager.getConfiguration();

      expect(managerConfig.transitionSpeed).toBe(20000);
      expect(managerConfig.currentTheme).toBe('matrix');
      expect(managerConfig.fontSize).toBe('medium');
      expect(managerConfig.autoMode).toBe(true);
    });

    it('should handle corrupted localStorage data consistently', () => {
      // Set corrupted data
      localStorageMock.setItem('screensaver-config', 'corrupted-json');
      localStorageMock.setItem('screensaver-favorites', 'corrupted-json');

      // Test hook handling
      const { result: configResult } = renderHook(() => useConfigPersistence());
      const { result: favoritesResult } = renderHook(() => useFavoritesPersistence());

      // Should use defaults
      expect(configResult.current.config.currentTheme).toBe('matrix');
      expect(favoritesResult.current.count).toBe(0);

      // Test manager handling
      const manager = ConfigurationManager.getInstance();
      const managerConfig = manager.getConfiguration();
      const managerFavorites = manager.getFavorites();

      expect(managerConfig.currentTheme).toBe('matrix');
      expect(managerFavorites.size).toBe(0);
    });
  });
});