import { Pattern, PatternConfig } from '../types';

/**
 * Abstract base class for all ASCII patterns
 * Provides common functionality and enforces the Pattern interface
 */
export abstract class BasePattern implements Pattern {
  protected ctx: CanvasRenderingContext2D;
  protected config: PatternConfig;
  protected gridWidth: number = 0;
  protected gridHeight: number = 0;
  protected charWidth: number = 0;
  protected charHeight: number = 0;
  protected isInitialized: boolean = false;
  protected animationState: any = {};
  
  public readonly name: string;
  
  constructor(ctx: CanvasRenderingContext2D, config: PatternConfig, name: string) {
    this.ctx = ctx;
    this.config = config;
    this.name = name;
  }
  
  /**
   * Initialize the pattern - must be implemented by subclasses
   */
  public abstract initialize(): void;
  
  /**
   * Update pattern state based on delta time - must be implemented by subclasses
   */
  public abstract update(deltaTime: number): void;
  
  /**
   * Render the pattern to canvas - must be implemented by subclasses
   */
  public abstract render(): void;
  
  /**
   * Clean up pattern resources - must be implemented by subclasses
   */
  public abstract cleanup(): void;
  
  /**
   * Handle canvas resize - can be overridden by subclasses
   */
  public onResize(gridWidth: number, gridHeight: number): void {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    
    // Recalculate character dimensions
    const metrics = this.ctx.measureText('M');
    this.charWidth = metrics.width;
    this.charHeight = parseInt(this.ctx.font) * 1.2;
  }
  
  /**
   * Set pattern configuration - can be overridden by subclasses
   */
  public setConfig(config: Partial<PatternConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get pattern configuration
   */
  public getConfig(): PatternConfig {
    return { ...this.config };
  }
  
  /**
   * Check if pattern is initialized
   */
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Utility method to draw a character at grid position
   */
  protected drawChar(char: string, x: number, y: number, color?: string): void {
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
      return; // Out of bounds
    }
    
    const pixelX = x * this.charWidth;
    const pixelY = y * this.charHeight;
    
    if (color) {
      this.ctx.fillStyle = color;
    }
    
    this.ctx.fillText(char, pixelX, pixelY);
  }
  
  /**
   * Utility method to clear a character at grid position
   */
  protected clearChar(x: number, y: number): void {
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
      return; // Out of bounds
    }
    
    const pixelX = x * this.charWidth;
    const pixelY = y * this.charHeight;
    
    this.ctx.clearRect(pixelX, pixelY, this.charWidth, this.charHeight);
  }
  
  /**
   * Utility method to fill entire canvas background
   * This ensures 100% coverage without black spaces
   */
  protected fillBackground(color: string = '#000000'): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }
  
  /**
   * Utility method to get random character from pattern's character set
   */
  protected getRandomChar(): string {
    const chars = this.config.characters || '01';
    return chars[Math.floor(Math.random() * chars.length)];
  }
  
  /**
   * Utility method to convert speed setting to numeric value
   */
  protected getSpeedMultiplier(): number {
    switch (this.config.speed) {
      case 'slow': return 0.5;
      case 'medium': return 1.0;
      case 'fast': return 2.0;
      default: return 1.0;
    }
  }
  
  /**
   * Utility method to convert density setting to numeric value
   */
  protected getDensityMultiplier(): number {
    switch (this.config.density) {
      case 'low': return 0.3;
      case 'medium': return 0.6;
      case 'high': return 1.0;
      default: return 0.6;
    }
  }
  
  /**
   * Utility method to interpolate between two values
   */
  protected lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  }
  
  /**
   * Utility method to clamp a value between min and max
   */
  protected clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
  
  /**
   * Utility method to generate random number in range
   */
  protected randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
  
  /**
   * Utility method to generate random integer in range
   */
  protected randomInt(min: number, max: number): number {
    return Math.floor(this.randomRange(min, max + 1));
  }
}

/**
 * Simple test pattern implementation for testing purposes
 */
export class TestPattern extends BasePattern {
  private testChar: string = 'T';
  private position: { x: number; y: number } = { x: 0, y: 0 };
  
  constructor(ctx: CanvasRenderingContext2D, config: PatternConfig) {
    super(ctx, config, 'test');
  }
  
  public initialize(): void {
    this.isInitialized = true;
    this.position = { x: 0, y: 0 };
    this.testChar = this.getRandomChar();
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    // Simple animation: move character across screen
    this.position.x += deltaTime * 0.01 * this.getSpeedMultiplier();
    
    if (this.position.x >= this.gridWidth) {
      this.position.x = 0;
      this.position.y = (this.position.y + 1) % this.gridHeight;
      this.testChar = this.getRandomChar();
    }
  }
  
  public render(): void {
    if (!this.isInitialized) return;
    
    // Clear previous position
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    // Draw current character
    this.ctx.fillStyle = '#00ff00';
    this.drawChar(this.testChar, Math.floor(this.position.x), this.position.y);
  }
  
  public cleanup(): void {
    this.isInitialized = false;
    this.animationState = {};
  }
}