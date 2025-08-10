import { BasePattern } from './BasePattern';
import { PatternConfig } from '../types';

interface MandelbrotPoint {
  x: number;
  y: number;
  iterations: number;
  char: string;
  color: string;
}

/**
 * MandelbrotASCII pattern renders the Mandelbrot fractal using ASCII density characters
 * Features zooming animation and different character sets for density representation
 */
export class MandelbrotASCII extends BasePattern {
  private mandelbrotGrid: MandelbrotPoint[][] = [];
  private centerX: number = -0.5;
  private centerY: number = 0;
  private zoom: number = 1;
  private maxIterations: number = 50;
  private zoomSpeed: number = 0.02;
  private zoomDirection: number = 1; // 1 for zoom in, -1 for zoom out
  private minZoom: number = 0.5;
  private maxZoom: number = 100;
  private animationTime: number = 0;
  private colorCycleSpeed: number = 0.001;
  
  // ASCII characters ordered by density (light to dark)
  private densityChars: string = ' .,:;ox%#@';
  private currentCharSet: string = ' .,:;ox%#@';
  
  // Interesting points in the Mandelbrot set to explore
  private interestingPoints = [
    { x: -0.5, y: 0, zoom: 1 },           // Main bulb
    { x: -0.75, y: 0, zoom: 5 },         // Left side detail
    { x: -0.1, y: 0.8, zoom: 10 },       // Upper spiral
    { x: -0.7269, y: 0.1889, zoom: 50 }, // Seahorse valley
    { x: 0.3, y: 0.5, zoom: 20 },        // Right side fractals
    { x: -0.8, y: 0.156, zoom: 80 },     // Misiurewicz point
    { x: -0.16, y: 1.04, zoom: 30 },     // Spiral detail
  ];
  private currentPointIndex: number = 0;
  private pointTransitionTimer: number = 0;
  private pointTransitionDuration: number = 10000; // 10 seconds per point
  
  constructor(ctx: CanvasRenderingContext2D, config: PatternConfig) {
    super(ctx, config, 'mandelbrot-ascii');
    this.applyComplexityConfig(config.complexity || 'medium');
    this.applySpeedConfig(config.speed || 'medium');
  }
  
  public initialize(): void {
    this.isInitialized = true;
    this.mandelbrotGrid = [];
    this.animationTime = 0;
    this.pointTransitionTimer = 0;
    
    // Set canvas properties
    this.ctx.font = `${this.config.fontSize || 12}px ${this.config.fontFamily || 'Courier New, Monaco, Consolas, monospace'}`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    
    // Initialize grid
    this.initializeGrid();
    
    // Start at first interesting point
    const startPoint = this.interestingPoints[0];
    this.centerX = startPoint.x;
    this.centerY = startPoint.y;
    this.zoom = startPoint.zoom;
    
    // Calculate initial Mandelbrot set
    this.calculateMandelbrot();
  }
  
