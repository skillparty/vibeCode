import { ASCIIPatternEngine } from '../ASCIIPatternEngine';
import { TransitionManager } from '../TransitionManager';
import { LayerManager } from '../LayerManager';
import { PatternSynchronizer } from '../PatternSynchronizer';
import { MatrixRain } from '../MatrixRain';
import { BinaryWaves } from '../BinaryWaves';

// Mock Canvas 2D context
const createMockContext = () => ({
  fillStyle: '#000000',
  font: '12px monospace',
  textBaseline: 'top',
  textAlign: 'left',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  filter: 'none',
  shadowBlur: 0,
  shadowColor: 'transparent',
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  drawImage: jest.fn(),
  measureText: jest.fn(() => ({ width: 8 })),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(800 * 600 * 4),
    width: 800,
    height: 600
  })),
  putImageData: jest.fn(),
  createImageData: jest.fn((width, height) => ({
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height
  })),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn()
});

// Mock canvas and context
const createMockCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  
  // Mock getContext to return our mock context
  const mockContext = createMockContext();
  canvas.getContext = jest.fn(() => mockContext);
  
  // Mock parent element
  const parent = document.createElement('div');
  parent.style.width = '800px';
  parent.style.height = '600px';
  parent.appendChild(canvas);
  
  return canvas;
};

