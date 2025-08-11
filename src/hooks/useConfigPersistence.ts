import { useEffect, useCallback, useState } from 'react';
import { Configuration } from '../types';

// Configuration schema for validation
const CONFIG_SCHEMA = {
  transitionSpeed: {
    type: 'number',
    min: 5000,
    max: 20000,
    default: 10000
  },
  currentTheme: {
    type: 'string',
    enum: ['matrix', 'terminal', 'retro', 'blue'],
    default: 'matrix'
  },
  transitionEffect: {
    type: 'string',
    enum: ['fade', 'slide', 'typewriter', 'rotate3d', 'morph'],
    default: 'fade'
  },
  autoMode: {
    type: 'boolean',
    default: true
  },
  enableParticles: {
    type: 'boolean',
    default: true
  },
  fontSize: {
    type: 'string',
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  },
  dayNightMode: {
    type: 'string',
    enum: ['day', 'night', 'auto'],
    default: 'auto'
  },
  presentationMode: {
    type: 'boolean',
    default: false
  },
  motionSensitivity: {
    type: 'string',
    enum: ['normal', 'reduced'],
    default: 'normal'
  }
} as const;

// Storage keys
const STORAGE_KEYS = {
  CONFIG: 'screensaver-config',
  BACKUP: 'screensaver-config-backup',
  VERSION: 'screensaver-config-version',
  FAVORITES: 'screensaver-favorites'
} as const;

// Current configuration version for migration
const CONFIG_VERSION = 1;

// Default configuration
export const DEFAULT_CONFIG: Configuration = {
  transitionSpeed: 10000,
  currentTheme: 'matrix',
  transitionEffect: 'fade',
  autoMode: true,
  enableParticles: true,
  fontSize: 'medium',
  dayNightMode: 'auto',
  presentationMode: false,
  motionSensitivity: 'normal'
};

// Configuration validation function
const validateConfig = (config: any): Configuration => {
  const validatedConfig: Partial<Configuration> = {};

  for (const [key, schema] of Object.entries(CONFIG_SCHEMA)) {
    const value = config[key];
    
    if (value === undefined || value === null) {
      (validatedConfig as any)[key] = schema.default;
      continue;
    }

    switch (schema.type) {
      case 'number':
        if (typeof value === 'number' && !isNaN(value)) {
          const numValue = Math.max(schema.min || -Infinity, Math.min(schema.max || Infinity, value));
          (validatedConfig as any)[key] = numValue;
        } else {
          (validatedConfig as any)[key] = schema.default;
        }
        break;
      
      case 'boolean':
        (validatedConfig as any)[key] = Boolean(value);
        break;
      
      case 'string':
        if (typeof value === 'string' && (!schema.enum || schema.enum.includes(value as any))) {
          (validatedConfig as any)[key] = value;
        } else {
          (validatedConfig as any)[key] = schema.default;
        }
        break;
      
      default:
        (validatedConfig as any)[key] = schema.default;
    }
  }

  return validatedConfig as Configuration;
};

// Configuration migration function
const migrateConfig = (config: any, fromVersion: number): Configuration => {
  let migratedConfig = { ...config };

  // Migration logic for future versions
  switch (fromVersion) {
    case 0:
      // Migration from version 0 to 1
      // Add any new fields or transform existing ones
      if (!migratedConfig.motionSensitivity) {
        migratedConfig.motionSensitivity = 'normal';
      }
      if (!migratedConfig.dayNightMode) {
        migratedConfig.dayNightMode = 'auto';
      }
      break;
    
    // Add more migration cases as needed
    default:
      break;
  }

  return validateConfig(migratedConfig);
};

// Error types for better error handling
export enum ConfigPersistenceError {
  STORAGE_NOT_AVAILABLE = 'STORAGE_NOT_AVAILABLE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_DATA = 'INVALID_DATA',
  MIGRATION_FAILED = 'MIGRATION_FAILED'
}

export interface ConfigPersistenceResult {
  success: boolean;
  error?: ConfigPersistenceError;
  message?: string;
}

// Check if localStorage is available
const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// Safe localStorage operations
const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to get item from localStorage: ${key}`, error);
    return null;
  }
};

const safeSetItem = (key: string, value: string): ConfigPersistenceResult => {
  try {
    localStorage.setItem(key, value);
    return { success: true };
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.code === 22 || error.name === 'QuotaExceededError') {
        return {
          success: false,
          error: ConfigPersistenceError.QUOTA_EXCEEDED,
          message: 'Storage quota exceeded'
        };
      }
    }
    return {
      success: false,
      error: ConfigPersistenceError.STORAGE_NOT_AVAILABLE,
      message: 'localStorage is not available'
    };
  }
};

const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove item from localStorage: ${key}`, error);
  }
};