  private initializeGrid(): void {
    this.mandelbrotGrid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.mandelbrotGrid[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        this.mandelbrotGrid[y][x] = {
          x: 0,
          y: 0,
          iterations: 0,
          char: ' ',
          color: '#000000'
        };
      }
    }
  }
  
  private calculateMandelbrot(): void {
    const aspectRatio = this.gridWidth / this.gridHeight;
    const scale = 4 / this.zoom;
    
    for (let py = 0; py < this.gridHeight; py++) {
      for (let px = 0; px < this.gridWidth; px++) {
        // Convert screen coordinates to complex plane
        const x0 = this.centerX + (px - this.gridWidth / 2) * scale / this.gridWidth * aspectRatio;
        const y0 = this.centerY + (py - this.gridHeight / 2) * scale / this.gridHeight;
        
        const iterations = this.mandelbrotIterations(x0, y0);
        const point = this.mandelbrotGrid[py][px];
        
        point.x = x0;
        point.y = y0;
        point.iterations = iterations;
        point.char = this.getCharForIterations(iterations);
        point.color = this.getColorForIterations(iterations);
      }
    }
  }
  
  private mandelbrotIterations(x0: number, y0: number): number {
    let x = 0;
    let y = 0;
    let iteration = 0;
    
    while (x * x + y * y <= 4 && iteration < this.maxIterations) {
      const xtemp = x * x - y * y + x0;
      y = 2 * x * y + y0;
      x = xtemp;
      iteration++;
    }
    
    return iteration;
  }
  
  private getCharForIterations(iterations: number): string {
    if (iterations >= this.maxIterations) {
      return this.currentCharSet[this.currentCharSet.length - 1]; // Darkest char for set members
    }
    
    // Map iterations to character density
    const density = iterations / this.maxIterations;
    const charIndex = Math.floor(density * (this.currentCharSet.length - 1));
    return this.currentCharSet[Math.min(charIndex, this.currentCharSet.length - 1)];
  }
  
  private getColorForIterations(iterations: number): string {
    const theme = this.config.currentTheme || 'matrix';
    
    if (iterations >= this.maxIterations) {
      // Points in the set - use theme's primary color
      switch (theme) {
        case 'matrix': return '#00ff00';
        case 'terminal': return '#00ff00';
        case 'retro': return '#ff6b35';
        case 'blue': return '#00bfff';
        default: return '#00ff00';
      }
    }
    
    // Points outside the set - create gradient based on iterations
    const ratio = iterations / this.maxIterations;
    const colorCycle = (this.animationTime * this.colorCycleSpeed + ratio) % 1;
    
    switch (theme) {
      case 'matrix':
        const green = Math.floor(255 * (0.3 + 0.7 * Math.sin(colorCycle * Math.PI * 2)));
        return `rgb(0, ${green}, 0)`;
      case 'terminal':
        const termGreen = Math.floor(255 * (0.2 + 0.8 * ratio));
        return `rgb(0, ${termGreen}, 0)`;
      case 'retro':
        const red = Math.floor(255 * (0.4 + 0.6 * Math.sin(colorCycle * Math.PI * 2)));
        const orange = Math.floor(107 * (0.4 + 0.6 * Math.cos(colorCycle * Math.PI * 2)));
        return `rgb(${red}, ${orange}, 53)`;
      case 'blue':
        const blue = Math.floor(255 * (0.3 + 0.7 * Math.sin(colorCycle * Math.PI * 2)));
        const cyan = Math.floor(191 * (0.3 + 0.7 * Math.cos(colorCycle * Math.PI * 2)));
        return `rgb(0, ${cyan}, ${blue})`;
      default:
        return '#00ff00';
    }
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    this.animationTime += deltaTime;
    this.pointTransitionTimer += deltaTime;
    
    // Handle point transitions
    if (this.pointTransitionTimer >= this.pointTransitionDuration) {
      this.transitionToNextPoint();
      this.pointTransitionTimer = 0;
    }
    
    // Animate zoom
    const oldZoom = this.zoom;
    this.zoom *= (1 + this.zoomSpeed * this.zoomDirection * deltaTime / 1000);
    
    // Reverse zoom direction at limits
    if (this.zoom >= this.maxZoom) {
      this.zoomDirection = -1;
      this.zoom = this.maxZoom;
    } else if (this.zoom <= this.minZoom) {
      this.zoomDirection = 1;
      this.zoom = this.minZoom;
    }
    
    // Recalculate if zoom changed significantly
    if (Math.abs(this.zoom - oldZoom) / oldZoom > 0.05) {
      this.calculateMandelbrot();
    }
    
    // Update colors for animation effect
    this.updateColors();
  }
  
  private transitionToNextPoint(): void {
    this.currentPointIndex = (this.currentPointIndex + 1) % this.interestingPoints.length;
    const targetPoint = this.interestingPoints[this.currentPointIndex];
    
    // Smooth transition to new point
    this.centerX = targetPoint.x;
    this.centerY = targetPoint.y;
    this.zoom = targetPoint.zoom;
    this.zoomDirection = 1; // Start zooming in at new point
    
    this.calculateMandelbrot();
  }
  
  private updateColors(): void {
    // Update colors based on animation time for dynamic effect
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const point = this.mandelbrotGrid[y][x];
        point.color = this.getColorForIterations(point.iterations);
      }
    }
  }
  
  public render(): void {
    // Clear canvas with black background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    if (!this.isInitialized) return;
    
    // Render the Mandelbrot set
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const point = this.mandelbrotGrid[y][x];
        
        if (point.char !== ' ') {
          this.ctx.fillStyle = point.color;
          this.drawChar(point.char, x, y);
        }
      }
    }
    
    // Render info overlay
    this.renderInfoOverlay();
  }
  
  private renderInfoOverlay(): void {
    if (this.gridHeight < 3 || this.gridWidth < 20) return;
    
    const currentPoint = this.interestingPoints[this.currentPointIndex];
    const info = `Mandelbrot | Zoom: ${this.zoom.toFixed(1)}x | Point ${this.currentPointIndex + 1}/${this.interestingPoints.length}`;
    
    // Render semi-transparent background for info
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const infoWidth = Math.min(info.length, this.gridWidth);
    for (let i = 0; i < infoWidth; i++) {
      this.drawChar(' ', i, 0);
    }
    
    // Render info text
    this.ctx.fillStyle = this.getInfoColor();
    for (let i = 0; i < Math.min(info.length, this.gridWidth); i++) {
      this.drawChar(info[i], i, 0);
    }
  }
  
  private getInfoColor(): string {
    switch (this.config.currentTheme || 'matrix') {
      case 'matrix': return '#88ff88';
      case 'terminal': return '#88ff88';
      case 'retro': return '#ffaa44';
      case 'blue': return '#88ccff';
      default: return '#88ff88';
    }
  }
  
  private applyComplexityConfig(complexity: string): void {
    switch (complexity) {
      case 'low':
        this.maxIterations = 25;
        this.currentCharSet = ' .:@';
        break;
      case 'medium':
        this.maxIterations = 50;
        this.currentCharSet = ' .,:;ox%#@';
        break;
      case 'high':
        this.maxIterations = 100;
        this.currentCharSet = ' .\'",:;il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
        break;
    }
  }
  
  private applySpeedConfig(speed: string): void {
    switch (speed) {
      case 'slow':
        this.zoomSpeed = 0.01;
        this.colorCycleSpeed = 0.0005;
        this.pointTransitionDuration = 15000;
        break;
      case 'medium':
        this.zoomSpeed = 0.02;
        this.colorCycleSpeed = 0.001;
        this.pointTransitionDuration = 10000;
        break;
      case 'fast':
        this.zoomSpeed = 0.04;
        this.colorCycleSpeed = 0.002;
        this.pointTransitionDuration = 5000;
        break;
    }
  }
  
  public onResize(gridWidth: number, gridHeight: number): void {
    super.onResize(gridWidth, gridHeight);
    if (this.isInitialized) {
      this.initializeGrid();
      this.calculateMandelbrot();
    }
  }
  
  public setConfig(config: Partial<PatternConfig>): void {
    super.setConfig(config);
    
    if (config.complexity) {
      this.applyComplexityConfig(config.complexity);
      if (this.isInitialized) {
        this.calculateMandelbrot();
      }
    }
    
    if (config.speed) {
      this.applySpeedConfig(config.speed);
    }
  }
  
  public cleanup(): void {
    this.isInitialized = false;
    this.mandelbrotGrid = [];
    this.animationTime = 0;
    this.pointTransitionTimer = 0;
    this.currentPointIndex = 0;
    this.animationState = {};
  }
  
  /**
   * Get current animation state for debugging
   */
  public getAnimationState(): any {
    return {
      zoom: this.zoom,
      centerX: this.centerX,
      centerY: this.centerY,
      currentPoint: this.currentPointIndex,
      zoomDirection: this.zoomDirection,
      maxIterations: this.maxIterations,
      pointTransitionProgress: this.pointTransitionTimer / this.pointTransitionDuration
    };
  }
}