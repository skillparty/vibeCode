/**
 * Focus mode hook for reduced animation intensity during programming use
 * Implements requirement 7.2
 */

import { useState, useEffect, useCallback } from 'react';
import { Configuration } from '../types';

export interface FocusModeConfig {
  enabled: boolean;
  animationIntensity: 'minimal' | 'reduced' | 'normal';
  transitionSpeed: number;
  enableParticles: boolean;
  enableGlitchEffects: boolean;
  colorSaturation: number; // 0-100
  brightness: number; // 0-100
}

export interface FocusModeState {
  isActive: boolean;
  config: FocusModeConfig;
  originalConfig: Partial<Configuration> | null;
}

const DEFAULT_FOCUS_CONFIG: FocusModeConfig = {
  enabled: false,
  animationIntensity: 'reduced',
  transitionSpeed: 15000, // Slower transitions
  enableParticles: false,
  enableGlitchEffects: false,
  colorSaturation: 30, // Reduced saturation
  brightness: 70 // Dimmed brightness
};

export const useFocusMode = (
  currentConfig: Configuration,
  onConfigChange: (config: Partial<Configuration>) => void
) => {
  const [focusState, setFocusState] = useState<FocusModeState>({
    isActive: false,
    config: DEFAULT_FOCUS_CONFIG,
    originalConfig: null
  });

  // Load focus mode settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('screensaver-focus-mode');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFocusState(prev => ({
          ...prev,
          config: { ...DEFAULT_FOCUS_CONFIG, ...parsed.config }
        }));
      }
    } catch (error) {
      console.warn('Failed to load focus mode settings:', error);
    }
  }, []);

  // Save focus mode settings to localStorage
  const saveFocusSettings = useCallback((config: FocusModeConfig) => {
    try {
      localStorage.setItem('screensaver-focus-mode', JSON.stringify({
        config,
        version: 1,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save focus mode settings:', error);
    }
  }, []);

  // Toggle focus mode
  const toggleFocusMode = useCallback(() => {
    setFocusState(prev => {
      const newIsActive = !prev.isActive;
      
      if (newIsActive) {
        // Entering focus mode - save current config and apply focus settings
        const originalConfig = {
          transitionSpeed: currentConfig.transitionSpeed,
          enableParticles: currentConfig.enableParticles,
          motionSensitivity: currentConfig.motionSensitivity
        };

        // Apply focus mode configuration
        onConfigChange({
          transitionSpeed: prev.config.transitionSpeed,
          enableParticles: prev.config.enableParticles,
          motionSensitivity: 'reduced'
        });

        return {
          ...prev,
          isActive: true,
          originalConfig
        };
      } else {
        // Exiting focus mode - restore original config
        if (prev.originalConfig) {
          onConfigChange(prev.originalConfig);
        }

        return {
          ...prev,
          isActive: false,
          originalConfig: null
        };
      }
    });
  }, [currentConfig, onConfigChange]);

  // Update focus mode configuration
  const updateFocusConfig = useCallback((updates: Partial<FocusModeConfig>) => {
    setFocusState(prev => {
      const newConfig = { ...prev.config, ...updates };
      saveFocusSettings(newConfig);

      // If focus mode is active, apply changes immediately
      if (prev.isActive) {
        onConfigChange({
          transitionSpeed: newConfig.transitionSpeed,
          enableParticles: newConfig.enableParticles,
          motionSensitivity: newConfig.animationIntensity === 'minimal' ? 'reduced' : 'normal'
        });
      }

      return {
        ...prev,
        config: newConfig
      };
    });
  }, [onConfigChange, saveFocusSettings]);

  // Get pattern configuration adjustments for focus mode
  const getFocusPatternConfig = useCallback(() => {
    if (!focusState.isActive) {
      return {};
    }

    const { config } = focusState;
    
    return {
      animationSpeed: config.animationIntensity === 'minimal' ? 0.3 : 0.6,
      particleCount: config.enableParticles ? 0.5 : 0,
      glitchIntensity: config.enableGlitchEffects ? 0.3 : 0,
      colorSaturation: config.colorSaturation / 100,
      brightness: config.brightness / 100,
      transitionDuration: config.transitionSpeed
    };
  }, [focusState]);

  // Check if focus mode should auto-activate based on time
  const checkAutoActivation = useCallback(() => {
    if (!focusState.config.enabled) return;

    const now = new Date();
    const hour = now.getHours();
    
    // Auto-activate during typical work hours (9 AM - 6 PM)
    const isWorkHours = hour >= 9 && hour < 18;
    const shouldActivate = isWorkHours && !focusState.isActive;
    const shouldDeactivate = !isWorkHours && focusState.isActive;

    if (shouldActivate || shouldDeactivate) {
      toggleFocusMode();
    }
  }, [focusState, toggleFocusMode]);

  // Auto-activation check every hour
  useEffect(() => {
    const interval = setInterval(checkAutoActivation, 60 * 60 * 1000); // 1 hour
    return () => clearInterval(interval);
  }, [checkAutoActivation]);

  // Keyboard shortcut for focus mode toggle (Ctrl/Cmd + F)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'f' && !event.shiftKey) {
        event.preventDefault();
        toggleFocusMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleFocusMode]);

  return {
    isActive: focusState.isActive,
    config: focusState.config,
    toggleFocusMode,
    updateFocusConfig,
    getFocusPatternConfig,
    checkAutoActivation
  };
};