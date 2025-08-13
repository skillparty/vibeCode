import { BasePattern } from './BasePattern';
import { PatternConfig } from '../types';

/**
 * Digital Waterfall Pattern
 * A mesmerizing digital waterfall effect that fills the entire screen
 */
export class SimpleTestPattern extends BasePattern {
  private frameCount: number = 0;
  private drops: Array<{
    x: number;
    y: number;
    speed: number;
    char: string;
    intensity: number;
    trail: Array<{y: number, intensity: number}>;
  }> = [];
  
  private ripples: Array<{
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    intensity: number;
  }> = [];

  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    char: string;
  }> = [];

  private waterChars = ['│', '┃', '║', '|', '¦', '┆', '┊', '┋'];
  private rippleChars = ['○', '◯', '◦', '∘', '°', '·', '˙'];
  private sparkleChars = ['✦', '✧', '✩', '✪', '✫', '✬', '✭', '✮', '✯', '✰', '✱', '✲', '✳', '✴', '✵', '✶', '✷', '✸', '✹', '✺'];

  constructor(ctx: CanvasRenderingContext2D, config: PatternConfig) {
    super(ctx, config, 'digital-waterfall');
  }

  public initialize(): void {
    this.isInitialized = true;
    
    // Configure canvas text properties for proper rendering
    this.ctx.font = `${this.config.fontSize || 12}px ${this.config.fontFamily || 'Courier New, Monaco, Consolas, monospace'}`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    
    this.initializeDrops();
    this.initializeParticles();
  }

  private initializeDrops(): void {
    this.drops = [];
    // Create drops for every column to ensure full coverage
    for (let x = 0; x < this.gridWidth; x++) {
      if (Math.random() < 0.7) { // 70% chance for each column
        this.drops.push({
          x: x,
          y: -Math.random() * 20,
          speed: 0.5 + Math.random() * 1.5,
          char: this.waterChars[Math.floor(Math.random() * this.waterChars.length)],
          intensity: 0.5 + Math.random() * 0.5,
          trail: []
        });
      }
    }
  }

  private initializeParticles(): void {
    this.particles = [];
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: Math.random() * this.gridWidth,
        y: Math.random() * this.gridHeight,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        life: Math.random() * 100,
        maxLife: 50 + Math.random() * 100,
        char: this.sparkleChars[Math.floor(Math.random() * this.sparkleChars.length)]
      });
    }
  }

  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    this.frameCount++;
    
    // Update drops
    this.drops.forEach(drop => {
      // Add current position to trail
      drop.trail.push({ y: drop.y, intensity: drop.intensity });
      if (drop.trail.length > 8) {
        drop.trail.shift();
      }
      
      drop.y += drop.speed;
      
      // Create ripple when drop hits bottom
      if (drop.y >= this.gridHeight - 2 && Math.random() < 0.3) {
        this.ripples.push({
          x: drop.x,
          y: this.gridHeight - 1,
          radius: 0,
          maxRadius: 3 + Math.random() * 4,
          intensity: drop.intensity
        });
      }
      
      // Reset drop when it goes off screen
      if (drop.y > this.gridHeight + 5) {
        drop.y = -Math.random() * 10;
        drop.x = Math.floor(Math.random() * this.gridWidth);
        drop.char = this.waterChars[Math.floor(Math.random() * this.waterChars.length)];
        drop.trail = [];
      }
    });
    
    // Update ripples
    this.ripples = this.ripples.filter(ripple => {
      ripple.radius += 0.3;
      ripple.intensity *= 0.95;
      return ripple.radius < ripple.maxRadius && ripple.intensity > 0.1;
    });
    
    // Update particles
    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      
      // Wrap around screen
      if (particle.x < 0) particle.x = this.gridWidth - 1;
      if (particle.x >= this.gridWidth) particle.x = 0;
      if (particle.y < 0) particle.y = this.gridHeight - 1;
      if (particle.y >= this.gridHeight) particle.y = 0;
      
      // Reset particle when life ends
      if (particle.life <= 0) {
        particle.x = Math.random() * this.gridWidth;
        particle.y = Math.random() * this.gridHeight;
        particle.life = particle.maxLife;
        particle.char = this.sparkleChars[Math.floor(Math.random() * this.sparkleChars.length)];
      }
    });
    
    // Add new drops occasionally to maintain density
    if (this.frameCount % 30 === 0 && this.drops.length < this.gridWidth * 0.8) {
      this.drops.push({
        x: Math.floor(Math.random() * this.gridWidth),
        y: -Math.random() * 5,
        speed: 0.5 + Math.random() * 1.5,
        char: this.waterChars[Math.floor(Math.random() * this.waterChars.length)],
        intensity: 0.5 + Math.random() * 0.5,
        trail: []
      });
    }
  }

  public render(): void {
    // FIRST: Clear entire canvas with background - this ensures 100% coverage
    this.renderBackground();
    
    if (!this.isInitialized) return;
    
    // Render water drops and trails
    this.renderDrops();
    
    // Render ripples
    this.renderRipples();
    
    // Render floating particles
    this.renderParticles();
    
    // Render title
    this.renderTitle();
  }

  private renderBackground(): void {
    const themeColor = this.getThemeColor();
    
    // STEP 1: Fill entire canvas with solid background - GUARANTEES 100% coverage
    const bgR = Math.floor(themeColor.r * 0.1);
    const bgG = Math.floor(themeColor.g * 0.1);
    const bgB = Math.floor(themeColor.b * 0.2);
    this.fillBackground(`rgb(${bgR}, ${bgG}, ${bgB})`);
    
    // STEP 2: Add animated pattern over the solid background
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        // Create depth and wave effects
        const depth = y / this.gridHeight;
        const wave = Math.sin(x * 0.1 + this.frameCount * 0.02) * 0.1;
        const intensity = 0.2 + depth * 0.4 + wave;
        
        // Only draw pattern characters occasionally to create texture
        if ((x + y + Math.floor(this.frameCount / 15)) % 8 === 0) {
          const bgChars = ['·', '˙', '°', '∘', '◦'];
          const charIndex = (x + y + Math.floor(this.frameCount / 20)) % bgChars.length;
          const char = bgChars[charIndex];
          
          // Theme-based pattern color
          const r = Math.floor(themeColor.r * intensity * 0.4);
          const g = Math.floor(themeColor.g * intensity * 0.4);
          const b = Math.floor(themeColor.b * intensity * 0.6);
          
          this.drawChar(char, x, y, `rgb(${r}, ${g}, ${b})`);
        }
      }
    }
  }

  private renderDrops(): void {
    const themeColor = this.getThemeColor();
    
    this.drops.forEach(drop => {
      // Render trail
      drop.trail.forEach((trailPoint, index) => {
        const x = Math.floor(drop.x);
        const y = Math.floor(trailPoint.y);
        
        if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
          const trailIntensity = (index / drop.trail.length) * trailPoint.intensity;
          const r = Math.floor(themeColor.r * trailIntensity);
          const g = Math.floor(themeColor.g * trailIntensity);
          const b = Math.floor(themeColor.b * trailIntensity);
          
          this.drawChar(drop.char, x, y, `rgb(${r}, ${g}, ${b})`);
        }
      });
      
      // Render main drop
      const x = Math.floor(drop.x);
      const y = Math.floor(drop.y);
      
      if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
        const r = Math.floor(themeColor.r * drop.intensity);
        const g = Math.floor(themeColor.g * drop.intensity);
        const b = Math.floor(themeColor.b * drop.intensity);
        
        this.drawChar(drop.char, x, y, `rgb(${r}, ${g}, ${b})`);
      }
    });
  }

  private renderRipples(): void {
    const themeColor = this.getThemeColor();
    
    this.ripples.forEach(ripple => {
      const centerX = Math.floor(ripple.x);
      const centerY = Math.floor(ripple.y);
      const radius = Math.floor(ripple.radius);
      
      // Draw ripple circle
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const x = centerX + Math.floor(Math.cos(angle) * radius);
        const y = centerY + Math.floor(Math.sin(angle) * radius * 0.5); // Flatten for perspective
        
        if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
          const char = this.rippleChars[Math.floor(ripple.radius) % this.rippleChars.length];
          const r = Math.floor(themeColor.r * ripple.intensity * 0.8);
          const g = Math.floor(themeColor.g * ripple.intensity * 0.8);
          const b = Math.floor(themeColor.b * ripple.intensity);
          
          this.drawChar(char, x, y, `rgb(${r}, ${g}, ${b})`);
        }
      }
    });
  }

  private renderParticles(): void {
    const themeColor = this.getThemeColor();
    
    this.particles.forEach(particle => {
      const x = Math.floor(particle.x);
      const y = Math.floor(particle.y);
      
      if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
        const lifeRatio = particle.life / particle.maxLife;
        const intensity = lifeRatio * (0.5 + 0.5 * Math.sin(this.frameCount * 0.1));
        
        const r = Math.floor(themeColor.r * intensity * 0.7);
        const g = Math.floor(themeColor.g * intensity * 0.7);
        const b = Math.floor(themeColor.b * intensity);
        
        this.drawChar(particle.char, x, y, `rgb(${r}, ${g}, ${b})`);
      }
    });
  }

  private renderTitle(): void {
    const title = "✦ DIGITAL WATERFALL ✦";
    const subtitle = "~ Cascada Digital Infinita ~";
    const themeColor = this.getThemeColor();
    
    // Main title
    const startX = Math.floor((this.gridWidth - title.length) / 2);
    const y = Math.floor(this.gridHeight * 0.1);
    
    if (y >= 0 && startX >= 0) {
      for (let i = 0; i < title.length; i++) {
        const x = startX + i;
        if (x >= 0 && x < this.gridWidth) {
          const glow = 0.8 + 0.2 * Math.sin(this.frameCount * 0.05 + i * 0.2);
          const r = Math.floor(themeColor.r * glow);
          const g = Math.floor(themeColor.g * glow);
          const b = Math.floor(themeColor.b * glow);
          
          this.drawChar(title[i], x, y, `rgb(${r}, ${g}, ${b})`);
        }
      }
    }
    
    // Subtitle
    const subtitleX = Math.floor((this.gridWidth - subtitle.length) / 2);
    const subtitleY = y + 2;
    
    if (subtitleY >= 0 && subtitleX >= 0 && subtitleY < this.gridHeight) {
      for (let i = 0; i < subtitle.length; i++) {
        const x = subtitleX + i;
        if (x >= 0 && x < this.gridWidth) {
          const glow = 0.6 + 0.4 * Math.sin(this.frameCount * 0.03 + i * 0.15);
          const r = Math.floor((150 + themeColor.r * 0.5) * glow);
          const g = Math.floor((150 + themeColor.g * 0.5) * glow);
          const b = Math.floor((150 + themeColor.b * 0.5) * glow);
          
          this.drawChar(subtitle[i], x, subtitleY, `rgb(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)})`);
        }
      }
    }
  }

  private getThemeColor(): { r: number; g: number; b: number } {
    const theme = this.config.currentTheme || 'matrix';
    
    switch (theme) {
      case 'matrix':
      case 'terminal':
        return { r: 0, g: 255, b: 100 }; // Bright green
      case 'retro':
        return { r: 255, g: 0, b: 255 }; // Magenta
      case 'blue':
        return { r: 0, g: 150, b: 255 }; // Cyan blue
      default:
        return { r: 0, g: 255, b: 150 }; // Default aqua
    }
  }

  public cleanup(): void {
    this.isInitialized = false;
    this.frameCount = 0;
    this.drops = [];
    this.ripples = [];
    this.particles = [];
  }

  public onResize(gridWidth: number, gridHeight: number): void {
    super.onResize(gridWidth, gridHeight);
    if (this.isInitialized) {
      this.initializeDrops();
      this.initializeParticles();
    }
  }
}

export default SimpleTestPattern;