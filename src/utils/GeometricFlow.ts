import { BasePattern } from './BasePattern';
import { PatternConfig } from '../types';

interface GeometricShape {
  type: 'triangle' | 'diamond' | 'spiral' | 'cross' | 'arrow';
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  velocity: { x: number; y: number };
  age: number;
  maxAge: number;
  characters: string[];
}

/**
 * GeometricFlow pattern creates flowing geometric shapes using ASCII characters
 * Features rotation, transformation, and multiple geometric patterns
 */
export class GeometricFlow extends BasePattern {
  private shapes: GeometricShape[] = [];
  private time: number = 0;
  private spawnTimer: number = 0;
  private spawnInterval: number = 1000; // milliseconds
  private geometricChars: string[] = ['/', '\\', '|', '-', '+', '*', '#', 'X', 'O'];
  
  constructor(ctx: CanvasRenderingContext2D, config: PatternConfig) {
    super(ctx, config, 'geometricFlow');
  }
  
  public initialize(): void {
    this.isInitialized = true;
    this.time = 0;
    this.spawnTimer = 0;
    this.shapes = [];
    this.updateSpawnInterval();
    
    // Create initial shapes
    const initialShapes = Math.floor(2 + this.getDensityMultiplier() * 4);
    for (let i = 0; i < initialShapes; i++) {
      this.shapes.push(this.createShape());
    }
  }
  
  private updateSpawnInterval(): void {
    const speedMultiplier = this.getSpeedMultiplier();
    const densityMultiplier = this.getDensityMultiplier();
    this.spawnInterval = Math.max(500, 2000 / (speedMultiplier * densityMultiplier));
  }
  
  private createShape(): GeometricShape {
    const patterns = this.config.patterns || ['triangle', 'diamond', 'spiral', 'cross', 'arrow'];
    const shapeType = patterns[Math.floor(Math.random() * patterns.length)] as GeometricShape['type'];
    
    const speedMultiplier = this.getSpeedMultiplier();
    const complexityMultiplier = this.getComplexityMultiplier();
    
    const shape: GeometricShape = {
      type: shapeType,
      x: this.randomRange(5, Math.max(10, this.gridWidth - 5)),
      y: this.randomRange(5, Math.max(10, this.gridHeight - 5)),
      size: Math.floor(2 + complexityMultiplier * 6), // 2-8 size
      rotation: this.randomRange(0, Math.PI * 2),
      rotationSpeed: this.randomRange(-2, 2) * speedMultiplier,
      velocity: {
        x: this.randomRange(-2, 2) * speedMultiplier,
        y: this.randomRange(-2, 2) * speedMultiplier
      },
      age: 0,
      maxAge: this.randomRange(5000, 15000), // 5-15 seconds
      characters: this.getShapeCharacters(shapeType)
    };
    
    return shape;
  }
  
  private getShapeCharacters(shapeType: GeometricShape['type']): string[] {
    switch (shapeType) {
      case 'triangle':
        return ['/', '\\', '-', '^', 'v'];
      case 'diamond':
        return ['/', '\\', '<', '>', '+'];
      case 'spiral':
        return ['@', '*', 'o', '.', '+'];
      case 'cross':
        return ['+', 'X', '|', '-'];
      case 'arrow':
        return ['>', '<', '^', 'v', '-', '|'];
      default:
        return this.geometricChars;
    }
  }
  
  private getComplexityMultiplier(): number {
    switch (this.config.complexity) {
      case 'low': return 0.5;
      case 'medium': return 1.0;
      case 'high': return 1.5;
      default: return 1.0;
    }
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    this.time += deltaTime;
    this.spawnTimer += deltaTime;
    
    // Spawn new shapes
    if (this.spawnTimer >= this.spawnInterval) {
      this.shapes.push(this.createShape());
      this.spawnTimer = 0;
      
      // Limit number of shapes to prevent performance issues
      const maxShapes = Math.floor(5 + this.getDensityMultiplier() * 10);
      if (this.shapes.length > maxShapes) {
        this.shapes = this.shapes.slice(-maxShapes);
      }
    }
    
    // Update existing shapes
    this.shapes = this.shapes.filter(shape => {
      shape.age += deltaTime;
      
      // Remove old shapes
      if (shape.age > shape.maxAge) {
        return false;
      }
      
      // Update position
      shape.x += shape.velocity.x * deltaTime * 0.001;
      shape.y += shape.velocity.y * deltaTime * 0.001;
      
      // Update rotation
      shape.rotation += shape.rotationSpeed * deltaTime * 0.001;
      
      // Wrap around screen edges
      if (shape.x < -10) shape.x = this.gridWidth + 10;
      if (shape.x > this.gridWidth + 10) shape.x = -10;
      if (shape.y < -10) shape.y = this.gridHeight + 10;
      if (shape.y > this.gridHeight + 10) shape.y = -10;
      
      return true;
    });
  }
  
