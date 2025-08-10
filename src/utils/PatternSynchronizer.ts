import { Pattern } from '../types';

export interface SyncConfig {
  masterTempo: number; // BPM-like timing
  syncMode: 'strict' | 'loose' | 'independent';
  phaseOffset: number; // 0-1, offset in the cycle
  quantization: number; // How many beats to quantize to
}

export interface SyncEvent {
  type: 'beat' | 'measure' | 'phrase';
  timestamp: number;
  beat: number;
  measure: number;
  phrase: number;
}

export class PatternSynchronizer {
  private patterns: Map<string, { pattern: Pattern; config: SyncConfig }> = new Map();
  private masterClock: number = 0;
  private lastUpdateTime: number = 0;
  private tempo: number = 120; // BPM
  private isRunning: boolean = false;
  private syncCallbacks: ((event: SyncEvent) => void)[] = [];
  private beatCount: number = 0;
  private measureCount: number = 0;
  private phraseCount: number = 0;

  constructor(tempo: number = 120) {
    this.tempo = tempo;
    this.lastUpdateTime = performance.now();
  }

  /**
   * Register a pattern for synchronization
   */
  public registerPattern(name: string, pattern: Pattern, config: Partial<SyncConfig> = {}): void {
    const fullConfig: SyncConfig = {
      masterTempo: this.tempo,
      syncMode: 'loose',
      phaseOffset: 0,
      quantization: 4,
      ...config
    };

    this.patterns.set(name, { pattern, config: fullConfig });
  }

  /**
   * Unregister a pattern
   */
  public unregisterPattern(name: string): void {
    this.patterns.delete(name);
  }

  /**
   * Start synchronization
   */
  public start(): void {
    this.isRunning = true;
    this.lastUpdateTime = performance.now();
    this.masterClock = 0;
    this.beatCount = 0;
    this.measureCount = 0;
    this.phraseCount = 0;
  }

  /**
   * Stop synchronization
   */
  public stop(): void {
    this.isRunning = false;
  }

  /**
   * Update synchronization clock and notify patterns
   */
  public update(deltaTime: number): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const actualDelta = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    // Update master clock (in beats)
    const beatsPerMs = this.tempo / 60000;
    this.masterClock += actualDelta * beatsPerMs;

    // Check for beat boundaries
    const currentBeat = Math.floor(this.masterClock);
    if (currentBeat > this.beatCount) {
      this.beatCount = currentBeat;
      this.onBeat();
    }

    // Check for measure boundaries (4 beats per measure)
    const currentMeasure = Math.floor(this.beatCount / 4);
    if (currentMeasure > this.measureCount) {
      this.measureCount = currentMeasure;
      this.onMeasure();
    }

    // Check for phrase boundaries (4 measures per phrase)
    const currentPhrase = Math.floor(this.measureCount / 4);
    if (currentPhrase > this.phraseCount) {
      this.phraseCount = currentPhrase;
      this.onPhrase();
    }

