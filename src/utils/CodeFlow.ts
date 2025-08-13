import { BasePattern } from './BasePattern';
import { PatternConfig } from '../types';

interface CodeLine {
  text: string;
  y: number;
  speed: number;
  color: string;
  indent: number;
  type: 'comment' | 'function' | 'variable' | 'keyword' | 'string' | 'operator';
}

/**
 * CodeFlow pattern simulates scrolling code with syntax highlighting
 * Features realistic code snippets with proper indentation and colors
 */
export class CodeFlow extends BasePattern {
  private codeLines: CodeLine[] = [];
  private scrollSpeed: number = 20; // pixels per second
  private lineHeight: number = 1.2;
  private maxLines: number = 50;
  private spawnTimer: number = 0;
  private spawnInterval: number = 200; // milliseconds between new lines
  
  private codeSnippets: Array<{text: string, type: 'comment' | 'function' | 'variable' | 'keyword' | 'string' | 'operator', indent: number}> = [
    // JavaScript/TypeScript snippets
    { text: '// Initialize the application', type: 'comment', indent: 0 },
    { text: 'function initializeApp() {', type: 'function', indent: 0 },
    { text: '  const config = loadConfig();', type: 'variable', indent: 1 },
    { text: '  if (config.debug) {', type: 'keyword', indent: 1 },
    { text: '    console.log("Debug mode enabled");', type: 'string', indent: 2 },
    { text: '  }', type: 'keyword', indent: 1 },
    { text: '  return setupRoutes(config);', type: 'function', indent: 1 },
    { text: '}', type: 'function', indent: 0 },
    
    // Python snippets
    { text: '# Data processing pipeline', type: 'comment', indent: 0 },
    { text: 'def process_data(data_frame):', type: 'function', indent: 0 },
    { text: '    cleaned_data = data_frame.dropna()', type: 'variable', indent: 1 },
    { text: '    for column in cleaned_data.columns:', type: 'keyword', indent: 1 },
    { text: '        if column.startswith("temp_"):', type: 'keyword', indent: 2 },
    { text: '            cleaned_data[column] *= 1.8 + 32', type: 'operator', indent: 3 },
    { text: '    return cleaned_data', type: 'keyword', indent: 1 },
    
    // Java snippets
    { text: '// Service layer implementation', type: 'comment', indent: 0 },
    { text: 'public class UserService {', type: 'keyword', indent: 0 },
    { text: '  private final UserRepository repository;', type: 'variable', indent: 1 },
    { text: '  public User findById(Long id) {', type: 'function', indent: 1 },
    { text: '    return repository.findById(id)', type: 'function', indent: 2 },
    { text: '      .orElseThrow(() -> new UserNotFoundException());', type: 'function', indent: 3 },
    { text: '  }', type: 'function', indent: 1 },
    { text: '}', type: 'keyword', indent: 0 },
    
    // Go snippets
    { text: '// HTTP handler function', type: 'comment', indent: 0 },
    { text: 'func handleRequest(w http.ResponseWriter, r *http.Request) {', type: 'function', indent: 0 },
    { text: '  var request RequestData', type: 'variable', indent: 1 },
    { text: '  if err := json.NewDecoder(r.Body).Decode(&request); err != nil {', type: 'keyword', indent: 1 },
    { text: '    http.Error(w, "Invalid JSON", http.StatusBadRequest)', type: 'function', indent: 2 },
    { text: '    return', type: 'keyword', indent: 2 },
    { text: '  }', type: 'keyword', indent: 1 },
    { text: '  processRequest(request)', type: 'function', indent: 1 },
    { text: '}', type: 'function', indent: 0 },
    
    // Rust snippets
    { text: '// Memory-safe data processing', type: 'comment', indent: 0 },
    { text: 'impl<T> DataProcessor<T> where T: Clone + Send {', type: 'keyword', indent: 0 },
    { text: '  pub fn process(&self, data: Vec<T>) -> Result<Vec<T>, ProcessError> {', type: 'function', indent: 1 },
    { text: '    let mut results = Vec::with_capacity(data.len());', type: 'variable', indent: 2 },
    { text: '    for item in data.iter() {', type: 'keyword', indent: 2 },
    { text: '      match self.transform(item.clone()) {', type: 'keyword', indent: 3 },
    { text: '        Ok(transformed) => results.push(transformed),', type: 'operator', indent: 4 },
    { text: '        Err(e) => return Err(e),', type: 'keyword', indent: 4 },
    { text: '      }', type: 'keyword', indent: 3 },
    { text: '    }', type: 'keyword', indent: 2 },
    { text: '    Ok(results)', type: 'keyword', indent: 2 },
    { text: '  }', type: 'function', indent: 1 },
    { text: '}', type: 'keyword', indent: 0 }
  ];
  
