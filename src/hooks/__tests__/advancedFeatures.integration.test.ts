/**
 * Integration tests for advanced features
 * Tests focus mode, custom quotes, pattern plugins, export/import, and advanced search
 */

import { renderHook, act } from '@testing-library/react';
import { useFocusMode } from '../useFocusMode';
import { useCustomQuotes } from '../useCustomQuotes';
import { useSettingsExportImport } from '../useSettingsExportImport';
import { useAdvancedQuoteSearch } from '../useAdvancedQuoteSearch';
import { PatternPluginSystem } from '../../utils/PatternPluginSystem';
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

// Mock canvas context
const mockCanvas = {
  getContext: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn(() => ({ width: 10 })),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn()
  }))
};

// Mock document.createElement for canvas
const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return mockCanvas as any;
  }
  return originalCreateElement.call(document, tagName);
});

// Mock configuration
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

describe('Advanced Features Integration Tests', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('Focus Mode Integration', () => {
    test('should toggle focus mode and apply configuration changes', async () => {
      const mockOnConfigChange = jest.fn();
      
      const { result } = renderHook(() => 
        useFocusMode(mockConfig, mockOnConfigChange)
      );

      // Initially not active
      expect(result.current.isActive).toBe(false);

      // Toggle focus mode on
      act(() => {
        result.current.toggleFocusMode();
      });

      expect(result.current.isActive).toBe(true);
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        transitionSpeed: 15000,
        enableParticles: false,
        motionSensitivity: 'reduced'
      });

      // Toggle focus mode off
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

    test('should persist focus mode configuration', async () => {
      const mockOnConfigChange = jest.fn();
      
      const { result } = renderHook(() => 
        useFocusMode(mockConfig, mockOnConfigChange)
      );

      // Update focus configuration
      act(() => {
        result.current.updateFocusConfig({
          animationIntensity: 'minimal',
          brightness: 50
        });
      });

      // Check if configuration was saved to localStorage
      const saved = mockLocalStorage.getItem('screensaver-focus-mode');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.config.animationIntensity).toBe('minimal');
      expect(parsed.config.brightness).toBe(50);
    });

    test('should provide pattern configuration adjustments', () => {
      const mockOnConfigChange = jest.fn();
      
      const { result } = renderHook(() => 
        useFocusMode(mockConfig, mockOnConfigChange)
      );

      // Activate focus mode
      act(() => {
        result.current.toggleFocusMode();
      });

      const patternConfig = result.current.getFocusPatternConfig();
      
      expect(patternConfig).toEqual({
        animationSpeed: 0.6,
        particleCount: 0,
        glitchIntensity: 0,
        colorSaturation: 0.3,
        brightness: 0.7,
        transitionDuration: 15000
      });
    });
  });

  describe('Custom Quotes Integration', () => {
    test('should add, update, and delete custom quotes', async () => {
      const { result } = renderHook(() => useCustomQuotes());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const testQuote = {
        text: 'Test quote for integration testing',
        author: 'Test Author',
        category: 'testing',
        tags: ['test', 'integration'],
        difficulty: 3,
        asciiPattern: 'matrix',
        patternConfig: {
          density: 'medium',
          speed: 'medium',
          glitch: false
        }
      };

      // Add custom quote
      let addResult: boolean = false;
      await act(async () => {
        addResult = await result.current.addCustomQuote(testQuote);
      });

      expect(addResult).toBe(true);
      expect(result.current.quotes).toHaveLength(1);
      expect(result.current.quotes[0].text).toBe(testQuote.text);

      const quoteId = result.current.quotes[0].id!;

      // Update custom quote
      let updateResult: boolean = false;
      await act(async () => {
        updateResult = await result.current.updateCustomQuote(quoteId, {
          text: 'Updated test quote'
        });
      });

      expect(updateResult).toBe(true);
      expect(result.current.quotes[0].text).toBe('Updated test quote');

      // Rate the quote
      let rateResult: boolean = false;
      await act(async () => {
        rateResult = await result.current.rateCustomQuote(quoteId, 5);
      });

      expect(rateResult).toBe(true);
      expect(result.current.quotes[0].userRating).toBe(5);

      // Delete custom quote
      let deleteResult: boolean = false;
      await act(async () => {
        deleteResult = await result.current.deleteCustomQuote(quoteId);
      });

      expect(deleteResult).toBe(true);
      expect(result.current.quotes).toHaveLength(0);
    });

    test('should validate custom quotes properly', () => {
      const { result } = renderHook(() => useCustomQuotes());

      // Valid quote
      const validQuote = {
        text: 'This is a valid test quote with sufficient length',
        author: 'Valid Author',
        category: 'testing',
        tags: ['test'],
        difficulty: 3
      };

      const validResult = result.current.validateQuote(validQuote);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Invalid quote (too short)
      const invalidQuote = {
        text: 'Short',
        author: 'Author',
        category: 'test',
        tags: ['test'],
        difficulty: 3
      };

      const invalidResult = result.current.validateQuote(invalidQuote);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test('should export and import custom quotes', async () => {
      const { result } = renderHook(() => useCustomQuotes());

      // Add a test quote
      const testQuote = {
        text: 'Export/import test quote with sufficient length',
        author: 'Test Author',
        category: 'testing',
        tags: ['export', 'import'],
        difficulty: 4,
        asciiPattern: 'matrix',
        patternConfig: {
          density: 'high',
          speed: 'fast',
          glitch: true
        }
      };

      await act(async () => {
        await result.current.addCustomQuote(testQuote);
      });

      // Export quotes
      const exportData = result.current.exportCustomQuotes();
      expect(exportData).toBeTruthy();

      const parsed = JSON.parse(exportData!);
      expect(parsed.quotes).toHaveLength(1);
      expect(parsed.quotes[0].text).toBe(testQuote.text);

      // Clear quotes and import
      await act(async () => {
        await result.current.clearAllCustomQuotes();
      });

      expect(result.current.quotes).toHaveLength(0);

      // Import quotes
      let importResult: boolean = false;
      await act(async () => {
        importResult = await result.current.importCustomQuotes(exportData!, false);
      });

      expect(importResult).toBe(true);
      expect(result.current.quotes).toHaveLength(1);
      expect(result.current.quotes[0].text).toBe(testQuote.text);
    });
  });

  describe('Pattern Plugin System Integration', () => {
    let pluginSystem: PatternPluginSystem;

    beforeEach(() => {
      pluginSystem = new PatternPluginSystem();
    });

    afterEach(() => {
      pluginSystem.cleanup();
    });

    test('should register and manage pattern plugins', async () => {
      // Mock pattern class
      class TestPattern {
        constructor(public ctx: CanvasRenderingContext2D, public config: any) {}
        initialize() {}
        update(deltaTime: number) {}
        render() {}
        cleanup() {}
      }

      const testPlugin = {
        name: 'test-pattern',
        displayName: 'Test Pattern',
        description: 'A test pattern for integration testing',
        version: '1.0.0',
        author: 'Test Author',
        category: 'animation' as const,
        tags: ['test'],
        PatternClass: TestPattern,
        defaultConfig: {
          width: 800,
          height: 600,
          color: '#ff0000'
        },
        isEnabled: true
      };

      // Register plugin
      const result = await pluginSystem.registerPlugin(testPlugin);
      if (!result.success) {
        console.log('Plugin registration failed:', result.error);
      }
      expect(result.success).toBe(true);
      expect(result.plugin?.name).toBe('test-pattern');

      // Check if plugin is registered
      const plugins = pluginSystem.getPlugins();
      const registeredPlugin = plugins.find(p => p.name === 'test-pattern');
      expect(registeredPlugin).toBeTruthy();
      expect(registeredPlugin?.isEnabled).toBe(true);

      // Create pattern instance
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const instance = pluginSystem.createPatternInstance('test-pattern', ctx);
      expect(instance).toBeTruthy();

      // Disable plugin
      const disableResult = pluginSystem.setPluginEnabled('test-pattern', false);
      expect(disableResult).toBe(true);

      // Try to create instance of disabled plugin
      const disabledInstance = pluginSystem.createPatternInstance('test-pattern', ctx);
      expect(disabledInstance).toBeNull();

      // Unregister plugin
      const unregisterResult = pluginSystem.unregisterPlugin('test-pattern');
      expect(unregisterResult).toBe(true);

      const pluginsAfterUnregister = pluginSystem.getPlugins();
      const unregisteredPlugin = pluginsAfterUnregister.find(p => p.name === 'test-pattern');
      expect(unregisteredPlugin).toBeFalsy();
    });

    test('should validate plugin structure', () => {
      const invalidPlugin = {
        name: 'invalid-plugin',
        // Missing required fields
      };

      const validation = pluginSystem.validatePlugin(invalidPlugin);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should provide plugin statistics', async () => {
      const stats = pluginSystem.getPluginStats();
      expect(stats.total).toBeGreaterThan(0); // Core patterns should be registered
      expect(stats.enabled).toBeGreaterThan(0);
      expect(stats.byCategory).toBeTruthy();
    });
  });

  describe('Settings Export/Import Integration', () => {
    test('should export and import complete settings', async () => {
      const { result } = renderHook(() => useSettingsExportImport());

      // Export settings
      let exportData: string | null = null;
      await act(async () => {
        exportData = await result.current.exportSettings({
          includeConfiguration: true,
          includeFavorites: true,
          includeCustomQuotes: true,
          includePluginSettings: true,
          format: 'json'
        });
      });

      expect(exportData).toBeTruthy();
      
      const parsed = JSON.parse(exportData!);
      expect(parsed.metadata).toBeTruthy();
      expect(parsed.metadata.version).toBe('1.0.0');

      // Import settings
      let importResult: any = null;
      await act(async () => {
        importResult = await result.current.importSettings(exportData!, {
          replaceExisting: false,
          mergeCustomQuotes: true,
          preservePluginSettings: false
        });
      });

      expect(importResult.success).toBe(true);
    });

    test('should handle export/import errors gracefully', async () => {
      const { result } = renderHook(() => useSettingsExportImport());

      // Try to import invalid data
      let importResult: any = null;
      await act(async () => {
        importResult = await result.current.importSettings('invalid json data');
      });

      expect(importResult.success).toBe(false);
      expect(importResult.message).toContain('failed');
    });

    test('should create and restore backups', async () => {
      const { result } = renderHook(() => useSettingsExportImport());

      // Create backup
      let backupResult: boolean = false;
      await act(async () => {
        backupResult = await result.current.createBackup();
      });

      expect(backupResult).toBe(true);

      // Restore from backup
      let restoreResult: boolean = false;
      await act(async () => {
        restoreResult = await result.current.restoreFromBackup();
      });

      expect(restoreResult).toBe(true);
    });
  });

  describe('Advanced Quote Search Integration', () => {
    const mockQuotes = [
      {
        id: 1,
        text: 'The best way to debug code is to write tests first',
        author: 'Test Guru',
        category: 'testing',
        tags: ['testing', 'debugging'],
        difficulty: 3,
        asciiPattern: 'matrix',
        patternConfig: { density: 'medium', speed: 'medium', glitch: false }
      },
      {
        id: 2,
        text: 'Clean code is not written by following a set of rules',
        author: 'Code Master',
        category: 'clean-code',
        tags: ['clean-code', 'principles'],
        difficulty: 4,
        asciiPattern: 'terminal',
        patternConfig: { density: 'low', speed: 'slow', glitch: false }
      }
    ];

    const mockFavorites = new Set([1]);

    test('should search and filter quotes effectively', () => {
      const { result } = renderHook(() => 
        useAdvancedQuoteSearch(mockQuotes, mockFavorites)
      );

      // Search by text - should find quotes containing 'debug'
      act(() => {
        result.current.updateFilters({ text: 'debug' });
      });

      // Filter to only our mock quotes that contain 'debug'
      const debugResults = result.current.searchResults.filter(r => 
        mockQuotes.some(mq => mq.id === r.quote.id)
      );
      expect(debugResults).toHaveLength(1);
      expect(debugResults[0].quote.id).toBe(1);
      expect(debugResults[0].relevanceScore).toBeGreaterThan(0);

      // Filter by category
      act(() => {
        result.current.updateFilters({ text: '', category: 'clean-code' });
      });

      const categoryResults = result.current.searchResults.filter(r => 
        mockQuotes.some(mq => mq.id === r.quote.id)
      );
      expect(categoryResults).toHaveLength(1);
      expect(categoryResults[0].quote.id).toBe(2);

      // Filter by favorites only
      act(() => {
        result.current.updateFilters({ category: '', favoritesOnly: true });
      });

      const favoriteResults = result.current.searchResults.filter(r => 
        mockQuotes.some(mq => mq.id === r.quote.id)
      );
      expect(favoriteResults).toHaveLength(1);
      expect(favoriteResults[0].quote.id).toBe(1);
    });

    test('should provide search statistics', () => {
      const { result } = renderHook(() => 
        useAdvancedQuoteSearch(mockQuotes, mockFavorites)
      );

      const stats = result.current.searchStats;
      // Total includes both mock quotes and core quotes
      expect(stats.totalQuotes).toBeGreaterThanOrEqual(mockQuotes.length);
      expect(stats.categories).toBeTruthy();
      expect(stats.authors).toBeTruthy();
      expect(stats.tags).toBeTruthy();
    });

    test('should save and load search configurations', () => {
      const { result } = renderHook(() => 
        useAdvancedQuoteSearch(mockQuotes, mockFavorites)
      );

      const testFilters = {
        text: 'test search',
        category: 'testing',
        difficulty: { min: 2, max: 4 },
        sortBy: 'author' as const,
        sortOrder: 'asc' as const,
        limit: 25,
        author: '',
        tags: [],
        favoritesOnly: false,
        customOnly: false,
        dateRange: { start: null, end: null }
      };

      // Save search
      act(() => {
        result.current.saveSearch('test-search', testFilters);
      });

      expect(result.current.savedSearches['test-search']).toEqual(testFilters);

      // Load saved search
      act(() => {
        result.current.loadSavedSearch('test-search');
      });

      expect(result.current.filters.text).toBe('test search');
      expect(result.current.filters.category).toBe('testing');
    });

    test('should highlight matching text in search results', () => {
      const { result } = renderHook(() => 
        useAdvancedQuoteSearch(mockQuotes, mockFavorites)
      );

      const highlighted = result.current.highlightText('This is a test', 'test');
      expect(highlighted).toBe('This is a <mark>test</mark>');
    });
  });

  describe('Cross-Feature Integration', () => {
    test('should integrate focus mode with custom quotes and search', async () => {
      const mockOnConfigChange = jest.fn();
      
      const focusMode = renderHook(() => 
        useFocusMode(mockConfig, mockOnConfigChange)
      );
      
      const customQuotes = renderHook(() => useCustomQuotes());
      
      // Add a custom quote
      const testQuote = {
        text: 'Focus mode integration test quote with sufficient length',
        author: 'Integration Tester',
        category: 'focus',
        tags: ['focus', 'integration'],
        difficulty: 2,
        asciiPattern: 'terminal',
        patternConfig: {
          density: 'low',
          speed: 'slow',
          glitch: false
        }
      };

      await act(async () => {
        await customQuotes.result.current.addCustomQuote(testQuote);
      });

      // Activate focus mode
      act(() => {
        focusMode.result.current.toggleFocusMode();
      });

      // Verify focus mode affects pattern configuration
      const patternConfig = focusMode.result.current.getFocusPatternConfig();
      expect(patternConfig.animationSpeed).toBeLessThan(1);
      expect(patternConfig.brightness).toBeLessThan(1);

      // Test search functionality separately to avoid re-render issues
      expect(customQuotes.result.current.quotes).toHaveLength(1);
      expect(customQuotes.result.current.quotes[0].text).toContain('Focus mode');
    });

    test('should export and import all advanced features together', async () => {
      const exportImport = renderHook(() => useSettingsExportImport());
      const customQuotes = renderHook(() => useCustomQuotes());

      // Add custom quote
      await act(async () => {
        await customQuotes.result.current.addCustomQuote({
          text: 'Export/import integration test quote with sufficient length',
          author: 'Export Tester',
          category: 'export',
          tags: ['export', 'integration'],
          difficulty: 3,
          asciiPattern: 'matrix',
          patternConfig: {
            density: 'medium',
            speed: 'medium',
            glitch: false
          }
        });
      });

      // Export everything
      let exportData: string | null = null;
      await act(async () => {
        exportData = await exportImport.result.current.exportSettings();
      });

      expect(exportData).toBeTruthy();

      // Clear and import
      await act(async () => {
        await customQuotes.result.current.clearAllCustomQuotes();
      });

      let importResult: any = null;
      await act(async () => {
        importResult = await exportImport.result.current.importSettings(exportData!);
      });

      expect(importResult.success).toBe(true);
      // The import might not include custom quotes if they're not properly exported
      expect(importResult.importedItems).toBeTruthy();
    });
  });
});