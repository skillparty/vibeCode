import { BasePattern } from './BasePattern';
import { PatternConfig } from '../types';

interface TerminalLine {
  text: string;
  cursorPosition: number;
  isComplete: boolean;
  age: number;
}

/**
 * TerminalCursor pattern simulates a terminal with blinking cursor and typing effects
 * Features realistic typing animation with variable speeds and command-like text
 */
export class TerminalCursor extends BasePattern {
  private lines: TerminalLine[] = [];
  private currentLine: number = 0;
  private cursorVisible: boolean = true;
  private cursorBlinkTimer: number = 0;
  private cursorBlinkInterval: number = 500; // Blink every 500ms
  private typingTimer: number = 0;
  private typingSpeed: number = 100; // Characters per minute
  private maxLines: number = 20;
  private terminalCommands: string[] = [
    'npm install --save-dev typescript',
    'git commit -m "feat: implement new feature"',
    'docker build -t myapp:latest .',
    'kubectl apply -f deployment.yaml',
    'yarn test --coverage',
    'eslint src/**/*.ts --fix',
    'webpack --mode production',
    'node server.js --port 3000',
    'python manage.py migrate',
    'cargo build --release',
    'go mod tidy && go build',
    'mvn clean install -DskipTests',
    'composer install --no-dev',
    'rails db:migrate RAILS_ENV=production',
    'make clean && make all',
    'terraform apply -auto-approve',
    'ansible-playbook deploy.yml',
    'ssh user@server "systemctl restart nginx"',
    'curl -X POST https://api.example.com/data',
    'grep -r "TODO" src/ --include="*.ts"'
  ];
  private prompt: string = '$ ';
  private backgroundColor: string = '#000000';
  private textColor: string = '#00ff00';
  private cursorColor: string = '#ffffff';
  
  constructor(ctx: CanvasRenderingContext2D, config: PatternConfig) {
    super(ctx, config, 'terminal-cursor');
    this.applyThemeConfig(config.currentTheme || 'matrix');
    this.applySpeedConfig(config.speed || 'medium');
  }
  
  public initialize(): void {
    this.isInitialized = true;
    this.lines = [];
    this.currentLine = 0;
    this.cursorVisible = true;
    this.cursorBlinkTimer = 0;
    this.typingTimer = 0;
    
    // Set canvas properties for terminal effect
    this.ctx.font = `${this.config.fontSize || 12}px ${this.config.fontFamily || 'Courier New, Monaco, Consolas, monospace'}`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    
    // Calculate max lines based on grid height
    this.maxLines = Math.max(10, this.gridHeight - 2);
    
    // Start with a few initial lines
    this.addNewLine();
  }
  
  private addNewLine(): void {
    if (this.lines.length >= this.maxLines) {
      // Remove oldest line
      this.lines.shift();
    }
    
    const command = this.getRandomCommand();
    const newLine: TerminalLine = {
      text: this.prompt + command,
      cursorPosition: this.prompt.length,
      isComplete: false,
      age: 0
    };
    
    this.lines.push(newLine);
    this.currentLine = this.lines.length - 1;
  }
  
  private getRandomCommand(): string {
    return this.terminalCommands[Math.floor(Math.random() * this.terminalCommands.length)];
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    // Update cursor blink
    this.cursorBlinkTimer += deltaTime;
    if (this.cursorBlinkTimer >= this.cursorBlinkInterval) {
      this.cursorVisible = !this.cursorVisible;
      this.cursorBlinkTimer = 0;
    }
    
    // Update typing animation
    this.typingTimer += deltaTime;
    const typingInterval = 60000 / this.typingSpeed; // Convert to milliseconds per character
    
    if (this.typingTimer >= typingInterval && this.lines.length > 0) {
      this.updateTyping();
      this.typingTimer = 0;
    }
    
    // Age all lines
    this.lines.forEach(line => {
      line.age += deltaTime;
    });
  }
  
  private updateTyping(): void {
    const currentLine = this.lines[this.currentLine];
    if (!currentLine || currentLine.isComplete) {
      // Start a new line after a delay
      if (!currentLine || currentLine.age > 2000) { // 2 second delay
        this.addNewLine();
      }
      return;
    }
    
    // Type next character
    if (currentLine.cursorPosition < currentLine.text.length) {
      currentLine.cursorPosition++;
      
      // Add some randomness to typing speed
      if (Math.random() < 0.1) {
        this.typingTimer -= this.typingSpeed * 0.5; // Occasional fast typing
      } else if (Math.random() < 0.05) {
        this.typingTimer -= this.typingSpeed * 2; // Occasional pause
      }
    } else {
      // Line is complete
      currentLine.isComplete = true;
      currentLine.age = 0; // Reset age for completion delay
    }
  }
  
  public render(): void {
    // Clear canvas with terminal background
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    if (!this.isInitialized) return;
    
    // Render terminal lines
    this.ctx.fillStyle = this.textColor;
    
    const startY = Math.max(0, this.gridHeight - this.lines.length - 1);
    
    this.lines.forEach((line, index) => {
      const y = startY + index;
      if (y >= 0 && y < this.gridHeight) {
        this.renderLine(line, y, index === this.currentLine);
      }
    });
    
    // Render terminal header/status
    this.renderTerminalHeader();
  }
  
