import { BasePattern } from './BasePattern';
import { PatternConfig } from '../types';

interface NetworkNode {
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  char: string;
  color: string;
  connections: number[];
  activity: number; // 0-1, affects brightness
  type: 'server' | 'client' | 'router' | 'database';
  age: number;
}

interface Connection {
  from: number;
  to: number;
  strength: number; // 0-1
  activity: number; // 0-1, animated
  char: string;
  color: string;
}

/**
 * NetworkNodes pattern creates a connected node visualization
 * Features moving nodes with dynamic connections and data flow animation
 */
export class NetworkNodes extends BasePattern {
  private nodes: NetworkNode[] = [];
  private connections: Connection[] = [];
  private maxNodes: number = 20;
  private maxConnections: number = 30;
  private connectionDistance: number = 15;
  private nodeSpeed: number = 2;
  private activityTimer: number = 0;
  private spawnTimer: number = 0;
  private spawnInterval: number = 3000; // 3 seconds between new nodes
  
  // Character sets for different node types
  private nodeChars = {
    server: ['█', '▓', '▒'],
    client: ['●', '○', '◦'],
    router: ['◆', '◇', '◈'],
    database: ['■', '□', '▫']
  };
  
  // Connection characters for data flow
  private connectionChars = ['-', '=', '≡', '~', '·', ' '];
  
  constructor(ctx: CanvasRenderingContext2D, config: PatternConfig) {
    super(ctx, config, 'network-nodes');
    this.applyDensityConfig(config.density || 'medium');
    this.applySpeedConfig(config.speed || 'medium');
  }
  
  public initialize(): void {
    this.isInitialized = true;
    this.nodes = [];
    this.connections = [];
    this.activityTimer = 0;
    this.spawnTimer = 0;
    
    // Set canvas properties
    this.ctx.font = `${this.config.fontSize || 12}px ${this.config.fontFamily || 'Courier New, Monaco, Consolas, monospace'}`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    
    // Calculate connection distance based on grid size
    this.connectionDistance = Math.min(this.gridWidth, this.gridHeight) / 4;
    
    // Create initial nodes
    this.createInitialNodes();
    
    // Create initial connections
    this.updateConnections();
  }
  
  private createInitialNodes(): void {
    const initialNodeCount = Math.floor(this.maxNodes * 0.6);
    
    for (let i = 0; i < initialNodeCount; i++) {
      this.createNode();
    }
  }
  
  private createNode(): void {
    if (this.nodes.length >= this.maxNodes) return;
    
    const nodeTypes: Array<'server' | 'client' | 'router' | 'database'> = ['server', 'client', 'router', 'database'];
    const type = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
    
    const node: NetworkNode = {
      x: this.randomRange(2, this.gridWidth - 2),
      y: this.randomRange(2, this.gridHeight - 2),
      vx: this.randomRange(-this.nodeSpeed, this.nodeSpeed),
      vy: this.randomRange(-this.nodeSpeed, this.nodeSpeed),
      char: this.getCharForNodeType(type),
      color: this.getColorForNodeType(type),
      connections: [],
      activity: Math.random(),
      type: type,
      age: 0
    };
    
    this.nodes.push(node);
  }
  
