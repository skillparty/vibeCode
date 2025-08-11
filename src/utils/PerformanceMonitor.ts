/**
 * Performance monitoring system for the ASCII screensaver
 * Tracks FPS, memory usage, and provides automatic performance degradation
 */

export interface PerformanceMetrics {
  fps: number;
  averageFps: number;
  frameTime: number;
  memoryUsage: number;
  isPerformanceDegraded: boolean;
  degradationLevel: number;
}

export interface PerformanceConfig {
  targetFps: number;
  minFps: number;
  memoryThreshold: number; // MB
  sampleSize: number;
  degradationThreshold: number;
  enableMemoryMonitoring: boolean;
  enableAutoOptimization: boolean;
}

export type PerformanceCallback = (metrics: PerformanceMetrics) => void;

export class PerformanceMonitor {
  private config: PerformanceConfig;
  private frameCount: number = 0;
  private lastTime: number = 0;
  private currentFps: number = 60;
  private frameTimes: number[] = [];
  private memoryUsage: number = 0;
  private isMonitoring: boolean = false;
  private degradationLevel: number = 0;
  private callbacks: PerformanceCallback[] = [];
  private monitoringInterval: number | null = null;
  
  // Performance optimization flags
  private isPerformanceDegraded: boolean = false;
  private lastOptimizationTime: number = 0;
  private optimizationCooldown: number = 2000; // 2 seconds
  
  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      targetFps: 60,
      minFps: 30,
      memoryThreshold: 50, // 50MB
      sampleSize: 60, // 1 second at 60fps
      degradationThreshold: 45, // Start degradation below 45fps
      enableMemoryMonitoring: true,
      enableAutoOptimization: true,
      ...config
    };
    
    // Initialize frame times array
    this.frameTimes = new Array(this.config.sampleSize).fill(16.67); // ~60fps
  }
  
  /**
   * Start performance monitoring
   */
  public start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    
    // Start memory monitoring if enabled
    if (this.config.enableMemoryMonitoring) {
      this.startMemoryMonitoring();
    }
    
    console.log('Performance monitoring started');
  }
  
  /**
   * Stop performance monitoring
   */
  public stop(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('Performance monitoring stopped');
  }
  
  /**
   * Update performance metrics (call this every frame)
   */
  public update(currentTime: number): void {
    if (!this.isMonitoring) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.frameCount++;
    
    // Update frame times
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > this.config.sampleSize) {
      this.frameTimes.shift();
    }
    
    // Calculate current FPS
    this.currentFps = Math.min(1000 / deltaTime, this.config.targetFps);
    
    // Check for performance issues
    this.checkPerformance();
    
    // Notify callbacks
    this.notifyCallbacks();
  }
  
  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    const averageFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
    const averageFps = Math.min(1000 / averageFrameTime, this.config.targetFps);
    
    return {
      fps: this.currentFps,
      averageFps,
      frameTime: this.lastTime > 0 ? performance.now() - this.lastTime : 0,
      memoryUsage: this.memoryUsage,
      isPerformanceDegraded: this.isPerformanceDegraded,
      degradationLevel: this.degradationLevel
    };
  }
  
  /**
   * Add performance callback
   */
  public addCallback(callback: PerformanceCallback): void {
    this.callbacks.push(callback);
  }
  
  /**
   * Remove performance callback
   */
  public removeCallback(callback: PerformanceCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }
  
  /**
   * Force performance degradation for testing
   */
  public forceDegradation(level: number): void {
    this.degradationLevel = Math.max(0, Math.min(3, level));
    this.isPerformanceDegraded = this.degradationLevel > 0;
    console.log(`Performance degradation forced to level ${this.degradationLevel}`);
  }
  
  /**
   * Reset performance state
   */
  public reset(): void {
    this.frameCount = 0;
    this.frameTimes = new Array(this.config.sampleSize).fill(16.67);
    this.degradationLevel = 0;
    this.isPerformanceDegraded = false;
    this.lastOptimizationTime = 0;
  }
  
  /**
   * Get performance recommendations
   */
  public getRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();
    
    if (metrics.averageFps < this.config.degradationThreshold) {
      recommendations.push('Consider reducing pattern complexity');
      recommendations.push('Disable particle effects');
      recommendations.push('Reduce animation speed');
    }
    
    if (metrics.memoryUsage > this.config.memoryThreshold * 0.8) {
      recommendations.push('Memory usage is high - consider pattern cleanup');
      recommendations.push('Reduce pattern history cache');
    }
    
    if (metrics.frameTime > 20) {
      recommendations.push('Frame time is high - optimize render loop');
    }
    
    return recommendations;
  }
  
  /**
   * Check performance and trigger optimizations if needed
   */
  private checkPerformance(): void {
    if (!this.config.enableAutoOptimization) return;
    
    const now = performance.now();
    if (now - this.lastOptimizationTime < this.optimizationCooldown) return;
    
    const metrics = this.getMetrics();
    
    // Check if we need to degrade performance
    if (metrics.averageFps < this.config.degradationThreshold && !this.isPerformanceDegraded) {
      this.triggerPerformanceDegradation();
      this.lastOptimizationTime = now;
    }
    
    // Check if we can restore performance
    else if (metrics.averageFps > this.config.degradationThreshold + 5 && this.isPerformanceDegraded) {
      this.restorePerformance();
      this.lastOptimizationTime = now;
    }
    
    // Memory pressure check
    if (this.config.enableMemoryMonitoring && metrics.memoryUsage > this.config.memoryThreshold) {
      this.triggerMemoryOptimization();
      this.lastOptimizationTime = now;
    }
  }
  
  /**
   * Trigger performance degradation
   */
  private triggerPerformanceDegradation(): void {
    const currentLevel = this.degradationLevel;
    const newLevel = Math.min(3, currentLevel + 1);
    
    if (newLevel !== currentLevel) {
      this.degradationLevel = newLevel;
      this.isPerformanceDegraded = true;
      
      console.warn(`Performance degradation triggered - Level ${newLevel}`);
      console.warn(`Current FPS: ${this.getMetrics().averageFps.toFixed(1)}`);
      
      // Notify callbacks about degradation
      this.notifyCallbacks();
    }
  }
  
  /**
   * Restore performance to previous level
   */
  private restorePerformance(): void {
    const currentLevel = this.degradationLevel;
    const newLevel = Math.max(0, currentLevel - 1);
    
    if (newLevel !== currentLevel) {
      this.degradationLevel = newLevel;
      this.isPerformanceDegraded = newLevel > 0;
      
      console.log(`Performance restored - Level ${newLevel}`);
      console.log(`Current FPS: ${this.getMetrics().averageFps.toFixed(1)}`);
      
      // Notify callbacks about restoration
      this.notifyCallbacks();
    }
  }
  
  /**
   * Trigger memory optimization
   */
  private triggerMemoryOptimization(): void {
    console.warn(`Memory threshold exceeded: ${this.memoryUsage.toFixed(1)}MB`);
    
    // Force garbage collection if available (development only)
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
    
    // Notify callbacks about memory pressure
    this.notifyCallbacks();
  }
  
  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    // Check if Performance API with memory is available
    if (!('memory' in performance)) {
      console.warn('Memory monitoring not available in this browser');
      return;
    }
    
    this.monitoringInterval = window.setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
      }
    }, 1000); // Check every second
  }
  
  /**
   * Notify all callbacks with current metrics
   */
  private notifyCallbacks(): void {
    const metrics = this.getMetrics();
    this.callbacks.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Performance callback error:', error);
      }
    });
  }
  
  /**
   * Get performance summary for debugging
   */
  public getPerformanceSummary(): string {
    const metrics = this.getMetrics();
    return `FPS: ${metrics.fps.toFixed(1)} (avg: ${metrics.averageFps.toFixed(1)}) | ` +
           `Memory: ${metrics.memoryUsage.toFixed(1)}MB | ` +
           `Degraded: ${metrics.isPerformanceDegraded ? `Level ${metrics.degradationLevel}` : 'No'}`;
  }
  
  /**
   * Export performance data for analysis
   */
  public exportData(): any {
    return {
      config: this.config,
      metrics: this.getMetrics(),
      frameTimes: [...this.frameTimes],
      timestamp: Date.now(),
      recommendations: this.getRecommendations()
    };
  }
}