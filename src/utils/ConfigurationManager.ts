import { Configuration } from '../types';
import { 
  useConfigPersistence, 
  DEFAULT_CONFIG, 
  ConfigPersistenceError,
  ConfigPersistenceResult 
} from '../hooks/useConfigPersistence';
import { useFavoritesPersistence } from '../hooks/useFavoritesPersistence';

/**
 * Configuration Manager utility class for handling all configuration-related operations
 * This provides a centralized way to manage configuration and favorites persistence
 */
export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: Configuration = DEFAULT_CONFIG;
  private favorites: Set<number> = new Set();
  private listeners: Set<(config: Configuration) => void> = new Set();
  private favoriteListeners: Set<(favorites: Set<number>) => void> = new Set();

  private constructor() {
    this.loadConfiguration();
    this.loadFavorites();
  }

  // Method to reset instance for testing
  public static resetInstance(): void {
    ConfigurationManager.instance = undefined as any;
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfiguration(): void {
    try {
      const saved = localStorage.getItem('screensaver-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = this.validateConfiguration(parsed);
      }
    } catch (error) {
      console.warn('Failed to load configuration:', error);
      this.config = DEFAULT_CONFIG;
    }
  }

  /**
   * Load favorites from localStorage
   */
  private loadFavorites(): void {
    try {
      const saved = localStorage.getItem('screensaver-favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.favorites = new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.warn('Failed to load favorites:', error);
      this.favorites = new Set();
    }
  }

  /**
   * Validate configuration object against schema
   */
  private validateConfiguration(config: any): Configuration {
    const validated: Configuration = { ...DEFAULT_CONFIG };

    // Validate each field
    if (typeof config.transitionSpeed === 'number' && 
        config.transitionSpeed >= 5000 && 
        config.transitionSpeed <= 20000) {
      validated.transitionSpeed = config.transitionSpeed;
    }

    if (['matrix', 'terminal', 'retro', 'blue'].includes(config.currentTheme)) {
      validated.currentTheme = config.currentTheme;
    }

    if (['fade', 'slide', 'typewriter', 'rotate3d', 'morph'].includes(config.transitionEffect)) {
      validated.transitionEffect = config.transitionEffect;
    }

    if (typeof config.autoMode === 'boolean') {
      validated.autoMode = config.autoMode;
    }

    if (typeof config.enableParticles === 'boolean') {
      validated.enableParticles = config.enableParticles;
    }

    if (['small', 'medium', 'large'].includes(config.fontSize)) {
      validated.fontSize = config.fontSize;
    }

    if (['day', 'night', 'auto'].includes(config.dayNightMode)) {
      validated.dayNightMode = config.dayNightMode;
    }

    if (typeof config.presentationMode === 'boolean') {
      validated.presentationMode = config.presentationMode;
    }

    if (['normal', 'reduced'].includes(config.motionSensitivity)) {
      validated.motionSensitivity = config.motionSensitivity;
    }

    return validated;
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfiguration(): ConfigPersistenceResult {
    try {
      localStorage.setItem('screensaver-config', JSON.stringify(this.config));
      localStorage.setItem('screensaver-config-version', '1');
      this.notifyConfigListeners();
      return { success: true };
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        return {
          success: false,
          error: ConfigPersistenceError.QUOTA_EXCEEDED,
          message: 'Storage quota exceeded'
        };
      }
      return {
        success: false,
        error: ConfigPersistenceError.STORAGE_NOT_AVAILABLE,
        message: 'Failed to save configuration'
      };
    }
  }

  /**
   * Save favorites to localStorage
   */
  private saveFavorites(): ConfigPersistenceResult {
    try {
      const favoritesArray = Array.from(this.favorites);
      localStorage.setItem('screensaver-favorites', JSON.stringify(favoritesArray));
      this.notifyFavoriteListeners();
      return { success: true };
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        return {
          success: false,
          error: ConfigPersistenceError.QUOTA_EXCEEDED,
          message: 'Storage quota exceeded'
        };
      }
      return {
        success: false,
        error: ConfigPersistenceError.STORAGE_NOT_AVAILABLE,
        message: 'Failed to save favorites'
      };
    }
  }

  /**
   * Notify configuration change listeners
   */
  private notifyConfigListeners(): void {
    this.listeners.forEach(listener => listener(this.config));
  }

  /**
   * Notify favorites change listeners
   */
  private notifyFavoriteListeners(): void {
    this.favoriteListeners.forEach(listener => listener(this.favorites));
  }

  // Public API methods

  /**
   * Get current configuration
   */
  public getConfiguration(): Configuration {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfiguration(updates: Partial<Configuration>): ConfigPersistenceResult {
    const newConfig = { ...this.config, ...updates };
    const validatedConfig = this.validateConfiguration(newConfig);
    this.config = validatedConfig;
    return this.saveConfiguration();
  }

  /**
   * Reset configuration to defaults
   */
  public resetConfiguration(): ConfigPersistenceResult {
    this.config = { ...DEFAULT_CONFIG };
    return this.saveConfiguration();
  }

  /**
   * Get current favorites
   */
  public getFavorites(): Set<number> {
    return new Set(this.favorites);
  }

  /**
   * Add quote to favorites
   */
  public addFavorite(quoteId: number): ConfigPersistenceResult {
    this.favorites.add(quoteId);
    return this.saveFavorites();
  }

  /**
   * Remove quote from favorites
   */
  public removeFavorite(quoteId: number): ConfigPersistenceResult {
    this.favorites.delete(quoteId);
    return this.saveFavorites();
  }

  /**
   * Toggle favorite status
   */
  public toggleFavorite(quoteId: number): ConfigPersistenceResult {
    if (this.favorites.has(quoteId)) {
      return this.removeFavorite(quoteId);
    } else {
      return this.addFavorite(quoteId);
    }
  }

  /**
   * Check if quote is favorite
   */
  public isFavorite(quoteId: number): boolean {
    return this.favorites.has(quoteId);
  }

  /**
   * Clear all favorites
   */
  public clearFavorites(): ConfigPersistenceResult {
    this.favorites.clear();
    return this.saveFavorites();
  }

  /**
   * Export all settings as JSON string
   */
  public exportSettings(): string | null {
    try {
      const exportData = {
        config: this.config,
        favorites: Array.from(this.favorites),
        version: 1,
        timestamp: Date.now(),
        appVersion: '1.0.0'
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.warn('Failed to export settings:', error);
      return null;
    }
  }

  /**
   * Import settings from JSON string
   */
  public importSettings(data: string): ConfigPersistenceResult {
    try {
      const parsed = JSON.parse(data);
      
      // Import configuration
      if (parsed.config) {
        this.config = this.validateConfiguration(parsed.config);
      }
      
      // Import favorites
      if (Array.isArray(parsed.favorites)) {
        this.favorites = new Set(parsed.favorites.filter(id => typeof id === 'number'));
      }
      
      // Save both
      const configResult = this.saveConfiguration();
      const favoritesResult = this.saveFavorites();
      
      if (!configResult.success) return configResult;
      if (!favoritesResult.success) return favoritesResult;
      
      return { success: true };
    } catch (error) {
      console.warn('Failed to import settings:', error);
      return {
        success: false,
        error: ConfigPersistenceError.INVALID_DATA,
        message: 'Invalid settings data'
      };
    }
  }

  /**
   * Create backup of current settings
   */
  public createBackup(): ConfigPersistenceResult {
    try {
      const backupData = {
        config: this.config,
        favorites: Array.from(this.favorites),
        timestamp: Date.now(),
        version: 1
      };
      localStorage.setItem('screensaver-config-backup', JSON.stringify(backupData));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: ConfigPersistenceError.STORAGE_NOT_AVAILABLE,
        message: 'Failed to create backup'
      };
    }
  }

  /**
   * Restore settings from backup
   */
  public restoreFromBackup(): ConfigPersistenceResult {
    try {
      const backup = localStorage.getItem('screensaver-config-backup');
      if (!backup) {
        return {
          success: false,
          error: ConfigPersistenceError.INVALID_DATA,
          message: 'No backup found'
        };
      }
      
      const parsed = JSON.parse(backup);
      
      // Restore configuration
      if (parsed.config) {
        this.config = this.validateConfiguration(parsed.config);
      }
      
      // Restore favorites
      if (Array.isArray(parsed.favorites)) {
        this.favorites = new Set(parsed.favorites.filter(id => typeof id === 'number'));
      }
      
      // Save restored settings
      const configResult = this.saveConfiguration();
      const favoritesResult = this.saveFavorites();
      
      if (!configResult.success) return configResult;
      if (!favoritesResult.success) return favoritesResult;
      
      return { success: true };
    } catch (error) {
      console.warn('Failed to restore from backup:', error);
      return {
        success: false,
        error: ConfigPersistenceError.INVALID_DATA,
        message: 'Invalid backup data'
      };
    }
  }

  /**
   * Subscribe to configuration changes
   */
  public onConfigurationChange(listener: (config: Configuration) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Subscribe to favorites changes
   */
  public onFavoritesChange(listener: (favorites: Set<number>) => void): () => void {
    this.favoriteListeners.add(listener);
    return () => this.favoriteListeners.delete(listener);
  }

  /**
   * Check if localStorage is available
   */
  public isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  public getStorageInfo(): { used: number; available: boolean } {
    if (!this.isStorageAvailable()) {
      return { used: 0, available: false };
    }

    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith('screensaver-')) {
          used += localStorage[key].length;
        }
      }
      return { used, available: true };
    } catch {
      return { used: 0, available: false };
    }
  }
}

// Export singleton instance
export const configManager = ConfigurationManager.getInstance();