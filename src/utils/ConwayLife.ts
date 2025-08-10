import { BasePattern } from './BasePattern';
import { PatternConfig } from '../types';

interface Cell {
  alive: boolean;
  age: number;
  char: string;
  color: string;
}

/**
 * ConwayLife pattern implements Conway's Game of Life cellular automaton
 * Features different cell representations, aging effects, and pattern seeding
 */
export class ConwayLife extends BasePattern {
  private currentGrid: Cell[][] = [];
  private nextGrid: Cell[][] = [];
  private generation: number = 0;
  private updateTimer: number = 0;
  private updateInterval: number = 200; // milliseconds between generations
  private maxAge: number = 10;
  private stableGenerations: number = 0;
  private lastPopulation: number = 0;
  private resetTimer: number = 0;
  private resetInterval: number = 30000; // Reset after 30 seconds of stability
  
  // Different character sets for cell representation
  private cellChars = {
    simple: ['█', '▓', '▒', '░', ' '],
    organic: ['@', '#', '*', 'o', '.', ' '],
    digital: ['1', '0', '1', '0', ' '],
    blocks: ['█', '▉', '▊', '▋', '▌', '▍', '▎', '▏', ' ']
  };
  private currentCharSet: string[] = this.cellChars.simple;
  
  // Famous Conway's Life patterns for seeding
  private patterns = {
    glider: [
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 1]
    ],
    blinker: [
      [1, 1, 1]
    ],
    toad: [
      [0, 1, 1, 1],
      [1, 1, 1, 0]
    ],
    beacon: [
      [1, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 1, 1],
      [0, 0, 1, 1]
    ],
    pulsar: [
      [0,0,1,1,1,0,0,0,1,1,1,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,0,0,0,0,1,0,1,0,0,0,0,1],
      [1,0,0,0,0,1,0,1,0,0,0,0,1],
      [1,0,0,0,0,1,0,1,0,0,0,0,1],
      [0,0,1,1,1,0,0,0,1,1,1,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,1,1,1,0,0,0,1,1,1,0,0],
      [1,0,0,0,0,1,0,1,0,0,0,0,1],
      [1,0,0,0,0,1,0,1,0,0,0,0,1],
      [1,0,0,0,0,1,0,1,0,0,0,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,1,1,1,0,0,0,1,1,1,0,0]
    ],
    gosperGun: [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
      [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
      [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
  };
  
  constructor(ctx: CanvasRenderingContext2D, config: PatternConfig) {
    super(ctx, config, 'conway-life');
    this.applySpeedConfig(config.speed || 'medium');
    this.applyComplexityConfig(config.complexity || 'medium');
  }
  
  public initialize(): void {
    this.isInitialized = true;
    this.generation = 0;
    this.updateTimer = 0;
    this.stableGenerations = 0;
    this.lastPopulation = 0;
    this.resetTimer = 0;
    
    // Set canvas properties
    this.ctx.font = `${this.config.fontSize || 12}px ${this.config.fontFamily || 'Courier New, Monaco, Consolas, monospace'}`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    
    // Initialize grids
    this.initializeGrids();
    
    // Seed with random patterns
    this.seedRandomPatterns();
  }
  
  private initializeGrids(): void {
    this.currentGrid = [];
    this.nextGrid = [];
    
    for (let y = 0; y < this.gridHeight; y++) {
      this.currentGrid[y] = [];
      this.nextGrid[y] = [];
      
      for (let x = 0; x < this.gridWidth; x++) {
        this.currentGrid[y][x] = {
          alive: false,
          age: 0,
          char: ' ',
          color: '#000000'
        };
        
        this.nextGrid[y][x] = {
          alive: false,
          age: 0,
          char: ' ',
          color: '#000000'
        };
      }
    }
  }
  
  private seedRandomPatterns(): void {
    const patternNames = Object.keys(this.patterns);
    const numPatterns = Math.floor(2 + this.getDensityMultiplier() * 4); // 2-6 patterns
    
    for (let i = 0; i < numPatterns; i++) {
      const patternName = patternNames[Math.floor(Math.random() * patternNames.length)];
      const pattern = this.patterns[patternName as keyof typeof this.patterns];
      
      // Random position for pattern
      const startX = Math.floor(Math.random() * (this.gridWidth - pattern[0].length));
      const startY = Math.floor(Math.random() * (this.gridHeight - pattern.length));
      
      this.placePattern(pattern, startX, startY);
    }
    
    // Add some random noise
    const noiseLevel = 0.1 * this.getDensityMultiplier();
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (Math.random() < noiseLevel) {
          this.currentGrid[y][x].alive = true;
          this.currentGrid[y][x].age = 0;
        }
      }
    }
    
    this.updateCellAppearance();
  }
  
