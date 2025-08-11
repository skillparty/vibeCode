import { ConfigurationManager, configManager } from '../ConfigurationManager';
import { DEFAULT_CONFIG } from '../../hooks/useConfigPersistence';
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
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    hasOwnProperty: jest.fn((key: string) => key in store)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('ConfigurationManager', () => {
  let manager: ConfigurationManager;

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    // Reset singleton instance for each test
    ConfigurationManager.resetInstance();
    manager = ConfigurationManager.getInstance();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ConfigurationManager.getInstance();
      const instance2 = ConfigurationManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should use the exported singleton', () => {
      expect(configManager).toBe(ConfigurationManager.getInstance());
    });
  });

  describe('configuration management', () => {
    it('should initialize with default configuration', () => {
      const config = manager.getConfiguration();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should load saved configuration from localStorage', () => {
      const savedConfig: Configuration = {
        ...DEFAULT_CONFIG,
        currentTheme: 'terminal',
        transitionSpeed: 15000
      };

      localStorageMock.setItem('screensaver-config', JSON.stringify(savedConfig));
      
      // Create new instance to trigger loading
      const newManager = ConfigurationManager.getInstance();
      const config = newManager.getConfiguration();
      
      expect(config.currentTheme).toBe('terminal');
      expect(config.transitionSpeed).toBe(15000);
    });

    it('should update configuration and save to localStorage', () => {
      const updates = {
        currentTheme: 'retro' as const,
        transitionSpeed: 8000
      };

      const result = manager.updateConfiguration(updates);
      expect(result.success).toBe(true);

      const config = manager.getConfiguration();
      expect(config.currentTheme).toBe('retro');
      expect(config.transitionSpeed).toBe(8000);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'screensaver-config',
        expect.stringContaining('"currentTheme":"retro"')
      );
    });

    it('should validate configuration updates', () => {
      const invalidUpdates = {
        transitionSpeed: 50000, // Above max
        currentTheme: 'invalid-theme' as any,
        fontSize: 'invalid-size' as any
      };

      manager.updateConfiguration(invalidUpdates);
      const config = manager.getConfiguration();

      expect(config.transitionSpeed).toBe(20000); // Clamped to max
      expect(config.currentTheme).toBe('matrix'); // Reset to default
      expect(config.fontSize).toBe('medium'); // Reset to default
    });

    it('should reset configuration to defaults', () => {
      // First update config
      manager.updateConfiguration({ currentTheme: 'blue', transitionSpeed: 15000 });
      
      // Then reset
      const result = manager.resetConfiguration();
      expect(result.success).toBe(true);

      const config = manager.getConfiguration();
      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('favorites management', () => {
    it('should initialize with empty favorites', () => {
      const favorites = manager.getFavorites();
      expect(favorites.size).toBe(0);
    });

    it('should load saved favorites from localStorage', () => {
      const savedFavorites = [1, 3, 5];
      localStorageMock.setItem('screensaver-favorites', JSON.stringify(savedFavorites));
      
      // Create new instance to trigger loading
      const newManager = ConfigurationManager.getInstance();
      const favorites = newManager.getFavorites();
      
      expect(favorites.size).toBe(3);
      expect(favorites.has(1)).toBe(true);
      expect(favorites.has(3)).toBe(true);
      expect(favorites.has(5)).toBe(true);
    });

    it('should add quote to favorites', () => {
      const result = manager.addFavorite(5);
      expect(result.success).toBe(true);

      expect(manager.isFavorite(5)).toBe(true);
      expect(manager.getFavorites().size).toBe(1);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'screensaver-favorites',
        JSON.stringify([5])
      );
    });

    it('should remove quote from favorites', () => {
      manager.addFavorite(5);
      manager.addFavorite(10);

      const result = manager.removeFavorite(5);
      expect(result.success).toBe(true);

      expect(manager.isFavorite(5)).toBe(false);
      expect(manager.isFavorite(10)).toBe(true);
      expect(manager.getFavorites().size).toBe(1);
    });

    it('should toggle favorite status', () => {
      // Add favorite
      let result = manager.toggleFavorite(5);
      expect(result.success).toBe(true);
      expect(manager.isFavorite(5)).toBe(true);

      // Remove favorite
      result = manager.toggleFavorite(5);
      expect(result.success).toBe(true);
      expect(manager.isFavorite(5)).toBe(false);
    });

    it('should clear all favorites', () => {
      manager.addFavorite(1);
      manager.addFavorite(2);
      manager.addFavorite(3);

      expect(manager.getFavorites().size).toBe(3);

      const result = manager.clearFavorites();
      expect(result.success).toBe(true);
      expect(manager.getFavorites().size).toBe(0);
    });
  });

  describe('import/export functionality', () => {
    it('should export settings as JSON string', () => {
      manager.updateConfiguration({ currentTheme: 'blue' });
      manager.addFavorite(1);
      manager.addFavorite(3);

      const exported = manager.exportSettings();
      expect(exported).toBeTruthy();

      const parsed = JSON.parse(exported!);
      expect(parsed.config.currentTheme).toBe('blue');
      expect(parsed.favorites).toEqual([1, 3]);
      expect(parsed.version).toBe(1);
      expect(parsed.timestamp).toBeTruthy();
    });

    it('should import settings from JSON string', () => {
      const importData = {
        config: {
          ...DEFAULT_CONFIG,
          currentTheme: 'terminal',
          transitionSpeed: 7000
        },
        favorites: [2, 4, 6],
        version: 1,
        timestamp: Date.now()
      };

      const result = manager.importSettings(JSON.stringify(importData));
      expect(result.success).toBe(true);

      const config = manager.getConfiguration();
      expect(config.currentTheme).toBe('terminal');
      expect(config.transitionSpeed).toBe(7000);

      const favorites = manager.getFavorites();
      expect(favorites.size).toBe(3);
      expect(favorites.has(2)).toBe(true);
      expect(favorites.has(4)).toBe(true);
      expect(favorites.has(6)).toBe(true);
    });

    it('should handle invalid import data gracefully', () => {
      const result = manager.importSettings('invalid-json');
      expect(result.success).toBe(false);
    });
  });

  describe('backup and restore', () => {
    it('should create backup of current settings', () => {
      manager.updateConfiguration({ currentTheme: 'blue' });
      manager.addFavorite(5);

      const result = manager.createBackup();
      expect(result.success).toBe(true);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'screensaver-config-backup',
        expect.stringContaining('"currentTheme":"blue"')
      );
    });

    it('should restore settings from backup', () => {
      const backupData = {
        config: {
          ...DEFAULT_CONFIG,
          currentTheme: 'terminal',
          transitionSpeed: 12000
        },
        favorites: [1, 2, 3],
        version: 1,
        timestamp: Date.now()
      };

      localStorageMock.setItem('screensaver-config-backup', JSON.stringify(backupData));

      const result = manager.restoreFromBackup();
      expect(result.success).toBe(true);

      const config = manager.getConfiguration();
      expect(config.currentTheme).toBe('terminal');
      expect(config.transitionSpeed).toBe(12000);

      const favorites = manager.getFavorites();
      expect(favorites.size).toBe(3);
    });

    it('should handle missing backup gracefully', () => {
      const result = manager.restoreFromBackup();
      expect(result.success).toBe(false);
    });
  });

  describe('event listeners', () => {
    it('should notify configuration change listeners', () => {
      const listener = jest.fn();
      const unsubscribe = manager.onConfigurationChange(listener);

      manager.updateConfiguration({ currentTheme: 'retro' });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ currentTheme: 'retro' })
      );

      unsubscribe();
      manager.updateConfiguration({ currentTheme: 'blue' });
      
      // Should not be called after unsubscribe
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should notify favorites change listeners', () => {
      const listener = jest.fn();
      const unsubscribe = manager.onFavoritesChange(listener);

      manager.addFavorite(5);

      expect(listener).toHaveBeenCalledWith(
        expect.any(Set)
      );

      unsubscribe();
      manager.addFavorite(10);
      
      // Should not be called after unsubscribe
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('storage utilities', () => {
    it('should detect storage availability', () => {
      expect(manager.isStorageAvailable()).toBe(true);
    });

    it('should calculate storage usage', () => {
      manager.updateConfiguration({ currentTheme: 'blue' });
      manager.addFavorite(1);

      const storageInfo = manager.getStorageInfo();
      expect(storageInfo.available).toBe(true);
      expect(storageInfo.used).toBeGreaterThan(0);
    });

    it('should handle storage errors gracefully', () => {
      const quotaError = new Error('QuotaExceededError');
      (quotaError as any).name = 'QuotaExceededError';
      (quotaError as any).code = 22;
      
      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });

      const result = manager.updateConfiguration({ currentTheme: 'blue' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('quota exceeded');
    });
  });

  describe('data validation', () => {
    it('should handle corrupted localStorage data', () => {
      localStorageMock.setItem('screensaver-config', 'corrupted-json');
      localStorageMock.setItem('screensaver-favorites', 'corrupted-json');

      // Should not throw and should use defaults
      const newManager = ConfigurationManager.getInstance();
      const config = newManager.getConfiguration();
      const favorites = newManager.getFavorites();

      expect(config).toEqual(DEFAULT_CONFIG);
      expect(favorites.size).toBe(0);
    });

    it('should filter invalid favorite IDs', () => {
      const invalidFavorites = [1, 'invalid', null, 3, undefined, 5];
      localStorageMock.setItem('screensaver-favorites', JSON.stringify(invalidFavorites));

      const newManager = ConfigurationManager.getInstance();
      const favorites = newManager.getFavorites();

      expect(favorites.size).toBe(3); // Only 1, 3, 5
      expect(favorites.has(1)).toBe(true);
      expect(favorites.has(3)).toBe(true);
      expect(favorites.has(5)).toBe(true);
    });
  });
});