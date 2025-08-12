/**
 * Performance optimization system for the screensaver
 * Monitors performance metrics and automatically adjusts settings
 */

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  lastUpdate: number;
}

interface OptimizationSettings {
  targetFPS: number;
  maxMemoryMB: number;
  maxCPUPercent: number;
  maxRenderTimeMs: number;
}

interface PerformanceOptimizationCallbacks {
  onPerformanceDegradation: (metrics: PerformanceMetrics) => void;
  onPerformanceRecovery: (metrics: PerformanceMetrics) => void;
  onOptimizationApplied: (optimization: string) => void;
}

export class PerformanceOptimizer {
  private metrics: PerformanceMetrics = {
    fps: 60,
    memoryUsage: 0,
    cpuUsage: 0,
    renderTime: 0,
    lastUpdate: performance.now()
  };

  private settings: OptimizationSettings = {
    targetFPS: 60,
    maxMemoryMB: 50,
    maxCPUPercent: 5,
    maxRenderTimeMs: 16.67 // ~60fps
  };

  private callbacks: PerformanceOptimizationCallbacks;
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private performanceHistory: PerformanceMetrics[] = [];
  private optimizationLevel = 0; // 0 = full quality, 3 = maximum optimization
  private isMonitoring = false;
  private monitoringInterval: number | null = null;

  constructor(callbacks: PerformanceOptimizationCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(() => {
      this.updateMetrics();
      this.checkPerformance();
    }, 1000); // Check every second

    console.log('PerformanceOptimizer: Monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('PerformanceOptimizer: Monitoring stopped');
  }

  /**
   * Update frame metrics (call this from animation loop)
   */
  updateFrame(renderStartTime: number): void {
    const now = performance.now();
    const renderTime = now - renderStartTime;
    
    this.frameCount++;
    this.metrics.renderTime = renderTime;

    // Calculate FPS every second
    if (now - this.lastFrameTime >= 1000) {
      this.metrics.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    const now = performance.now();
    
    // Update memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // MB
    }

    // Estimate CPU usage based on render time
    this.metrics.cpuUsage = Math.min((this.metrics.renderTime / 16.67) * 100, 100);
    this.metrics.lastUpdate = now;

    // Store in history (keep last 60 seconds)
    this.performanceHistory.push({ ...this.metrics });
    if (this.performanceHistory.length > 60) {
      this.performanceHistory.shift();
    }
  }

  /**
   * Check performance and apply optimizations if needed
   */
  private checkPerformance(): void {
    const { fps, memoryUsage, cpuUsage, renderTime } = this.metrics;
    const { targetFPS, maxMemoryMB, maxCPUPercent, maxRenderTimeMs } = this.settings;

    // Check if performance is degraded
    const isPerformanceDegraded = 
      fps < targetFPS * 0.8 || // FPS below 80% of target
      memoryUsage > maxMemoryMB ||
      cpuUsage > maxCPUPercent ||
      renderTime > maxRenderTimeMs * 1.5;

    if (isPerformanceDegraded && this.optimizationLevel < 3) {
      this.applyOptimization();
      this.callbacks.onPerformanceDegradation(this.metrics);
    } else if (!isPerformanceDegraded && this.optimizationLevel > 0) {
      // Check if we can reduce optimization level
      const recentMetrics = this.performanceHistory.slice(-10);
      const avgFPS = recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
      
      if (avgFPS > targetFPS * 0.95) {
        this.reduceOptimization();
        this.callbacks.onPerformanceRecovery(this.metrics);
      }
    }
  }

  /**
   * Apply performance optimizations
   */
  private applyOptimization(): void {
    this.optimizationLevel = Math.min(this.optimizationLevel + 1, 3);
    
    let optimization = '';
    
    switch (this.optimizationLevel) {
      case 1:
        optimization = 'Reduced particle effects';
        break;
      case 2:
        optimization = 'Simplified ASCII patterns';
        break;
      case 3:
        optimization = 'Minimal rendering mode';
        break;
    }

    console.log(`PerformanceOptimizer: Applied optimization level ${this.optimizationLevel}: ${optimization}`);
    this.callbacks.onOptimizationApplied(optimization);
  }

  /**
   * Reduce optimization level
   */
  private reduceOptimization(): void {
    this.optimizationLevel = Math.max(this.optimizationLevel - 1, 0);
    
    const optimization = this.optimizationLevel === 0 
      ? 'Full quality restored' 
      : `Optimization reduced to level ${this.optimizationLevel}`;

    console.log(`PerformanceOptimizer: ${optimization}`);
    this.callbacks.onOptimizationApplied(optimization);
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current optimization level
   */
  getOptimizationLevel(): number {
    return this.optimizationLevel;
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const { fps, memoryUsage, cpuUsage } = this.metrics;

    if (fps < 30) {
      recommendations.push('Consider reducing animation complexity');
    }
    
    if (memoryUsage > 40) {
      recommendations.push('High memory usage detected - consider reloading');
    }
    
    if (cpuUsage > 10) {
      recommendations.push('High CPU usage - reduce background processes');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal');
    }

    return recommendations;
  }

  /**
   * Force garbage collection if available (for testing)
   */
  forceGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
      console.log('PerformanceOptimizer: Forced garbage collection');
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    current: PerformanceMetrics;
    average: PerformanceMetrics;
    optimizationLevel: number;
    recommendations: string[];
  } {
    const recent = this.performanceHistory.slice(-10);
    const average: PerformanceMetrics = {
      fps: recent.reduce((sum, m) => sum + m.fps, 0) / recent.length || 0,
      memoryUsage: recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length || 0,
      cpuUsage: recent.reduce((sum, m) => sum + m.cpuUsage, 0) / recent.length || 0,
      renderTime: recent.reduce((sum, m) => sum + m.renderTime, 0) / recent.length || 0,
      lastUpdate: this.metrics.lastUpdate
    };

    return {
      current: this.getMetrics(),
      average,
      optimizationLevel: this.optimizationLevel,
      recommendations: this.getRecommendations()
    };
  }

  /**
   * Reset optimization level
   */
  resetOptimization(): void {
    this.optimizationLevel = 0;
    this.callbacks.onOptimizationApplied('Optimization reset to full quality');
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<OptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('PerformanceOptimizer: Settings updated', this.settings);
  }
}

export default PerformanceOptimizer;