  private placePattern(pattern: number[][], startX: number, startY: number): void {
    for (let y = 0; y < pattern.length; y++) {
      for (let x = 0; x < pattern[y].length; x++) {
        const gridX = startX + x;
        const gridY = startY + y;
        
        if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
          if (pattern[y][x] === 1) {
            this.currentGrid[gridY][gridX].alive = true;
            this.currentGrid[gridY][gridX].age = 0;
          }
        }
      }
    }
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    this.updateTimer += deltaTime;
    this.resetTimer += deltaTime;
    
    // Update generation
    if (this.updateTimer >= this.updateInterval) {
      this.nextGeneration();
      this.updateTimer = 0;
    }
    
    // Check for reset conditions
    if (this.resetTimer >= this.resetInterval || this.stableGenerations > 50) {
      this.resetSimulation();
    }
  }
  
  private nextGeneration(): void {
    // Calculate next generation using Conway's rules
    let population = 0;
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const neighbors = this.countNeighbors(x, y);
        const currentCell = this.currentGrid[y][x];
        const nextCell = this.nextGrid[y][x];
        
        // Conway's Game of Life rules
        if (currentCell.alive) {
          // Live cell with 2 or 3 neighbors survives
          nextCell.alive = neighbors === 2 || neighbors === 3;
          nextCell.age = nextCell.alive ? currentCell.age + 1 : 0;
        } else {
          // Dead cell with exactly 3 neighbors becomes alive
          nextCell.alive = neighbors === 3;
          nextCell.age = nextCell.alive ? 0 : 0;
        }
        
        if (nextCell.alive) {
          population++;
        }
        
        // Limit age to prevent overflow
        nextCell.age = Math.min(nextCell.age, this.maxAge);
      }
    }
    
    // Swap grids
    [this.currentGrid, this.nextGrid] = [this.nextGrid, this.currentGrid];
    
    // Update generation counter and stability tracking
    this.generation++;
    
    if (Math.abs(population - this.lastPopulation) < 5) {
      this.stableGenerations++;
    } else {
      this.stableGenerations = 0;
    }
    
    this.lastPopulation = population;
    
    // Update cell appearance
    this.updateCellAppearance();
  }
  
  private countNeighbors(x: number, y: number): number {
    let count = 0;
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue; // Skip center cell
        
        const nx = x + dx;
        const ny = y + dy;
        
        // Handle wrapping (toroidal topology)
        const wrappedX = (nx + this.gridWidth) % this.gridWidth;
        const wrappedY = (ny + this.gridHeight) % this.gridHeight;
        
        if (this.currentGrid[wrappedY][wrappedX].alive) {
          count++;
        }
      }
    }
    
    return count;
  }
  
  private updateCellAppearance(): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.currentGrid[y][x];
        
        if (cell.alive) {
          cell.char = this.getCharForAge(cell.age);
          cell.color = this.getColorForAge(cell.age);
        } else {
          cell.char = ' ';
          cell.color = '#000000';
        }
      }
    }
  }
  
  private getCharForAge(age: number): string {
    const ageRatio = Math.min(age / this.maxAge, 1);
    const charIndex = Math.floor(ageRatio * (this.currentCharSet.length - 1));
    return this.currentCharSet[charIndex];
  }
  
  private getColorForAge(age: number): string {
    const theme = this.config.currentTheme || 'matrix';
    const ageRatio = Math.min(age / this.maxAge, 1);
    
    switch (theme) {
      case 'matrix':
        // Young cells are bright green, older cells fade to dark green
        const green = Math.floor(255 * (1 - ageRatio * 0.7));
        return `rgb(0, ${green}, 0)`;
      case 'terminal':
        const termGreen = Math.floor(255 * (0.8 - ageRatio * 0.5));
        return `rgb(0, ${termGreen}, 0)`;
      case 'retro':
        // Young cells are bright orange, older cells fade to red
        const red = Math.floor(255 * (0.6 + ageRatio * 0.4));
        const orange = Math.floor(107 * (1 - ageRatio * 0.6));
        return `rgb(${red}, ${orange}, 53)`;
      case 'blue':
        // Young cells are bright blue, older cells fade to dark blue
        const blue = Math.floor(255 * (1 - ageRatio * 0.6));
        const cyan = Math.floor(191 * (0.8 - ageRatio * 0.4));
        return `rgb(0, ${cyan}, ${blue})`;
      default:
        return '#00ff00';
    }
  }
  
  private resetSimulation(): void {
    this.generation = 0;
    this.stableGenerations = 0;
    this.lastPopulation = 0;
    this.resetTimer = 0;
    
    // Clear grid
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.currentGrid[y][x].alive = false;
        this.currentGrid[y][x].age = 0;
      }
    }
    
    // Seed new patterns
    this.seedRandomPatterns();
  }
  
  public render(): void {
    // Clear canvas with black background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    if (!this.isInitialized) return;
    
    // Render cells
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.currentGrid[y][x];
        
        if (cell.alive && cell.char !== ' ') {
          this.ctx.fillStyle = cell.color;
          this.drawChar(cell.char, x, y);
        }
      }
    }
    
    // Render info overlay
    this.renderInfoOverlay();
  }
  
  private renderInfoOverlay(): void {
    if (this.gridHeight < 2 || this.gridWidth < 20) return;
    
    const info = `Conway's Life | Gen: ${this.generation} | Pop: ${this.lastPopulation}`;
    
    // Render info text
    this.ctx.fillStyle = this.getInfoColor();
    for (let i = 0; i < Math.min(info.length, this.gridWidth); i++) {
      this.drawChar(info[i], i, this.gridHeight - 1);
    }
  }
  
  private getInfoColor(): string {
    switch (this.config.currentTheme || 'matrix') {
      case 'matrix': return '#004400';
      case 'terminal': return '#004400';
      case 'retro': return '#662200';
      case 'blue': return '#002244';
      default: return '#004400';
    }
  }
  
  private applySpeedConfig(speed: string): void {
    switch (speed) {
      case 'slow':
        this.updateInterval = 500;
        this.resetInterval = 45000;
        break;
      case 'medium':
        this.updateInterval = 200;
        this.resetInterval = 30000;
        break;
      case 'fast':
        this.updateInterval = 100;
        this.resetInterval = 15000;
        break;
    }
  }
  
  private applyComplexityConfig(complexity: string): void {
    switch (complexity) {
      case 'low':
        this.currentCharSet = this.cellChars.simple;
        this.maxAge = 5;
        break;
      case 'medium':
        this.currentCharSet = this.cellChars.organic;
        this.maxAge = 10;
        break;
      case 'high':
        this.currentCharSet = this.cellChars.blocks;
        this.maxAge = 15;
        break;
    }
  }
  
  public onResize(gridWidth: number, gridHeight: number): void {
    super.onResize(gridWidth, gridHeight);
    if (this.isInitialized) {
      this.initializeGrids();
      this.seedRandomPatterns();
    }
  }
  
  public setConfig(config: Partial<PatternConfig>): void {
    super.setConfig(config);
    
    if (config.speed) {
      this.applySpeedConfig(config.speed);
    }
    
    if (config.complexity) {
      this.applyComplexityConfig(config.complexity);
      if (this.isInitialized) {
        this.updateCellAppearance();
      }
    }
  }
  
  public cleanup(): void {
    this.isInitialized = false;
    this.currentGrid = [];
    this.nextGrid = [];
    this.generation = 0;
    this.updateTimer = 0;
    this.stableGenerations = 0;
    this.lastPopulation = 0;
    this.resetTimer = 0;
    this.animationState = {};
  }
  
  /**
   * Get current animation state for debugging
   */
  public getAnimationState(): any {
    return {
      generation: this.generation,
      population: this.lastPopulation,
      stableGenerations: this.stableGenerations,
      updateInterval: this.updateInterval,
      maxAge: this.maxAge,
      resetProgress: this.resetTimer / this.resetInterval
    };
  }
}