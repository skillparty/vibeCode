import { BasePattern } from './BasePattern';
import { PatternConfig } from '../types';

/**
 * BinaryWaves pattern creates sine wave animations using 0s and 1s
 * Features configurable wave amplitude, frequency, and direction
 */
export class BinaryWaves extends BasePattern {
  private waves: Array<{
    amplitude: number;
    frequency: number;
    phase: number;
    speed: number;
    direction: 'horizontal' | 'vertical';
  }> = [];
  private time: number = 0;
  private grid: string[][] = [];
  
  constructor(ctx: CanvasRenderingContext2D, config: PatternConfig) {
    super(ctx, config, 'binaryWaves');
  }
  
  public initialize(): void {
    this.isInitialized = true;
    this.time = 0;
    this.initializeGrid();
    this.initializeWaves();
  }
  
  private initializeGrid(): void {
    this.grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x] = ' ';
      }
    }
  }
  
  private initializeWaves(): void {
    this.waves = [];
    const numWaves = Math.floor(3 + this.getDensityMultiplier() * 5); // 3-8 waves
    const speedMultiplier = this.getSpeedMultiplier();
    
    for (let i = 0; i < numWaves; i++) {
      this.waves.push({
        amplitude: this.randomRange(2, 8) * this.getDensityMultiplier(),
        frequency: this.randomRange(0.02, 0.08),
        phase: this.randomRange(0, Math.PI * 2),
        speed: this.randomRange(0.5, 2.0) * speedMultiplier,
        direction: Math.random() > 0.5 ? 'horizontal' : 'vertical'
      });
    }
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    this.time += deltaTime * 0.001; // Convert to seconds
    this.updateGrid();
  }
  
  private updateGrid(): void {
    // Clear grid
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x] = ' ';
      }
    }
    
    // Generate waves
    this.waves.forEach((wave, waveIndex) => {
      if (wave.direction === 'horizontal') {
        this.generateHorizontalWave(wave, waveIndex);
      } else {
        this.generateVerticalWave(wave, waveIndex);
      }
    });
  }
  
  private generateHorizontalWave(wave: any, waveIndex: number): void {
    for (let x = 0; x < this.gridWidth; x++) {
      const waveValue = Math.sin(
        x * wave.frequency + 
        this.time * wave.speed + 
        wave.phase
      );
      
      const centerY = this.gridHeight / 2;
      const y = Math.round(centerY + waveValue * wave.amplitude);
      
      if (y >= 0 && y < this.gridHeight) {
        // Use wave index to determine character (0 or 1)
        const char = waveIndex % 2 === 0 ? '0' : '1';
        this.grid[y][x] = char;
        
        // Add some thickness to the wave
        if (wave.amplitude > 4) {
          const thickness = Math.floor(wave.amplitude / 4);
          for (let dy = -thickness; dy <= thickness; dy++) {
            const thickY = y + dy;
            if (thickY >= 0 && thickY < this.gridHeight && this.grid[thickY][x] === ' ') {
              // Fade effect based on distance from center
              const intensity = 1 - Math.abs(dy) / thickness;
              if (Math.random() < intensity * 0.7) {
                this.grid[thickY][x] = char;
              }
            }
          }
        }
      }
    }
  }
  
  private generateVerticalWave(wave: any, waveIndex: number): void {
    for (let y = 0; y < this.gridHeight; y++) {
      const waveValue = Math.sin(
        y * wave.frequency + 
        this.time * wave.speed + 
        wave.phase
      );
      
      const centerX = this.gridWidth / 2;
      const x = Math.round(centerX + waveValue * wave.amplitude);
      
      if (x >= 0 && x < this.gridWidth) {
        // Use wave index to determine character (0 or 1)
        const char = waveIndex % 2 === 0 ? '0' : '1';
        this.grid[y][x] = char;
        
        // Add some thickness to the wave
        if (wave.amplitude > 4) {
          const thickness = Math.floor(wave.amplitude / 4);
          for (let dx = -thickness; dx <= thickness; dx++) {
            const thickX = x + dx;
            if (thickX >= 0 && thickX < this.gridWidth && this.grid[y][thickX] === ' ') {
              // Fade effect based on distance from center
              const intensity = 1 - Math.abs(dx) / thickness;
              if (Math.random() < intensity * 0.7) {
                this.grid[y][thickX] = char;
              }
            }
          }
        }
      }
    }
  }
  
  public render(): void {
    if (!this.isInitialized) return;
    
    // Set font and color based on theme
    this.ctx.fillStyle = this.getWaveColor();
    
    // Render the grid
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const char = this.grid[y][x];
        if (char !== ' ') {
          // Add slight color variation based on character and position
          const colorVariation = this.getColorVariation(char, x, y);
          this.ctx.fillStyle = colorVariation;
          this.drawChar(char, x, y);
        }
      }
    }
  }
  
  private getWaveColor(): string {
    // Base color based on theme
    switch (this.config.currentTheme || 'matrix') {
      case 'matrix': return '#00ff00';
      case 'terminal': return '#00ff00';
      case 'retro': return '#ff6b35';
      case 'blue': return '#00bfff';
      default: return '#00ff00';
    }
  }
  
  private getColorVariation(char: string, x: number, y: number): string {
    const baseColor = this.getWaveColor();
    
    // Create subtle variations based on character and position
    const variation = Math.sin(x * 0.1 + y * 0.1 + this.time) * 0.3;
    const intensity = 0.7 + variation * 0.3;
    
    // Parse base color and apply intensity
    if (baseColor === '#00ff00') {
      const green = Math.floor(255 * intensity);
      return `rgb(0, ${green}, 0)`;
    } else if (baseColor === '#ff6b35') {
      const red = Math.floor(255 * intensity);
      const green = Math.floor(107 * intensity);
      const blue = Math.floor(53 * intensity);
      return `rgb(${red}, ${green}, ${blue})`;
    } else if (baseColor === '#00bfff') {
      const blue = Math.floor(255 * intensity);
      const green = Math.floor(191 * intensity);
      return `rgb(0, ${green}, ${blue})`;
    }
    
    return baseColor;
  }
  
  public onResize(gridWidth: number, gridHeight: number): void {
    super.onResize(gridWidth, gridHeight);
    if (this.isInitialized) {
      this.initializeGrid();
      // Adjust wave parameters for new dimensions
      this.waves.forEach(wave => {
        if (wave.direction === 'horizontal') {
          wave.amplitude = Math.min(wave.amplitude, gridHeight / 4);
        } else {
          wave.amplitude = Math.min(wave.amplitude, gridWidth / 4);
        }
      });
    }
  }
  
  public setConfig(config: Partial<PatternConfig>): void {
    super.setConfig(config);
    if (this.isInitialized) {
      // Reinitialize waves with new config
      this.initializeWaves();
    }
  }
  
  public cleanup(): void {
    this.isInitialized = false;
    this.waves = [];
    this.grid = [];
    this.time = 0;
    this.animationState = {};
  }
}