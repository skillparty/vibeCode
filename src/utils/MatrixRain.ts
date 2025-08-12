import { BasePattern } from './BasePattern';
import { PatternConfig } from '../types';

interface MatrixColumn {
  x: number;
  y: number;
  speed: number;
  length: number;
  characters: string[];
  opacity: number[];
  lastUpdate: number;
}

/**
 * Matrix Rain ASCII pattern implementation
 * Creates falling character animation with variable speeds and column-based dropping
 */
export class MatrixRain extends BasePattern {
  private columns: MatrixColumn[] = [];
  private matrixCharacters: string = '01{}[]()<>/*+-=;:.,!@#$%^&*';
  private baseSpeed: number = 50; // Base falling speed in pixels per second
  private columnSpacing: number = 1; // Spacing between columns
  private minLength: number = 5;
  private maxLength: number = 25;
  private spawnProbability: number = 0.02; // Probability of spawning new column per frame
  private glitchTimer: number = 0;
  private glitchInterval: number = 2000; // Glitch effect every 2 seconds
  
  constructor(ctx: CanvasRenderingContext2D, config: PatternConfig) {
    super(ctx, config, 'matrix-rain');
    
    // Override default characters with Matrix-style programming symbols
    this.matrixCharacters = config.characters || '01{}[]()<>/*+-=;:.,!@#$%^&*';
    
    // Apply initial configuration
    this.applySpeedConfig(config.speed || 'medium');
    this.applyDensityConfig(config.density || 'medium');
  }
  
  public initialize(): void {
    this.isInitialized = true;
    this.columns = [];
    this.glitchTimer = 0;
    
    // Set canvas properties for Matrix effect
    this.ctx.font = `${this.config.fontSize || 12}px ${this.config.fontFamily || 'Courier New, Monaco, Consolas, monospace'}`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    
    // Initialize some columns to start with
    this.initializeColumns();
  }
  
  /**
   * Initialize columns across the screen width
   */
  private initializeColumns(): void {
    const numColumns = Math.floor(this.gridWidth / this.columnSpacing);
    
    for (let i = 0; i < numColumns; i++) {
      if (Math.random() < 0.3) { // Start with 30% of columns active
        this.spawnColumn(i * this.columnSpacing);
      }
    }
  }
  
  /**
   * Spawn a new column at the specified x position
   */
  private spawnColumn(x: number): void {
    const length = this.randomInt(this.minLength, this.maxLength);
    const speed = this.baseSpeed * this.getSpeedMultiplier() * this.randomRange(0.5, 2.0);
    
    const column: MatrixColumn = {
      x: x,
      y: -length, // Start above the screen
      speed: speed,
      length: length,
      characters: [],
      opacity: [],
      lastUpdate: 0
    };
    
    // Generate random characters for this column
    for (let i = 0; i < length; i++) {
      column.characters.push(this.getRandomMatrixChar());
      // Create fade effect - head is brightest, tail fades out
      const opacityFactor = (length - i) / length;
      column.opacity.push(opacityFactor);
    }
    
    this.columns.push(column);
  }
  
  /**
   * Get a random character from the Matrix character set
   */
  private getRandomMatrixChar(): string {
    return this.matrixCharacters[Math.floor(Math.random() * this.matrixCharacters.length)];
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    const speedMultiplier = this.getSpeedMultiplier();
    const densityMultiplier = this.getDensityMultiplier();
    
    // Update glitch timer
    this.glitchTimer += deltaTime;
    
    // Update existing columns
    for (let i = this.columns.length - 1; i >= 0; i--) {
      const column = this.columns[i];
      
      // Move column down
      column.y += (column.speed * deltaTime) / 1000;
      
      // Update character changes periodically for glitch effect
      if (this.glitchTimer > this.glitchInterval) {
        this.updateColumnCharacters(column);
      }
      
      // Remove columns that have moved completely off screen
      if (column.y > this.gridHeight + column.length) {
        this.columns.splice(i, 1);
      }
    }
    
    // Reset glitch timer
    if (this.glitchTimer > this.glitchInterval) {
      this.glitchTimer = 0;
    }
    
    // Spawn new columns randomly
    const spawnRate = this.spawnProbability * densityMultiplier;
    if (Math.random() < spawnRate) {
      const x = this.randomInt(0, this.gridWidth - 1);
      // Only spawn if no column exists at this position
      const existingColumn = this.columns.find(col => 
        Math.abs(col.x - x) < this.columnSpacing && col.y < this.gridHeight / 2
      );
      
      if (!existingColumn) {
        this.spawnColumn(x);
      }
    }
  }
  
