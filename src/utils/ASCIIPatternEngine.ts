import { Pattern, PatternConfig, TransitionState, TransitionConfig } from '../types';
import { MatrixRain } from './MatrixRain';
import { BinaryWaves } from './BinaryWaves';
import { GeometricFlow } from './GeometricFlow';
import { TerminalCursor } from './TerminalCursor';
import { CodeFlow } from './CodeFlow';
import { MandelbrotASCII } from './MandelbrotASCII';
import { ConwayLife } from './ConwayLife';
import { NetworkNodes } from './NetworkNodes';
import { TransitionManager } from './TransitionManager';
import { LayerManager } from './LayerManager';
import { PatternSynchronizer } from './PatternSynchronizer';

export interface EngineConfig {
  fontSize: number;
  fontFamily: string;
  backgroundColor: string;
  foregroundColor: string;
  enableDebug: boolean;
}

export class ASCIIPatternEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentPattern: Pattern | null = null;
  private transitionState: TransitionState = { type: 'idle', effect: 'fade', progress: 0, duration: 1000 };
  private patterns: Map<string, new (ctx: CanvasRenderingContext2D, config: PatternConfig) => Pattern> = new Map();
  private animationId: number | null = null;
  private lastFrameTime: number = 0;
  private config: EngineConfig;
  
  // New managers for advanced features
  private transitionManager: TransitionManager;
  private layerManager: LayerManager;
  private synchronizer: PatternSynchronizer;
  private useMultiLayer: boolean = false;
  
  // Grid properties for responsive ASCII rendering
  private gridWidth: number = 0;
  private gridHeight: number = 0;
  private charWidth: number = 0;
  private charHeight: number = 0;
  
  constructor(canvas: HTMLCanvasElement, config: Partial<EngineConfig> = {}) {
    this.canvas = canvas;
    
    // Initialize Canvas 2D context
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = ctx;
    
    // Set default configuration
    this.config = {
      fontSize: 12,
      fontFamily: 'Courier New, Monaco, Consolas, monospace',
      backgroundColor: '#000000',
      foregroundColor: '#00ff00',
      enableDebug: false,
      ...config
    };
    
    // Initialize managers
    this.transitionManager = new TransitionManager(canvas, ctx);
    this.layerManager = new LayerManager(canvas, ctx);
    this.synchronizer = new PatternSynchronizer(120); // 120 BPM default
    
    this.initializeCanvas();
    this.setupResizeHandling();
    
    // Register built-in patterns
    this.registerBuiltInPatterns();
  }
  
  /**
   * Initialize canvas with proper settings and calculate grid dimensions
   */
  private initializeCanvas(): void {
    // Set canvas font properties
    this.ctx.font = `${this.config.fontSize}px ${this.config.fontFamily}`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    
    // Calculate character dimensions for grid
    this.calculateGridDimensions();
    
    // Set initial canvas size
    this.resize();
    
    if (this.config.enableDebug) {
      console.log('ASCIIPatternEngine initialized:', {
        gridWidth: this.gridWidth,
        gridHeight: this.gridHeight,
        charWidth: this.charWidth,
        charHeight: this.charHeight
      });
    }
  }
  
  /**
   * Calculate character dimensions and grid size based on canvas size
   */
  private calculateGridDimensions(): void {
    // Measure character dimensions using a sample character
    const metrics = this.ctx.measureText('M');
    this.charWidth = metrics.width;
    
    // Calculate character height (approximate based on font size)
    this.charHeight = this.config.fontSize * 1.2; // Standard line height multiplier
    
    // Calculate grid dimensions based on canvas size
    this.gridWidth = Math.floor(this.canvas.width / this.charWidth);
    this.gridHeight = Math.floor(this.canvas.height / this.charHeight);
  }
  
  /**
   * Set up responsive resize handling with debouncing
   */
  private setupResizeHandling(): void {
    let resizeTimeout: number;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        this.resize();
      }, 100); // Debounce resize events
    };
    
    // Use ResizeObserver for better performance if available
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(this.canvas.parentElement || this.canvas);
    } else {
      // Fallback to window resize event
      window.addEventListener('resize', handleResize, { passive: true });
    }
  }
  
  /**
   * Handle canvas resize and recalculate grid
   */
  public resize(width?: number, height?: number): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    
    // Set canvas size to parent dimensions or provided dimensions
    const newWidth = width || parent.clientWidth;
    const newHeight = height || parent.clientHeight;
    
    // Set actual canvas size
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    
    // Set display size (CSS)
    this.canvas.style.width = `${newWidth}px`;
    this.canvas.style.height = `${newHeight}px`;
    
    // Recalculate grid dimensions
    this.calculateGridDimensions();
    
    // Reinitialize canvas context properties (they reset on resize)
    this.ctx.font = `${this.config.fontSize}px ${this.config.fontFamily}`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    
    // Resize layer manager canvases
    this.layerManager.resize(newWidth, newHeight);
    
    // Notify current pattern of resize
    if (this.currentPattern && 'onResize' in this.currentPattern) {
      (this.currentPattern as any).onResize(this.gridWidth, this.gridHeight);
    }
    
    if (this.config.enableDebug) {
      console.log('Canvas resized:', {
        width: newWidth,
        height: newHeight,
        gridWidth: this.gridWidth,
        gridHeight: this.gridHeight
      });
    }
  }
  
  /**
   * Register a pattern class with the engine
   */
  public registerPattern(name: string, patternClass: new (ctx: CanvasRenderingContext2D, config: PatternConfig) => Pattern): void {
    this.patterns.set(name, patternClass);
    
    if (this.config.enableDebug) {
      console.log(`Pattern registered: ${name}`);
    }
  }
  
  /**
   * Switch to a different pattern with advanced transition
   */
  public switchPattern(
    patternName: string, 
    transitionConfig: Partial<TransitionConfig> = {}, 
    patternConfig: PatternConfig = {} as PatternConfig
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const PatternClass = this.patterns.get(patternName);
      if (!PatternClass) {
        reject(new Error(`Pattern not found: ${patternName}`));
        return;
      }
      
      try {
        const fullTransitionConfig: TransitionConfig = {
          type: 'fade',
          duration: 1000,
          easing: 'ease-in-out',
          ...transitionConfig
        };

        // Create new pattern instance
        const newPattern = new PatternClass(this.ctx, patternConfig);
        newPattern.initialize();

        if (this.useMultiLayer) {
          // Multi-layer transition
          this.switchPatternMultiLayer(patternName, newPattern, fullTransitionConfig);
        } else {
          // Single-layer transition with TransitionManager
          this.transitionManager.startTransition(
            this.currentPattern,
            newPattern,
            fullTransitionConfig
          );
        }

        // Register pattern with synchronizer
        this.synchronizer.registerPattern(patternName, newPattern);

        // Update current pattern reference
        const oldPattern = this.currentPattern;
        this.currentPattern = newPattern;

        // Clean up old pattern after transition
        setTimeout(() => {
          if (oldPattern) {
            oldPattern.cleanup();
          }
        }, fullTransitionConfig.duration);

        if (this.config.enableDebug) {
          console.log(`Switched to pattern: ${patternName} with transition: ${fullTransitionConfig.type}`);
        }
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Start the animation loop
   */
  public startAnimation(): void {
    if (this.animationId !== null) {
      return; // Already running
    }
    
    this.lastFrameTime = performance.now();
    this.synchronizer.start();
    
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;
      
      // Update synchronizer
      this.synchronizer.update(deltaTime);
      
      if (this.useMultiLayer) {
        // Multi-layer rendering
        this.layerManager.updateLayers(deltaTime);
        this.layerManager.renderLayers();
      } else {
        // Single-layer rendering with transitions
        if (this.transitionManager.isTransitioning()) {
          // Handle transition rendering
          const transitionComplete = this.transitionManager.updateTransition(deltaTime, this.currentPattern!);
          if (transitionComplete) {
            this.transitionState.type = 'idle';
          }
        } else {
          // Normal rendering
          this.clearCanvas();
          
          if (this.currentPattern) {
            this.currentPattern.update(deltaTime);
            this.currentPattern.render();
          }
        }
      }
      
      // Continue animation loop
      this.animationId = requestAnimationFrame(animate);
    };
    
    this.animationId = requestAnimationFrame(animate);
    
    if (this.config.enableDebug) {
      console.log('Animation started');
    }
  }
  
  /**
   * Stop the animation loop
   */
  public stopAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      this.synchronizer.stop();
      
      if (this.config.enableDebug) {
        console.log('Animation stopped');
      }
    }
  }
  
  /**
   * Clear the canvas with background color
   */
  private clearCanvas(): void {
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * Switch pattern using multi-layer system
   */
  private switchPatternMultiLayer(
    patternName: string, 
    newPattern: Pattern, 
    transitionConfig: TransitionConfig
  ): void {
    // Assign new pattern to appropriate layer
    const targetLayer = this.determineTargetLayer(patternName);
    this.layerManager.assignPatternToLayer(targetLayer, newPattern);
    
    // Animate layer transition
    this.animateLayerTransition(targetLayer, transitionConfig);
  }

  /**
   * Determine which layer a pattern should be assigned to
   */
  private determineTargetLayer(patternName: string): string {
    // Background patterns
    if (['mandelbrot-ascii', 'binary-waves'].includes(patternName)) {
      return 'background';
    }
    
    // Foreground patterns
    if (['terminal-cursor', 'code-flow'].includes(patternName)) {
      return 'foreground';
    }
    
    // Default to middle layer
    return 'middle';
  }

  /**
   * Animate layer transition
   */
  private animateLayerTransition(layerName: string, config: TransitionConfig): void {
    const layer = this.layerManager.getLayer(layerName);
    if (!layer) return;

    // Start with transparent layer
    this.layerManager.updateLayer(layerName, { opacity: 0 });
    
    // Animate to full opacity
    this.layerManager.animateLayer(layerName, 'opacity', 1, config.duration);
  }
  
  /**
   * Get current grid dimensions
   */
  public getGridDimensions(): { width: number; height: number; charWidth: number; charHeight: number } {
    return {
      width: this.gridWidth,
      height: this.gridHeight,
      charWidth: this.charWidth,
      charHeight: this.charHeight
    };
  }
  
  /**
   * Get canvas context for direct access
   */
  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
  
  /**
   * Get current pattern
   */
  public getCurrentPattern(): Pattern | null {
    return this.currentPattern;
  }
  
  /**
   * Check if animation is running
   */
  public isAnimating(): boolean {
    return this.animationId !== null;
  }
  
  /**
   * Update engine configuration
   */
  public updateConfig(newConfig: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize canvas if font properties changed
    if (newConfig.fontSize || newConfig.fontFamily) {
      this.initializeCanvas();
    }
  }
  
  /**
   * Register built-in patterns
   */
  private registerBuiltInPatterns(): void {
    this.registerPattern('matrix-rain', MatrixRain);
    this.registerPattern('binary-waves', BinaryWaves);
    this.registerPattern('geometric-flow', GeometricFlow);
    this.registerPattern('terminal-cursor', TerminalCursor);
    this.registerPattern('code-flow', CodeFlow);
    this.registerPattern('mandelbrot-ascii', MandelbrotASCII);
    this.registerPattern('conway-life', ConwayLife);
    this.registerPattern('network-nodes', NetworkNodes);
  }

  /**
   * Enable or disable multi-layer rendering
   */
  public setMultiLayerMode(enabled: boolean): void {
    this.useMultiLayer = enabled;
    
    if (enabled && this.currentPattern) {
      // Move current pattern to appropriate layer
      const layerName = this.determineTargetLayer(this.currentPattern.name);
      this.layerManager.assignPatternToLayer(layerName, this.currentPattern);
    }
  }

  /**
   * Get layer manager for direct access
   */
  public getLayerManager(): LayerManager {
    return this.layerManager;
  }

  /**
   * Get synchronizer for direct access
   */
  public getSynchronizer(): PatternSynchronizer {
    return this.synchronizer;
  }

  /**
   * Get transition manager for direct access
   */
  public getTransitionManager(): TransitionManager {
    return this.transitionManager;
  }

  /**
   * Set synchronization tempo
   */
  public setSyncTempo(tempo: number): void {
    this.synchronizer.setTempo(tempo);
  }

  /**
   * Add multiple patterns to different layers
   */
  public addPatternToLayer(
    layerName: string, 
    patternName: string, 
    patternConfig: PatternConfig = {} as PatternConfig
  ): void {
    const PatternClass = this.patterns.get(patternName);
    if (!PatternClass) {
      throw new Error(`Pattern not found: ${patternName}`);
    }

    // Get or create layer
    let layer = this.layerManager.getLayer(layerName);
    if (!layer) {
      layer = this.layerManager.createLayer(layerName, 0);
    }

    // Create pattern instance with layer context
    const pattern = new PatternClass(layer.ctx!, patternConfig);
    pattern.initialize();

    // Assign to layer
    this.layerManager.assignPatternToLayer(layerName, pattern);
    
    // Register with synchronizer
    this.synchronizer.registerPattern(`${layerName}-${patternName}`, pattern);
  }

  /**
   * Apply effect to specific layer
   */
  public applyLayerEffect(layerName: string, effect: string, intensity: number = 1): void {
    this.layerManager.applyLayerEffect(layerName, effect, intensity);
  }

  /**
   * Get current transition state
   */
  public getTransitionState(): TransitionState {
    return this.transitionManager.getTransitionState();
  }

  /**
   * Force complete current transition
   */
  public forceCompleteTransition(): void {
    this.transitionManager.forceComplete();
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stopAnimation();
    
    if (this.currentPattern) {
      this.currentPattern.cleanup();
      this.currentPattern = null;
    }
    
    // Clean up managers
    this.layerManager.cleanup();
    this.synchronizer.cleanup();
    
    this.patterns.clear();
    
    if (this.config.enableDebug) {
      console.log('ASCIIPatternEngine cleaned up');
    }
  }
}