    // Update synchronized patterns
    this.updateSynchronizedPatterns(deltaTime);
  }

  /**
   * Update patterns with synchronized timing
   */
  private updateSynchronizedPatterns(deltaTime: number): void {
    for (const [name, { pattern, config }] of this.patterns) {
      let adjustedDelta = deltaTime;

      switch (config.syncMode) {
        case 'strict':
          // Patterns update exactly on beat boundaries
          adjustedDelta = this.getStrictSyncDelta(config);
          break;
        case 'loose':
          // Patterns update with slight timing adjustments
          adjustedDelta = this.getLooseSyncDelta(deltaTime, config);
          break;
        case 'independent':
          // Patterns update independently
          adjustedDelta = deltaTime;
          break;
      }

      // Apply phase offset
      const phaseAdjustedDelta = this.applyPhaseOffset(adjustedDelta, config.phaseOffset);
      
      // Update pattern with synchronized delta
      pattern.update(phaseAdjustedDelta);
    }
  }

  /**
   * Get strict synchronization delta (quantized to beats)
   */
  private getStrictSyncDelta(config: SyncConfig): number {
    const beatLength = 60000 / config.masterTempo; // ms per beat
    const quantizedBeatLength = beatLength / config.quantization;
    
    // Return delta that aligns with quantized beats
    return quantizedBeatLength;
  }

  /**
   * Get loose synchronization delta (slightly adjusted)
   */
  private getLooseSyncDelta(deltaTime: number, config: SyncConfig): number {
    const beatLength = 60000 / config.masterTempo;
    const beatPhase = (this.masterClock % 1);
    
    // Slightly adjust delta to drift towards beat alignment
    const adjustment = Math.sin(beatPhase * Math.PI * 2) * 0.1;
    return deltaTime * (1 + adjustment);
  }

  /**
   * Apply phase offset to delta timing
   */
  private applyPhaseOffset(deltaTime: number, phaseOffset: number): number {
    if (phaseOffset === 0) return deltaTime;
    
    const beatLength = 60000 / this.tempo;
    const offsetMs = phaseOffset * beatLength;
    
    // Adjust timing based on phase offset
    return deltaTime + (offsetMs * 0.01); // Small adjustment
  }

  /**
   * Handle beat events
   */
  private onBeat(): void {
    const event: SyncEvent = {
      type: 'beat',
      timestamp: performance.now(),
      beat: this.beatCount,
      measure: this.measureCount,
      phrase: this.phraseCount
    };

    this.notifyCallbacks(event);
  }

  /**
   * Handle measure events
   */
  private onMeasure(): void {
    const event: SyncEvent = {
      type: 'measure',
      timestamp: performance.now(),
      beat: this.beatCount,
      measure: this.measureCount,
      phrase: this.phraseCount
    };

    this.notifyCallbacks(event);
  }

  /**
   * Handle phrase events
   */
  private onPhrase(): void {
    const event: SyncEvent = {
      type: 'phrase',
      timestamp: performance.now(),
      beat: this.beatCount,
      measure: this.measureCount,
      phrase: this.phraseCount
    };

    this.notifyCallbacks(event);
  }

  /**
   * Notify all sync callbacks
   */
  private notifyCallbacks(event: SyncEvent): void {
    for (const callback of this.syncCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('Sync callback error:', error);
      }
    }
  }

  /**
   * Add sync event callback
   */
  public onSync(callback: (event: SyncEvent) => void): void {
    this.syncCallbacks.push(callback);
  }

  /**
   * Remove sync event callback
   */
  public offSync(callback: (event: SyncEvent) => void): void {
    const index = this.syncCallbacks.indexOf(callback);
    if (index > -1) {
      this.syncCallbacks.splice(index, 1);
    }
  }

  /**
   * Set master tempo
   */
  public setTempo(tempo: number): void {
    this.tempo = Math.max(60, Math.min(200, tempo)); // Clamp between 60-200 BPM
    
    // Update all pattern configs
    for (const { config } of this.patterns.values()) {
      config.masterTempo = this.tempo;
    }
  }

  /**
   * Get current tempo
   */
  public getTempo(): number {
    return this.tempo;
  }

  /**
   * Get current timing info
   */
  public getTimingInfo(): {
    masterClock: number;
    beat: number;
    measure: number;
    phrase: number;
    beatPhase: number;
  } {
    return {
      masterClock: this.masterClock,
      beat: this.beatCount,
      measure: this.measureCount,
      phrase: this.phraseCount,
      beatPhase: this.masterClock % 1
    };
  }

  /**
   * Quantize a value to the current beat grid
   */
  public quantize(value: number, subdivision: number = 4): number {
    const beatLength = 60000 / this.tempo;
    const quantizedLength = beatLength / subdivision;
    return Math.round(value / quantizedLength) * quantizedLength;
  }

  /**
   * Schedule a callback for a specific beat
   */
  public scheduleCallback(targetBeat: number, callback: () => void): void {
    const checkBeat = () => {
      if (this.beatCount >= targetBeat) {
        callback();
      } else if (this.isRunning) {
        requestAnimationFrame(checkBeat);
      }
    };
    
    requestAnimationFrame(checkBeat);
  }

  /**
   * Get pattern sync configuration
   */
  public getPatternConfig(name: string): SyncConfig | undefined {
    return this.patterns.get(name)?.config;
  }

  /**
   * Update pattern sync configuration
   */
  public updatePatternConfig(name: string, config: Partial<SyncConfig>): void {
    const patternData = this.patterns.get(name);
    if (patternData) {
      patternData.config = { ...patternData.config, ...config };
    }
  }

  /**
   * Clean up synchronizer
   */
  public cleanup(): void {
    this.stop();
    this.patterns.clear();
    this.syncCallbacks = [];
  }
}