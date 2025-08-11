import { renderHook, act } from '@testing-library/react';
import { useFavoritesPersistence } from '../useFavoritesPersistence';
import { ConfigPersistenceError } from '../useConfigPersistence';

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

describe('useFavoritesPersistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty favorites when no saved data exists', () => {
      const { result } = renderHook(() => useFavoritesPersistence());

      expect(result.current.favorites.size).toBe(0);
      expect(result.current.count).toBe(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastError).toBeNull();
    });

    it('should load saved favorites from localStorage', () => {
      const savedFavorites = [1, 3, 5, 7];
      localStorageMock.setItem('screensaver-favorites', JSON.stringify(savedFavorites));

      const { result } = renderHook(() => useFavoritesPersistence());

      expect(result.current.count).toBe(4);
      expect(result.current.isFavorite(1)).toBe(true);
      expect(result.current.isFavorite(3)).toBe(true);
      expect(result.current.isFavorite(5)).toBe(true);
      expect(result.current.isFavorite(7)).toBe(true);
      expect(result.current.isFavorite(2)).toBe(false);
    });

    it('should handle invalid JSON in localStorage gracefully', () => {
      localStorageMock.setItem('screensaver-favorites', 'invalid-json');

      const { result } = renderHook(() => useFavoritesPersistence());

      expect(result.current.favorites.size).toBe(0);
      expect(result.current.count).toBe(0);
    });

    it('should handle non-array data in localStorage gracefully', () => {
      localStorageMock.setItem('screensaver-favorites', JSON.stringify({ invalid: 'data' }));

      const { result } = renderHook(() => useFavoritesPersistence());

      expect(result.current.favorites.size).toBe(0);
      expect(result.current.count).toBe(0);
    });
  });

  describe('adding favorites', () => {
    it('should add a quote to favorites', () => {
      const { result } = renderHook(() => useFavoritesPersistence());

      act(() => {
        const addResult = result.current.addFavorite(5);
        expect(addResult.success).toBe(true);
      });

      expect(result.current.isFavorite(5)).toBe(true);
      expect(result.current.count).toBe(1);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'screensaver-favorites',
        JSON.stringify([5])
      );
    });

    it('should not duplicate favorites when adding existing quote', () => {
      const { result } = renderHook(() => useFavoritesPersistence());

      act(() => {
        result.current.addFavorite(5);
        result.current.addFavorite(5); // Add same quote again
      });

      expect(result.current.count).toBe(1);
      expect(result.current.isFavorite(5)).toBe(true);
    });

    it('should add multiple different favorites', () => {
      const { result } = renderHook(() => useFavoritesPersistence());

      act(() => {
        result.current.addFavorite(1);
        result.current.addFavorite(3);
        result.current.addFavorite(7);
      });

      expect(result.current.count).toBe(3);
      expect(result.current.isFavorite(1)).toBe(true);
      expect(result.current.isFavorite(3)).toBe(true);
      expect(result.current.isFavorite(7)).toBe(true);
    });
  });

  describe('removing favorites', () => {
    it('should remove a quote from favorites', () => {
      const { result } = renderHook(() => useFavoritesPersistence());

      act(() => {
        result.current.addFavorite(5);
        result.current.addFavorite(10);
      });

      expect(result.current.count).toBe(2);

      act(() => {
        const removeResult = result.current.removeFavorite(5);
        expect(removeResult.success).toBe(true);
      });

      expect(result.current.isFavorite(5)).toBe(false);
      expect(result.current.isFavorite(10)).toBe(true);
      expect(result.current.count).toBe(1);
    });

    it('should handle removing non-existent favorite gracefully', () => {
      const { result } = renderHook(() => useFavoritesPersistence());

      act(() => {
        const removeResult = result.current.removeFavorite(999);
        expect(removeResult.success).toBe(true);
      });

      expect(result.current.count).toBe(0);
    });
  });

  describe('toggling favorites', () => {
    it('should add favorite when toggling non-favorite quote', () => {
      const { result } = renderHook(() => useFavoritesPersistence());

      act(() => {
        const toggleResult = result.current.toggleFavorite(5);
        expect(toggleResult.success).toBe(true);
      });

      expect(result.current.isFavorite(5)).toBe(true);
      expect(result.current.count).toBe(1);
    });

    it('should remove favorite when toggling favorite quote', () => {
      const { result } = renderHook(() => useFavoritesPersistence());

      act(() => {
        result.current.addFavorite(5);
      });

      expect(result.current.isFavorite(5)).toBe(true);

      act(() => {
        const toggleResult = result.current.toggleFavorite(5);
        expect(toggleResult.success).toBe(true);
      });

      expect(result.current.isFavorite(5)).toBe(false);
      expect(result.current.count).toBe(0);
    });
  });

  describe('utility functions', () => {
    it('should return correct favorite IDs array', () => {
      const { result } = renderHook(() => useFavoritesPersistence());

      act(() => {
        result.current.addFavorite(3);
        result.current.addFavorite(1);
        result.current.addFavorite(7);
      });

      const favoriteIds = result.current.getFavoriteIds();
      expect(favoriteIds).toHaveLength(3);
      expect(favoriteIds).toContain(1);
      expect(favoriteIds).toContain(3);
      expect(favoriteIds).toContain(7);
    });

    it('should clear all favorites', () => {
      const { result } = renderHook(() => useFavoritesPersistence());

      act(() => {
        result.current.addFavorite(1);
        result.current.addFavorite(2);
        result.current.addFavorite(3);
      });

      expect(result.current.count).toBe(3);

      act(() => {
        const clearResult = result.current.clearFavorites();
        expect(clearResult.success).toBe(true);
      });

      expect(result.current.count).toBe(0);
      expect(result.current.getFavoriteIds()).toHaveLength(0);
    });
  });

  describe('import/export functionality', () => {
    it('should export favorites as array', () => {
      const { result } = renderHook(() => useFavoritesPersistence());

      act(() => {
        result.current.addFavorite(1);
        result.current.addFavorite(5);
        result.current.addFavorite(10);
      });

      const exported = result.current.exportFavorites();
      expect(exported).toHaveLength(3);
      expect(exported).toContain(1);
      expect(exported).toContain(5);
      expect(exported).toContain(10);
    });

    it('should import favorites from array', () => {
      const { result } = renderHook(() => useFavoritesPersistence());

      const importData = [2, 4, 6, 8];

      act(() => {
        const importResult = result.current.importFavorites(importData);
        expect(importResult.success).toBe(true);
      });

      expect(result.current.count).toBe(4);
      expect(result.current.isFavorite(2)).toBe(true);
      expect(result.current.isFavorite(4)).toBe(true);
      expect(result.current.isFavorite(6)).toBe(true);
      expect(result.current.isFavorite(8)).toBe(true);
    });

    it('should filter out invalid values when importing', () => {
      const { result } = renderHook(() => useFavoritesPersistence());

      const importData = [1, 'invalid', 3, null, 5, undefined, 7] as any[];

      act(() => {
        const importResult = result.current.importFavorites(importData);
        expect(importResult.success).toBe(true);
      });

      expect(result.current.count).toBe(4); // Only valid numbers
      expect(result.current.isFavorite(1)).toBe(true);
      expect(result.current.isFavorite(3)).toBe(true);
      expect(result.current.isFavorite(5)).toBe(true);
      expect(result.current.isFavorite(7)).toBe(true);
    });

    it('should replace existing favorites when importing', () => {
      const { result } = renderHook(() => useFavoritesPersistence());

      act(() => {
        result.current.addFavorite(1);
        result.current.addFavorite(2);
      });

      expect(result.current.count).toBe(2);

      act(() => {
        result.current.importFavorites([5, 6, 7]);
      });

      expect(result.current.count).toBe(3);
      expect(result.current.isFavorite(1)).toBe(false);
      expect(result.current.isFavorite(2)).toBe(false);
      expect(result.current.isFavorite(5)).toBe(true);
      expect(result.current.isFavorite(6)).toBe(true);
      expect(result.current.isFavorite(7)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle localStorage quota exceeded error', () => {
      const quotaError = new Error('QuotaExceededError');
      (quotaError as any).name = 'QuotaExceededError';
      (quotaError as any).code = 22;
      
      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });

      const { result } = renderHook(() => useFavoritesPersistence());

      act(() => {
        const addResult = result.current.addFavorite(5);
        expect(addResult.success).toBe(false);
        expect(addResult.error).toBe(ConfigPersistenceError.QUOTA_EXCEEDED);
      });

      expect(result.current.lastError).toBe(ConfigPersistenceError.QUOTA_EXCEEDED);
    });

    it('should handle localStorage not available error', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const { result } = renderHook(() => useFavoritesPersistence());

      act(() => {
        const addResult = result.current.addFavorite(5);
        expect(addResult.success).toBe(false);
        expect(addResult.error).toBe(ConfigPersistenceError.STORAGE_NOT_AVAILABLE);
      });

      expect(result.current.lastError).toBe(ConfigPersistenceError.STORAGE_NOT_AVAILABLE);
    });
  });

  describe('auto-save functionality', () => {
    it('should auto-save favorites when they change', () => {
      const { result } = renderHook(() => useFavoritesPersistence());

      // Clear previous calls
      localStorageMock.setItem.mockClear();

      act(() => {
        result.current.addFavorite(5);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'screensaver-favorites',
        JSON.stringify([5])
      );
    });

    it('should not auto-save during initial loading', () => {
      localStorageMock.setItem.mockClear();
      
      renderHook(() => useFavoritesPersistence());

      // Should not save favorites during initialization
      const favoritesSaveCalls = localStorageMock.setItem.mock.calls.filter(
        call => call[0] === 'screensaver-favorites'
      );
      expect(favoritesSaveCalls).toHaveLength(0);
    });
  });
});