// Main hook for configuration persistence
export const useConfigPersistence = (
  initialConfig: Configuration = DEFAULT_CONFIG
) => {
  const [config, setConfig] = useState<Configuration>(initialConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<ConfigPersistenceError | null>(null);

  // Load configuration from localStorage
  const loadConfig = useCallback((): Configuration => {
    if (!isStorageAvailable()) {
      setLastError(ConfigPersistenceError.STORAGE_NOT_AVAILABLE);
      return DEFAULT_CONFIG;
    }

    try {
      const savedConfig = safeGetItem(STORAGE_KEYS.CONFIG);
      const savedVersion = safeGetItem(STORAGE_KEYS.VERSION);
      
      if (!savedConfig) {
        return DEFAULT_CONFIG;
      }

      const parsedConfig = JSON.parse(savedConfig);
      const version = savedVersion ? parseInt(savedVersion, 10) : 0;

      // Migrate if necessary
      const migratedConfig = version < CONFIG_VERSION 
        ? migrateConfig(parsedConfig, version)
        : validateConfig(parsedConfig);

      setLastError(null);
      return migratedConfig;
    } catch (error) {
      console.warn('Failed to load configuration:', error);
      setLastError(ConfigPersistenceError.INVALID_DATA);
      return DEFAULT_CONFIG;
    }
  }, []);

  // Save configuration to localStorage
  const saveConfig = useCallback((configToSave: Configuration): ConfigPersistenceResult => {
    if (!isStorageAvailable()) {
      const error = ConfigPersistenceError.STORAGE_NOT_AVAILABLE;
      setLastError(error);
      return { success: false, error };
    }

    try {
      const validatedConfig = validateConfig(configToSave);
      const configResult = safeSetItem(STORAGE_KEYS.CONFIG, JSON.stringify(validatedConfig));
      
      if (!configResult.success) {
        setLastError(configResult.error!);
        return configResult;
      }

      // Save version
      const versionResult = safeSetItem(STORAGE_KEYS.VERSION, CONFIG_VERSION.toString());
      
      if (!versionResult.success) {
        setLastError(versionResult.error!);
        return versionResult;
      }

      setLastError(null);
      return { success: true };
    } catch (error) {
      console.warn('Failed to save configuration:', error);
      const errorType = ConfigPersistenceError.INVALID_DATA;
      setLastError(errorType);
      return { success: false, error: errorType };
    }
  }, []);

  // Create backup of current configuration
  const createBackup = useCallback((): ConfigPersistenceResult => {
    if (!isStorageAvailable()) {
      const error = ConfigPersistenceError.STORAGE_NOT_AVAILABLE;
      setLastError(error);
      return { success: false, error };
    }

    const backupData = {
      config: JSON.stringify(config),
      version: CONFIG_VERSION,
      timestamp: Date.now()
    };

    const result = safeSetItem(STORAGE_KEYS.BACKUP, JSON.stringify(backupData));
    if (!result.success) {
      setLastError(result.error!);
    }
    return result;
  }, [config]);

  // Restore configuration from backup
  const restoreFromBackup = useCallback((): ConfigPersistenceResult => {
    if (!isStorageAvailable()) {
      const error = ConfigPersistenceError.STORAGE_NOT_AVAILABLE;
      setLastError(error);
      return { success: false, error };
    }

    try {
      const backupData = safeGetItem(STORAGE_KEYS.BACKUP);
      if (!backupData) {
        return { success: false, error: ConfigPersistenceError.INVALID_DATA };
      }

      const parsed = JSON.parse(backupData);
      const restoredConfig = JSON.parse(parsed.config);
      const validatedConfig = validateConfig(restoredConfig);

      setConfig(validatedConfig);
      const result = saveConfig(validatedConfig);
      
      if (result.success) {
        setLastError(null);
      }
      
      return result;
    } catch (error) {
      console.warn('Failed to restore from backup:', error);
      const errorType = ConfigPersistenceError.INVALID_DATA;
      setLastError(errorType);
      return { success: false, error: errorType };
    }
  }, [saveConfig]);

  // Reset configuration to defaults
  const resetToDefaults = useCallback((): ConfigPersistenceResult => {
    setConfig(DEFAULT_CONFIG);
    return saveConfig(DEFAULT_CONFIG);
  }, [saveConfig]);

  // Export configuration for backup
  const exportConfig = useCallback((): string | null => {
    try {
      const exportData = {
        config,
        version: CONFIG_VERSION,
        timestamp: Date.now(),
        appVersion: '1.0.0' // Could be dynamic
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.warn('Failed to export configuration:', error);
      return null;
    }
  }, [config]);

  // Import configuration from backup
  const importConfig = useCallback((configData: string): ConfigPersistenceResult => {
    try {
      const parsed = JSON.parse(configData);
      const importedConfig = validateConfig(parsed.config);
      
      setConfig(importedConfig);
      return saveConfig(importedConfig);
    } catch (error) {
      console.warn('Failed to import configuration:', error);
      const errorType = ConfigPersistenceError.INVALID_DATA;
      setLastError(errorType);
      return { success: false, error: errorType };
    }
  }, [saveConfig]);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<Configuration>): ConfigPersistenceResult => {
    const newConfig = { ...config, ...updates };
    const validatedConfig = validateConfig(newConfig);
    
    setConfig(validatedConfig);
    return saveConfig(validatedConfig);
  }, [config, saveConfig]);

  // Load configuration on mount
  useEffect(() => {
    setIsLoading(true);
    const loadedConfig = loadConfig();
    setConfig(loadedConfig);
    setIsLoading(false);
  }, []); // Remove loadConfig dependency to avoid infinite loop

  // Auto-save configuration when it changes (but not during initial load)
  useEffect(() => {
    if (!isLoading && config !== initialConfig) {
      saveConfig(config);
    }
  }, [config, isLoading]); // Remove saveConfig dependency

  return {
    config,
    isLoading,
    lastError,
    updateConfig,
    saveConfig,
    loadConfig,
    createBackup,
    restoreFromBackup,
    resetToDefaults,
    exportConfig,
    importConfig,
    isStorageAvailable: isStorageAvailable()
  };
};