  private getCharForNodeType(type: 'server' | 'client' | 'router' | 'database'): string {
    const chars = this.nodeChars[type];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  
  private getColorForNodeType(type: 'server' | 'client' | 'router' | 'database'): string {
    const theme = this.config.currentTheme || 'matrix';
    
    switch (theme) {
      case 'matrix':
        switch (type) {
          case 'server': return '#00ff00';
          case 'client': return '#88ff88';
          case 'router': return '#44ff44';
          case 'database': return '#00cc00';
        }
        break;
      case 'terminal':
        switch (type) {
          case 'server': return '#00ff00';
          case 'client': return '#ffff00';
          case 'router': return '#ff8800';
          case 'database': return '#88ff88';
        }
        break;
      case 'retro':
        switch (type) {
          case 'server': return '#ff6b35';
          case 'client': return '#ffaa44';
          case 'router': return '#ff8822';
          case 'database': return '#cc5500';
        }
        break;
      case 'blue':
        switch (type) {
          case 'server': return '#00bfff';
          case 'client': return '#88ccff';
          case 'router': return '#44aaff';
          case 'database': return '#0088cc';
        }
        break;
    }
    return '#00ff00';
  }
  
  private updateConnections(): void {
    // Clear existing connections
    this.connections = [];
    
    // Clear node connections
    this.nodes.forEach(node => {
      node.connections = [];
    });
    
    // Create new connections based on distance
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const node1 = this.nodes[i];
        const node2 = this.nodes[j];
        
        const distance = this.getDistance(node1.x, node1.y, node2.x, node2.y);
        
        if (distance <= this.connectionDistance && this.connections.length < this.maxConnections) {
          // Create connection with probability based on distance
          const connectionProbability = 1 - (distance / this.connectionDistance);
          
          if (Math.random() < connectionProbability * 0.7) {
            const connection: Connection = {
              from: i,
              to: j,
              strength: connectionProbability,
              activity: Math.random(),
              char: this.getConnectionChar(),
              color: this.getConnectionColor(node1, node2)
            };
            
            this.connections.push(connection);
            node1.connections.push(j);
            node2.connections.push(i);
          }
        }
      }
    }
  }
  
  private getDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }
  
  private getConnectionChar(): string {
    return this.connectionChars[Math.floor(Math.random() * this.connectionChars.length)];
  }
  
  private getConnectionColor(node1: NetworkNode, node2: NetworkNode): string {
    // Blend colors of connected nodes
    const theme = this.config.currentTheme || 'matrix';
    
    switch (theme) {
      case 'matrix': return '#004400';
      case 'terminal': return '#444400';
      case 'retro': return '#442200';
      case 'blue': return '#002244';
      default: return '#004400';
    }
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    const deltaSeconds = deltaTime / 1000;
    this.activityTimer += deltaTime;
    this.spawnTimer += deltaTime;
    
    // Spawn new nodes periodically
    if (this.spawnTimer >= this.spawnInterval && this.nodes.length < this.maxNodes) {
      this.createNode();
      this.spawnTimer = 0;
      this.updateConnections();
    }
    
    // Update nodes
    this.updateNodes(deltaSeconds);
    
    // Update connections activity
    this.updateConnectionActivity(deltaSeconds);
    
    // Periodically update connections based on new positions
    if (this.activityTimer > 1000) { // Every second
      this.updateConnections();
      this.activityTimer = 0;
    }
  }
  
  private updateNodes(deltaSeconds: number): void {
    this.nodes.forEach((node, index) => {
      // Update position
      node.x += node.vx * deltaSeconds;
      node.y += node.vy * deltaSeconds;
      
      // Bounce off walls
      if (node.x <= 1 || node.x >= this.gridWidth - 1) {
        node.vx *= -1;
        node.x = this.clamp(node.x, 1, this.gridWidth - 1);
      }
      
      if (node.y <= 1 || node.y >= this.gridHeight - 1) {
        node.vy *= -1;
        node.y = this.clamp(node.y, 1, this.gridHeight - 1);
      }
      
      // Update activity (creates pulsing effect)
      node.activity = 0.3 + 0.7 * Math.sin(this.activityTimer * 0.001 + index);
      
      // Age the node
      node.age += deltaSeconds;
      
      // Occasionally change direction slightly
      if (Math.random() < 0.01) {
        node.vx += this.randomRange(-0.5, 0.5);
        node.vy += this.randomRange(-0.5, 0.5);
        
        // Limit speed
        const speed = Math.sqrt(node.vx ** 2 + node.vy ** 2);
        if (speed > this.nodeSpeed) {
          node.vx = (node.vx / speed) * this.nodeSpeed;
          node.vy = (node.vy / speed) * this.nodeSpeed;
        }
      }
    });
  }
  
  private updateConnectionActivity(deltaSeconds: number): void {
    this.connections.forEach((connection, index) => {
      // Animate connection activity
      connection.activity = 0.2 + 0.8 * Math.sin(this.activityTimer * 0.002 + index * 0.5);
      
      // Occasionally change connection character for data flow effect
      if (Math.random() < 0.1) {
        connection.char = this.getConnectionChar();
      }
    });
  }
  
  public render(): void {
    // Clear canvas with dark background - ensures 100% coverage
    this.fillBackground(this.getBackgroundColor());
    
    if (!this.isInitialized) return;
    
    // Render connections first (so they appear behind nodes)
    this.renderConnections();
    
    // Render nodes
    this.renderNodes();
    
    // Render network info
    this.renderNetworkInfo();
  }
  
  private renderConnections(): void {
    this.connections.forEach(connection => {
      const fromNode = this.nodes[connection.from];
      const toNode = this.nodes[connection.to];
      
      if (!fromNode || !toNode) return;
      
      // Calculate connection line
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const distance = Math.sqrt(dx ** 2 + dy ** 2);
      
      if (distance < 1) return;
      
      const steps = Math.floor(distance);
      const stepX = dx / steps;
      const stepY = dy / steps;
      
      // Set connection color with activity-based alpha
      const alpha = connection.activity * connection.strength * 0.7;
      this.ctx.fillStyle = this.applyAlpha(connection.color, alpha);
      
      // Draw connection line with characters
      for (let i = 1; i < steps; i++) {
        const x = Math.floor(fromNode.x + stepX * i);
        const y = Math.floor(fromNode.y + stepY * i);
        
        if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
          // Vary character based on position for data flow effect
          const flowChar = i % 3 === 0 ? connection.char : (Math.random() < 0.3 ? '·' : ' ');
          if (flowChar !== ' ') {
            this.drawChar(flowChar, x, y);
          }
        }
      }
    });
  }
  
  private renderNodes(): void {
    this.nodes.forEach(node => {
      const x = Math.floor(node.x);
      const y = Math.floor(node.y);
      
      if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
        // Apply activity-based brightness
        const alpha = 0.5 + 0.5 * node.activity;
        this.ctx.fillStyle = this.applyAlpha(node.color, alpha);
        
        this.drawChar(node.char, x, y);
        
        // Add connection count indicator for important nodes
        if (node.connections.length > 3) {
          this.ctx.fillStyle = this.applyAlpha('#ffffff', alpha * 0.5);
          this.drawChar('+', x + 1, y);
        }
      }
    });
  }
  
  private renderNetworkInfo(): void {
    if (this.gridHeight < 2 || this.gridWidth < 25) return;
    
    const info = `Network | Nodes: ${this.nodes.length} | Connections: ${this.connections.length}`;
    
    // Render info text
    this.ctx.fillStyle = this.getInfoColor();
    for (let i = 0; i < Math.min(info.length, this.gridWidth); i++) {
      this.drawChar(info[i], i, 0);
    }
  }
  
  private getBackgroundColor(): string {
    switch (this.config.currentTheme || 'matrix') {
      case 'matrix': return '#000000';
      case 'terminal': return '#001100';
      case 'retro': return '#110800';
      case 'blue': return '#000811';
      default: return '#000000';
    }
  }
  
  private getInfoColor(): string {
    switch (this.config.currentTheme || 'matrix') {
      case 'matrix': return '#002200';
      case 'terminal': return '#222200';
      case 'retro': return '#221100';
      case 'blue': return '#001122';
      default: return '#002200';
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
  
  private applyDensityConfig(density: string): void {
    switch (density) {
      case 'low':
        this.maxNodes = 10;
        this.maxConnections = 15;
        this.connectionDistance = Math.min(this.gridWidth, this.gridHeight) / 3;
        break;
      case 'medium':
        this.maxNodes = 20;
        this.maxConnections = 30;
        this.connectionDistance = Math.min(this.gridWidth, this.gridHeight) / 4;
        break;
      case 'high':
        this.maxNodes = 35;
        this.maxConnections = 50;
        this.connectionDistance = Math.min(this.gridWidth, this.gridHeight) / 5;
        break;
    }
  }
  
  private applySpeedConfig(speed: string): void {
    switch (speed) {
      case 'slow':
        this.nodeSpeed = 1;
        this.spawnInterval = 5000;
        break;
      case 'medium':
        this.nodeSpeed = 2;
        this.spawnInterval = 3000;
        break;
      case 'fast':
        this.nodeSpeed = 4;
        this.spawnInterval = 1500;
        break;
    }
  }
  
  public onResize(gridWidth: number, gridHeight: number): void {
    super.onResize(gridWidth, gridHeight);
    
    if (this.isInitialized) {
      // Update connection distance based on new grid size
      this.connectionDistance = Math.min(gridWidth, gridHeight) / 4;
      
      // Remove nodes that are now outside the grid
      this.nodes = this.nodes.filter(node => 
        node.x >= 1 && node.x < gridWidth - 1 && 
        node.y >= 1 && node.y < gridHeight - 1
      );
      
      // Update connections
      this.updateConnections();
    }
  }
  
  public setConfig(config: Partial<PatternConfig>): void {
    super.setConfig(config);
    
    if (config.density) {
      this.applyDensityConfig(config.density);
      if (this.isInitialized) {
        this.updateConnections();
      }
    }
    
    if (config.speed) {
      this.applySpeedConfig(config.speed);
    }
    
    // Update colors if theme changed
    if (config.currentTheme) {
      this.nodes.forEach(node => {
        node.color = this.getColorForNodeType(node.type);
      });
      
      this.connections.forEach(connection => {
        const fromNode = this.nodes[connection.from];
        const toNode = this.nodes[connection.to];
        if (fromNode && toNode) {
          connection.color = this.getConnectionColor(fromNode, toNode);
        }
      });
    }
  }
  
  public cleanup(): void {
    this.isInitialized = false;
    this.nodes = [];
    this.connections = [];
    this.activityTimer = 0;
    this.spawnTimer = 0;
    this.animationState = {};
  }
  
  /**
   * Get current animation state for debugging
   */
  public getAnimationState(): any {
    return {
      nodeCount: this.nodes.length,
      connectionCount: this.connections.length,
      maxNodes: this.maxNodes,
      maxConnections: this.maxConnections,
      connectionDistance: this.connectionDistance,
      nodeSpeed: this.nodeSpeed,
      averageActivity: this.nodes.reduce((sum, node) => sum + node.activity, 0) / this.nodes.length || 0
    };
  }
}