describe('Pattern Transitions Integration Tests', () => {
  let canvas: HTMLCanvasElement;
  let engine: ASCIIPatternEngine;

  beforeEach(() => {
    canvas = createMockCanvas();
    engine = new ASCIIPatternEngine(canvas, { enableDebug: false });
  });

  afterEach(() => {
    if (engine) {
      engine.cleanup();
    }
  });

  describe('Basic Pattern Switching', () => {
    test('should switch between patterns with fade transition', async () => {
      // Start with matrix rain
      await engine.switchPattern('matrix-rain');
      expect(engine.getCurrentPattern()).toBeTruthy();
      expect(engine.getCurrentPattern()?.name).toBe('matrix-rain');

      // Switch to binary waves with fade
      await engine.switchPattern('binary-waves', { type: 'fade', duration: 500 });
      expect(engine.getCurrentPattern()?.name).toBe('binary-waves');
    });

    test('should handle transition state correctly', async () => {
      await engine.switchPattern('matrix-rain');
      
      // Start transition
      const transitionPromise = engine.switchPattern('binary-waves', { 
        type: 'morph', 
        duration: 1000 
      });
      
      // Check transition state
      const transitionState = engine.getTransitionState();
      expect(['idle', 'transitioning']).toContain(transitionState.type);
      
      await transitionPromise;
    });

    test('should support all transition types', async () => {
      const transitionTypes = ['fade', 'morph', 'displacement', 'glitch', 'slide', 'rotate3d'];
      
      await engine.switchPattern('matrix-rain');
      
      for (const transitionType of transitionTypes) {
        await engine.switchPattern('binary-waves', { 
          type: transitionType as any, 
          duration: 100 
        });
        expect(engine.getCurrentPattern()?.name).toBe('binary-waves');
        
        await engine.switchPattern('matrix-rain', { 
          type: transitionType as any, 
          duration: 100 
        });
        expect(engine.getCurrentPattern()?.name).toBe('matrix-rain');
      }
    });
  });

  describe('Multi-Layer Rendering', () => {
    test('should enable multi-layer mode', () => {
      engine.setMultiLayerMode(true);
      const layerManager = engine.getLayerManager();
      expect(layerManager).toBeInstanceOf(LayerManager);
    });

    test('should add patterns to different layers', () => {
      engine.setMultiLayerMode(true);
      
      // Add patterns to different layers
      engine.addPatternToLayer('background', 'mandelbrot-ascii');
      engine.addPatternToLayer('middle', 'matrix-rain');
      engine.addPatternToLayer('foreground', 'terminal-cursor');
      
      const layerManager = engine.getLayerManager();
      const layers = layerManager.getAllLayers();
      
      expect(layers.length).toBeGreaterThanOrEqual(3);
      expect(layers.some(layer => layer.name === 'background')).toBe(true);
      expect(layers.some(layer => layer.name === 'middle')).toBe(true);
      expect(layers.some(layer => layer.name === 'foreground')).toBe(true);
    });

    test('should apply layer effects', () => {
      engine.setMultiLayerMode(true);
      engine.addPatternToLayer('background', 'binary-waves');
      
      // Apply blur effect
      engine.applyLayerEffect('background', 'blur', 2);
      
      const layer = engine.getLayerManager().getLayer('background');
      expect(layer).toBeTruthy();
    });

    test('should animate layer properties', async () => {
      engine.setMultiLayerMode(true);
      engine.addPatternToLayer('middle', 'matrix-rain');
      
      const layerManager = engine.getLayerManager();
      const layer = layerManager.getLayer('middle');
      
      if (layer) {
        // Start with low opacity
        layerManager.updateLayer('middle', { opacity: 0.2 });
        expect(layer.opacity).toBe(0.2);
        
        // Animate to full opacity
        await layerManager.animateLayer('middle', 'opacity', 1.0, 100);
        expect(layer.opacity).toBe(1.0);
      }
    });
  });

  describe('Pattern Synchronization', () => {
    test('should synchronize patterns with master tempo', () => {
      const synchronizer = engine.getSynchronizer();
      
      // Set tempo
      engine.setSyncTempo(140);
      expect(synchronizer.getTempo()).toBe(140);
      
      // Register patterns
      const canvas2 = createMockCanvas();
      const ctx2 = canvas2.getContext('2d')!;
      const pattern1 = new MatrixRain(ctx2, {} as any);
      const pattern2 = new BinaryWaves(ctx2, {} as any);
      
      synchronizer.registerPattern('pattern1', pattern1);
      synchronizer.registerPattern('pattern2', pattern2);
      
      // Start synchronization
      synchronizer.start();
      expect(synchronizer.getTempo()).toBe(140);
    });

    test('should provide timing information', () => {
      const synchronizer = engine.getSynchronizer();
      synchronizer.start();
      
      const timingInfo = synchronizer.getTimingInfo();
      expect(timingInfo).toHaveProperty('masterClock');
      expect(timingInfo).toHaveProperty('beat');
      expect(timingInfo).toHaveProperty('measure');
      expect(timingInfo).toHaveProperty('phrase');
      expect(timingInfo).toHaveProperty('beatPhase');
    });

    test('should handle sync callbacks', (done) => {
      const synchronizer = engine.getSynchronizer();
      
      synchronizer.onSync((event) => {
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('timestamp');
        expect(['beat', 'measure', 'phrase']).toContain(event.type);
        done();
      });
      
      synchronizer.start();
      
      // Simulate time passing to trigger beat
      setTimeout(() => {
        synchronizer.update(1000); // 1 second
      }, 10);
    });

    test('should quantize values to beat grid', () => {
      const synchronizer = engine.getSynchronizer();
      synchronizer.setTempo(120); // 120 BPM = 500ms per beat
      
      // Test quantization
      const quantized = synchronizer.quantize(750, 4); // Should snap to nearest 1/4 beat
      expect(quantized).toBeCloseTo(750, 0); // Allow some tolerance
    });
  });

  describe('Animation Loop Integration', () => {
    test('should start and stop animation with transitions', () => {
      engine.startAnimation();
      expect(engine.isAnimating()).toBe(true);
      
      engine.stopAnimation();
      expect(engine.isAnimating()).toBe(false);
    });

    test('should handle animation with multi-layer mode', async () => {
      engine.setMultiLayerMode(true);
      engine.addPatternToLayer('background', 'binary-waves');
      engine.addPatternToLayer('foreground', 'matrix-rain');
      
      engine.startAnimation();
      expect(engine.isAnimating()).toBe(true);
      
      // Let animation run briefly
      await new Promise(resolve => setTimeout(resolve, 50));
      
      engine.stopAnimation();
    });

    test('should handle resize with layers', () => {
      engine.setMultiLayerMode(true);
      engine.addPatternToLayer('middle', 'matrix-rain');
      
      // Resize canvas
      engine.resize(1024, 768);
      
      const gridDimensions = engine.getGridDimensions();
      expect(gridDimensions.width).toBeGreaterThan(0);
      expect(gridDimensions.height).toBeGreaterThan(0);
    });
  });

  describe('Transition Manager', () => {
    test('should create transition manager', () => {
      const transitionManager = engine.getTransitionManager();
      expect(transitionManager).toBeInstanceOf(TransitionManager);
    });

    test('should handle transition completion', async () => {
      await engine.switchPattern('matrix-rain');
      
      // Start a quick transition
      const transitionPromise = engine.switchPattern('binary-waves', { 
        type: 'fade', 
        duration: 50 
      });
      
      // Force complete transition
      engine.forceCompleteTransition();
      
      await transitionPromise;
      expect(engine.getCurrentPattern()?.name).toBe('binary-waves');
    });

    test('should handle multiple rapid transitions', async () => {
      await engine.switchPattern('matrix-rain');
      
      // Start multiple transitions rapidly
      const promises = [
        engine.switchPattern('binary-waves', { type: 'fade', duration: 100 }),
        engine.switchPattern('geometric-flow', { type: 'slide', duration: 100 }),
        engine.switchPattern('terminal-cursor', { type: 'morph', duration: 100 })
      ];
      
      await Promise.all(promises);
      expect(engine.getCurrentPattern()?.name).toBe('terminal-cursor');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid pattern names', async () => {
      await expect(engine.switchPattern('invalid-pattern')).rejects.toThrow('Pattern not found');
    });

    test('should handle invalid layer operations', () => {
      engine.setMultiLayerMode(true);
      
      expect(() => {
        engine.addPatternToLayer('invalid-layer', 'invalid-pattern');
      }).toThrow('Pattern not found');
    });

    test('should cleanup properly on errors', async () => {
      try {
        await engine.switchPattern('invalid-pattern');
      } catch (error) {
        // Should not affect engine state
        expect(engine.getCurrentPattern()).toBeNull();
      }
      
      // Should still be able to switch to valid pattern
      await engine.switchPattern('matrix-rain');
      expect(engine.getCurrentPattern()?.name).toBe('matrix-rain');
    });
  });

  describe('Performance', () => {
    test('should maintain reasonable performance with transitions', async () => {
      const startTime = performance.now();
      
      // Perform multiple transitions
      await engine.switchPattern('matrix-rain', { type: 'fade', duration: 10 });
      await engine.switchPattern('binary-waves', { type: 'morph', duration: 10 });
      await engine.switchPattern('geometric-flow', { type: 'slide', duration: 10 });
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete within reasonable time (less than 1 second for quick transitions)
      expect(totalTime).toBeLessThan(1000);
    });

    test('should handle rapid animation updates', () => {
      engine.startAnimation();
      
      // Simulate rapid updates
      const startTime = performance.now();
      let frameCount = 0;
      
      const testFrames = () => {
        frameCount++;
        if (frameCount < 60 && performance.now() - startTime < 1000) {
          requestAnimationFrame(testFrames);
        }
      };
      
      requestAnimationFrame(testFrames);
      
      setTimeout(() => {
        engine.stopAnimation();
        expect(frameCount).toBeGreaterThan(0);
      }, 100);
    });
  });
});