// Example usage of ASCIIPatternEngine and BasePattern
// This file demonstrates how to use the engine and can be used for manual testing

import { ASCIIPatternEngine } from './ASCIIPatternEngine';
import { TestPattern } from './BasePattern';
import { PatternConfig } from '../types';

/**
 * Example function to demonstrate engine usage
 * This would typically be called from a React component
 */
export function createExampleEngine(canvas: HTMLCanvasElement): ASCIIPatternEngine {
  // Create engine with custom configuration
  const engine = new ASCIIPatternEngine(canvas, {
    fontSize: 14,
    fontFamily: 'Courier New, monospace',
    backgroundColor: '#000011',
    foregroundColor: '#00ff41',
    enableDebug: true
  });
  
  // Register the test pattern
  engine.registerPattern('test', TestPattern);
  
  return engine;
}

/**
 * Example function to start a basic animation
 */
export async function startExampleAnimation(engine: ASCIIPatternEngine): Promise<void> {
  // Configure the test pattern
  const patternConfig: PatternConfig = {
    characters: '01#*+-.=',
    speed: 'medium',
    density: 'high'
  };
  
  // Switch to test pattern
  await engine.switchPattern('test', 'fade', patternConfig);
  
  // Start animation
  engine.startAnimation();
  
  console.log('Example animation started');
}

/**
 * Example function to demonstrate pattern switching
 */
export async function demonstratePatternSwitching(engine: ASCIIPatternEngine): Promise<void> {
  const patterns = ['test'];
  let currentIndex = 0;
  
  const switchPattern = async () => {
    const patternName = patterns[currentIndex];
    const config: PatternConfig = {
      characters: currentIndex % 2 === 0 ? '01' : '#*+',
      speed: currentIndex % 3 === 0 ? 'slow' : currentIndex % 3 === 1 ? 'medium' : 'fast',
      density: 'medium'
    };
    
    await engine.switchPattern(patternName, 'fade', config);
    currentIndex = (currentIndex + 1) % patterns.length;
  };
  
  // Switch patterns every 5 seconds
  setInterval(switchPattern, 5000);
  
  console.log('Pattern switching demonstration started');
}

/**
 * Example cleanup function
 */
export function cleanupExample(engine: ASCIIPatternEngine): void {
  engine.stopAnimation();
  engine.cleanup();
  console.log('Example cleaned up');
}

// Export types for external use
export type { EngineConfig } from './ASCIIPatternEngine';
export { ASCIIPatternEngine, BasePattern, TestPattern };