  public render(): void {
    if (!this.isInitialized) return;
    
    // Clear canvas with fade effect
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    // Render shapes
    this.shapes.forEach(shape => {
      this.renderShape(shape);
    });
  }
  
  private renderShape(shape: GeometricShape): void {
    const centerX = Math.round(shape.x);
    const centerY = Math.round(shape.y);
    
    // Skip shapes outside visible area
    if (centerX < -shape.size || centerX > this.gridWidth + shape.size ||
        centerY < -shape.size || centerY > this.gridHeight + shape.size) {
      return;
    }
    
    // Calculate age-based alpha for fade effect
    const ageRatio = shape.age / shape.maxAge;
    const alpha = Math.max(0.3, Math.sin(ageRatio * Math.PI)); // Ensure minimum visibility
    
    // Set color with alpha
    const baseColor = this.getShapeColor(shape);
    this.ctx.fillStyle = this.applyAlpha(baseColor, alpha);
    
    switch (shape.type) {
      case 'triangle':
        this.renderTriangle(shape, centerX, centerY);
        break;
      case 'diamond':
        this.renderDiamond(shape, centerX, centerY);
        break;
      case 'spiral':
        this.renderSpiral(shape, centerX, centerY);
        break;
      case 'cross':
        this.renderCross(shape, centerX, centerY);
        break;
      case 'arrow':
        this.renderArrow(shape, centerX, centerY);
        break;
    }
  }
  
