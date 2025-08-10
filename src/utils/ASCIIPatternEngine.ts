import { Pattern, PatternConfig, TransitionState } from '../types';
import { MatrixRain } from './MatrixRain';
import { BinaryWaves } from './BinaryWaves';
import { GeometricFlow } from './GeometricFlow';

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
  private transitionState: TransitionState = { type: 'idle', effect: '', progress: 0 };
  private patterns: Map<string, new (ctx: CanvasRenderingContext2D, config: PatternConfig) => Pattern> = new Map();
  private animationId: number | null = null;
  private lastFrameTime: number = 0;
  private config: EngineConfig;
  
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
   * Switch to a different pattern with optional transition
   */
  public switchPattern(patternName: string, transitionType: string = 'fade', patternConfig: PatternConfig = {} as PatternConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const PatternClass = this.patterns.get(patternName);
      if (!PatternClass) {
        reject(new Error(`Pattern not found: ${patternName}`));
        return;
      }
      
      try {
        // Clean up current pattern
        if (this.currentPattern) {
          this.currentPattern.cleanup();
        }
        
        // Create new pattern instance
        const newPattern = new PatternClass(this.ctx, patternConfig);
        
        // Initialize the new pattern
        newPattern.initialize();
        
        // Set as current pattern
        this.currentPattern = newPattern;
        
        // Update transition state
        this.transitionState = {
          type: 'transitioning',
          effect: transitionType,
          progress: 0,
          toPattern: patternName
        };
        
        if (this.config.enableDebug) {
          console.log(`Switched to pattern: ${patternName}`);
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
    
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;
      
      // Clear canvas
      this.clearCanvas();
      
      // Update and render current pattern
      if (this.currentPattern) {
        this.currentPattern.update(deltaTime);
        this.currentPattern.render();
      }
      
      // Handle transitions
      this.updateTransition(deltaTime);
      
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
   * Update transition state
   */
  private updateTransition(deltaTime: number): void {
    if (this.transitionState.type === 'transitioning') {
      // Simple transition logic - can be expanded for different effects
      this.transitionState.progress += deltaTime / 1000; // Convert to seconds
      
      if (this.transitionState.progress >= 1) {
        this.transitionState = { type: 'idle', effect: '', progress: 0 };
      }
    }
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
    
    this.patterns.clear();
    
    if (this.config.enableDebug) {
      console.log('ASCIIPatternEngine cleaned up');
    }
  }
}