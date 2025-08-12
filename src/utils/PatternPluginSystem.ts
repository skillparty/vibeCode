/**
 * Pattern plugin system for adding new ASCII patterns dynamically
 * Implements requirement 7.6 - extensibility hooks
 */

import { Pattern, PatternConfig } from '../types';
import { BasePattern } from './BasePattern';

export interface PatternPlugin {
  name: string;
  displayName: string;
  description: string;
  version: string;
  author: string;
  category: 'animation' | 'static' | 'interactive' | 'generative';
  tags: string[];
  PatternClass: new (ctx: CanvasRenderingContext2D, config: PatternConfig) => Pattern;
  defaultConfig: PatternConfig;
  configSchema?: PatternConfigSchema;
  previewImage?: string;
  isEnabled: boolean;
  loadTime?: number;
}

export interface PatternConfigSchema {
  [key: string]: {
    type: 'number' | 'string' | 'boolean' | 'select' | 'color';
    default: any;
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
    description?: string;
  };
}

export interface PluginValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PluginLoadResult {
  success: boolean;
  plugin?: PatternPlugin;
  error?: string;
}

export class PatternPluginSystem {
  private plugins: Map<string, PatternPlugin> = new Map();
  private loadedModules: Map<string, any> = new Map();
  private eventListeners: Map<string, Set<Function>> = new Map();
  private storageKey = 'screensaver-pattern-plugins';

  constructor() {
    this.loadPersistedPlugins();
    this.registerCorePatterns();
  }

  /**
   * Register core patterns as plugins
   */
  private registerCorePatterns(): void {
    const corePatterns = [
      {
        name: 'matrix-rain',
        displayName: 'Matrix Rain',
        description: 'Classic falling character animation inspired by The Matrix',
        category: 'animation' as const,
        tags: ['classic', 'cyberpunk', 'falling']
      },
      {
        name: 'binary-waves',
        displayName: 'Binary Waves',
        description: 'Sine wave patterns using binary digits',
        category: 'animation' as const,
        tags: ['waves', 'binary', 'mathematical']
      },
      {
        name: 'geometric-flow',
        displayName: 'Geometric Flow',
        description: 'Flowing geometric shapes using ASCII characters',
        category: 'animation' as const,
        tags: ['geometric', 'shapes', 'flow']
      },
      {
        name: 'terminal-cursor',
        displayName: 'Terminal Cursor',
        description: 'Blinking cursor with typing effects',
        category: 'interactive' as const,
        tags: ['terminal', 'cursor', 'typing']
      },
      {
        name: 'code-flow',
        displayName: 'Code Flow',
        description: 'Simulated code scrolling animation',
        category: 'animation' as const,
        tags: ['code', 'programming', 'scroll']
      },
      {
        name: 'mandelbrot-ascii',
        displayName: 'Mandelbrot ASCII',
        description: 'Fractal patterns rendered as ASCII art',
        category: 'generative' as const,
        tags: ['fractal', 'mathematical', 'mandelbrot']
      },
      {
        name: 'conway-life',
        displayName: "Conway's Game of Life",
        description: 'Cellular automaton simulation',
        category: 'generative' as const,
        tags: ['cellular', 'automaton', 'life']
      },
      {
        name: 'network-nodes',
        displayName: 'Network Nodes',
        description: 'Connected node visualization',
        category: 'animation' as const,
        tags: ['network', 'nodes', 'connections']
      }
    ];

    // Register core patterns (they're already loaded)
    corePatterns.forEach(pattern => {
      this.plugins.set(pattern.name, {
        ...pattern,
        version: '1.0.0',
        author: 'Core',
        PatternClass: null as any, // Will be loaded dynamically
        defaultConfig: this.getDefaultConfigForPattern(pattern.name),
        isEnabled: true
      });
    });
  }