  constructor(ctx: CanvasRenderingContext2D, config: PatternConfig) {
    super(ctx, config, 'code-flow');
    this.applySpeedConfig(config.speed || 'medium');
  }
  
  public initialize(): void {
    this.isInitialized = true;
    this.codeLines = [];
    this.spawnTimer = 0;
    
    // Set canvas properties for code display
    this.ctx.font = `${this.config.fontSize || 12}px ${this.config.fontFamily || 'Courier New, Monaco, Consolas, monospace'}`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    
    // Calculate line height in grid units
    this.lineHeight = 1.2;
    
    // Spawn initial lines
    for (let i = 0; i < Math.min(10, this.gridHeight); i++) {
      this.spawnCodeLine(-i * this.lineHeight);
    }
  }
  
  private spawnCodeLine(startY?: number): void {
    if (this.codeLines.length >= this.maxLines) {
      return;
    }
    
    const snippet = this.getRandomCodeSnippet();
    const indentSpaces = '  '.repeat(snippet.indent);
    const fullText = indentSpaces + snippet.text;
    
    const codeLine: CodeLine = {
      text: fullText,
      y: startY !== undefined ? startY : -this.lineHeight,
      speed: this.scrollSpeed * this.getSpeedMultiplier() * this.randomRange(0.8, 1.2),
      color: this.getColorForType(snippet.type),
      indent: snippet.indent,
      type: snippet.type
    };
    
    this.codeLines.push(codeLine);
  }
  
  private getRandomCodeSnippet() {
    return this.codeSnippets[Math.floor(Math.random() * this.codeSnippets.length)];
  }
  
  private getColorForType(type: string): string {
    const theme = this.config.currentTheme || 'matrix';
    
    switch (theme) {
      case 'matrix':
        switch (type) {
          case 'comment': return '#008800';
          case 'function': return '#00ff00';
          case 'variable': return '#88ff88';
          case 'keyword': return '#00cc00';
          case 'string': return '#44ff44';
          case 'operator': return '#66ff66';
          default: return '#00ff00';
        }
      case 'terminal':
        switch (type) {
          case 'comment': return '#888888';
          case 'function': return '#00ff00';
          case 'variable': return '#ffff00';
          case 'keyword': return '#ff8800';
          case 'string': return '#88ff88';
          case 'operator': return '#ff4444';
          default: return '#00ff00';
        }
      case 'retro':
        switch (type) {
          case 'comment': return '#cc8800';
          case 'function': return '#ff6b35';
          case 'variable': return '#ffaa00';
          case 'keyword': return '#ff4400';
          case 'string': return '#ff8844';
          case 'operator': return '#ffcc44';
          default: return '#ff6b35';
        }
      case 'blue':
        switch (type) {
          case 'comment': return '#4488cc';
          case 'function': return '#00bfff';
          case 'variable': return '#88ccff';
          case 'keyword': return '#0088cc';
          case 'string': return '#44aaff';
          case 'operator': return '#66bbff';
          default: return '#00bfff';
        }
      default:
        return '#00ff00';
    }
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    const deltaSeconds = deltaTime / 1000;
    
    // Update spawn timer
    this.spawnTimer += deltaTime;
    
    // Spawn new lines periodically
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnCodeLine();
      this.spawnTimer = 0;
      
      // Vary spawn interval slightly for more natural flow
      this.spawnInterval = 200 + this.randomRange(-50, 100);
    }
    
