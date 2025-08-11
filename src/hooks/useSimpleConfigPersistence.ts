import { useState, useEffect, useCallback } from 'react';
import { Configuration } from '../types';

// Default configuration
const DEFAULT_CONFIG: Configuration = {
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

// Storage key
const CONFIG_KEY = 'screensaver-config';

// Simple configuration persistence hook
export const useSimpleConfigPersistence = () => {
  const [config, setConfig] = useState<Configuration>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load configuration from localStorage
  const loadConfig = useCallback(() => {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
      setError(null);
    } catch (err) {
      console.warn('Failed to load config:', err);
      setError('Failed to load configuration');
      setConfig(DEFAULT_CONFIG);
    }
  }, []);

  // Save configuration to localStorage
  const saveConfig = useCallback((newConfig: Configuration) => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
      setError(null);
      return true;
    } catch (err) {
      console.warn('Failed to save config:', err);
      setError('Failed to save configuration');
      return false;
    }
  }, []);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<Configuration>) => {
    const newConfig = { ...config, ...updates };
    return saveConfig(newConfig);
  }, [config, saveConfig]);

  // Reset to defaults
  const resetConfig = useCallback(() => {
    return saveConfig(DEFAULT_CONFIG);
  }, [saveConfig]);

  // Load on mount
  useEffect(() => {
    setIsLoading(true);
    loadConfig();
    setIsLoading(false);
  }, [loadConfig]);

  return {
    config,
    isLoading,
    error,
    updateConfig,
    resetConfig,
    loadConfig
  };
};