  /**
   * Update characters in a column for glitch effect
   */
  private updateColumnCharacters(column: MatrixColumn): void {
    const glitchProbability = this.config.glitchProbability || 0.02;
    
    for (let i = 0; i < column.characters.length; i++) {
      if (Math.random() < glitchProbability) {
        column.characters[i] = this.getRandomMatrixChar();
      }
    }
  }
  
  public render(): void {
    // Always clear canvas with black background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    if (!this.isInitialized) return;
    
    // Render each column
    for (const column of this.columns) {
      this.renderColumn(column);
    }
  }
  
  /**
   * Render a single column with fade effect
   */
  private renderColumn(column: MatrixColumn): void {
    for (let i = 0; i < column.length; i++) {
      const charY = Math.floor(column.y + i);
      
      // Skip characters that are off screen
      if (charY < 0 || charY >= this.gridHeight) {
        continue;
      }
      
      const char = column.characters[i];
      const opacity = column.opacity[i];
      
      // Create color with fade effect
      let color: string;
      if (i === 0) {
        // Head of the column - bright white/green
        color = `rgba(255, 255, 255, ${opacity})`;
      } else if (i < 3) {
        // Near head - bright green
        color = `rgba(0, 255, 0, ${opacity})`;
      } else {
        // Tail - darker green with fade
        // Use theme-based colors instead of hardcoded green
        const themeColor = this.getThemeColor();
        color = `rgba(${themeColor.r}, ${themeColor.g}, ${themeColor.b}, ${opacity})`;
      }
      
      this.ctx.fillStyle = color;
      this.drawChar(char, column.x, charY);
    }
  }
  
  public cleanup(): void {
    this.isInitialized = false;
    this.columns = [];
    this.glitchTimer = 0;
    this.animationState = {};
  }
  
  public onResize(gridWidth: number, gridHeight: number): void {
    super.onResize(gridWidth, gridHeight);
    
    // Remove columns that are now outside the screen
    this.columns = this.columns.filter(column => column.x < gridWidth);
    
    // Adjust spawn probability based on screen size
    const screenArea = gridWidth * gridHeight;
    this.spawnProbability = Math.max(0.005, Math.min(0.05, screenArea / 10000));
  }
  
  /**
   * Set Matrix-specific configuration
   */
  public setConfig(config: Partial<PatternConfig>): void {
    super.setConfig(config);
    
    if (config.characters) {
      this.matrixCharacters = config.characters;
    }
    
    if (config.speed) {
      this.applySpeedConfig(config.speed);
    }
    
    if (config.density) {
      this.applyDensityConfig(config.density);
    }
  }
  
  /**
   * Get theme-based color values
   */
  private getThemeColor(): { r: number; g: number; b: number } {
    const theme = this.config.currentTheme || 'matrix';
    
    switch (theme) {
      case 'matrix':
      case 'terminal':
        return { r: 0, g: 255, b: 0 }; // Green
      case 'retro':
        return { r: 255, g: 0, b: 255 }; // Magenta
      case 'blue':
        return { r: 0, g: 153, b: 255 }; // Blue
      default:
        return { r: 0, g: 255, b: 0 }; // Default green
    }
  }

  /**
   * Apply speed configuration
   */
  private applySpeedConfig(speed: 'slow' | 'medium' | 'fast'): void {
    switch (speed) {
      case 'slow':
        this.baseSpeed = 30;
        break;
      case 'medium':
        this.baseSpeed = 50;
        break;
      case 'fast':
        this.baseSpeed = 80;
        break;
    }
  }
  
  /**
   * Apply density configuration
   */
  private applyDensityConfig(density: 'low' | 'medium' | 'high'): void {
    switch (density) {
      case 'low':
        this.spawnProbability = 0.01;
        break;
      case 'medium':
        this.spawnProbability = 0.02;
        break;
      case 'high':
        this.spawnProbability = 0.04;
        break;
    }
  }
  
  /**
   * Get current animation state for debugging
   */
  public getAnimationState(): any {
    return {
      columnCount: this.columns.length,
      glitchTimer: this.glitchTimer,
      baseSpeed: this.baseSpeed,
      spawnProbability: this.spawnProbability
    };
  }
}