    // Update existing lines
    for (let i = this.codeLines.length - 1; i >= 0; i--) {
      const line = this.codeLines[i];
      line.y += line.speed * deltaSeconds;
      
      // Remove lines that have scrolled off screen
      if (line.y > this.gridHeight + 2) {
        this.codeLines.splice(i, 1);
      }
    }
  }
  
  public render(): void {
    // Clear canvas with dark background - ensures 100% coverage
    this.fillBackground(this.getBackgroundColor());
    
    if (!this.isInitialized) return;
    
    // Render all code lines
    this.codeLines.forEach(line => {
      this.renderCodeLine(line);
    });
    
    // Add subtle scan lines effect
    this.renderScanLines();
  }
  
  private renderCodeLine(line: CodeLine): void {
    const y = Math.floor(line.y);
    
    // Skip lines that are completely off screen
    if (y < -2 || y >= this.gridHeight + 2) {
      return;
    }
    
    // Apply fade effect for lines near edges
    let alpha = 1.0;
    if (y < 2) {
      alpha = Math.max(0, (y + 2) / 4);
    } else if (y > this.gridHeight - 3) {
      alpha = Math.max(0, (this.gridHeight - y + 1) / 4);
    }
    
    // Set color with alpha
    this.ctx.fillStyle = this.applyAlpha(line.color, alpha);
    
    // Render each character of the line
    const maxChars = Math.min(line.text.length, this.gridWidth);
    for (let i = 0; i < maxChars; i++) {
      const char = line.text[i];
      
      // Add slight character-level effects
      if (line.type === 'comment' && Math.random() < 0.02) {
        // Occasional flicker for comments
        continue;
      }
      
      this.drawChar(char, i, y);
    }
    
    // Add cursor effect for function declarations
    if (line.type === 'function' && line.text.includes('{') && alpha > 0.8) {
      const cursorX = Math.min(line.text.length, this.gridWidth - 1);
      this.ctx.fillStyle = this.applyAlpha('#ffffff', alpha * 0.7);
      this.drawChar('_', cursorX, y);
    }
  }
  
  private renderScanLines(): void {
    // Add subtle horizontal scan lines for retro effect
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    
    for (let y = 0; y < this.gridHeight; y += 2) {
      const pixelY = y * this.charHeight;
      this.ctx.fillRect(0, pixelY, this.ctx.canvas.width, 1);
    }
  }
  
  private getBackgroundColor(): string {
    switch (this.config.currentTheme || 'matrix') {
      case 'matrix': return '#000000';
      case 'terminal': return '#001100';
      case 'retro': return '#1a0a00';
      case 'blue': return '#000811';
      default: return '#000000';
    }
  }
  
  private applyAlpha(color: string, alpha: number): string {
    // Convert hex color to rgba with alpha
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // If already rgba, modify alpha
    if (color.startsWith('rgba')) {
      return color.replace(/[\d\.]+\)$/g, `${alpha})`);
    }
    
    // If rgb, convert to rgba
    if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    }
    
    return color;
  }
  
  private applySpeedConfig(speed: string): void {
    switch (speed) {
      case 'slow':
        this.scrollSpeed = 10;
        this.spawnInterval = 400;
        break;
      case 'medium':
        this.scrollSpeed = 20;
        this.spawnInterval = 200;
        break;
      case 'fast':
        this.scrollSpeed = 35;
        this.spawnInterval = 100;
        break;
    }
  }
  
  public onResize(gridWidth: number, gridHeight: number): void {
    super.onResize(gridWidth, gridHeight);
    
    if (this.isInitialized) {
      // Remove lines that are now off screen
      this.codeLines = this.codeLines.filter(line => 
        line.y < gridHeight + 2 && line.y > -2
      );
    }
  }
  
  public setConfig(config: Partial<PatternConfig>): void {
    super.setConfig(config);
    
    if (config.speed) {
      this.applySpeedConfig(config.speed);
    }
    
    // Update colors for existing lines if theme changed
    if (config.currentTheme) {
      this.codeLines.forEach(line => {
        line.color = this.getColorForType(line.type);
      });
    }
  }
  
  public cleanup(): void {
    this.isInitialized = false;
    this.codeLines = [];
    this.spawnTimer = 0;
    this.animationState = {};
  }
  
  /**
   * Get current animation state for debugging
   */
  public getAnimationState(): any {
    return {
      lineCount: this.codeLines.length,
      scrollSpeed: this.scrollSpeed,
      spawnInterval: this.spawnInterval,
      averageY: this.codeLines.reduce((sum, line) => sum + line.y, 0) / this.codeLines.length || 0
    };
  }
}