  /**
   * Get default configuration for core patterns
   */
  private getDefaultConfigForPattern(patternName: string): PatternConfig {
    const baseConfig = {
      width: 800,
      height: 600,
      fontSize: 16,
      fontFamily: 'Courier New, Monaco, Consolas',
      color: '#00ff00',
      backgroundColor: '#000000',
      animationSpeed: 1.0
    };

    switch (patternName) {
      case 'matrix-rain':
        return {
          characters: '01{}[]()<>/*+-=;:.,!@#$%^&',
          speed: 'medium',
          density: 'high',
          glitchProbability: 0.02
        };
      case 'binary-waves':
        return {
          ...baseConfig,
          characters: '01',
          speed: 'medium',
          density: 'medium',
          waveLength: 20,
          amplitude: 5
        };
      case 'geometric-flow':
        return {
          characters: '/-\\|+*#',
          speed: 'medium',
          density: 'medium',
          rotationSpeed: 'medium',
          complexity: 'medium'
        };
      default:
        return {
          characters: '01',
          speed: 'medium',
          density: 'medium'
        };
    }
  }

  /**
   * Load persisted plugin configurations
   */
  private loadPersistedPlugins(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.plugins && Array.isArray(data.plugins)) {
          // Only restore enabled/disabled state for now
          data.plugins.forEach((pluginData: any) => {
            if (pluginData.name && typeof pluginData.isEnabled === 'boolean') {
              // Will be applied when plugins are registered
            }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted plugins:', error);
    }
  }

  /**
   * Save plugin configurations
   */
  private savePluginConfigurations(): void {
    try {
      const pluginData = Array.from(this.plugins.values()).map(plugin => ({
        name: plugin.name,
        isEnabled: plugin.isEnabled,
        version: plugin.version
      }));

      localStorage.setItem(this.storageKey, JSON.stringify({
        plugins: pluginData,
        version: 1,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save plugin configurations:', error);
    }
  }

  /**
   * Validate a pattern plugin
   */
  public validatePlugin(plugin: Partial<PatternPlugin>): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!plugin.name || typeof plugin.name !== 'string') {
      errors.push('Plugin name is required and must be a string');
    } else if (!/^[a-z0-9-]+$/.test(plugin.name)) {
      errors.push('Plugin name must contain only lowercase letters, numbers, and hyphens');
    }

    if (!plugin.displayName || typeof plugin.displayName !== 'string') {
      errors.push('Display name is required');
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      errors.push('Version is required');
    }

    if (!plugin.PatternClass || typeof plugin.PatternClass !== 'function') {
      errors.push('PatternClass must be a constructor function');
    }

    // Check if plugin already exists
    if (plugin.name && this.plugins.has(plugin.name)) {
      warnings.push(`Plugin '${plugin.name}' already exists and will be replaced`);
    }

    // Validate category
    const validCategories = ['animation', 'static', 'interactive', 'generative'];
    if (plugin.category && !validCategories.includes(plugin.category)) {
      errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }

    // Validate tags
    if (plugin.tags && !Array.isArray(plugin.tags)) {
      errors.push('Tags must be an array');
    }

    // Validate default config
    if (plugin.defaultConfig && typeof plugin.defaultConfig !== 'object') {
      errors.push('Default config must be an object');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Register a new pattern plugin
   */
  public async registerPlugin(plugin: PatternPlugin): Promise<PluginLoadResult> {
    const validation = this.validatePlugin(plugin);
    
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    try {
      // Test instantiation
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Cannot create canvas context for testing');
      }

      const testInstance = new plugin.PatternClass(ctx, plugin.defaultConfig);
      
      // Verify it implements the Pattern interface
      if (typeof testInstance.initialize !== 'function' ||
          typeof testInstance.update !== 'function' ||
          typeof testInstance.render !== 'function' ||
          typeof testInstance.cleanup !== 'function') {
        throw new Error('Plugin must implement Pattern interface (initialize, update, render, cleanup)');
      }

      // Register the plugin
      const pluginWithDefaults: PatternPlugin = {
        ...plugin,
        tags: plugin.tags || [],
        author: plugin.author || 'Unknown',
        description: plugin.description || '',
        isEnabled: plugin.isEnabled !== false,
        category: plugin.category || 'animation'
      };

      this.plugins.set(plugin.name, pluginWithDefaults);
      this.savePluginConfigurations();

      // Emit registration event
      this.emit('plugin-registered', pluginWithDefaults);

      console.log(`Pattern plugin registered: ${plugin.name}`);

      return {
        success: true,
        plugin: pluginWithDefaults
      };
    } catch (error) {
      console.error(`Failed to register plugin ${plugin.name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Unregister a pattern plugin
   */
  public unregisterPlugin(pluginName: string): boolean {
    if (!this.plugins.has(pluginName)) {
      return false;
    }

    // Don't allow unregistering core patterns
    const plugin = this.plugins.get(pluginName)!;
    if (plugin.author === 'Core') {
      console.warn(`Cannot unregister core pattern: ${pluginName}`);
      return false;
    }

    this.plugins.delete(pluginName);
    this.loadedModules.delete(pluginName);
    this.savePluginConfigurations();

    this.emit('plugin-unregistered', pluginName);
    console.log(`Pattern plugin unregistered: ${pluginName}`);

    return true;
  }

  /**
   * Enable or disable a plugin
   */
  public setPluginEnabled(pluginName: string, enabled: boolean): boolean {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return false;
    }

    plugin.isEnabled = enabled;
    this.savePluginConfigurations();

    this.emit('plugin-toggled', { pluginName, enabled });
    return true;
  }

  /**
   * Get all registered plugins
   */
  public getPlugins(): PatternPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get enabled plugins only
   */
  public getEnabledPlugins(): PatternPlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.isEnabled);
  }

  /**
   * Get plugin by name
   */
  public getPlugin(name: string): PatternPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get plugins by category
   */
  public getPluginsByCategory(category: string): PatternPlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.category === category);
  }

  /**
   * Get plugins by tag
   */
  public getPluginsByTag(tag: string): PatternPlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.tags.includes(tag));
  }

  /**
   * Load plugin from URL or module
   */
  public async loadPluginFromUrl(url: string): Promise<PluginLoadResult> {
    try {
      const module = await import(url);
      
      if (!module.default || !module.default.plugin) {
        throw new Error('Plugin module must export a default object with a plugin property');
      }

      return this.registerPlugin(module.default.plugin);
    } catch (error) {
      console.error(`Failed to load plugin from URL ${url}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load plugin'
      };
    }
  }

  /**
   * Create a pattern instance from plugin
   */
  public createPatternInstance(
    pluginName: string, 
    ctx: CanvasRenderingContext2D, 
    config?: PatternConfig
  ): Pattern | null {
    const plugin = this.plugins.get(pluginName);
    if (!plugin || !plugin.isEnabled) {
      return null;
    }

    try {
      const finalConfig = { ...plugin.defaultConfig, ...config };
      const startTime = performance.now();
      
      const instance = new plugin.PatternClass(ctx, finalConfig);
      
      // Record load time
      plugin.loadTime = performance.now() - startTime;
      
      return instance;
    } catch (error) {
      console.error(`Failed to create pattern instance for ${pluginName}:`, error);
      return null;
    }
  }

  /**
   * Get plugin statistics
   */
  public getPluginStats(): {
    total: number;
    enabled: number;
    byCategory: { [key: string]: number };
    averageLoadTime: number;
  } {
    const plugins = Array.from(this.plugins.values());
    const enabled = plugins.filter(p => p.isEnabled);
    
    const byCategory: { [key: string]: number } = {};
    plugins.forEach(plugin => {
      byCategory[plugin.category] = (byCategory[plugin.category] || 0) + 1;
    });

    const loadTimes = plugins
      .filter(p => p.loadTime !== undefined)
      .map(p => p.loadTime!);
    
    const averageLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
      : 0;

    return {
      total: plugins.length,
      enabled: enabled.length,
      byCategory,
      averageLoadTime
    };
  }

  /**
   * Event system for plugin lifecycle
   */
  public on(event: string, callback: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(callback);
    
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in plugin event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Export plugin configuration
   */
  public exportPluginConfig(): string | null {
    try {
      const exportData = {
        plugins: Array.from(this.plugins.values()).map(plugin => ({
          name: plugin.name,
          displayName: plugin.displayName,
          version: plugin.version,
          isEnabled: plugin.isEnabled,
          defaultConfig: plugin.defaultConfig
        })),
        exportDate: new Date().toISOString(),
        version: 1
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export plugin config:', error);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.plugins.clear();
    this.loadedModules.clear();
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const patternPluginSystem = new PatternPluginSystem();