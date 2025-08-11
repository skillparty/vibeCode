/**
 * Lazy loading system for ASCII patterns and visual effects
 * Optimizes initial load time and memory usage
 */

import { Pattern, PatternConfig } from '../types';

export interface PatternModule {
  default: new (ctx: CanvasRenderingContext2D, config: PatternConfig) => Pattern;
}

export interface LoadedPattern {
  name: string;
  PatternClass: new (ctx: CanvasRenderingContext2D, config: PatternConfig) => Pattern;
  isLoaded: boolean;
  loadTime: number;
}

export class PatternLoader {
  private patterns: Map<string, LoadedPattern> = new Map();
  private loadingPromises: Map<string, Promise<PatternModule>> = new Map();
  private preloadQueue: string[] = [];
  private isPreloading: boolean = false;
  
  constructor() {
    this.registerPatternModules();
  }
  
  /**
   * Register pattern modules for lazy loading
   */
  private registerPatternModules(): void {
    // Register patterns with their import paths
    this.patterns.set('matrix-rain', {
      name: 'matrix-rain',
      PatternClass: null as any,
      isLoaded: false,
      loadTime: 0
    });
    
    this.patterns.set('binary-waves', {
      name: 'binary-waves',
      PatternClass: null as any,
      isLoaded: false,
      loadTime: 0
    });
    
    this.patterns.set('geometric-flow', {
      name: 'geometric-flow',
      PatternClass: null as any,
      isLoaded: false,
      loadTime: 0
    });
    
    this.patterns.set('terminal-cursor', {
      name: 'terminal-cursor',
      PatternClass: null as any,
      isLoaded: false,
      loadTime: 0
    });
    
    this.patterns.set('code-flow', {
      name: 'code-flow',
      PatternClass: null as any,
      isLoaded: false,
      loadTime: 0
    });
    
    this.patterns.set('mandelbrot-ascii', {
      name: 'mandelbrot-ascii',
      PatternClass: null as any,
      isLoaded: false,
      loadTime: 0
    });
    
    this.patterns.set('conway-life', {
      name: 'conway-life',
      PatternClass: null as any,
      isLoaded: false,
      loadTime: 0
    });
    
    this.patterns.set('network-nodes', {
      name: 'network-nodes',
      PatternClass: null as any,
      isLoaded: false,
      loadTime: 0
    });
  }
  
  /**
   * Load a pattern asynchronously
   */
  public async loadPattern(patternName: string): Promise<new (ctx: CanvasRenderingContext2D, config: PatternConfig) => Pattern> {
    const pattern = this.patterns.get(patternName);
    if (!pattern) {
      throw new Error(`Pattern not found: ${patternName}`);
    }
    
    // Return immediately if already loaded
    if (pattern.isLoaded) {
      return pattern.PatternClass;
    }
    
    // Check if already loading
    if (this.loadingPromises.has(patternName)) {
      const module = await this.loadingPromises.get(patternName)!;
      return module.default;
    }
    
    // Start loading
    const startTime = performance.now();
    const loadingPromise = this.importPattern(patternName);
    this.loadingPromises.set(patternName, loadingPromise);
    
    try {
      const module = await loadingPromise;
      pattern.PatternClass = module.default;
      pattern.isLoaded = true;
      pattern.loadTime = performance.now() - startTime;
      
      console.log(`Pattern loaded: ${patternName} (${pattern.loadTime.toFixed(2)}ms)`);
      
      return pattern.PatternClass;
    } catch (error) {
      console.error(`Failed to load pattern: ${patternName}`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(patternName);
    }
  }
  
  /**
   * Import pattern module dynamically
   */
  private async importPattern(patternName: string): Promise<PatternModule> {
    switch (patternName) {
      case 'matrix-rain':
        return import('./MatrixRain').then(module => ({ default: module.MatrixRain }));
      case 'binary-waves':
        return import('./BinaryWaves').then(module => ({ default: module.BinaryWaves }));
      case 'geometric-flow':
        return import('./GeometricFlow').then(module => ({ default: module.GeometricFlow }));
      case 'terminal-cursor':
        return import('./TerminalCursor').then(module => ({ default: module.TerminalCursor }));
      case 'code-flow':
        return import('./CodeFlow').then(module => ({ default: module.CodeFlow }));
      case 'mandelbrot-ascii':
        return import('./MandelbrotASCII').then(module => ({ default: module.MandelbrotASCII }));
      case 'conway-life':
        return import('./ConwayLife').then(module => ({ default: module.ConwayLife }));
      case 'network-nodes':
        return import('./NetworkNodes').then(module => ({ default: module.NetworkNodes }));
      default:
        throw new Error(`Unknown pattern: ${patternName}`);
    }
  }
  
  /**
   * Preload patterns in background
   */
  public async preloadPatterns(patternNames: string[]): Promise<void> {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    this.preloadQueue = [...patternNames];
    
    console.log(`Starting preload of ${patternNames.length} patterns`);
    
    // Load patterns one by one to avoid overwhelming the system
    for (const patternName of this.preloadQueue) {
      try {
        await this.loadPattern(patternName);
        
        // Small delay between loads to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.warn(`Preload failed for pattern: ${patternName}`, error);
      }
    }
    
    this.isPreloading = false;
    console.log('Pattern preloading completed');
  }
  
  /**
   * Preload essential patterns immediately
   */
  public async preloadEssentialPatterns(): Promise<void> {
    const essentialPatterns = ['matrix-rain', 'binary-waves', 'terminal-cursor'];
    await this.preloadPatterns(essentialPatterns);
  }
  
  /**
   * Check if pattern is loaded
   */
  public isPatternLoaded(patternName: string): boolean {
    const pattern = this.patterns.get(patternName);
    return pattern ? pattern.isLoaded : false;
  }
  
  /**
   * Get loading status of all patterns
   */
  public getLoadingStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {};
    this.patterns.forEach((pattern, name) => {
      status[name] = pattern.isLoaded;
    });
    return status;
  }
  
  /**
   * Get load times for performance analysis
   */
  public getLoadTimes(): { [key: string]: number } {
    const times: { [key: string]: number } = {};
    this.patterns.forEach((pattern, name) => {
      if (pattern.isLoaded) {
        times[name] = pattern.loadTime;
      }
    });
    return times;
  }
  
  /**
   * Unload a pattern to free memory
   */
  public unloadPattern(patternName: string): void {
    const pattern = this.patterns.get(patternName);
    if (pattern && pattern.isLoaded) {
      pattern.PatternClass = null as any;
      pattern.isLoaded = false;
      pattern.loadTime = 0;
      console.log(`Pattern unloaded: ${patternName}`);
    }
  }
  
  /**
   * Unload all patterns
   */
  public unloadAllPatterns(): void {
    this.patterns.forEach((pattern, name) => {
      if (pattern.isLoaded) {
        this.unloadPattern(name);
      }
    });
  }
  
  /**
   * Get memory usage estimate
   */
  public getMemoryUsageEstimate(): number {
    let estimate = 0;
    this.patterns.forEach((pattern) => {
      if (pattern.isLoaded) {
        // Rough estimate: each pattern class ~50KB
        estimate += 50;
      }
    });
    return estimate; // KB
  }
  
  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.unloadAllPatterns();
    this.loadingPromises.clear();
    this.preloadQueue = [];
    this.isPreloading = false;
  }
}