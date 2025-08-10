import { LayerManager } from '../LayerManager';
import { Pattern } from '../../types';

// Mock pattern for testing
class MockPattern implements Pattern {
  name = 'mock-pattern';
  ctx: any;
  
  constructor(ctx: any) {
    this.ctx = ctx;
  }
  
  initialize(): void {}
  update(deltaTime: number): void {}
  render(): void {}
  cleanup(): void {}
}

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
  save: jest.fn(),
  restore: jest.fn(),
  canvas: { width: 800, height: 600 }
});

// Mock canvas
const createMockCanvas = () => {
  const mockContext = createMockContext();
  return {
    width: 800,
    height: 600,
    getContext: jest.fn(() => mockContext)
  };
};

// Mock document.createElement for canvas creation
const originalCreateElement = document.createElement;
beforeAll(() => {
  document.createElement = jest.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return createMockCanvas();
    }
    return originalCreateElement.call(document, tagName);
  });
});

afterAll(() => {
  document.createElement = originalCreateElement;
});

describe('LayerManager', () => {
  let layerManager: LayerManager;
  let mockCanvas: any;
  let mockContext: any;

  beforeEach(() => {
    mockCanvas = createMockCanvas();
    mockContext = mockCanvas.getContext('2d');
    layerManager = new LayerManager(mockCanvas, mockContext);
  });

  afterEach(() => {
    layerManager.cleanup();
  });

  describe('Layer Creation', () => {
    test('should initialize with default layers', () => {
      const layers = layerManager.getAllLayers();
      expect(layers.length).toBeGreaterThanOrEqual(3);
      
      const layerNames = layers.map(layer => layer.name);
      expect(layerNames).toContain('background');
      expect(layerNames).toContain('middle');
      expect(layerNames).toContain('foreground');
    });

    test('should create custom layer', () => {
      const layer = layerManager.createLayer('custom', 50, 0.8, 'multiply');
      
      expect(layer.name).toBe('custom');
      expect(layer.zIndex).toBe(50);
      expect(layer.opacity).toBe(0.8);
      expect(layer.blendMode).toBe('multiply');
    });

    test('should sort layers by zIndex', () => {
      layerManager.createLayer('layer1', 10);
      layerManager.createLayer('layer2', 5);
      layerManager.createLayer('layer3', 15);
      
      const layers = layerManager.getAllLayers();
      const zIndexes = layers.map(layer => layer.zIndex);
      
      // Should be sorted in ascending order
      for (let i = 1; i < zIndexes.length; i++) {
        expect(zIndexes[i]).toBeGreaterThanOrEqual(zIndexes[i - 1]);
      }
    });
  });

  describe('Pattern Assignment', () => {
    test('should assign pattern to layer', () => {
      const pattern = new MockPattern(mockContext);
      layerManager.assignPatternToLayer('middle', pattern);
      
      const layer = layerManager.getLayer('middle');
      expect(layer?.pattern).toBe(pattern);
    });

    test('should throw error for invalid layer', () => {
      const pattern = new MockPattern(mockContext);
      
      expect(() => {
        layerManager.assignPatternToLayer('invalid', pattern);
      }).toThrow('Layer not found: invalid');
    });

    test('should remove pattern from layer', () => {
      const pattern = new MockPattern(mockContext);
      layerManager.assignPatternToLayer('middle', pattern);
      
      layerManager.removePatternFromLayer('middle');
      
      const layer = layerManager.getLayer('middle');
      expect(layer?.pattern).toBeUndefined();
    });
  });

  describe('Layer Properties', () => {
    test('should update layer opacity', () => {
      layerManager.updateLayer('middle', { opacity: 0.5 });
      
      const layer = layerManager.getLayer('middle');
      expect(layer?.opacity).toBe(0.5);
    });

    test('should update layer blend mode', () => {
      layerManager.updateLayer('middle', { blendMode: 'screen' });
      
      const layer = layerManager.getLayer('middle');
      expect(layer?.blendMode).toBe('screen');
    });

    test('should update layer zIndex and resort', () => {
      const initialLayers = layerManager.getAllLayers();
      const middleLayer = layerManager.getLayer('middle');
      const originalIndex = initialLayers.indexOf(middleLayer!);
      
      layerManager.updateLayer('middle', { zIndex: 200 });
      
      const updatedLayers = layerManager.getAllLayers();
      const newIndex = updatedLayers.indexOf(middleLayer!);
      
      expect(newIndex).not.toBe(originalIndex);
      expect(middleLayer?.zIndex).toBe(200);
    });

    test('should clamp opacity values', () => {
      layerManager.updateLayer('middle', { opacity: 1.5 });
      let layer = layerManager.getLayer('middle');
      expect(layer?.opacity).toBe(1);
      
      layerManager.updateLayer('middle', { opacity: -0.5 });
      layer = layerManager.getLayer('middle');
      expect(layer?.opacity).toBe(0);
    });
  });

  describe('Layer Effects', () => {
    test('should apply blur effect', () => {
      layerManager.applyLayerEffect('middle', 'blur', 2);
      
      const layer = layerManager.getLayer('middle');
      expect(layer?.ctx?.filter).toBe('blur(2px)');
    });

    test('should apply glow effect', () => {
      layerManager.applyLayerEffect('middle', 'glow', 1);
      
      const layer = layerManager.getLayer('middle');
      expect(layer?.ctx?.shadowColor).toBe('#00ff00');
      expect(layer?.ctx?.shadowBlur).toBe(10);
    });

    test('should clear layer effects', () => {
      layerManager.applyLayerEffect('middle', 'blur', 2);
      layerManager.clearLayerEffect('middle');
      
      const layer = layerManager.getLayer('middle');
      expect(layer?.ctx?.filter).toBe('none');
      expect(layer?.ctx?.shadowBlur).toBe(0);
    });
  });

  describe('Animation', () => {
    test('should animate layer opacity', async () => {
      const layer = layerManager.getLayer('middle');
      expect(layer?.opacity).toBe(1);
      
      const animationPromise = layerManager.animateLayer('middle', 'opacity', 0.5, 50);
      
      await animationPromise;
      expect(layer?.opacity).toBe(0.5);
    });

    test('should animate layer zIndex', async () => {
      const layer = layerManager.getLayer('middle');
      const originalZIndex = layer?.zIndex || 0;
      
      const animationPromise = layerManager.animateLayer('middle', 'zIndex', 50, 50);
      
      await animationPromise;
      expect(layer?.zIndex).toBe(50);
      expect(layer?.zIndex).not.toBe(originalZIndex);
    });
  });

  describe('Rendering', () => {
    test('should update all layers', () => {
      const pattern1 = new MockPattern(mockContext);
      const pattern2 = new MockPattern(mockContext);
      
      pattern1.update = jest.fn();
      pattern1.render = jest.fn();
      pattern2.update = jest.fn();
      pattern2.render = jest.fn();
      
      layerManager.assignPatternToLayer('background', pattern1);
      layerManager.assignPatternToLayer('foreground', pattern2);
      
      layerManager.updateLayers(16.67); // ~60fps
      
      expect(pattern1.update).toHaveBeenCalledWith(16.67);
      expect(pattern1.render).toHaveBeenCalled();
      expect(pattern2.update).toHaveBeenCalledWith(16.67);
      expect(pattern2.render).toHaveBeenCalled();
    });

    test('should render layers to main canvas', () => {
      layerManager.renderLayers();
      
      // Should clear main canvas and draw layers
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });

  describe('Resize', () => {
    test('should resize all layer canvases', () => {
      layerManager.resize(1024, 768);
      
      const layers = layerManager.getAllLayers();
      layers.forEach(layer => {
        expect(layer.canvas?.width).toBe(1024);
        expect(layer.canvas?.height).toBe(768);
      });
    });
  });

  describe('Cleanup', () => {
    test('should cleanup all layers and patterns', () => {
      const pattern = new MockPattern(mockContext);
      pattern.cleanup = jest.fn();
      
      layerManager.assignPatternToLayer('middle', pattern);
      layerManager.cleanup();
      
      expect(pattern.cleanup).toHaveBeenCalled();
      expect(layerManager.getAllLayers()).toHaveLength(0);
    });

    test('should remove layer', () => {
      const pattern = new MockPattern(mockContext);
      pattern.cleanup = jest.fn();
      
      layerManager.assignPatternToLayer('middle', pattern);
      layerManager.removeLayer('middle');
      
      expect(pattern.cleanup).toHaveBeenCalled();
      expect(layerManager.getLayer('middle')).toBeUndefined();
    });
  });
});