  private renderTriangle(shape: GeometricShape, centerX: number, centerY: number): void {
    const size = shape.size;
    const rotation = shape.rotation;
    
    // Generate triangle points
    const points = [];
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2 / 3) + rotation;
      const x = centerX + Math.cos(angle) * size;
      const y = centerY + Math.sin(angle) * size;
      points.push({ x: Math.round(x), y: Math.round(y) });
    }
    
    // Draw triangle edges
    for (let i = 0; i < 3; i++) {
      const start = points[i];
      const end = points[(i + 1) % 3];
      this.drawLine(start.x, start.y, end.x, end.y, shape.characters[i % shape.characters.length]);
    }
  }
  
  private renderDiamond(shape: GeometricShape, centerX: number, centerY: number): void {
    const size = shape.size;
    const rotation = shape.rotation;
    
    // Generate diamond points
    const points = [
      { x: centerX, y: centerY - size }, // top
      { x: centerX + size, y: centerY }, // right
      { x: centerX, y: centerY + size }, // bottom
      { x: centerX - size, y: centerY }  // left
    ];
    
    // Apply rotation
    points.forEach(point => {
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      point.x = centerX + dx * Math.cos(rotation) - dy * Math.sin(rotation);
      point.y = centerY + dx * Math.sin(rotation) + dy * Math.cos(rotation);
      point.x = Math.round(point.x);
      point.y = Math.round(point.y);
    });
    
    // Draw diamond edges
    for (let i = 0; i < 4; i++) {
      const start = points[i];
      const end = points[(i + 1) % 4];
      this.drawLine(start.x, start.y, end.x, end.y, shape.characters[i % shape.characters.length]);
    }
  }
  
  private renderSpiral(shape: GeometricShape, centerX: number, centerY: number): void {
    const size = shape.size;
    const rotation = shape.rotation;
    const turns = 2;
    const points = size * 4;
    
    for (let i = 0; i < points; i++) {
      const t = i / points;
      const angle = t * turns * Math.PI * 2 + rotation;
      const radius = t * size;
      
      const x = Math.round(centerX + Math.cos(angle) * radius);
      const y = Math.round(centerY + Math.sin(angle) * radius);
      
      if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
        const charIndex = Math.floor(t * shape.characters.length);
        this.drawChar(shape.characters[charIndex], x, y);
      }
    }
  }
  
  private renderCross(shape: GeometricShape, centerX: number, centerY: number): void {
    const size = shape.size;
    const rotation = shape.rotation;
    
    // Horizontal line
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    
    for (let i = -size; i <= size; i++) {
      const x = Math.round(centerX + i * cos);
      const y = Math.round(centerY + i * sin);
      if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
        this.drawChar(shape.characters[0], x, y);
      }
    }
    
    // Vertical line
    const cos90 = Math.cos(rotation + Math.PI / 2);
    const sin90 = Math.sin(rotation + Math.PI / 2);
    
    for (let i = -size; i <= size; i++) {
      const x = Math.round(centerX + i * cos90);
      const y = Math.round(centerY + i * sin90);
      if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
        this.drawChar(shape.characters[1], x, y);
      }
    }
  }
  
  private renderArrow(shape: GeometricShape, centerX: number, centerY: number): void {
    const size = shape.size;
    const rotation = shape.rotation;
    
    // Arrow shaft
    for (let i = 0; i < size; i++) {
      const x = Math.round(centerX + Math.cos(rotation) * i);
      const y = Math.round(centerY + Math.sin(rotation) * i);
      if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
        this.drawChar('-', x, y);
      }
    }
    
    // Arrow head
    const headX = Math.round(centerX + Math.cos(rotation) * size);
    const headY = Math.round(centerY + Math.sin(rotation) * size);
    
    if (headX >= 0 && headX < this.gridWidth && headY >= 0 && headY < this.gridHeight) {
      this.drawChar('>', headX, headY);
    }
    
    // Arrow head sides
    const headSize = Math.max(1, Math.floor(size / 3));
    for (let i = 1; i <= headSize; i++) {
      const angle1 = rotation + Math.PI * 0.75;
      const angle2 = rotation - Math.PI * 0.75;
      
      const x1 = Math.round(headX + Math.cos(angle1) * i);
      const y1 = Math.round(headY + Math.sin(angle1) * i);
      const x2 = Math.round(headX + Math.cos(angle2) * i);
      const y2 = Math.round(headY + Math.sin(angle2) * i);
      
      if (x1 >= 0 && x1 < this.gridWidth && y1 >= 0 && y1 < this.gridHeight) {
        this.drawChar('/', x1, y1);
      }
      if (x2 >= 0 && x2 < this.gridWidth && y2 >= 0 && y2 < this.gridHeight) {
        this.drawChar('\\', x2, y2);
      }
    }
  }
  
  private drawLine(x1: number, y1: number, x2: number, y2: number, char: string): void {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    let x = x1;
    let y = y1;
    
    while (true) {
      if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
        this.drawChar(char, x, y);
      }
      
      if (x === x2 && y === y2) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }
  
  private getShapeColor(shape: GeometricShape): string {
    // Base color based on theme
    switch (this.config.currentTheme || 'matrix') {
      case 'matrix': return '#00ff00';
      case 'terminal': return '#00ff00';
      case 'retro': return '#ff6b35';
      case 'blue': return '#00bfff';
      default: return '#00ff00';
    }
  }
  
  private applyAlpha(color: string, alpha: number): string {
    // Simple alpha application - in a real implementation, you'd parse the color properly
    const intensity = Math.floor(255 * alpha);
    
    if (color === '#00ff00') {
      return `rgba(0, ${intensity}, 0, ${alpha})`;
    } else if (color === '#ff6b35') {
      const red = Math.floor(255 * alpha);
      const green = Math.floor(107 * alpha);
      const blue = Math.floor(53 * alpha);
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    } else if (color === '#00bfff') {
      const blue = Math.floor(255 * alpha);
      const green = Math.floor(191 * alpha);
      return `rgba(0, ${green}, ${blue}, ${alpha})`;
    }
    
    return color;
  }
  
  public onResize(gridWidth: number, gridHeight: number): void {
    super.onResize(gridWidth, gridHeight);
    // Remove shapes that are now out of bounds
    this.shapes = this.shapes.filter(shape => 
      shape.x >= -10 && shape.x <= gridWidth + 10 &&
      shape.y >= -10 && shape.y <= gridHeight + 10
    );
  }
  
  public setConfig(config: Partial<PatternConfig>): void {
    super.setConfig(config);
    if (this.isInitialized) {
      this.updateSpawnInterval();
    }
  }
  
  public cleanup(): void {
    this.isInitialized = false;
    this.shapes = [];
    this.time = 0;
    this.spawnTimer = 0;
    this.animationState = {};
  }
}