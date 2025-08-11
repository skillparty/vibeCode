import { useEffect, useCallback, useState } from 'react';
import { ConfigPersistenceError, ConfigPersistenceResult } from './useConfigPersistence';

// Storage key for favorites
const FAVORITES_STORAGE_KEY = 'screensaver-favorites';

// Safe localStorage operations for favorites
const safeGetFavorites = (): Set<number> => {
  try {
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!saved) return new Set();
    
    const parsed = JSON.parse(saved);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.warn('Failed to load favorites:', error);
    return new Set();
  }
};

const safeSaveFavorites = (favorites: Set<number>): ConfigPersistenceResult => {
  try {
    const favoritesArray = Array.from(favorites);
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritesArray));
    return { success: true };
  } catch (error) {
    if (error instanceof DOMException && error.code === 22) {
      return {
        success: false,
        error: ConfigPersistenceError.QUOTA_EXCEEDED,
        message: 'Storage quota exceeded while saving favorites'
      };
    }
    return {
      success: false,
      error: ConfigPersistenceError.STORAGE_NOT_AVAILABLE,
      message: 'Failed to save favorites to localStorage'
    };
  }
};

// Hook for managing favorites persistence
export const useFavoritesPersistence = () => {
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<ConfigPersistenceError | null>(null);
  const [initialFavorites, setInitialFavorites] = useState<Set<number>>(new Set());

  // Load favorites on mount
  useEffect(() => {
    setIsLoading(true);
    const loadedFavorites = safeGetFavorites();
    setFavorites(loadedFavorites);
    setInitialFavorites(loadedFavorites);
    setIsLoading(false);
  }, []);

  // Save favorites when they change (but not during initial load)
  useEffect(() => {
    if (!isLoading && favorites !== initialFavorites) {
      const result = safeSaveFavorites(favorites);
      if (!result.success) {
        setLastError(result.error!);
      } else {
        setLastError(null);
      }
    }
  }, [favorites, isLoading, initialFavorites]);

  // Add quote to favorites
  const addFavorite = useCallback((quoteId: number): ConfigPersistenceResult => {
    const newFavorites = new Set(favorites);
    newFavorites.add(quoteId);
    setFavorites(newFavorites);
    return safeSaveFavorites(newFavorites);
  }, [favorites]);

  // Remove quote from favorites
  const removeFavorite = useCallback((quoteId: number): ConfigPersistenceResult => {
    const newFavorites = new Set(favorites);
    newFavorites.delete(quoteId);
    setFavorites(newFavorites);
    return safeSaveFavorites(newFavorites);
  }, [favorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback((quoteId: number): ConfigPersistenceResult => {
    if (favorites.has(quoteId)) {
      return removeFavorite(quoteId);
    } else {
      return addFavorite(quoteId);
    }
  }, [favorites, addFavorite, removeFavorite]);

  // Check if quote is favorite
  const isFavorite = useCallback((quoteId: number): boolean => {
    return favorites.has(quoteId);
  }, [favorites]);

  // Get all favorite quote IDs as array
  const getFavoriteIds = useCallback((): number[] => {
    return Array.from(favorites);
  }, [favorites]);

  // Clear all favorites
  const clearFavorites = useCallback((): ConfigPersistenceResult => {
    setFavorites(new Set());
    return safeSaveFavorites(new Set());
  }, []);

  // Import favorites from array
  const importFavorites = useCallback((favoriteIds: number[]): ConfigPersistenceResult => {
    const newFavorites = new Set(favoriteIds.filter(id => typeof id === 'number'));
    setFavorites(newFavorites);
    return safeSaveFavorites(newFavorites);
  }, []);

  // Export favorites as array
  const exportFavorites = useCallback((): number[] => {
    return Array.from(favorites);
  }, [favorites]);

  return {
    favorites,
    isLoading,
    lastError,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoriteIds,
    clearFavorites,
    importFavorites,
    exportFavorites,
    count: favorites.size
  };
};