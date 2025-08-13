import { BasePattern } from './BasePattern';
import { PatternConfig } from '../types';

/**
 * Simple test pattern to verify rendering is working
 * Draws a simple grid of characters to test basic functionality
 */
export class SimpleTestPattern extends BasePattern {
  private frameCount: number = 0;
  private testChars: string[] = ['0', '1', '#', '*', '+', '-', '|'];

  constructor(ctx: CanvasRenderingContext2D, config: PatternConfig) {
    super(ctx, config, 'simple-test');
  }

  public initialize(): void {
    this.isInitialized = true;
    console.log('SimpleTestPattern initialized:', {
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight,
      charWidth: this.charWidth,
      charHeight: this.charHeight
    });
  }

  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    this.frameCount++;
    
    // Simple animation - change pattern every 60 frames
    if (this.frameCount % 60 === 0) {
      console.log('SimpleTestPattern update - frame:', this.frameCount);
    }
  }

  public render(): void {
    if (!this.isInitialized) {
      console.log('SimpleTestPattern: Not initialized, skipping render');
      return;
    }

    // Clear canvas with black background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // Set text color to bright green
    this.ctx.fillStyle = '#00ff00';
    
    // Draw a simple test pattern
    const spacing = 2; // Space between characters
    
    for (let x = 0; x < this.gridWidth; x += spacing) {
      for (let y = 0; y < this.gridHeight; y += spacing) {
        // Create a simple pattern
        const charIndex = (x + y + Math.floor(this.frameCount / 30)) % this.testChars.length;
        const char = this.testChars[charIndex];
        
        // Draw the character
        this.drawChar(char, x, y);
      }
    }

    // Draw border for debugging
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // Draw debug info
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px monospace';
    this.ctx.fillText(`Grid: ${this.gridWidth}x${this.gridHeight}`, 10, 20);
    this.ctx.fillText(`Frame: ${this.frameCount}`, 10, 40);
    this.ctx.fillText(`Canvas: ${this.ctx.canvas.width}x${this.ctx.canvas.height}`, 10, 60);
  }

  public cleanup(): void {
    this.isInitialized = false;
    this.frameCount = 0;
    console.log('SimpleTestPattern cleaned up');
  }

  public onResize(gridWidth: number, gridHeight: number): void {
    super.onResize(gridWidth, gridHeight);
    console.log('SimpleTestPattern resized:', { gridWidth, gridHeight });
  }
}

export default SimpleTestPattern;