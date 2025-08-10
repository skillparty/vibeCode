import { Pattern, RenderLayer } from '../types';

export class LayerManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private layers: Map<string, RenderLayer> = new Map();
  private sortedLayers: RenderLayer[] = [];

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    
    // Initialize default layers
    this.initializeDefaultLayers();
  }

  /**
   * Initialize default rendering layers
   */
  private initializeDefaultLayers(): void {
    this.createLayer('background', -100, 1.0, 'source-over');
    this.createLayer('middle', 0, 1.0, 'source-over');
    this.createLayer('foreground', 100, 1.0, 'source-over');
  }

  /**
   * Create a new rendering layer
   */
  public createLayer(
    name: string, 
    zIndex: number, 
    opacity: number = 1.0, 
    blendMode: GlobalCompositeOperation = 'source-over'
  ): RenderLayer {
    // Create off-screen canvas for this layer
    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = this.canvas.width;
    layerCanvas.height = this.canvas.height;
    
    const layerCtx = layerCanvas.getContext('2d');
    if (!layerCtx) {
      throw new Error('Failed to create layer context');
    }

    // Set font properties to match main canvas
    layerCtx.font = this.ctx.font;
    layerCtx.textBaseline = this.ctx.textBaseline;
    layerCtx.textAlign = this.ctx.textAlign;

    const layer: RenderLayer = {
      name,
      zIndex,
      opacity,
      blendMode,
      canvas: layerCanvas,
      ctx: layerCtx
    };

    this.layers.set(name, layer);
    this.updateSortedLayers();

    return layer;
  }

  /**
   * Assign a pattern to a specific layer
   */
  public assignPatternToLayer(layerName: string, pattern: Pattern): void {
    const layer = this.layers.get(layerName);
    if (!layer) {
      throw new Error(`Layer not found: ${layerName}`);
    }

    layer.pattern = pattern;
    
    // Update pattern's context to use layer context
    if (layer.ctx) {
      (pattern as any).ctx = layer.ctx;
    }
  }

  /**
   * Remove pattern from layer
   */
  public removePatternFromLayer(layerName: string): void {
    const layer = this.layers.get(layerName);
    if (layer) {
      layer.pattern = undefined;
    }
  }

  /**
   * Update layer properties
   */
  public updateLayer(
    layerName: string, 
    properties: Partial<Pick<RenderLayer, 'opacity' | 'blendMode' | 'zIndex'>>
  ): void {
    const layer = this.layers.get(layerName);
    if (!layer) {
      throw new Error(`Layer not found: ${layerName}`);
    }

    if (properties.opacity !== undefined) {
      layer.opacity = Math.max(0, Math.min(1, properties.opacity));
    }
    
    if (properties.blendMode !== undefined) {
      layer.blendMode = properties.blendMode;
    }
    
    if (properties.zIndex !== undefined) {
      layer.zIndex = properties.zIndex;
      this.updateSortedLayers();
    }
  }

  /**
   * Update sorted layers array based on zIndex
   */
  private updateSortedLayers(): void {
    this.sortedLayers = Array.from(this.layers.values())
      .sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Update all patterns in layers
   */
  public updateLayers(deltaTime: number): void {
    for (const layer of this.sortedLayers) {
      if (layer.pattern && layer.ctx) {
        // Clear layer canvas
        layer.ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        layer.ctx.clearRect(0, 0, layer.canvas!.width, layer.canvas!.height);
        
        // Update and render pattern
        layer.pattern.update(deltaTime);
        layer.pattern.render();
      }
    }
  }

  /**
   * Render all layers to main canvas
   */
  public renderLayers(): void {
    // Clear main canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render layers in order
    for (const layer of this.sortedLayers) {
      if (layer.canvas && layer.opacity > 0) {
        this.ctx.save();
        
        // Set layer properties
        this.ctx.globalAlpha = layer.opacity;
        this.ctx.globalCompositeOperation = layer.blendMode;
        
        // Draw layer to main canvas
        this.ctx.drawImage(layer.canvas, 0, 0);
        
        this.ctx.restore();
      }
    }
  }

  /**
   * Get layer by name
   */
  public getLayer(layerName: string): RenderLayer | undefined {
    return this.layers.get(layerName);
  }

  /**
   * Get all layers
   */
  public getAllLayers(): RenderLayer[] {
    return [...this.sortedLayers];
  }

  /**
   * Remove a layer
   */
  public removeLayer(layerName: string): void {
    const layer = this.layers.get(layerName);
    if (layer && layer.pattern) {
      layer.pattern.cleanup();
    }
    
    this.layers.delete(layerName);
    this.updateSortedLayers();
  }

  /**
   * Resize all layer canvases
   */
  public resize(width: number, height: number): void {
    for (const layer of this.layers.values()) {
      if (layer.canvas && layer.ctx) {
        layer.canvas.width = width;
        layer.canvas.height = height;
        
        // Restore font properties after resize
        layer.ctx.font = this.ctx.font;
        layer.ctx.textBaseline = this.ctx.textBaseline;
        layer.ctx.textAlign = this.ctx.textAlign;
      }
    }
  }

  /**
   * Create a layer effect (e.g., blur, glow)
   */
  public applyLayerEffect(layerName: string, effect: string, intensity: number = 1): void {
    const layer = this.layers.get(layerName);
    if (!layer || !layer.ctx) return;

    switch (effect) {
      case 'blur':
        layer.ctx.filter = `blur(${intensity}px)`;
        break;
      case 'glow':
        layer.ctx.shadowColor = '#00ff00';
        layer.ctx.shadowBlur = intensity * 10;
        break;
      case 'contrast':
        layer.ctx.filter = `contrast(${100 + intensity * 50}%)`;
        break;
      case 'brightness':
        layer.ctx.filter = `brightness(${100 + intensity * 50}%)`;
        break;
      default:
        layer.ctx.filter = 'none';
        layer.ctx.shadowBlur = 0;
    }
  }

  /**
   * Clear layer effect
   */
  public clearLayerEffect(layerName: string): void {
    const layer = this.layers.get(layerName);
    if (layer && layer.ctx) {
      layer.ctx.filter = 'none';
      layer.ctx.shadowBlur = 0;
      layer.ctx.shadowColor = 'transparent';
    }
  }

  /**
   * Animate layer property over time
   */
  public animateLayer(
    layerName: string, 
    property: 'opacity' | 'zIndex', 
    targetValue: number, 
    duration: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const layer = this.layers.get(layerName);
      if (!layer) {
        resolve();
        return;
      }

      const startValue = property === 'opacity' ? layer.opacity : layer.zIndex;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out animation
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (targetValue - startValue) * easedProgress;

        if (property === 'opacity') {
          layer.opacity = currentValue;
        } else {
          layer.zIndex = Math.round(currentValue);
          this.updateSortedLayers();
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Clean up all layers
   */
  public cleanup(): void {
    for (const layer of this.layers.values()) {
      if (layer.pattern) {
        layer.pattern.cleanup();
      }
    }
    
    this.layers.clear();
    this.sortedLayers = [];
  }
}