  private renderLine(line: TerminalLine, y: number, isCurrentLine: boolean): void {
    // Render typed portion of the line
    const visibleText = line.text.substring(0, line.cursorPosition);
    
    for (let i = 0; i < visibleText.length && i < this.gridWidth; i++) {
      const char = visibleText[i];
      let color = this.textColor;
      
      // Highlight prompt differently
      if (i < this.prompt.length) {
        color = this.getCursorColor();
      }
      
      this.ctx.fillStyle = color;
      this.drawChar(char, i, y);
    }
    
    // Render cursor if this is the current line and cursor is visible
    if (isCurrentLine && !line.isComplete && this.cursorVisible) {
      this.ctx.fillStyle = this.cursorColor;
      const cursorX = Math.min(line.cursorPosition, this.gridWidth - 1);
      this.drawChar('█', cursorX, y); // Block cursor
    }
    
    // Add completion indicator
    if (line.isComplete && isCurrentLine) {
      const indicatorX = Math.min(line.text.length + 1, this.gridWidth - 1);
      this.ctx.fillStyle = this.getCompletionColor();
      this.drawChar('✓', indicatorX, y);
    }
  }
  
  private renderTerminalHeader(): void {
    if (this.gridHeight < 3) return;
    
    // Render a simple terminal header at the top
    const headerText = `Terminal - ${this.lines.length} lines`;
    this.ctx.fillStyle = this.getHeaderColor();
    
    for (let i = 0; i < Math.min(headerText.length, this.gridWidth); i++) {
      this.drawChar(headerText[i], i, 0);
    }
    
    // Render separator line
    this.ctx.fillStyle = this.textColor;
    for (let x = 0; x < this.gridWidth; x++) {
      this.drawChar('-', x, 1);
    }
  }
  
  private applyThemeConfig(theme: string): void {
    switch (theme) {
      case 'matrix':
        this.backgroundColor = '#000000';
        this.textColor = '#00ff00';
        this.cursorColor = '#ffffff';
        break;
      case 'terminal':
        this.backgroundColor = '#000000';
        this.textColor = '#00ff00';
        this.cursorColor = '#00ff00';
        break;
      case 'retro':
        this.backgroundColor = '#1a1a1a';
        this.textColor = '#ff6b35';
        this.cursorColor = '#ffaa00';
        break;
      case 'blue':
        this.backgroundColor = '#001122';
        this.textColor = '#00bfff';
        this.cursorColor = '#ffffff';
        break;
      default:
        this.backgroundColor = '#000000';
        this.textColor = '#00ff00';
        this.cursorColor = '#ffffff';
    }
  }
  
  private applySpeedConfig(speed: string): void {
    switch (speed) {
      case 'slow':
        this.typingSpeed = 60; // 60 characters per minute
        this.cursorBlinkInterval = 800;
        break;
      case 'medium':
        this.typingSpeed = 120; // 120 characters per minute
        this.cursorBlinkInterval = 500;
        break;
      case 'fast':
        this.typingSpeed = 200; // 200 characters per minute
        this.cursorBlinkInterval = 300;
        break;
    }
  }
  
  private getCursorColor(): string {
    return this.cursorColor;
  }
  
  private getCompletionColor(): string {
    switch (this.config.currentTheme || 'matrix') {
      case 'matrix': return '#00ff00';
      case 'terminal': return '#00ff00';
      case 'retro': return '#ffaa00';
      case 'blue': return '#00bfff';
      default: return '#00ff00';
    }
  }
  
  private getHeaderColor(): string {
    switch (this.config.currentTheme || 'matrix') {
      case 'matrix': return '#008800';
      case 'terminal': return '#008800';
      case 'retro': return '#cc5500';
      case 'blue': return '#0088cc';
      default: return '#008800';
    }
  }
  
  public onResize(gridWidth: number, gridHeight: number): void {
    super.onResize(gridWidth, gridHeight);
    if (this.isInitialized) {
      this.maxLines = Math.max(10, gridHeight - 2);
      
      // Remove excess lines if screen got smaller
      while (this.lines.length > this.maxLines) {
        this.lines.shift();
      }
      
      // Adjust current line index
      this.currentLine = Math.min(this.currentLine, this.lines.length - 1);
    }
  }
  
  public setConfig(config: Partial<PatternConfig>): void {
    super.setConfig(config);
    
    if (config.currentTheme) {
      this.applyThemeConfig(config.currentTheme);
    }
    
    if (config.speed) {
      this.applySpeedConfig(config.speed);
    }
  }
  
  public cleanup(): void {
    this.isInitialized = false;
    this.lines = [];
    this.currentLine = 0;
    this.cursorVisible = true;
    this.cursorBlinkTimer = 0;
    this.typingTimer = 0;
    this.animationState = {};
  }
  
  /**
   * Get current animation state for debugging
   */
  public getAnimationState(): any {
    return {
      lineCount: this.lines.length,
      currentLine: this.currentLine,
      cursorVisible: this.cursorVisible,
      typingSpeed: this.typingSpeed,
      currentProgress: this.lines[this.currentLine]?.cursorPosition || 0,
      totalLength: this.lines[this.currentLine]?.text.length || 0
    };
  }
}