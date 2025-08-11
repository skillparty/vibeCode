/**
 * Unit tests for useFocusMode hook
 */

import { renderHook, act } from '@testing-library/react';
import { useFocusMode } from '../useFocusMode';
import { Configuration } from '../../types';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

const mockConfig: Configuration = {
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

describe('useFocusMode', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  test('should initialize with focus mode inactive', () => {
    const mockOnConfigChange = jest.fn();
    
    const { result } = renderHook(() => 
      useFocusMode(mockConfig, mockOnConfigChange)
    );

    expect(result.current.isActive).toBe(false);
  });

  test('should toggle focus mode on and off', () => {
    const mockOnConfigChange = jest.fn();
    
    const { result } = renderHook(() => 
      useFocusMode(mockConfig, mockOnConfigChange)
    );

    // Toggle on
    act(() => {
      result.current.toggleFocusMode();
    });

    expect(result.current.isActive).toBe(true);
    expect(mockOnConfigChange).toHaveBeenCalledWith({
      transitionSpeed: 15000,
      enableParticles: false,
      motionSensitivity: 'reduced'
    });

    // Toggle off
    act(() => {
      result.current.toggleFocusMode();
    });

    expect(result.current.isActive).toBe(false);
    expect(mockOnConfigChange).toHaveBeenCalledWith({
      transitionSpeed: mockConfig.transitionSpeed,
      enableParticles: mockConfig.enableParticles,
      motionSensitivity: mockConfig.motionSensitivity
    });
  });

  test('should update focus configuration', () => {
    const mockOnConfigChange = jest.fn();
    
    const { result } = renderHook(() => 
      useFocusMode(mockConfig, mockOnConfigChange)
    );

    act(() => {
      result.current.updateFocusConfig({
        animationIntensity: 'minimal',
        brightness: 50
      });
    });

    expect(result.current.config.animationIntensity).toBe('minimal');
    expect(result.current.config.brightness).toBe(50);
  });

  test('should provide pattern configuration adjustments', () => {
    const mockOnConfigChange = jest.fn();
    
    const { result } = renderHook(() => 
      useFocusMode(mockConfig, mockOnConfigChange)
    );

    // When inactive, should return empty config
    expect(result.current.getFocusPatternConfig()).toEqual({});

    // Activate focus mode
    act(() => {
      result.current.toggleFocusMode();
    });

    const patternConfig = result.current.getFocusPatternConfig();
    expect(patternConfig.animationSpeed).toBeLessThan(1);
    expect(patternConfig.brightness).toBeLessThan(1);
    expect(patternConfig.colorSaturation).toBeLessThan(1);
  });

  test('should persist focus configuration to localStorage', () => {
    const mockOnConfigChange = jest.fn();
    
    const { result } = renderHook(() => 
      useFocusMode(mockConfig, mockOnConfigChange)
    );

    act(() => {
      result.current.updateFocusConfig({
        animationIntensity: 'minimal',
        brightness: 60
      });
    });

    const saved = mockLocalStorage.getItem('screensaver-focus-mode');
    expect(saved).toBeTruthy();
    
    const parsed = JSON.parse(saved!);
    expect(parsed.config.animationIntensity).toBe('minimal');
    expect(parsed.config.brightness).toBe(60);
  });
});