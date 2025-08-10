import { Pattern, TransitionState, TransitionConfig, RenderLayer } from '../types';

export class TransitionManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private transitionState: TransitionState;
  private fromCanvas: HTMLCanvasElement | null = null;
  private toCanvas: HTMLCanvasElement | null = null;
  private fromCtx: CanvasRenderingContext2D | null = null;
  private toCtx: CanvasRenderingContext2D | null = null;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.transitionState = {
      type: 'idle',
      effect: 'fade',
      progress: 0,
      duration: 1000
    };
  }

  /**
   * Start a transition between two patterns
   */
  public startTransition(
    fromPattern: Pattern | null,
    toPattern: Pattern,
    config: TransitionConfig
  ): void {
    // Create temporary canvases for transition rendering
    this.createTransitionCanvases();

    // Render the from pattern to its canvas
    if (fromPattern && this.fromCtx) {
      this.renderPatternToCanvas(fromPattern, this.fromCtx);
    }

    // Initialize transition state
    this.transitionState = {
      type: 'transitioning',
      effect: config.type,
      progress: 0,
      duration: config.duration,
      startTime: performance.now(),
      fromPattern: fromPattern?.name,
      toPattern: toPattern.name
    };
  }

  /**
   * Update transition progress and render
   */
  public updateTransition(deltaTime: number, toPattern: Pattern): boolean {
    if (this.transitionState.type !== 'transitioning') {
      return false;
    }

    const currentTime = performance.now();
    const elapsed = currentTime - (this.transitionState.startTime || currentTime);
    this.transitionState.progress = Math.min(elapsed / this.transitionState.duration, 1);

    // Render the to pattern to its canvas
    if (this.toCtx) {
      this.renderPatternToCanvas(toPattern, this.toCtx);
    }

    // Apply transition effect
    this.renderTransition();

    // Check if transition is complete
    if (this.transitionState.progress >= 1) {
      this.completeTransition();
      return true;
    }

    return false;
  }

  /**
   * Create temporary canvases for transition rendering
   */
  private createTransitionCanvases(): void {
    // Create from canvas
    this.fromCanvas = document.createElement('canvas');
    this.fromCanvas.width = this.canvas.width;
    this.fromCanvas.height = this.canvas.height;
    this.fromCtx = this.fromCanvas.getContext('2d');

    // Create to canvas
    this.toCanvas = document.createElement('canvas');
    this.toCanvas.width = this.canvas.width;
    this.toCanvas.height = this.canvas.height;
    this.toCtx = this.toCanvas.getContext('2d');

    // Set font properties for both contexts
    if (this.fromCtx) {
      this.fromCtx.font = this.ctx.font;
      this.fromCtx.textBaseline = this.ctx.textBaseline;
      this.fromCtx.textAlign = this.ctx.textAlign;
    }

    if (this.toCtx) {
      this.toCtx.font = this.ctx.font;
      this.toCtx.textBaseline = this.ctx.textBaseline;
      this.toCtx.textAlign = this.ctx.textAlign;
    }
  }

  /**
   * Render a pattern to a specific canvas context
   */
  private renderPatternToCanvas(pattern: Pattern, ctx: CanvasRenderingContext2D): void {
    const originalCtx = (pattern as any).ctx;
    (pattern as any).ctx = ctx;
    
    // Clear the canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Render the pattern
    pattern.render();
    
    // Restore original context
    (pattern as any).ctx = originalCtx;
  }

  /**
   * Render the transition effect
   */
  private renderTransition(): void {
    // Clear main canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const progress = this.easeProgress(this.transitionState.progress);

    switch (this.transitionState.effect) {
      case 'fade':
        this.renderFadeTransition(progress);
        break;
      case 'morph':
        this.renderMorphTransition(progress);
        break;
      case 'displacement':
        this.renderDisplacementTransition(progress);
        break;
      case 'glitch':
        this.renderGlitchTransition(progress);
        break;
      case 'slide':
        this.renderSlideTransition(progress);
        break;
      case 'rotate3d':
        this.renderRotate3DTransition(progress);
        break;
    }
  }

  /**
   * Apply easing to transition progress
   */
  private easeProgress(progress: number): number {
    // Ease-in-out cubic
    return progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  /**
   * Render fade transition
   */
  private renderFadeTransition(progress: number): void {
    // Draw from pattern with decreasing opacity
    if (this.fromCanvas) {
      this.ctx.globalAlpha = 1 - progress;
      this.ctx.drawImage(this.fromCanvas, 0, 0);
    }

    // Draw to pattern with increasing opacity
    if (this.toCanvas) {
      this.ctx.globalAlpha = progress;
      this.ctx.drawImage(this.toCanvas, 0, 0);
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * Render morph transition with pixel-level blending
   */
  private renderMorphTransition(progress: number): void {
    if (!this.fromCanvas || !this.toCanvas) return;

    const fromImageData = this.fromCtx?.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const toImageData = this.toCtx?.getImageData(0, 0, this.canvas.width, this.canvas.height);

    if (!fromImageData || !toImageData) return;

    const morphedImageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    const fromData = fromImageData.data;
    const toData = toImageData.data;
    const morphedData = morphedImageData.data;

    for (let i = 0; i < fromData.length; i += 4) {
      // Interpolate RGB values
      morphedData[i] = fromData[i] * (1 - progress) + toData[i] * progress;     // R
      morphedData[i + 1] = fromData[i + 1] * (1 - progress) + toData[i + 1] * progress; // G
      morphedData[i + 2] = fromData[i + 2] * (1 - progress) + toData[i + 2] * progress; // B
      morphedData[i + 3] = Math.max(fromData[i + 3], toData[i + 3]); // A
    }

    this.ctx.putImageData(morphedImageData, 0, 0);
  }

  /**
   * Render displacement transition
   */
  private renderDisplacementTransition(progress: number): void {
    const displacement = Math.sin(progress * Math.PI) * 50;

    // Draw from pattern with displacement
    if (this.fromCanvas) {
      this.ctx.globalAlpha = 1 - progress;
      this.ctx.drawImage(this.fromCanvas, -displacement, 0);
    }

    // Draw to pattern with opposite displacement
    if (this.toCanvas) {
      this.ctx.globalAlpha = progress;
      this.ctx.drawImage(this.toCanvas, displacement, 0);
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * Render glitch transition
   */
  private renderGlitchTransition(progress: number): void {
    const glitchIntensity = Math.sin(progress * Math.PI * 4) * 20;
    const sliceHeight = 10;

    // Draw base pattern
    if (progress < 0.5 && this.fromCanvas) {
      this.ctx.drawImage(this.fromCanvas, 0, 0);
    } else if (this.toCanvas) {
      this.ctx.drawImage(this.toCanvas, 0, 0);
    }

    // Add glitch effect
    const sourceCanvas = progress < 0.5 ? this.fromCanvas : this.toCanvas;
    if (sourceCanvas) {
      for (let y = 0; y < this.canvas.height; y += sliceHeight) {
        const offset = (Math.random() - 0.5) * glitchIntensity;
        this.ctx.drawImage(
          sourceCanvas,
          0, y, this.canvas.width, sliceHeight,
          offset, y, this.canvas.width, sliceHeight
        );
      }
    }
  }

  /**
   * Render slide transition
   */
  private renderSlideTransition(progress: number): void {
    const slideOffset = this.canvas.width * progress;

    // Draw from pattern sliding out
    if (this.fromCanvas) {
      this.ctx.drawImage(this.fromCanvas, -slideOffset, 0);
    }

    // Draw to pattern sliding in
    if (this.toCanvas) {
      this.ctx.drawImage(this.toCanvas, this.canvas.width - slideOffset, 0);
    }
  }

  /**
   * Render 3D rotation transition
   */
  private renderRotate3DTransition(progress: number): void {
    const angle = progress * Math.PI;
    const scaleX = Math.cos(angle);

    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, 0);
    this.ctx.scale(Math.abs(scaleX), 1);
    this.ctx.translate(-this.canvas.width / 2, 0);

    if (scaleX >= 0 && this.fromCanvas) {
      this.ctx.drawImage(this.fromCanvas, 0, 0);
    } else if (scaleX < 0 && this.toCanvas) {
      this.ctx.drawImage(this.toCanvas, 0, 0);
    }

    this.ctx.restore();
  }

  /**
   * Complete the transition and clean up
   */
  private completeTransition(): void {
    this.transitionState = {
      type: 'idle',
      effect: 'fade',
      progress: 0,
      duration: 1000
    };

    // Clean up temporary canvases
    this.fromCanvas = null;
    this.toCanvas = null;
    this.fromCtx = null;
    this.toCtx = null;
  }

  /**
   * Get current transition state
   */
  public getTransitionState(): TransitionState {
    return { ...this.transitionState };
  }

  /**
   * Check if currently transitioning
   */
  public isTransitioning(): boolean {
    return this.transitionState.type === 'transitioning';
  }

  /**
   * Force complete current transition
   */
  public forceComplete(): void {
    if (this.transitionState.type === 'transitioning') {
      this.completeTransition();
    }
  }
}